/*
  Détoure les photos des égéries (fond studio clair et uni) pour les poser sur les couleurs de la marque.
  node scripts/detourer-egeries.cjs <dossier des photos e-N.jpg>
  Sortie : public/egeries/detoure/<nom>.webp (fond transparent, cadré au plus juste)
*/
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const src = process.argv[2];
const out = path.join(__dirname, "..", "public", "egeries", "detoure");
const LIST = { "3": "panier", "5": "presente", "6": "pouces", "15": "telephone", "17": "victoire", "19": "montre", "18": "indique" };

(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const [n, name] of Object.entries(LIST)) {
    const { data, info } = await sharp(path.join(src, `e-${n}.jpg`)).rotate().resize({ height: 1400 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    // fond = clair et peu coloré, atteint depuis les bords de l'image
    const isBg = (p) => {
      const r = data[p], g = data[p + 1], b = data[p + 2];
      return Math.min(r, g, b) > 170 && Math.max(r, g, b) - Math.min(r, g, b) < 38;
    };
    const seen = new Uint8Array(W * H), stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    let removed = 0;
    while (stack.length) {
      const i = stack.pop();
      if (seen[i]) continue;
      seen[i] = 1;
      if (!isBg(i * 4)) continue;
      data[i * 4 + 3] = 0;
      removed++;
      const x = i % W, y = (i / W) | 0;
      if (x > 0) stack.push(i - 1);
      if (x < W - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - W);
      if (y < H - 1) stack.push(i + W);
    }
    // bord adouci, puis cadrage sur la silhouette
    const alpha = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) alpha[i] = data[i * 4 + 3];
    const soft = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let i = 0; i < W * H; i++) {
      const a = Math.min(data[i * 4 + 3], soft[i]);
      data[i * 4 + 3] = a;
      if (a > 20) {
        const x = i % W, y = (i / W) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    const file = path.join(out, `${name}.webp`);
    await sharp(data, { raw: info }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).webp({ quality: 82, alphaQuality: 90 }).toFile(file);
    console.log(name, `fond retiré ${Math.round((removed / (W * H)) * 100)} %`, `${x1 - x0 + 1}x${y1 - y0 + 1}`, `${(fs.statSync(file).size / 1024) | 0} Ko`);
  }
})();
