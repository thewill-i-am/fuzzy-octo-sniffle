# fuzzy-octo-sniffle

Una cartita para Jenny ♡

Un clavel cerrado que despliega sus pétalos, deja ver una carta en su centro y la abre para leerla. Con dos amigos de Fondo de Bikini. Funciona sin instalar nada y sin conexión a internet.

## Abrir

Haz doble clic en **`index.html`**. Toca **«Abrir mi clavel»** o la flor: primero florece el clavel y después la carta sale de su centro. Para repetir, cierra la carta con la ×, con Escape o con «Volver a hacer florecer el clavel».

## Poner tu propia carta

Edita **`carta.js`** con un editor de texto:

- `destinataria`: el nombre que aparece en la página, la etiqueta del clavel y la carta.
- `saludo`: por ejemplo, `"Mi querida Jenny,"`.
- `parrafos`: tu carta, un párrafo entre comillas por renglón. Separa los párrafos con comas.
- `despedida` y `firma`: cómo quieres terminar la carta.

Guarda y recarga la página. La carta está personalizada para Jenny; léela completa antes de enviarla para asegurarte de que representa lo que quieres decir. Si necesitas comillas dobles dentro de un texto, escríbelas como `\"`.

La imagen que adjuntaste está en **`assets/bob-esponja-esposas.jpg`** y aparece como una posdata sobre la distancia, no sobre el duelo.

## Compartir

Sitio en GitHub Pages: **https://thewill-i-am.github.io/fuzzy-octo-sniffle/**

Los cambios que se suban a la rama `main` se publican automáticamente desde la raíz del proyecto.

Envía la carpeta completa comprimida, o sube sus cuatro archivos web (`index.html`, `styles.css`, `carta.js` y `app.js`) **junto con la carpeta `assets`** a un alojamiento estático como GitHub Pages o Netlify. No hay servidor, cuentas, rastreadores ni envío de datos.

**La carta no tiene contraseña:** cualquier persona con los archivos o el enlace podrá leerla. No pongas información sensible si vas a publicarla.

## Comprobación

Con Node.js 18 o posterior:

```sh
node --test tests/carta.test.cjs
```

Compatible con navegadores modernos, móvil y teclado. Respeta la preferencia del sistema de reducir animaciones. Las ilustraciones son SVG propios y las fuentes son del sistema; no hay dependencias externas.

## Referencias de la carta

- **Don Quijote de la Mancha, segunda parte, capítulo LVIII**: cita sobre las dos maneras de hermosura. [Texto en la Universidad de Duke](https://people.duke.edu/~garci/garcitextos/CERVANTES-MD/Don-quijote/CAP-INDIVIDUALES/DQ-2-58.HTM).
- **Bhagavad-gītā, 6.32**: la carta incluye una paráfrasis de la idea del verso, no una cita textual de una traducción moderna. [Verso y traducción de referencia](https://www.holy-bhagavad-gita.org/chapter/6/verse/32/).
