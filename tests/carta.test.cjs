const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

// Clave y carta de prueba: nunca se publica la contraseña real.
const password = crypto.randomBytes(24).toString("base64");
const sample = { destinataria: "Jenny", saludo: "Hola,", parrafos: ["Una carta de prueba.", "<script>no se ejecuta</script>"], despedida: "Con cariño,", firma: "De Will" };
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const data = Buffer.concat([cipher.update(JSON.stringify(sample), "utf8"), cipher.final(), cipher.getAuthTag()]);
const fixture = { version: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), data: data.toString("base64") };

// Un DOM mínimo permite comprobar la interacción sin instalar dependencias.
function createApp(reduced = false) {
  function element() {
    const listeners = {};
    const attributes = new Map();
    const classes = new Set();
    return {
      textContent: "", value: "", children: [], disabled: false, open: false, scrollTop: 0,
      classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) },
      style: { setProperty: (name, value) => attributes.set(name, value) },
      getBoundingClientRect: () => ({ x: 700, y: 200, width: 100, height: 120 }),
      scrollIntoView() {},
      closest: () => null,
      append(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      remove() {},
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: (name) => attributes.delete(name),
      getAttribute: (name) => attributes.get(name),
      addEventListener(name, listener) { (listeners[name] ??= []).push(listener); },
      dispatch(name) { return Promise.all((listeners[name] ?? []).map((listener) => listener({ currentTarget: this, preventDefault() {} }))); },
      showModal() { this.open = true; },
      close() { this.open = false; this.dispatch("close"); },
      focus() { this.focused = true; },
      select() {}
    };
  }
  const elements = new Map();
  const get = (selector) => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  const buttons = [element(), get(".carnation-button")];
  const recipients = [element(), element()];
  recipients[1].closest = () => true;
  const timers = new Map();
  let nextTimer = 0;
  let delay;
  const context = {
    Uint8Array, TextEncoder, TextDecoder, atob,
    document: {
      querySelector: get,
      querySelectorAll: (selector) => selector === "[data-open-letter]" ? buttons : recipients,
      createElement: element
    },
    window: {
      crypto: crypto.webcrypto,
      innerWidth: 1200, innerHeight: 800,
      matchMedia: () => ({ matches: reduced }),
      setTimeout(callback, milliseconds) { delay = milliseconds; timers.set(++nextTimer, callback); return nextTimer; },
      clearTimeout: (id) => timers.delete(id)
    }
  };
  vm.createContext(context);
  for (const file of ["carta.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
    if (file === "carta.js") context.window.CARTA_CIFRADA = { ...fixture };
  }
  return {
    get, buttons, recipients, context, timers, delay: () => delay,
    async unlock(value = password) { get("#letter-password").value = value; await get("#password-form").dispatch("submit"); },
    tick() { for (const callback of [...timers.values()]) callback(); timers.clear(); }
  };
}

test("sin contraseña no se renderiza la carta ni se puede saltar el acceso", () => {
  const app = createApp();
  assert.equal(app.get("#password-dialog").open, true);
  assert.equal(app.get("#letter-paragraphs").children.length, 0);
  app.get("#close-password").dispatch("click");
  app.buttons[0].dispatch("click");
  assert.equal(app.get("#password-dialog").open, true);
  assert.equal(app.timers.size, 0);
  assert.equal(app.get("#letter-dialog").open, false);
});

test("una contraseña incorrecta no revela el contenido; la correcta permite continuar", async () => {
  const app = createApp();
  await app.unlock(`${password}x`);
  assert.equal(app.get("#password-dialog").open, true);
  assert.equal(app.get("#letter-paragraphs").children.length, 0);
  assert.equal(app.get("#letter-password").getAttribute("aria-invalid"), "true");
  assert.match(app.get("#password-error").textContent, /no coincide/);
  assert.equal(app.get("#unlock-button").disabled, false);
  await app.unlock();
  assert.equal(app.get("#password-dialog").open, false);
  assert.equal(app.get("#letter-password").value, "");
  assert.equal(app.get("#letter-password").getAttribute("aria-invalid"), undefined);
});

test("un archivo cifrado alterado no se puede abrir", async () => {
  const app = createApp();
  const damaged = Buffer.from(fixture.data, "base64");
  damaged[0] ^= 1;
  app.context.window.CARTA_CIFRADA.data = damaged.toString("base64");
  await app.unlock();
  assert.equal(app.get("#letter-paragraphs").children.length, 0);
  assert.equal(app.get("#password-dialog").open, true);
});

test("después de descifrar, la carta se renderiza como texto y personaliza el nombre", async () => {
  const app = createApp();
  await app.unlock();
  assert.equal(app.recipients[0].textContent, "Jenny");
  assert.equal(app.recipients[1].textContent, "Jenny.");
  const paragraphs = app.get("#letter-paragraphs").children;
  assert.equal(paragraphs.length, sample.parrafos.length);
  assert.equal(paragraphs.at(-1).textContent, "<script>no se ejecuta</script>");
  assert.match(app.get(".carnation-button").getAttribute("aria-label"), /clavel.*Jenny/);
});

test("florece una sola vez, abre la carta desde el clavel y permite repetir", async () => {
  const app = createApp();
  await app.unlock();
  app.buttons[0].dispatch("click");
  app.buttons[1].dispatch("click");
  assert.equal(app.timers.size, 1);
  assert.equal(app.get("#scene").classList.contains("is-opening"), true);
  assert.ok(app.buttons.every((button) => button.disabled));
  assert.equal(app.delay(), 3600);
  assert.equal(app.get("#letter-dialog").open, false);
  app.tick();
  assert.equal(app.get("#letter-dialog").open, true);
  assert.equal(app.get("#letter-dialog").getAttribute("--letter-x"), "150px");
  assert.equal(app.get("#letter-dialog").getAttribute("--letter-y"), "-140px");
  app.get("#close-letter").dispatch("click");
  assert.equal(app.get("#letter-dialog").open, false);
  assert.equal(app.get("#scene").classList.contains("is-opening"), false);
  assert.ok(app.buttons.every((button) => !button.disabled));
  assert.equal(app.buttons[0].focused, true);
  app.buttons[1].dispatch("click");
  app.tick();
  assert.equal(app.get("#letter-dialog").open, true);
  app.get("#replay-button").dispatch("click");
  assert.equal(app.buttons[1].focused, true);
});

test("con movimiento reducido abre sin esperar la floración", async () => {
  const app = createApp(true);
  await app.unlock();
  app.buttons[0].dispatch("click");
  assert.equal(app.delay(), 0);
  app.tick();
  assert.equal(app.get("#letter-dialog").open, true);
  app.get("#letter-dialog").close();
  assert.ok(app.buttons.every((button) => !button.disabled));
});

test("la imagen adjunta está incluida como un recurso local dentro de la carta", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /class="letter-meme"[\s\S]*?src="assets\/bob-esponja-esposas\.jpg"/);
  assert.match(html, /alt="Bob Esponja con unas esposas enormes alrededor de sus brazos\."/);
  const image = fs.readFileSync(path.join(__dirname, "..", "assets", "bob-esponja-esposas.jpg"));
  assert.equal(image.readUInt16BE(0), 0xffd8);
});

test("el archivo publicado contiene solo el texto cifrado, no la carta original", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "carta.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  assert.equal(context.window.CARTA, undefined);
  assert.equal(context.window.CARTA_CIFRADA.version, 1);
  assert.equal(Buffer.from(context.window.CARTA_CIFRADA.salt, "base64").length, 16);
  assert.equal(Buffer.from(context.window.CARTA_CIFRADA.iv, "base64").length, 12);
  assert.ok(Buffer.from(context.window.CARTA_CIFRADA.data, "base64").length > 16);
  assert.equal(source.includes('"parrafos"'), false);
});
