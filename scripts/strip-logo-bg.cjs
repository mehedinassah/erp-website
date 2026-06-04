// Remove white background from perico.png — including the enclosed white
// "counters" inside the letters P, R, O — while keeping the white circuit
// lines inside the coloured icon square.
//
//   Pass 1: upscale 3×, flood-fill the OUTER white from the borders → transparent.
//           (smooth feathered alpha so edges aren't jagged). Then trim margins.
//   Pass 2: on the trimmed image, the icon is the left square. For everything to
//           the RIGHT of the icon (the wordmark), remove ANY remaining near-white
//           pixel — this clears the sealed counters in P/R/O. The icon region is
//           left untouched so its internal white traces survive.
const sharp = require("sharp");
const path = require("path");

const LOOSE = 205;
const PURE = 248;
const lumOf = (d, i) => (d[i] + d[i + 1] + d[i + 2]) / 3;

async function pass1(src) {
  const SCALE = 3;
  const m = await sharp(src).metadata();
  const { data, info } = await sharp(src)
    .resize(m.width * SCALE, m.height * SCALE, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let head = 0,
    tail = 0;
  const seed = (x, y) => {
    const p = y * width + x;
    if (!visited[p] && lumOf(data, p * 4) >= LOOSE) {
      visited[p] = 1;
      qx[tail] = x;
      qy[tail] = y;
      tail++;
    }
  };
  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }
  while (head < tail) {
    const x = qx[head],
      y = qy[head];
    head++;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const p = ny * width + nx;
      if (!visited[p] && lumOf(data, p * 4) >= LOOSE) {
        visited[p] = 1;
        qx[tail] = nx;
        qy[tail] = ny;
        tail++;
      }
    }
  }
  for (let p = 0; p < width * height; p++) {
    if (!visited[p]) continue;
    const i = p * 4;
    const l = lumOf(data, i);
    data[i + 3] =
      l >= PURE ? 0 : Math.max(0, Math.min(255, Math.round(((PURE - l) / (PURE - LOOSE)) * 255)));
  }

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .toBuffer();
}

async function pass2(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Icon is the left square (≈ as wide as the image is tall). Guard a little extra.
  const iconCutoff = Math.round(height * 1.15);

  for (let y = 0; y < height; y++) {
    for (let x = iconCutoff; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      const l = lumOf(data, i);
      if (l >= PURE) {
        data[i + 3] = 0;
      } else if (l >= LOOSE) {
        data[i + 3] = Math.max(
          0,
          Math.min(255, Math.round(((PURE - l) / (PURE - LOOSE)) * 255)),
        );
      }
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

(async () => {
  const src = path.join(__dirname, "..", "public", "perico.png");
  const out = path.join(__dirname, "..", "public", "perico-logo.png");
  const buf1 = await pass1(src);
  const buf2 = await pass2(buf1);
  await sharp(buf2).toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`✓ perico-logo.png — ${meta.width}×${meta.height}, white removed (incl. P/R/O counters)`);
})();
