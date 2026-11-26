const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const password = process.env.CARTA_PASSWORD;
if (!password || password.length > 128) {
  throw new Error("Define CARTA_PASSWORD con la contraseña, entre 1 y 128 caracteres.");
}

const root = path.join(__dirname, "..");
const carta = JSON.parse(fs.readFileSync(path.join(root, "carta.privada.json"), "utf8"));
if (!carta || !["destinataria", "saludo", "despedida", "firma"].every((field) => typeof carta[field] === "string")
  || !Array.isArray(carta.parrafos) || !carta.parrafos.length || !carta.parrafos.every((text) => typeof text === "string")) {
  throw new Error("La carta debe tener destinataria, saludo, párrafos, despedida y firma válidos.");
}

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(JSON.stringify(carta), "utf8"), cipher.final()]);
const data = Buffer.concat([encrypted, cipher.getAuthTag()]);

// Verifica que se puede recuperar la carta antes de sustituir el archivo público.
const check = crypto.createDecipheriv("aes-256-gcm", key, iv);
check.setAuthTag(data.subarray(-16));
assert.deepEqual(JSON.parse(Buffer.concat([check.update(data.subarray(0, -16)), check.final()]).toString("utf8")), carta);

const payload = { version: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), data: data.toString("base64") };
const target = path.join(root, "carta.js");
fs.writeFileSync(`${target}.tmp`, `// Archivo cifrado generado por scripts/cifrar.cjs. No contiene la contraseña.\nwindow.CARTA_CIFRADA = ${JSON.stringify(payload)};\n`);
fs.renameSync(`${target}.tmp`, target);
console.log("Carta cifrada. El original privado no se incluye en Git.");
