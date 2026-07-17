import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "public/hipie.png";        // 배경 있는 원본 로고
const FOREST = { r: 15, g: 92, b: 62, alpha: 1 }; // --forest #0f5c3e

mkdirSync("public/icons", { recursive: true });

// 1) 일반 아이콘(any) — 투명 배경 유지, contain
async function anyIcon(size, out) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log("wrote", out);
}

// 2) maskable / apple — forest 배경 채우고 로고를 safe-zone(80%)에 배치
async function filledIcon(size, out, ratio = 0.8) {
  const inner = Math.round(size * ratio);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: FOREST },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out);
}

await anyIcon(192, "public/icons/icon-192.png");
await anyIcon(512, "public/icons/icon-512.png");
await filledIcon(512, "public/icons/maskable-512.png", 0.78);
await filledIcon(180, "public/icons/apple-touch-icon.png", 0.82);
console.log("done");
