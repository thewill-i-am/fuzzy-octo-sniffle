(() => {
  "use strict";

  const dialog = document.querySelector("#letter-dialog");
  const passwordDialog = document.querySelector("#password-dialog");
  const passwordInput = document.querySelector("#letter-password");
  const passwordError = document.querySelector("#password-error");
  const unlockButton = document.querySelector("#unlock-button");
  const scene = document.querySelector("#scene");
  const openButtons = [...document.querySelectorAll("[data-open-letter]")];
  const flowerNote = document.querySelector(".flower-note");
  const status = document.querySelector("#opening-status");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let openingTimer;
  let opening = false;
  let unlocked = false;
  let unlocking = false;
  let trigger;

  async function decryptLetter(password) {
    const payload = window.CARTA_CIFRADA;
    if (!payload || payload.version !== 1) throw new Error("Formato de carta no válido.");
    const salt = Uint8Array.from(atob(payload.salt), (char) => char.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.iv), (char) => char.charCodeAt(0));
    const data = Uint8Array.from(atob(payload.data), (char) => char.charCodeAt(0));
    if (salt.length !== 16 || iv.length !== 12 || data.length < 16 || data.length > 2000000) {
      throw new Error("Archivo cifrado no válido.");
    }
    const material = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
      material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext));
  }

  function renderLetter(carta) {
    if (!carta || !["destinataria", "saludo", "despedida", "firma"].every((field) => typeof carta[field] === "string")
      || !Array.isArray(carta.parrafos) || !carta.parrafos.length || !carta.parrafos.every((text) => typeof text === "string")) {
      throw new Error("Contenido de carta no válido.");
    }
    document.title = `Una cartita para ${carta.destinataria} ♡`;
    document.querySelectorAll("[data-recipient]").forEach((element) => {
      element.textContent = carta.destinataria + (element.closest("h2") ? "." : "");
    });
    document.querySelector(".wordmark").setAttribute("aria-label", `Una cartita para ${carta.destinataria}, inicio`);
    document.querySelector(".carnation-button").setAttribute("aria-label", `Hacer florecer el clavel y leer la carta para ${carta.destinataria}`);
    document.querySelector("#letter-greeting").textContent = carta.saludo;
    document.querySelector("#letter-farewell").textContent = carta.despedida;
    document.querySelector("#letter-signature").textContent = carta.firma;
    document.querySelector("#letter-paragraphs").replaceChildren();
    carta.parrafos.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      document.querySelector("#letter-paragraphs").append(paragraph);
    });
  }

  document.querySelector("#password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (unlocking || !passwordInput.value || passwordInput.value.length > 128) return;
    unlocking = true;
    passwordError.textContent = "";
    unlockButton.disabled = true;
    unlockButton.textContent = "Abriendo…";
    passwordInput.disabled = true;
    try {
      renderLetter(await decryptLetter(passwordInput.value));
      unlocked = true;
      passwordInput.value = "";
      passwordInput.removeAttribute("aria-invalid");
      passwordDialog.close();
      openButtons[0].focus({ preventScroll: true });
    } catch {
      passwordError.textContent = "El safe word no coincide. Inténtalo otra vez.";
      passwordInput.setAttribute("aria-invalid", "true");
    } finally {
      unlocking = false;
      unlockButton.disabled = false;
      unlockButton.textContent = "Entrar a mi carta";
      passwordInput.disabled = false;
      if (!unlocked) {
        passwordInput.focus();
        passwordInput.select();
      }
    }
  });

  function openLetter(event) {
    if (!unlocked) {
      if (!passwordDialog.open) passwordDialog.showModal();
      return;
    }
    if (opening || dialog.open) return;
    opening = true;
    trigger = event.currentTarget;
    openButtons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    });
    status.textContent = "El clavel está abriendo sus pétalos. Dentro hay una carta para ti.";
    scene.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "center" });
    scene.classList.add("is-opening");
    openingTimer = window.setTimeout(() => {
      const origin = flowerNote.getBoundingClientRect();
      dialog.style.setProperty("--letter-x", `${origin.x + origin.width / 2 - window.innerWidth / 2}px`);
      dialog.style.setProperty("--letter-y", `${origin.y + origin.height / 2 - window.innerHeight / 2}px`);
      dialog.showModal();
      dialog.scrollTop = 0;
      status.textContent = "Tu carta está abierta.";
    }, reducedMotion.matches ? 0 : 3600);
  }

  openButtons.forEach((button) => button.addEventListener("click", openLetter));
  document.querySelector("#close-password").addEventListener("click", () => passwordDialog.close());
  document.querySelector("#close-letter").addEventListener("click", () => dialog.close());
  document.querySelector("#replay-button").addEventListener("click", () => dialog.close());

  dialog.addEventListener("close", () => {
    window.clearTimeout(openingTimer);
    scene.classList.remove("is-opening");
    openButtons.forEach((button) => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
    opening = false;
    status.textContent = "Puedes volver a abrir la sorpresa cuando quieras.";
    trigger?.focus({ preventScroll: true });
  });

  passwordDialog.showModal();
  if (!window.crypto?.subtle) {
    passwordError.textContent = "Este navegador no puede descifrar la carta. Abre el enlace HTTPS en un navegador actualizado.";
    unlockButton.disabled = true;
  }
})();
