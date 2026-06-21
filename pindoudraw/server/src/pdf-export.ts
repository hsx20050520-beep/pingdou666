/**
 * PDF 图纸导出模块
 * 使用 pdfkit 生成矢量 PDF，完全无损
 */

import PDFDocument from 'pdfkit';
import type { ProcessedImage } from './image-processor';

/** 生成 PDF 文档 buffer */
export async function generatePatternPDF(
  processed: ProcessedImage,
  cellSize: number = 16
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const { pixelData, legend, brand, colorNumberMap } = processed;
      const { width, height, pixels } = pixelData;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: '拼豆图纸',
          Author: '拼豆图纸大师',
          Subject: `${brandNames[brand]} 拼豆图纸 ${width}x${height}`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // 页面可用尺寸
      const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageH = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

      // === 标题 ===
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`拼豆图纸 (${brandNames[brand]})  ${width}×${height}  共${legend.length}色`, 40, 40);

      // === 图纸区域 ===
      const titleH = 50;
      const gridSize = 0.5; // 网格线宽(点)
      const totalGridW = width * (cellSize + gridSize) + gridSize;
      const totalGridH = height * (cellSize + gridSize) + gridSize;

      // 居中
      const startX = doc.page.margins.left + Math.max(0, (pageW - totalGridW) / 2);
      const startY = doc.page.margins.top + titleH;

      // 绘制每个像素
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const colorIdx = pixels[y][x];
          const color = pixelData.colors.get(colorIdx);
          const px = startX + x * (cellSize + gridSize) + gridSize;
          const py = startY + y * (cellSize + gridSize) + gridSize;
          const legendNum = colorNumberMap?.get(colorIdx) || colorIdx;

          // 填充颜色块
          doc.rect(px, py, cellSize, cellSize);
          doc.fill(color?.hex || '#FFFFFF');

          // 编号文字
          const fontSize = Math.max(5, cellSize / 3);
          const textColor = isLightColor(color?.hex || '#FFFFFF') ? '#000000' : '#FFFFFF';
          doc.fontSize(fontSize).font('Helvetica');
          doc.fillColor(textColor);
          doc.text(String(legendNum), px + cellSize / 2, py + cellSize / 2 - fontSize / 3, {
            width: cellSize,
            align: 'center',
            lineBreak: false,
          });
        }
      }

      // 外边框
      doc.rect(startX, startY, totalGridW, totalGridH).stroke('#CCCCCC');

      // === 图例区域 ===
      const legendStartY = startY + totalGridH + 40;

      // 检查是否需要新页面
      const legendItemH = 36;
      const legendCols = 4;
      const legendRows = Math.ceil(legend.length / legendCols);
      const legendTotalH = legendRows * legendItemH + 30;

      if (legendStartY + legendTotalH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333');
      const legendTitleY = legendStartY > doc.page.height - doc.page.margins.bottom 
        ? doc.page.margins.top 
        : legendStartY;
      doc.text('色号图例', doc.page.margins.left, legendTitleY);

      const legendItemW = (pageW - 20) / legendCols;
      const legendContentY = legendTitleY + 24;

      legend.forEach((item, index) => {
        const col = index % legendCols;
        const row = Math.floor(index / legendCols);
        const lx = doc.page.margins.left + col * legendItemW;
        const ly = legendContentY + row * legendItemH;

        // 色块
        const cs = 14;
        doc.rect(lx, ly, cs, cs).fill(item.color.hex);
        doc.rect(lx, ly, cs, cs).stroke('#CCCCCC');

        // 编号圆圈
        const circleX = lx + cs + 12;
        const circleY = ly + cs / 2;
        doc.circle(circleX, circleY, 8).fill(item.color.hex);
        doc.circle(circleX, circleY, 8).stroke('#333333');
        
        const numFontSize = 9;
        doc.fontSize(numFontSize).font('Helvetica');
        doc.fillColor(isLightColor(item.color.hex) ? '#000000' : '#FFFFFF');
        doc.text(String(item.number), circleX - 4, circleY - 4, {
          width: 8,
          align: 'center',
          lineBreak: false,
        });

        // 名称和数量
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        doc.text(`${item.color.name}`, circleX + 12, ly, { width: legendItemW - cs - 30 });
        doc.fontSize(8).fillColor('#666666');
        doc.text(`#${item.count}颗 (${item.percentage}%)`, circleX + 12, ly + 12, {
          width: legendItemW - cs - 30,
        });
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function isLightColor(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return true;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const brandNames: Record<string, string> = {
  mard: 'Mard',
  perler: 'Perler',
  hama: 'Hama',
  nabbi: 'Nabbi',
};
