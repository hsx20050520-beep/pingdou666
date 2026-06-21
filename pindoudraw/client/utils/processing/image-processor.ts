/**
 * 客户端图片处理模块 - 纯前端实现，无需后端服务器
 */
import { findClosestColor, type BeadColor } from './bead-colors';

export interface PixelData {
  width: number;
  height: number;
  pixels: number[][];
  colors: Map<number, BeadColor>;
  colorCount: number;
  totalBeads: number;
}

export interface ColorLegendItem {
  color: BeadColor;
  count: number;
  percentage: number;
  number: string;
}

export interface ProcessedImage {
  id: string;
  pixelData: PixelData;
  legend: ColorLegendItem[];
  colorNumberMap: Map<number, string>;
  originalWidth: number;
  originalHeight: number;
  targetPixelSize: number;
  brand: BeadColor["brand"];
}

let _idCounter = 0;
function genId(): string {
  return "local-" + Date.now() + "-" + (++_idCounter);
}

function blockMedian(
  data: Uint8ClampedArray, w: number, h: number,
  bx: number, by: number, cols: number, rows: number
): { r: number; g: number; b: number } {
  const bw = Math.ceil(w / cols), bh = Math.ceil(h / rows);
  const sx = bx * bw, sy = by * bh, ex = Math.min(sx + bw, w), ey = Math.min(sy + bh, h);
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const darkRs: number[] = [], darkGs: number[] = [], darkBs: number[] = [];
  for (let py = sy; py < ey; py++)
    for (let px = sx; px < ex; px++) {
      const i = (py * w + px) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rs.push(r); gs.push(g); bs.push(b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 100) { darkRs.push(r); darkGs.push(g); darkBs.push(b); }
    }
  rs.sort((a, b) => a - b); gs.sort((a, b) => a - b); bs.sort((a, b) => a - b);
  const m = Math.floor(rs.length / 2);
  const med = { r: rs[m], g: gs[m], b: bs[m] };
  const dr = rs.length > 0 ? darkRs.length / rs.length : 0;
  if (dr >= 0.05 && darkRs.length > 0) {
    darkRs.sort((a, b) => a - b); darkGs.sort((a, b) => a - b); darkBs.sort((a, b) => a - b);
    const dm = Math.floor(darkRs.length / 2);
    return { r: darkRs[dm], g: darkGs[dm], b: darkBs[dm] };
  }
  return med;
}

export function loadImageToCanvas(file: File): Promise<{ width: number; height: number; ctx: CanvasRenderingContext2D }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve({ width: img.width, height: img.height, ctx });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function processImageLocally(
  file: File, targetSize: number, brand: BeadColor["brand"] = "mard"
): Promise<ProcessedImage> {
  const id = genId();
  const { ctx: srcCtx, width: ow, height: oh } = await loadImageToCanvas(file);

  const maxDim = 1024;
  let rw = ow, rh = oh;
  if (ow > maxDim || oh > maxDim) {
    const s = Math.min(maxDim / ow, maxDim / oh);
    rw = Math.round(ow * s); rh = Math.round(oh * s);
  }

  const tc = document.createElement("canvas");
  tc.width = rw; tc.height = rh;
  const tctx = tc.getContext("2d")!;
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";
  tctx.drawImage(srcCtx.canvas, 0, 0, rw, rh);
  const raw = tctx.getImageData(0, 0, rw, rh).data;

  const ar = ow / oh;
  let cols = targetSize, rows = Math.round(targetSize / ar);
  if (ar <= 1) { rows = targetSize; cols = Math.round(targetSize * ar); }
  cols = Math.max(1, cols); rows = Math.max(1, rows);

  const pixels: number[][] = [];
  const colorMap = new Map<number, BeadColor>();
  let ci = 0;
  for (let by = 0; by < rows; by++) {
    const row: number[] = [];
    for (let bx = 0; bx < cols; bx++) {
      const { r, g, b } = blockMedian(raw, rw, rh, bx, by, cols, rows);
      const bc = findClosestColor(r, g, b, brand);
      let found = -1;
      for (const [k, v] of colorMap) { if (v.hex === bc.hex) { found = k; break; } }
      if (found >= 0) row.push(found);
      else { colorMap.set(ci, bc); row.push(ci); ci++; }
    }
    pixels.push(row);
  }

  const usage = new Map<number, number>();
  for (const r of pixels) for (const i of r) usage.set(i, (usage.get(i) || 0) + 1);
  const total = cols * rows;
  const legend: ColorLegendItem[] = [];
  const colorNumberMap = new Map<number, string>();
  [...usage.entries()].sort((a, b) => b[1] - a[1]).forEach(([idx, count]) => {
    const color = colorMap.get(idx)!;
    const num = color.stdNum.replace(/^[A-Za-z]+_/, "");
    colorNumberMap.set(idx, num);
    legend.push({ color, count, percentage: Math.round((count / total) * 100), number: num });
  });

  return {
    id, pixelData: { width: cols, height: rows, pixels, colors: colorMap, colorCount: colorMap.size, totalBeads: total },
    legend, colorNumberMap, originalWidth: ow, originalHeight: oh, targetPixelSize: targetSize, brand,
  };
}

export function renderPatternCanvas(
  pixels: number[][], colorMap: Map<number, BeadColor>, cellSize: number
): HTMLCanvasElement {
  const h = pixels.length, w = pixels[0]?.length || 0;
  const c = document.createElement("canvas");
  c.width = w * cellSize; c.height = h * cellSize;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const color = colorMap.get(pixels[y][x]);
      if (color) {
        ctx.fillStyle = color.hex;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  return c;
}

export function renderLegendCanvas(legend: ColorLegendItem[], cellSize = 24): HTMLCanvasElement {
  const ih = cellSize + 16;
  const c = document.createElement("canvas");
  c.width = 240; c.height = Math.max(100, legend.length * ih + 40);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("色号图例", 12, 20);
  legend.forEach((item, i) => {
    const y = 40 + i * ih;
    ctx.fillStyle = item.color.hex;
    ctx.fillRect(12, y, cellSize, cellSize);
    if (item.color.hex === "#FFFFFF") {
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.strokeRect(12, y, cellSize, cellSize);
    }
    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.fillText(item.number + " " + item.count + "颗 " + item.percentage + "%", 12 + cellSize + 8, y + cellSize - 4);
  });
  return c;
}
