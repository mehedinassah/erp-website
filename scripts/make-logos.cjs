// Turn the two supplied logos into clean transparent PNGs:
//   1.png  = black logo on WHITE  → perico-light.png (used in light mode)
//   2.png  = white logo on BLACK  → perico-dark.png  (used in dark mode)
// Single-colour line art, so a global luminance key with feathered alpha gives
// perfectly smooth edges (no flood-fill needed).
const sharp = require("sharp");
const path = require("path");

const dir = path.join(__dirname, "..", "public");
const ex = path.join(__dirname, "..", "perico-extract");

async function key(srcFile, outFile, mode) {
  const { data, info } = await sharp(srcFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    let alpha;
    if (mode === "light") {
      // black logo on white: dark = opaque, white = transparent
      // lum 60 → opaque, lum 245 → transparent
      alpha = Math.round(((245 - lum) / (245 - 60)) * 255);
    } else {
      // white logo on black: light = opaque, black = transparent
      // lum 200 → opaque, lum 10 → transparent
      alpha = Math.round(((lum - 10) / (200 - 10)) * 255);
    }
    data[i + 3] = Math.max(0, Math.min(255, alpha));
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .trim({ threshold: 5 })
    .toFile(path.join(dir, outFile));

  const m = await sharp(path.join(dir, outFile)).metadata();
  console.log(`✓ ${outFile} — ${m.width}×${m.height} (${mode} mode)`);
}

(async () => {
  await key(path.join(ex, "1.png"), "perico-light.png", "light");
  await key(path.join(ex, "2.png"), "perico-dark.png", "dark");
})();
