import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const file = process.argv[2];
const outDir = process.argv[3] || "/workspace/_decoded";
const html = fs.readFileSync(file, "utf8");

function extract(type) {
  const re = new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`);
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

fs.mkdirSync(outDir, { recursive: true });

const templateRaw = extract("template");
if (templateRaw) {
  const tpl = JSON.parse(templateRaw);
  fs.writeFileSync(path.join(outDir, "template.html"), tpl);
  console.log("template ->", tpl.length, "chars");
}

const manifestRaw = extract("manifest");
function tryDecode(b64) {
  try {
    const buf = Buffer.from(b64, "base64");
    try {
      return zlib.gunzipSync(buf).toString("utf8");
    } catch {
      return buf; // binary (font/img)
    }
  } catch {
    return null;
  }
}

if (manifestRaw) {
  const manifest = JSON.parse(manifestRaw);
  let i = 0;
  for (const [uuid, entry] of Object.entries(manifest)) {
    const data = entry?.data;
    if (typeof data !== "string") continue;
    const decoded = tryDecode(data);
    const mime = entry.mime || "";
    let ext = "bin";
    if (mime.includes("javascript")) ext = "js";
    else if (mime.includes("css")) ext = "css";
    else if (mime.includes("html")) ext = "html";
    else if (mime.includes("woff")) ext = "woff2";
    else if (mime.includes("png")) ext = "png";
    else if (mime.includes("svg")) ext = "svg";
    const name = `${String(i).padStart(2, "0")}_${uuid.slice(0, 8)}.${ext}`;
    if (Buffer.isBuffer(decoded)) fs.writeFileSync(path.join(outDir, name), decoded);
    else if (decoded != null) fs.writeFileSync(path.join(outDir, name), decoded);
    console.log(name, mime, typeof decoded === "string" ? decoded.length + " chars" : "binary");
    i++;
  }
}
