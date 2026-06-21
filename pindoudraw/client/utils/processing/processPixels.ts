import { findClosestColor, type BeadColor } from "./bead-colors";

export interface ProcessedResult {
  id: string;
  width: number;
  height: number;
  totalBeads: number;
  colorCount: number;
  legend: Array<{
    id: string; hex: string; name: string; brand: string;
    count: number; percentage: number; number: string; stdNum: string;
  }>;
  brand: string;
  pixels: number[][];
  colorMap: Record<string, { r: number; g: number; b: number; hex: string }>;
  originalWidth: number;
  originalHeight: number;
}

let _id = 0;
function genId() { return "local-" + Date.now() + "-" + (++_id); }

function blockMedian(
  data: Uint8ClampedArray | number[], w: number, h: number,
  bx: number, by: number, cols: number, rows: number
): { r: number; g: number; b: number } {
  const bw = Math.ceil(w / cols), bh = Math.ceil(h / rows);
  const sx = bx * bw, sy = by * bh, ex = Math.min(sx + bw, w), ey = Math.min(sy + bh, h);
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const drs: number[] = [], dgs: number[] = [], dbs: number[] = [];
  for (let py = sy; py < ey; py++)
    for (let px = sx; px < ex; px++) {
      const i = (py * w + px) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rs.push(r); gs.push(g); bs.push(b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 100) { drs.push(r); dgs.push(g); dbs.push(b); }
    }
  rs.sort((a, b) => a - b); gs.sort((a, b) => a - b); bs.sort((a, b) => a - b);
  const m = Math.floor(rs.length / 2);
  const med = { r: rs[m], g: gs[m], b: bs[m] };
  const dr = rs.length > 0 ? drs.length / rs.length : 0;
  if (dr >= 0.05 && drs.length > 0) {
    drs.sort((a, b) => a - b); dgs.sort((a, b) => a - b); dbs.sort((a, b) => a - b);
    const dm = Math.floor(drs.length / 2);
    return { r: drs[dm], g: dgs[dm], b: dbs[dm] };
  }
  return med;
}

export function processPixels(
  rawData: Uint8ClampedArray | number[],
  rw: number, rh: number,
  ow: number, oh: number,
  targetSize: number,
  brand: BeadColor["brand"] = "mard"
): ProcessedResult {
  const id = genId();
  const ar = ow / oh;
  let cols = targetSize, rows = Math.round(targetSize / ar);
  if (ar <= 1) { rows = targetSize; cols = Math.round(targetSize * ar); }
  cols = Math.max(1, cols); rows = Math.max(1, rows);

  const pixels: number[][] = [];
  const cmap = new Map<number, BeadColor>();
  let ci = 0;
  for (let by = 0; by < rows; by++) {
    const row: number[] = [];
    for (let bx = 0; bx < cols; bx++) {
      const { r, g, b } = blockMedian(rawData, rw, rh, bx, by, cols, rows);
      const bc = findClosestColor(r, g, b, brand);
      let found = -1;
      for (const [k, v] of cmap) { if (v.hex === bc.hex) { found = k; break; } }
      if (found >= 0) row.push(found);
      else { cmap.set(ci, bc); row.push(ci); ci++; }
    }
    pixels.push(row);
  }

  const usage = new Map<number, number>();
  for (const r of pixels) for (const i of r) usage.set(i, (usage.get(i) || 0) + 1);
  const total = cols * rows;
  const legend: any[] = [];
  const colorMapRecord: Record<string, any> = {};
  [...usage.entries()].sort((a, b) => b[1] - a[1]).forEach(([idx, count]) => {
    const color = cmap.get(idx)!;
    const num = color.stdNum.replace(/^[A-Za-z]+_/, "");
    colorMapRecord[String(idx)] = { r: color.r, g: color.g, b: color.b, hex: color.hex, name: color.name };
    legend.push({
      id: color.id, hex: color.hex, name: color.name,
      brand: color.brand, count, percentage: Math.round((count / total) * 100),
      number: num, stdNum: color.stdNum,
    });
  });

  return {
    id, width: cols, height: rows, totalBeads: total,
    colorCount: cmap.size, legend, brand,
    pixels, colorMap: colorMapRecord,
    originalWidth: ow, originalHeight: oh,
  };
}
