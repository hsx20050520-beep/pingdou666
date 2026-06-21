/**
 * 拼豆图纸 API 路由
 */

import { Router } from 'express';
import multer from 'multer';
import type { Request, Response } from 'express';
import { 
  processImage, 
  generatePatternPNG, 
  generateLegendPNG,
  getProcessedImage 
} from '../image-processor';
import { getAllBrands, beadColors } from '../bead-colors';
import type { BeadColor } from '../bead-colors';

const router = Router();

// 配置 multer 用于接收图片
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
    }
  },
});

interface ProcessRequest {
  targetSize: string;
  brand: string;
  useColorMatching: string | boolean;
}

/**
 * POST /api/v1/process
 * 上传图片并处理
 */
router.post('/process', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传图片' });
      return;
    }

    const body = req.body as ProcessRequest;
    const targetSize = parseInt(body.targetSize) || 64;
    const brand = (body.brand || 'mard') as BeadColor['brand'];
    const useColorMatching = body.useColorMatching === 'true' || body.useColorMatching === true;
    const clampedSize = Math.min(Math.max(targetSize, 16), 128);
    
    // 处理图片
    const result = await processImage(
      req.file.buffer,
      clampedSize,
      brand,
      useColorMatching
    );

    res.json({
      success: true,
      data: {
        id: result.id,
        width: result.pixelData.width,
        height: result.pixelData.height,
        totalBeads: result.pixelData.totalBeads,
        colorCount: result.pixelData.colorCount,
        legend: result.legend.map(item => ({
          id: item.color.id,
          hex: item.color.hex,
          name: item.color.name,
          brand: item.color.brand,
          count: item.count,
          percentage: item.percentage,
        })),
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        brand: result.brand,
      },
    });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: '图片处理失败' });
  }
});

/**
 * GET /api/v1/preview/:id
 * 获取预览图（低分辨率）
 */
router.get('/preview/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const cellSize = parseInt(String(req.query.cellSize)) || 10;
    
    const pngBuffer = await generatePatternPNG(
      id,
      cellSize,
      true,
      false
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(pngBuffer);
  } catch (error: any) {
    console.error('Preview error:', error);
    if (error.message === 'Image not found') {
      res.status(404).json({ error: '图片不存在或已过期' });
    } else {
      res.status(500).json({ error: '生成预览失败' });
    }
  }
});

/**
 * GET /api/v1/export/:id
 * 导出高分辨率图纸 PNG
 */
router.get('/export/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const cellSize = parseInt(String(req.query.cellSize)) || 20;
    const showNumbers = req.query.showNumbers === 'true';
    
    const pngBuffer = await generatePatternPNG(
      id,
      cellSize,
      true,
      showNumbers
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="bead-pattern-${id}.png"`);
    res.send(pngBuffer);
  } catch (error: any) {
    console.error('Export error:', error);
    if (error.message === 'Image not found') {
      res.status(404).json({ error: '图片不存在或已过期' });
    } else {
      res.status(500).json({ error: '导出失败' });
    }
  }
});

/**
 * GET /api/v1/legend/:id
 * 导出色号图例 PNG
 */
router.get('/legend/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    
    const pngBuffer = await generateLegendPNG(id);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="bead-legend-${id}.png"`);
    res.send(pngBuffer);
  } catch (error: any) {
    console.error('Legend error:', error);
    if (error.message === 'Image not found') {
      res.status(404).json({ error: '图片不存在或已过期' });
    } else {
      res.status(500).json({ error: '生成图例失败' });
    }
  }
});

/**
 * GET /api/v1/brands
 * 获取支持的色号品牌列表
 */
router.get('/brands', (req: Request, res: Response) => {
  const brands = getAllBrands();
  res.json({
    success: true,
    data: brands.map(brand => ({
      id: brand,
      name: brand.toUpperCase(),
      colorCount: beadColors.filter(c => c.brand === brand).length,
    })),
  });
});

/**
 * GET /api/v1/colors/:brand
 * 获取指定品牌的全部颜色
 */
router.get('/colors/:brand', (req: Request, res: Response) => {
  const brand = String(req.params.brand);
  const colors = beadColors.filter(c => c.brand === brand);
  
  res.json({
    success: true,
    data: colors.map(c => ({
      id: c.id,
      hex: c.hex,
      name: c.name,
      brand: c.brand,
    })),
  });
});

/**
 * GET /api/v1/image/:id
 * 获取图片处理详情
 */
router.get('/image/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const image = getProcessedImage(id);
  
  if (!image) {
    res.status(404).json({ error: '图片不存在或已过期' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: image.id,
      width: image.pixelData.width,
      height: image.pixelData.height,
      totalBeads: image.pixelData.totalBeads,
      colorCount: image.pixelData.colorCount,
      brand: image.brand,
      legend: image.legend.map(item => ({
        id: item.color.id,
        hex: item.color.hex,
        name: item.color.name,
        brand: item.color.brand,
        count: item.count,
        percentage: item.percentage,
      })),
    },
  });
});

export default router;
