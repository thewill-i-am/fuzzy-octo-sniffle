(() => {
  "use strict";

  const carta = window.CARTA;
  const dialog = document.querySelector("#letter-dialog");
  const scene = document.querySelector("#scene");
  const openButtons = [...document.querySelectorAll("[data-open-letter]")];
  const flowerNote = document.querySelector(".flower-note");
  const status = document.querySelector("#opening-status");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let openingTimer;
  let opening = false;
  let trigger;

  document.title = `Una cartita para ${carta.destinataria} ♡`;
  document.querySelectorAll("[data-recipient]").forEach((element) => {
    element.textContent = carta.destinataria + (element.closest("h2") ? "." : "");
  });
  document.querySelector(".wordmark").setAttribute("aria-label", `Una cartita para ${carta.destinataria}, inicio`);
  document.querySelector(".carnation-button").setAttribute("aria-label", `Hacer florecer el clavel y leer la carta para ${carta.destinataria}`);
  document.querySelector("#letter-greeting").textContent = carta.saludo;
  document.querySelector("#letter-farewell").textContent = carta.despedida;
  document.querySelector("#letter-signature").textContent = carta.firma;
  carta.parrafos.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    document.querySelector("#letter-paragraphs").append(paragraph);
  });

  function openLetter(event) {
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
})();
