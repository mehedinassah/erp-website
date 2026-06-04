// One-time: remove the white background from perico.png with SMOOTH edges.
// Strategy:
//   1. Upscale the source 3× (lanczos) so edges have a soft gradient to work with.
//   2. Flood-fill from the borders to find the *connected* white background
//      (interior white — the circuit lines inside the icon — is preserved).
//   3. Feathered alpha: pure-white bg → fully transparent; the thin anti-aliased
//      boundary band gets partial alpha so edges fade smoothly (no jagged "chop").
//   4. Trim the empty margins to a tight, high-res crop.
const sharp = require("sharp");
const path = require("path");

(async () => {
  const src = path.join(__dirname, "..", "public", "perico.png");
  const out = path.join(__dirname, "..", "public", "perico-logo.png");

  // 1. Upscale 3× for smoother boundaries
  const SCALE = 3;
  const base = await sharp(src).metadata();
  const W = base.width * SCALE;
  const H = base.height * SCALE;

  const { data, info } = await sharp(src)
    .resize(W, H, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const lum = (i) => (data[i] + data[i + 1] + data[i + 2]) / 3;

  // 2. Flood-fill connected background (loose threshold so the halo is included)
  const LOOSE = 205; // pixel counts as "background-ish" for connectivity
  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let head = 0,
    tail = 0;

  const seed = (x, y) => {
    const p = y * width + x;
    if (!visited[p] && lum(p * 4) >= LOOSE) {
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
    const nb = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of nb) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const p = ny * width + nx;
      if (!visited[p] && lum(p * 4) >= LOOSE) {
        visited[p] = 1;
        qx[tail] = nx;
        qy[tail] = ny;
        tail++;
      }
    }
  }

  // 3. Feathered alpha on the connected background region
  const PURE = 248; // >= this luminance in bg region → fully transparent
  for (let p = 0; p < width * height; p++) {
    if (!visited[p]) continue; // interior logo pixels untouched
    const i = p * 4;
    const l = lum(i);
    if (l >= PURE) {
      data[i + 3] = 0;
    } else {
      // boundary band: fade alpha smoothly between LOOSE..PURE
      const a = Math.round(((PURE - l) / (PURE - LOOSE)) * 255);
      data[i + 3] = Math.max(0, Math.min(255, a));
    }
  }

  // 4. Output, trim margins
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  console.log(`✓ perico-logo.png — ${meta.width}×${meta.height}, smooth transparent edges`);
})();
