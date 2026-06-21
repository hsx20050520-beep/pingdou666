/**
 * PNG export module - compact horizontal badge legend
 */

import sharp from 'sharp';
import type { ProcessedImage } from './image-processor';

const brandNames: Record<string, string> = {
  mard: 'Mard', perler: 'Perler', hama: 'Hama', nabbi: 'Nabbi'
};

function isLight(hex: string): boolean {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return true;
  return (parseInt(r[1],16)*299 + parseInt(r[2],16)*587 + parseInt(r[3],16)*114) / 1000 > 128;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export async function generatePatternPNG_v2(
  processed: ProcessedImage, cellSize = 24
): Promise<Buffer> {
  const { pixelData, legend, brand, colorNumberMap } = processed;
  const { width, height, pixels } = pixelData;
  const g = 1, cs = cellSize + g;
  const tw = width * cs + g, th = height * cs + g;
  const m = 40;
  const bw = 85, bh = 70;
  const lc = Math.max(4, Math.min(Math.floor(tw / bw), legend.length));
  const lr = Math.ceil(legend.length / lc);
  const fw = Math.max(tw + m*2, lc*bw + m*2);
  const fh = m + 50 + th + 40 + lr*bh + 50 + m;

  function t(s: string) { return s; }
  const p: string[] = [];

  p.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + fw + '" height="' + fh + '" viewBox="0 0 ' + fw + ' ' + fh + '">');
  p.push('<rect width="100%" height="100%" fill="white"/>');
  p.push('<text x="' + m + '" y="30" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">拼豆图纸 (' + esc(brandNames[brand]) + ') ' + width + '×' + height + ' 共' + legend.length + '色</text>');

  const gx = m, gy = m + 50;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ci = pixels[y][x], c = pixelData.colors.get(ci);
      const px = gx + x*cs + g, py = gy + y*cs + g;
      const n = colorNumberMap?.get(ci) ?? ci;
      p.push('<rect x="' + px + '" y="' + py + '" width="' + cellSize + '" height="' + cellSize + '" fill="' + (c?.hex||'#FFF') + '" stroke="#E0E0E0" stroke-width="0.5"/>');
      const fs = Math.max(7, Math.floor(cellSize/2.8));
      const tc = isLight(c?.hex||'#FFF') ? '#000' : '#FFF';
      p.push('<text x="' + (px+cellSize/2) + '" y="' + (py+cellSize/2+fs/3) + '" font-size="' + fs + '" font-weight="bold" fill="' + tc + '" text-anchor="middle">' + esc(String(n)) + '</text>');
    }
  }
  p.push('<rect x="' + gx + '" y="' + gy + '" width="' + tw + '" height="' + th + '" fill="none" stroke="#CCC" stroke-width="1"/>');

  const ly = gy + th + 30;
  const pad = (fw - m*2 - lc*bw) / (lc + 1);
  p.push('<text x="' + m + '" y="' + ly + '" font-family="sans-serif" font-size="18" font-weight="bold" fill="#333">色号图例（按使用量排列）</text>');

  legend.forEach((item, i) => {
    const col = i % lc, row = Math.floor(i / lc);
    const bx = m + pad + col*(bw+pad), by = ly + 20 + row*bh;
    const ws = 38, cx = bx + (bw-ws)/2;
    const iw = item.color.hex === '#FFFFFF';
    const tc2 = isLight(item.color.hex) ? '#1a1a2e' : '#FFF';
    p.push('<rect x="' + cx + '" y="' + by + '" width="' + ws + '" height="' + ws + '" rx="6" fill="' + item.color.hex + '" stroke="' + (iw?'#CCC':'none') + '" stroke-width="1.5"/>');
    p.push('<text x="' + (cx+ws/2) + '" y="' + (by+ws/2+5) + '" font-family="monospace" font-size="13" font-weight="bold" fill="' + tc2 + '" text-anchor="middle">' + item.number + '</text>');
    p.push('<text x="' + (bx+bw/2) + '" y="' + (by+ws+15) + '" font-family="sans-serif" font-size="11" fill="#666" text-anchor="middle">' + item.count + '颗</text>');
  })

  p.push('</svg>');
  const NL = String.fromCharCode(10);
  return sharp(Buffer.from(p.join(NL))).png({compressionLevel:9}).toBuffer();
}
