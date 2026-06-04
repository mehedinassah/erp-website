// One-time: remove the white background from perico.png via edge flood-fill.
// Flood-fill from the borders so interior white (the circuit lines inside the
// purple icon) is preserved — only background white becomes transparent.
const sharp = require("sharp");
const path = require("path");

(async () => {
  const src = path.join(__dirname, "..", "public", "perico.png");
  const out = path.join(__dirname, "..", "public", "perico-logo.png");

  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const isWhite = (i) =>
    data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;

  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let head = 0,
    tail = 0;

  const seed = (x, y) => {
    const p = y * width + x;
    if (!visited[p] && isWhite(p * 4)) {
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
    const i = (y * width + x) * 4;
    data[i + 3] = 0; // make transparent
    const nb = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of nb) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const p = ny * width + nx;
      if (!visited[p] && isWhite(p * 4)) {
        visited[p] = 1;
        qx[tail] = nx;
        qy[tail] = ny;
        tail++;
      }
    }
  }

  // Write transparent, then trim the empty margins to a tight crop.
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  console.log(`✓ perico-logo.png written — ${meta.width}×${meta.height}, transparent bg`);
})();
