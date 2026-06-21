/**
 * 拼豆色号数据库
 * 支持 Mard、Perler、Hama、Nabbi 四个品牌
 */

// 颜色数据结构
export interface BeadColor {
  id: string;
  hex: string;
  name: string;
  brand: 'mard' | 'perler' | 'hama' | 'nabbi';
  // RGB 值用于颜色匹配
  r: number;
  g: number;
  b: number;
}

// Mard 品牌色号
const mardColors: Omit<BeadColor, 'id' | 'r' | 'g' | 'b'>[] = [
  { hex: '#FFFFFF', name: '白色', brand: 'mard' },
  { hex: '#000000', name: '黑色', brand: 'mard' },
  { hex: '#FF0000', name: '红色', brand: 'mard' },
  { hex: '#00FF00', name: '绿色', brand: 'mard' },
  { hex: '#0000FF', name: '蓝色', brand: 'mard' },
  { hex: '#FFFF00', name: '黄色', brand: 'mard' },
  { hex: '#FF6B4A', name: '珊瑚橙', brand: 'mard' },
  { hex: '#FFA500', name: '橙色', brand: 'mard' },
  { hex: '#FFD700', name: '金色', brand: 'mard' },
  { hex: '#DC143C', name: '深红', brand: 'mard' },
  { hex: '#FF69B4', name: '粉红', brand: 'mard' },
  { hex: '#008000', name: '绿色', brand: 'mard' },
  { hex: '#228B22', name: '森林绿', brand: 'mard' },
  { hex: '#4169E1', name: '皇家蓝', brand: 'mard' },
  { hex: '#0000CD', name: '中蓝', brand: 'mard' },
  { hex: '#800080', name: '紫色', brand: 'mard' },
  { hex: '#9932CC', name: '暗兰花紫', brand: 'mard' },
  { hex: '#C0C0C0', name: '银色', brand: 'mard' },
  { hex: '#A52A2A', name: '棕色', brand: 'mard' },
  { hex: '#808080', name: '灰色', brand: 'mard' },
];

// Perler 品牌色号
const perlerColors: Omit<BeadColor, 'id' | 'r' | 'g' | 'b'>[] = [
  { hex: '#FFE4B5', name: 'Perler 奶黄', brand: 'perler' },
  { hex: '#FF8C00', name: 'Perler 暗橙', brand: 'perler' },
  { hex: '#FF1493', name: 'Perler 深粉', brand: 'perler' },
  { hex: '#00CED1', name: 'Perler 暗青', brand: 'perler' },
  { hex: '#20B2AA', name: 'Perler 浅蓝绿', brand: 'perler' },
];

// Hama 品牌色号
const hamaColors: Omit<BeadColor, 'id' | 'r' | 'g' | 'b'>[] = [
  { hex: '#FFD700', name: 'Hama 金黄', brand: 'hama' },
  { hex: '#FFC0CB', name: 'Hama 粉', brand: 'hama' },
  { hex: '#40E0D0', name: 'Hama 绿松石', brand: 'hama' },
  { hex: '#FA9A22', name: 'Hama 橙黄', brand: 'hama' },
];

// Nabbi 品牌色号
const nabbiColors: Omit<BeadColor, 'id' | 'r' | 'g' | 'b'>[] = [
  { hex: '#F0F8FF', name: 'Nabbi 爱丽丝蓝', brand: 'nabbi' },
  { hex: '#FA8072', name: 'Nabbi 三文鱼', brand: 'nabbi' },
  { hex: '#E0FFFF', name: 'Nabbi 浅青', brand: 'nabbi' },
];

// 合并所有颜色并计算 RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

const allColorsRaw = [...mardColors, ...perlerColors, ...hamaColors, ...nabbiColors];

export const beadColors: BeadColor[] = allColorsRaw.map((color, index) => {
  const rgb = hexToRgb(color.hex);
  return {
    ...color,
    id: `${color.brand}-${index}`,
    ...rgb,
  };
});

// 获取指定品牌的颜色
export function getColorsByBrand(brand: BeadColor['brand']): BeadColor[] {
  return beadColors.filter((c) => c.brand === brand);
}

// 获取所有品牌列表
export function getAllBrands(): BeadColor['brand'][] {
  return ['mard', 'perler', 'hama', 'nabbi'];
}

// 计算颜色相似度（使用欧几里得距离）
function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

// 找到最接近的颜色
export function findClosestColor(
  r: number, g: number, b: number,
  brand?: BeadColor['brand']
): BeadColor {
  const colors = brand ? getColorsByBrand(brand) : beadColors;
  
  let closest = colors[0];
  let minDistance = colorDistance(r, g, b, closest.r, closest.g, closest.b);
  
  for (const color of colors) {
    const distance = colorDistance(r, g, b, color.r, color.g, color.b);
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }
  
  return closest;
}

// 品牌中文名
export const brandNames: Record<BeadColor['brand'], string> = {
  mard: 'Mard',
  perler: 'Perler',
  hama: 'Hama',
  nabbi: 'Nabbi',
};
