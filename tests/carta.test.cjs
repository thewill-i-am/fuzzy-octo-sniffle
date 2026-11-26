const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Un DOM mínimo permite comprobar la interacción sin instalar dependencias.
function createApp(reduced = false) {
  function element() {
    const listeners = {};
    const attributes = new Map();
    const classes = new Set();
    return {
      textContent: "", children: [], disabled: false, open: false, scrollTop: 0,
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
      dispatch(name) { (listeners[name] ?? []).forEach((listener) => listener({ currentTarget: this })); },
      showModal() { this.open = true; },
      close() { this.open = false; this.dispatch("close"); },
      focus() { this.focused = true; }
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
    document: {
      querySelector: get,
      querySelectorAll: (selector) => selector === "[data-open-letter]" ? buttons : recipients,
      createElement: element
    },
    window: {
      innerWidth: 1200, innerHeight: 800,
      matchMedia: () => ({ matches: reduced }),
      setTimeout(callback, milliseconds) { delay = milliseconds; timers.set(++nextTimer, callback); return nextTimer; },
      clearTimeout: (id) => timers.delete(id)
    }
  };
  vm.createContext(context);
  for (const file of ["carta.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
    if (file === "carta.js") context.window.CARTA.parrafos.push("<script>no se ejecuta</script>");
  }
  return { get, buttons, recipients, context, timers, delay: () => delay, tick() { for (const callback of [...timers.values()]) callback(); timers.clear(); } };
}

test("la carta se renderiza como texto y personaliza el nombre", () => {
  const app = createApp();
  assert.equal(app.recipients[0].textContent, "Jenny");
  assert.equal(app.recipients[1].textContent, "Jenny.");
  const paragraphs = app.get("#letter-paragraphs").children;
  assert.equal(paragraphs.length, app.context.window.CARTA.parrafos.length);
  assert.equal(paragraphs.at(-1).textContent, "<script>no se ejecuta</script>");
  assert.match(app.get(".carnation-button").getAttribute("aria-label"), /clavel.*Jenny/);
});

test("florece una sola vez, abre la carta desde el clavel y permite repetir", () => {
  const app = createApp();
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

test("con movimiento reducido abre sin esperar la floración", () => {
  const app = createApp(true);
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
