/**
 * 图像处理模块
 * 负责像素化处理、颜色匹配、图纸生成
 */

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { BeadColor } from './bead-colors';
import { findClosestColor, brandNames } from './bead-colors';

// 输出类型
export interface PixelData {
  width: number;
  height: number;
  pixels: number[][]; // 每个像素的颜色索引
  colors: Map<number, BeadColor>; // 颜色映射
  colorCount: number; // 使用的颜色数量
  totalBeads: number; // 总珠子数
}

export interface ColorLegendItem {
  color: BeadColor;
  count: number;
  percentage: number;
  /** 标准编号（如 A5, H2, 01, 02） */
  number: string;
}

export interface ProcessedImage {
  id: string;
  pixelData: PixelData;
  legend: ColorLegendItem[];
  /** 映射: 颜色索引 → 图例短编号（如 A5, H2） */
  colorNumberMap: Map<number, string>;
  originalWidth: number;
  originalHeight: number;
  targetPixelSize: number;
  brand: BeadColor['brand'];
}

// 缓存处理结果
const processedImages = new Map<string, ProcessedImage>();

/**
 * 像素化处理图片
 */
// 区块取中位数颜色（细节保护：深色 ≥10% 时整块替换）
function blockMedian(data: Buffer, w: number, h: number, bx: number, by: number, cols: number, rows: number): { r: number; g: number; b: number } {
  const bw = Math.ceil(w / cols), bh = Math.ceil(h / rows);
  const sx = bx * bw, sy = by * bh, ex = Math.min(sx + bw, w), ey = Math.min(sy + bh, h);
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const darkRs: number[] = [], darkGs: number[] = [], darkBs: number[] = [];
  for (let py = sy; py < ey; py++)
    for (let px = sx; px < ex; px++) {
      const i = (py * w + px) * 3;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rs.push(r); gs.push(g); bs.push(b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 100) { darkRs.push(r); darkGs.push(g); darkBs.push(b); }
    }
  rs.sort((a, b) => a - b); gs.sort((a, b) => a - b); bs.sort((a, b) => a - b);
  const m = Math.floor(rs.length / 2);
  const median = { r: rs[m], g: gs[m], b: bs[m] };
  const total = rs.length;
  const darkRatio = total > 0 ? darkRs.length / total : 0;
  // 深色占比 ≥10% 时整块用深色中位数（保留细线条）
  if (darkRatio >= 0.05 && darkRs.length > 0) {
    darkRs.sort((a, b) => a - b); darkGs.sort((a, b) => a - b); darkBs.sort((a, b) => a - b);
    const dm = Math.floor(darkRs.length / 2);
    return { r: darkRs[dm], g: darkGs[dm], b: darkBs[dm] };
  }
  return median;
}

export async function processImage(
  imageBuffer: Buffer,
  targetSize: number,
  brand: BeadColor['brand'],
  useColorMatching: boolean,
  paletteCompression: string = 'off',
  saturation: number = 1.0,
  useDithering: boolean = false
): Promise<ProcessedImage> {

  const id = uuidv4();
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const ow = meta.width || 100, oh = meta.height || 100;
  const ar = ow / oh;
  let cols = targetSize, rows = Math.round(targetSize / ar);
  if (ar <= 1) { rows = targetSize; cols = Math.round(targetSize * ar); }
  cols = Math.max(1, cols); rows = Math.max(1, rows);

  // 读像素（缩放到合理大小加速处理）
  const maxDim = 1024;
  let rw = ow, rh = oh;
  if (ow > maxDim || oh > maxDim) {
    const scale = Math.min(maxDim / ow, maxDim / oh);
    rw = Math.round(ow * scale);
    rh = Math.round(oh * scale);
  }
  const raw = await image.resize(rw, rh, { kernel: 'lanczos3' }).raw().toBuffer();

  // 区块取色 + Lab 颜色匹配
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

  // ---- 调色板压缩（同原版，但用 Lab ΔE）----
  const PALETTE_CONFIG: Record<string, { threshold: number; maxColors: number }> = {
    'off':      { threshold: 0,    maxColors: 999 },
    'light':    { threshold: 12,   maxColors: 10 },
    'standard': { threshold: 18,   maxColors: 7 },
    'heavy':    { threshold: 25,   maxColors: 5 },
  };

  function compressPalette(cmap: Map<number, BeadColor>, pix: number[][], threshold: number): { newColorMap: Map<number, BeadColor>; pixels: number[][] } {
    if (threshold <= 0) return { newColorMap: cmap, pixels: pix };
    const usage = new Map<number, number>();
    for (const r of pix) for (const i of r) usage.set(i, (usage.get(i) || 0) + 1);
    const sorted = [...usage.entries()].sort((a, b) => b[1] - a[1]);
    const kept: number[] = [];
    const mergeTarget = new Map<number, number>();
    for (const [idx] of sorted) {
      const c = cmap.get(idx); if (!c) continue; let merged = false;
      for (const kIdx of kept) {
        const kc = cmap.get(kIdx); if (!kc) continue;
        const dL = c.L - kc.L, da = c.a - kc.a, db = c.bVal - kc.bVal;
        if (Math.sqrt(dL * dL + da * da + db * db) < threshold) { mergeTarget.set(idx, kIdx); merged = true; break; }
      }
      if (!merged) { kept.push(idx); mergeTarget.set(idx, idx); }
    }
    const newColorMap = new Map<number, BeadColor>();
    const oldToNew = new Map<number, number>();
    kept.forEach((k, i) => { newColorMap.set(i, cmap.get(k)!); oldToNew.set(k, i); });
    return { newColorMap, pixels: pix.map(r => r.map(idx => oldToNew.get(mergeTarget.get(idx)! )! )) };
  }

  const compConfig = PALETTE_CONFIG[paletteCompression];
  if (compConfig && compConfig.threshold > 0) {
    let threshold = compConfig.threshold;
    const maxColors = compConfig.maxColors;
    let result = compressPalette(colorMap, pixels, threshold);
    let attempts = 0;
    while (result.newColorMap.size > maxColors && attempts < 15) {
      threshold += Math.max(5, threshold * 0.15);
      result = compressPalette(colorMap, pixels, Math.round(threshold));
      attempts++;
    }
    colorMap.clear();
    for (const [k, v] of result.newColorMap) colorMap.set(k, v);
    pixels.length = 0;
    pixels.push(...result.pixels);
  }

  // ---- 图例 ----
  const usage = new Map<number, number>();
  for (const r of pixels) for (const i of r) usage.set(i, (usage.get(i) || 0) + 1);
  const total = cols * rows;
  const legend: ColorLegendItem[] = [];
  const colorNumberMap = new Map<number, string>();

  for (const [i, cnt] of usage) {
    const c = colorMap.get(i)!;
    const sn = (c.stdNum || '').includes('_') ? c.stdNum.split('_')[1] : c.stdNum || String(c.id);
    legend.push({ color: c, count: cnt, percentage: Math.round(cnt / total * 100), number: sn });
    colorNumberMap.set(i, sn);
  }
  legend.sort((a, b) => b.count - a.count);

  const pixelData: PixelData = {
    width: cols, height: rows, pixels,
    colors: colorMap, colorCount: colorMap.size, totalBeads: total,
  };
  const result: ProcessedImage = {
    id, pixelData, legend, colorNumberMap,
    originalWidth: ow, originalHeight: oh, targetPixelSize: targetSize, brand,
  };

  // 缓存
  if (processedImages.size > 100) {
    const firstKey = processedImages.keys().next().value;
    if (firstKey) processedImages.delete(firstKey);
  }
  processedImages.set(id, result);
  return result;
}
export async function generatePatternPNG(
  imageId: string,
  cellSize: number = 20,
  showGrid: boolean = true,
  showNumbers: boolean = false
): Promise<Buffer> {
  const processed = processedImages.get(imageId);
  if (!processed) {
    throw new Error('Image not found');
  }
  
  const { pixelData, brand, colorNumberMap } = processed;
  const { width, height, pixels } = pixelData;
  
  const gridSize = showGrid ? 1 : 0;
  const canvasWidth = (width * (cellSize + gridSize)) + gridSize;
  const canvasHeight = (height * (cellSize + gridSize)) + gridSize;
  
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">`;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIdx = pixels[y][x];
      const color = pixelData.colors.get(colorIdx);
      
      const px = x * (cellSize + gridSize) + gridSize;
      const py = y * (cellSize + gridSize) + gridSize;
      
      svgContent += `<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="${color?.hex || '#FFFFFF'}" stroke="#CCCCCC" stroke-width="0.5"/>`;
      
      if (showNumbers) {
        // 使用图例序号 (1,2,3...) 而非原始索引
        const legendNum = colorNumberMap?.get(colorIdx) || colorIdx;
        svgContent += `<text x="${px + cellSize/2}" y="${py + cellSize/2}" font-size="${Math.max(8, cellSize/4)}" text-anchor="middle" dominant-baseline="middle" fill="${isLightColor(color?.hex || '#FFFFFF') ? '#000' : '#FFF'}">${legendNum}</text>`;
      }
    }
  }
  
  svgContent += `<text x="${canvasWidth - 10}" y="${canvasHeight - 10}" font-size="12" text-anchor="end" fill="#999999">${brandNames[brand]} 色号</text>`;
  svgContent += '</svg>';
  
  const pngBuffer = await sharp(Buffer.from(svgContent))
    .png()
    .toBuffer();
  
  return pngBuffer;
}

/**
 * 生成色号图例 PNG
 */
export async function generateLegendPNG(
  imageId: string,
  cellSize: number = 16
): Promise<Buffer> {
  const processed = processedImages.get(imageId);
  if (!processed) {
    throw new Error('Image not found');
  }
  
  const { legend, brand } = processed;
  
  const itemWidth = 140;
  const itemHeight = 40;
  const columns = 5;
  const padding = 20;
  const rows = Math.ceil(legend.length / columns);
  
  const canvasWidth = columns * itemWidth + padding * 2;
  const canvasHeight = rows * itemHeight + padding * 2;
  
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">`;
  
  svgContent += `<text x="${padding}" y="${padding + 15}" font-size="14" font-weight="bold" fill="#333333">色号图例 (${brandNames[brand]})</text>`;
  
  legend.forEach((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    const x = padding + col * itemWidth;
    const y = padding + 30 + row * itemHeight;
    
    svgContent += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${item.color.hex}" stroke="#CCCCCC" stroke-width="1"/>`;
    // 序号
    svgContent += `<circle cx="${x + cellSize + 10}" cy="${y + 8}" r="9" fill="${item.color.hex}" stroke="#333" stroke-width="1"/><text x="${x + cellSize + 10}" y="${y + 12}" font-size="11" text-anchor="middle" fill="${isLightColor(item.color.hex) ? '#000' : '#FFF'}">${item.number}</text>`;
    svgContent += `<text x="${x + cellSize + 24}" y="${y + 12}" font-size="12" fill="#333333">${item.color.name}</text>`;
    svgContent += `<text x="${x + cellSize + 24}" y="${y + 26}" font-size="11" fill="#666666">${item.count}颗 (${item.percentage}%)</text>`;
  });
  
  svgContent += '</svg>';
  
  const pngBuffer = await sharp(Buffer.from(svgContent))
    .png()
    .toBuffer();
  
  return pngBuffer;
}

/**
 * 生成组合导出 PNG：上方为图纸（含编号），下方为色号图例
 */
export async function generateCombinedExportPNG(
  imageId: string,
  cellSize: number = 16
): Promise<Buffer> {
  const processed = processedImages.get(imageId);
  if (!processed) {
    throw new Error('Image not found');
  }

  const { pixelData, legend, brand } = processed;
  const { width, height, pixels } = pixelData;

  // === 图纸部分 ===
  const gridSize = 1;
  const patternW = width * (cellSize + gridSize) + gridSize;
  const patternH = height * (cellSize + gridSize) + gridSize;

  let patternSvg = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIdx = pixels[y][x];
      const color = pixelData.colors.get(colorIdx);
      const px = x * (cellSize + gridSize) + gridSize;
      const py = y * (cellSize + gridSize) + gridSize;
      const legendNum = processed.colorNumberMap?.get(colorIdx) || colorIdx;
      patternSvg += `<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="${color?.hex || '#FFFFFF'}" stroke="#CCCCCC" stroke-width="0.5"/>`;
      patternSvg += `<text x="${px + cellSize/2}" y="${py + cellSize/2}" font-size="${Math.max(7, cellSize/3)}" text-anchor="middle" dominant-baseline="middle" fill="${isLightColor(color?.hex || '#FFFFFF') ? '#000' : '#FFF'}">${legendNum}</text>`;
    }
  }

  // === 图例部分 ===
  const legendItemW = 145;
  const legendItemH = 42;
  const legendCols = 5;
  const legendPadding = 20;
  const legendRows = Math.ceil(legend.length / legendCols);
  const titleH = 40;
  const legendW = legendCols * legendItemW + legendPadding * 2;
  const legendH = legendRows * legendItemH + legendPadding * 2 + titleH;

  let legendSvg = `<text x="${legendPadding}" y="${legendPadding + 15}" font-size="16" font-weight="bold" fill="#333333">色号图例 (${brandNames[brand]})</text>`;
  legend.forEach((item, index) => {
    const col = index % legendCols;
    const row = Math.floor(index / legendCols);
    const lx = legendPadding + col * legendItemW;
    const ly = legendPadding + titleH + row * legendItemH;
    const cs = 14;
    legendSvg += `<rect x="${lx}" y="${ly}" width="${cs}" height="${cs}" fill="${item.color.hex}" stroke="#CCCCCC" stroke-width="1"/>`;
    legendSvg += `<circle cx="${lx + cs + 10}" cy="${ly + 7}" r="8" fill="${item.color.hex}" stroke="#333" stroke-width="1"/><text x="${lx + cs + 10}" y="${ly + 11}" font-size="10" text-anchor="middle" fill="${isLightColor(item.color.hex) ? '#000' : '#FFF'}">${item.number}</text>`;
    legendSvg += `<text x="${lx + cs + 24}" y="${ly + 10}" font-size="12" fill="#333333">${item.color.name}</text>`;
    legendSvg += `<text x="${lx + cs + 24}" y="${ly + 24}" font-size="11" fill="#666666">#${item.count}颗 (${item.percentage}%)</text>`;
  });

  // === 合并 ===
  const gap = 30;
  const totalW = Math.max(patternW, legendW);
  const totalH = patternH + gap + legendH;

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">` +
    `<rect width="100%" height="100%" fill="white"/>` +
    `<g transform="translate(${Math.max(0, (totalW - patternW) / 2)}, 0)">${patternSvg}</g>` +
    `<g transform="translate(${Math.max(0, (totalW - legendW) / 2)}, ${patternH + gap})">${legendSvg}</g>` +
    '</svg>';

  return await sharp(Buffer.from(fullSvg)).png().toBuffer();
}

export function getProcessedImage(imageId: string): ProcessedImage | undefined {
  return processedImages.get(imageId);
}

function isLightColor(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return true;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}
