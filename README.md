# fuzzy-octo-sniffle

Una cartita para Jenny ♡

Un clavel cerrado que despliega sus pétalos, deja ver una carta en su centro y la abre para leerla. Con dos amigos de Fondo de Bikini. Funciona sin instalar nada y sin conexión a internet.

## Abrir

Abre la página e introduce la contraseña. La pista es **«La contraseña es el safe word»**. Después toca **«Abrir mi clavel»** o la flor: primero florece el clavel y después la carta sale de su centro. Para repetir, cierra la carta con la ×, con Escape o con «Volver a hacer florecer el clavel».

La contraseña se usa en el navegador para descifrar la carta con AES-256-GCM y PBKDF2-SHA-256 (600.000 iteraciones). No está escrita en los archivos públicos y la aplicación no la almacena. Se vuelve a pedir al recargar la página. Necesitas un navegador moderno con Web Crypto; el enlace de GitHub Pages usa HTTPS.

## Poner tu propia carta

El original editable está en **`carta.privada.json`**, solo en tu computadora y excluido de Git. Edita ese archivo, no `carta.js`:

- `destinataria`: el nombre que aparece en la página, la etiqueta del clavel y la carta.
- `saludo`: por ejemplo, `"Mi querida Jenny,"`.
- `parrafos`: tu carta, un párrafo entre comillas por renglón. Separa los párrafos con comas.
- `despedida` y `firma`: cómo quieres terminar la carta.

Después de editarlo, genera el archivo cifrado con Node.js:

```sh
CARTA_PASSWORD='tu safe word' node scripts/cifrar.cjs
```

Este comando sustituye `carta.js` por la versión cifrada. Usa la misma contraseña o una nueva, y sube después el cambio a GitHub. No publiques `carta.privada.json` ni escribas la contraseña real en este README.

La carta está personalizada para Jenny; léela completa antes de enviarla para asegurarte de que representa lo que quieres decir.

La imagen que adjuntaste está en **`assets/bob-esponja-esposas.jpg`** y aparece como una posdata sobre la distancia, no sobre el duelo.

## Compartir

Sitio en GitHub Pages: **https://thewill-i-am.github.io/fuzzy-octo-sniffle/**

Los cambios que se suban a la rama `main` se publican automáticamente desde la raíz del proyecto.

Comparte el enlace de arriba. Para alojarla en otro sitio, sube únicamente sus cuatro archivos web (`index.html`, `styles.css`, `carta.js` y `app.js`) **junto con la carpeta `assets`**. No envíes la carpeta completa: contiene el original privado y el historial de Git. No hay servidor, cuentas, rastreadores ni envío de datos.

**Límites de privacidad:** se cifra el texto de la carta; la portada y la imagen de Bob Esponja siguen siendo públicas. Una contraseña corta puede adivinarse mediante intentos sin conexión.

**El texto estuvo público antes del cifrado y sigue en el historial anterior del repositorio.** Cifrar la versión actual no borra ese historial ni las copias ya descargadas. No se ha reescrito el historial.

## Comprobación

Con Node.js 18 o posterior:

```sh
node --test tests/carta.test.cjs
```

Compatible con navegadores modernos, móvil y teclado. Respeta la preferencia del sistema de reducir animaciones. Las ilustraciones son SVG propios y las fuentes son del sistema; no hay dependencias externas.

## Referencias de la carta

- **Don Quijote de la Mancha, segunda parte, capítulo LVIII**: cita sobre las dos maneras de hermosura. [Texto en la Universidad de Duke](https://people.duke.edu/~garci/garcitextos/CERVANTES-MD/Don-quijote/CAP-INDIVIDUALES/DQ-2-58.HTM).
- **Bhagavad-gītā, 6.32**: la carta incluye una paráfrasis de la idea del verso, no una cita textual de una traducción moderna. [Verso y traducción de referencia](https://www.holy-bhagavad-gita.org/chapter/6/verse/32/).
