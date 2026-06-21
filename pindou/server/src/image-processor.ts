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
}

export interface ProcessedImage {
  id: string;
  pixelData: PixelData;
  legend: ColorLegendItem[];
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
export async function processImage(
  imageBuffer: Buffer,
  targetSize: number,
  brand: BeadColor['brand'],
  useColorMatching: boolean
): Promise<ProcessedImage> {
  const id = uuidv4();
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  const originalWidth = metadata.width || 100;
  const originalHeight = metadata.height || 100;
  
  const aspectRatio = originalWidth / originalHeight;
  let targetWidth: number, targetHeight: number;
  
  if (aspectRatio > 1) {
    targetWidth = targetSize;
    targetHeight = Math.round(targetSize / aspectRatio);
  } else {
    targetHeight = targetSize;
    targetWidth = Math.round(targetSize * aspectRatio);
  }
  
  const resizedBuffer = await image
    .resize(targetWidth, targetHeight, { kernel: 'nearest' })
    .raw()
    .toBuffer();
  
  const pixels: number[][] = [];
  const colorMap = new Map<number, BeadColor>();
  let colorIndex = 0;
  
  for (let y = 0; y < targetHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 3;
      const r = resizedBuffer[idx];
      const g = resizedBuffer[idx + 1];
      const b = resizedBuffer[idx + 2];
      
      let beadColor: BeadColor;
      
      if (useColorMatching) {
        beadColor = findClosestColor(r, g, b, brand);
      } else {
        beadColor = {
          id: `original-${r}-${g}-${b}`,
          hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          name: `RGB(${r},${g},${b})`,
          brand: 'mard',
          r, g, b,
        };
      }
      
      let existingIndex = -1;
      for (const [existingIdx, c] of colorMap) {
        if (c.hex === beadColor.hex) {
          existingIndex = existingIdx;
          break;
        }
      }
      
      if (existingIndex >= 0) {
        row.push(existingIndex);
      } else {
        colorMap.set(colorIndex, beadColor);
        row.push(colorIndex);
        colorIndex++;
      }
    }
    pixels.push(row);
  }
  
  const colorUsage = new Map<number, number>();
  for (const row of pixels) {
    for (const idx of row) {
      colorUsage.set(idx, (colorUsage.get(idx) || 0) + 1);
    }
  }
  
  const totalPixels = targetWidth * targetHeight;
  const legend: ColorLegendItem[] = [];
  
  for (const [idx, count] of colorUsage) {
    const color = colorMap.get(idx)!;
    legend.push({
      color,
      count,
      percentage: Math.round((count / totalPixels) * 100),
    });
  }
  
  legend.sort((a, b) => b.count - a.count);
  
  const pixelData: PixelData = {
    width: targetWidth,
    height: targetHeight,
    pixels,
    colors: colorMap,
    colorCount: colorMap.size,
    totalBeads: totalPixels,
  };
  
  const result: ProcessedImage = {
    id,
    pixelData,
    legend,
    originalWidth,
    originalHeight,
    targetPixelSize: targetSize,
    brand,
  };
  
  if (processedImages.size > 100) {
    const firstKey = processedImages.keys().next().value;
    if (firstKey) processedImages.delete(firstKey);
  }
  processedImages.set(id, result);
  
  return result;
}

/**
 * 生成带网格的图纸 PNG
 */
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
  
  const { pixelData, brand } = processed;
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
        svgContent += `<text x="${px + cellSize/2}" y="${py + cellSize/2}" font-size="${Math.max(8, cellSize/4)}" text-anchor="middle" dominant-baseline="middle" fill="${isLightColor(color?.hex || '#FFFFFF') ? '#000' : '#FFF'}">${colorIdx}</text>`;
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
  
  const itemWidth = 120;
  const itemHeight = 40;
  const columns = 6;
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
    svgContent += `<text x="${x + cellSize + 8}" y="${y + 10}" font-size="11" fill="#333333">${item.color.name}</text>`;
    svgContent += `<text x="${x + cellSize + 8}" y="${y + 22}" font-size="10" fill="#666666">${item.count}颗 (${item.percentage}%)</text>`;
  });
  
  svgContent += '</svg>';
  
  const pngBuffer = await sharp(Buffer.from(svgContent))
    .png()
    .toBuffer();
  
  return pngBuffer;
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
