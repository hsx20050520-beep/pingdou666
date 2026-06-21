/**
 * 拼豆色号数据库
 * 颜色匹配采用 CIE Lab ΔE76 感知色差公式，比 RGB 欧几里得准确得多
 * 支持 Mard、Perler、Hama、Nabbi 四个品牌
 */

// 颜色数据结构
export interface BeadColor {
  id: string;
  hex: string;
  name: string;
  brand: 'mard' | 'perler' | 'hama' | 'nabbi';
  r: number;
  g: number;
  b: number;
  // 预计算的 Lab 值，加速匹配
  L: number;
  a: number;
  bVal: number;
  /** 标准编号（如 Mard_A1, Perler_01, Hama_01, Nabbi_01） */
  stdNum: string;
}

// ====== Mard 品牌官方色号（221色，9大色系）======
// 来源: Mard 官方色卡 pd.anqstar.com/colors

const mardColorDefs: { hex: string; name: string }[] = [
  // A系 — 黄橙系 (26色)
  { hex: '#FAF4C8', name: 'Mard_A1' },
  { hex: '#FFFFD5', name: 'Mard_A2' },
  { hex: '#FEFF8B', name: 'Mard_A3' },
  { hex: '#FBED56', name: 'Mard_A4' },
  { hex: '#F4D738', name: 'Mard_A5' },
  { hex: '#FEAC4C', name: 'Mard_A6' },
  { hex: '#FE8B4C', name: 'Mard_A7' },
  { hex: '#FFDA45', name: 'Mard_A8' },
  { hex: '#FF995B', name: 'Mard_A9' },
  { hex: '#F77C31', name: 'Mard_A10' },
  { hex: '#FFDD99', name: 'Mard_A11' },
  { hex: '#FE9F72', name: 'Mard_A12' },
  { hex: '#FFC365', name: 'Mard_A13' },
  { hex: '#FD543D', name: 'Mard_A14' },
  { hex: '#FFF365', name: 'Mard_A15' },
  { hex: '#FFFF9F', name: 'Mard_A16' },
  { hex: '#FFE36E', name: 'Mard_A17' },
  { hex: '#FEBE7D', name: 'Mard_A18' },
  { hex: '#FD7C72', name: 'Mard_A19' },
  { hex: '#FFD568', name: 'Mard_A20' },
  { hex: '#FFE395', name: 'Mard_A21' },
  { hex: '#F4F57D', name: 'Mard_A22' },
  { hex: '#E6C9B7', name: 'Mard_A23' },
  { hex: '#F7F8A2', name: 'Mard_A24' },
  { hex: '#FFD67D', name: 'Mard_A25' },
  { hex: '#FFC830', name: 'Mard_A26' },
  // B系 — 绿色系 (32色)
  { hex: '#E6EE31', name: 'Mard_B1' },
  { hex: '#63F347', name: 'Mard_B2' },
  { hex: '#9EF780', name: 'Mard_B3' },
  { hex: '#5DE035', name: 'Mard_B4' },
  { hex: '#35E352', name: 'Mard_B5' },
  { hex: '#65E2A6', name: 'Mard_B6' },
  { hex: '#3DAF80', name: 'Mard_B7' },
  { hex: '#1C9C4F', name: 'Mard_B8' },
  { hex: '#27523A', name: 'Mard_B9' },
  { hex: '#95D3C2', name: 'Mard_B10' },
  { hex: '#5D722A', name: 'Mard_B11' },
  { hex: '#166F41', name: 'Mard_B12' },
  { hex: '#CAEB7B', name: 'Mard_B13' },
  { hex: '#ADE946', name: 'Mard_B14' },
  { hex: '#2E5132', name: 'Mard_B15' },
  { hex: '#C5ED9C', name: 'Mard_B16' },
  { hex: '#9BB13A', name: 'Mard_B17' },
  { hex: '#E6EE49', name: 'Mard_B18' },
  { hex: '#24B88C', name: 'Mard_B19' },
  { hex: '#C2F0CC', name: 'Mard_B20' },
  { hex: '#156A6B', name: 'Mard_B21' },
  { hex: '#0B3C43', name: 'Mard_B22' },
  { hex: '#303A21', name: 'Mard_B23' },
  { hex: '#EEFCA5', name: 'Mard_B24' },
  { hex: '#4E846D', name: 'Mard_B25' },
  { hex: '#8D7A35', name: 'Mard_B26' },
  { hex: '#CCE1AF', name: 'Mard_B27' },
  { hex: '#9EE5B9', name: 'Mard_B28' },
  { hex: '#C5E254', name: 'Mard_B29' },
  { hex: '#E2FCB1', name: 'Mard_B30' },
  { hex: '#B0E792', name: 'Mard_B31' },
  { hex: '#9CAB5A', name: 'Mard_B32' },
  // C系 — 蓝青系 (29色)
  { hex: '#E8FFE7', name: 'Mard_C1' },
  { hex: '#A9F9FC', name: 'Mard_C2' },
  { hex: '#A0E2FB', name: 'Mard_C3' },
  { hex: '#41CCFF', name: 'Mard_C4' },
  { hex: '#01ACEB', name: 'Mard_C5' },
  { hex: '#50AAF0', name: 'Mard_C6' },
  { hex: '#3677D2', name: 'Mard_C7' },
  { hex: '#0F54C0', name: 'Mard_C8' },
  { hex: '#324BCA', name: 'Mard_C9' },
  { hex: '#3EBCE2', name: 'Mard_C10' },
  { hex: '#28DDDE', name: 'Mard_C11' },
  { hex: '#1C334D', name: 'Mard_C12' },
  { hex: '#CDE8FF', name: 'Mard_C13' },
  { hex: '#D5FDFF', name: 'Mard_C14' },
  { hex: '#22C4C6', name: 'Mard_C15' },
  { hex: '#1557A8', name: 'Mard_C16' },
  { hex: '#04D1F6', name: 'Mard_C17' },
  { hex: '#1D3344', name: 'Mard_C18' },
  { hex: '#1887A2', name: 'Mard_C19' },
  { hex: '#176DAF', name: 'Mard_C20' },
  { hex: '#BEDDFF', name: 'Mard_C21' },
  { hex: '#67B4BE', name: 'Mard_C22' },
  { hex: '#C8E2FF', name: 'Mard_C23' },
  { hex: '#7CC4FF', name: 'Mard_C24' },
  { hex: '#A9E5E5', name: 'Mard_C25' },
  { hex: '#3CAED8', name: 'Mard_C26' },
  { hex: '#D3DFFA', name: 'Mard_C27' },
  { hex: '#BBCFED', name: 'Mard_C28' },
  { hex: '#34488E', name: 'Mard_C29' },
  // D系 — 蓝紫系 (26色)
  { hex: '#AEB4F2', name: 'Mard_D1' },
  { hex: '#858EDD', name: 'Mard_D2' },
  { hex: '#2F54AF', name: 'Mard_D3' },
  { hex: '#182A84', name: 'Mard_D4' },
  { hex: '#B843C5', name: 'Mard_D5' },
  { hex: '#AC7BDE', name: 'Mard_D6' },
  { hex: '#8854B3', name: 'Mard_D7' },
  { hex: '#E2D3FF', name: 'Mard_D8' },
  { hex: '#D5B9F8', name: 'Mard_D9' },
  { hex: '#361851', name: 'Mard_D10' },
  { hex: '#B9BAE1', name: 'Mard_D11' },
  { hex: '#DE9AD4', name: 'Mard_D12' },
  { hex: '#B90095', name: 'Mard_D13' },
  { hex: '#8B279B', name: 'Mard_D14' },
  { hex: '#2F1F90', name: 'Mard_D15' },
  { hex: '#E3E1EE', name: 'Mard_D16' },
  { hex: '#C4D4F6', name: 'Mard_D17' },
  { hex: '#A45EC7', name: 'Mard_D18' },
  { hex: '#D8C3D7', name: 'Mard_D19' },
  { hex: '#9C32B2', name: 'Mard_D20' },
  { hex: '#9A009B', name: 'Mard_D21' },
  { hex: '#333A95', name: 'Mard_D22' },
  { hex: '#EBDAFC', name: 'Mard_D23' },
  { hex: '#7786E5', name: 'Mard_D24' },
  { hex: '#494FC7', name: 'Mard_D25' },
  { hex: '#DFC2F8', name: 'Mard_D26' },
  // E系 — 粉玫系 (24色)
  { hex: '#FDD3CC', name: 'Mard_E1' },
  { hex: '#FEC0DF', name: 'Mard_E2' },
  { hex: '#FFB7E7', name: 'Mard_E3' },
  { hex: '#E8649E', name: 'Mard_E4' },
  { hex: '#F551A2', name: 'Mard_E5' },
  { hex: '#F13D74', name: 'Mard_E6' },
  { hex: '#C63478', name: 'Mard_E7' },
  { hex: '#FFDBE9', name: 'Mard_E8' },
  { hex: '#E970CC', name: 'Mard_E9' },
  { hex: '#D33793', name: 'Mard_E10' },
  { hex: '#FCDDD2', name: 'Mard_E11' },
  { hex: '#F78FC3', name: 'Mard_E12' },
  { hex: '#B5006D', name: 'Mard_E13' },
  { hex: '#FFD1BA', name: 'Mard_E14' },
  { hex: '#F8C7C9', name: 'Mard_E15' },
  { hex: '#FFF3EB', name: 'Mard_E16' },
  { hex: '#FFE2EA', name: 'Mard_E17' },
  { hex: '#FFC7DB', name: 'Mard_E18' },
  { hex: '#FEBAD5', name: 'Mard_E19' },
  { hex: '#D8C7D1', name: 'Mard_E20' },
  { hex: '#BD9DA1', name: 'Mard_E21' },
  { hex: '#B785A1', name: 'Mard_E22' },
  { hex: '#937A8D', name: 'Mard_E23' },
  { hex: '#E1BCE8', name: 'Mard_E24' },
  // F系 — 红色系 (25色)
  { hex: '#FD957B', name: 'Mard_F1' },
  { hex: '#FC3D46', name: 'Mard_F2' },
  { hex: '#F74941', name: 'Mard_F3' },
  { hex: '#FC283C', name: 'Mard_F4' },
  { hex: '#E7002F', name: 'Mard_F5' },
  { hex: '#943630', name: 'Mard_F6' },
  { hex: '#971937', name: 'Mard_F7' },
  { hex: '#BC0028', name: 'Mard_F8' },
  { hex: '#E2677A', name: 'Mard_F9' },
  { hex: '#8A4526', name: 'Mard_F10' },
  { hex: '#5A2121', name: 'Mard_F11' },
  { hex: '#FD4E6A', name: 'Mard_F12' },
  { hex: '#F35744', name: 'Mard_F13' },
  { hex: '#FFA9AD', name: 'Mard_F14' },
  { hex: '#D30022', name: 'Mard_F15' },
  { hex: '#FEC2A6', name: 'Mard_F16' },
  { hex: '#E69C79', name: 'Mard_F17' },
  { hex: '#D37C46', name: 'Mard_F18' },
  { hex: '#C1444A', name: 'Mard_F19' },
  { hex: '#CD9391', name: 'Mard_F20' },
  { hex: '#F7B4C6', name: 'Mard_F21' },
  { hex: '#FDC0D0', name: 'Mard_F22' },
  { hex: '#F67E66', name: 'Mard_F23' },
  { hex: '#E698AA', name: 'Mard_F24' },
  { hex: '#E54B4F', name: 'Mard_F25' },
  // G系 — 棕肤系 (21色)
  { hex: '#FFE2CE', name: 'Mard_G1' },
  { hex: '#FFC4AA', name: 'Mard_G2' },
  { hex: '#F4C3A5', name: 'Mard_G3' },
  { hex: '#E1B383', name: 'Mard_G4' },
  { hex: '#EDB045', name: 'Mard_G5' },
  { hex: '#E99C17', name: 'Mard_G6' },
  { hex: '#9D5B3E', name: 'Mard_G7' },
  { hex: '#753832', name: 'Mard_G8' },
  { hex: '#E6B483', name: 'Mard_G9' },
  { hex: '#D98C39', name: 'Mard_G10' },
  { hex: '#E0C593', name: 'Mard_G11' },
  { hex: '#FFC890', name: 'Mard_G12' },
  { hex: '#B7714A', name: 'Mard_G13' },
  { hex: '#8D614C', name: 'Mard_G14' },
  { hex: '#FCF9E0', name: 'Mard_G15' },
  { hex: '#F2D9BA', name: 'Mard_G16' },
  { hex: '#78524B', name: 'Mard_G17' },
  { hex: '#FFE4CC', name: 'Mard_G18' },
  { hex: '#E07935', name: 'Mard_G19' },
  { hex: '#A94023', name: 'Mard_G20' },
  { hex: '#B88558', name: 'Mard_G21' },
  // H系 — 黑白系 (23色)
  { hex: '#FDFBFF', name: 'Mard_H1' },
  { hex: '#FEFFFF', name: 'Mard_H2' },
  { hex: '#B6B1BA', name: 'Mard_H3' },
  { hex: '#89858C', name: 'Mard_H4' },
  { hex: '#48464E', name: 'Mard_H5' },
  { hex: '#2F2B2F', name: 'Mard_H6' },
  { hex: '#000000', name: 'Mard_H7' },
  { hex: '#E7D6DB', name: 'Mard_H8' },
  { hex: '#EDEDED', name: 'Mard_H9' },
  { hex: '#EEE9EA', name: 'Mard_H10' },
  { hex: '#CECDD5', name: 'Mard_H11' },
  { hex: '#FFF5ED', name: 'Mard_H12' },
  { hex: '#F5ECD2', name: 'Mard_H13' },
  { hex: '#CFD7D3', name: 'Mard_H14' },
  { hex: '#98A6A8', name: 'Mard_H15' },
  { hex: '#1D1414', name: 'Mard_H16' },
  { hex: '#F1EDED', name: 'Mard_H17' },
  { hex: '#FFFDF0', name: 'Mard_H18' },
  { hex: '#F6EFE2', name: 'Mard_H19' },
  { hex: '#949FA3', name: 'Mard_H20' },
  { hex: '#FFFBE1', name: 'Mard_H21' },
  { hex: '#CACAD4', name: 'Mard_H22' },
  { hex: '#9A9D94', name: 'Mard_H23' },
  // M系 — 大地系 (15色)
  { hex: '#BCC6B8', name: 'Mard_M1' },
  { hex: '#8AA386', name: 'Mard_M2' },
  { hex: '#697D80', name: 'Mard_M3' },
  { hex: '#E3D2BC', name: 'Mard_M4' },
  { hex: '#D0CCAA', name: 'Mard_M5' },
  { hex: '#B0A782', name: 'Mard_M6' },
  { hex: '#B4A497', name: 'Mard_M7' },
  { hex: '#B38281', name: 'Mard_M8' },
  { hex: '#A58767', name: 'Mard_M9' },
  { hex: '#C5B2BC', name: 'Mard_M10' },
  { hex: '#9F7594', name: 'Mard_M11' },
  { hex: '#644749', name: 'Mard_M12' },
  { hex: '#D19066', name: 'Mard_M13' },
  { hex: '#C77362', name: 'Mard_M14' },
  { hex: '#757D78', name: 'Mard_M15' },
];

const perlerColorDefs: { hex: string; name: string }[] = [
  // 基础
  { hex: '#FFFFFF', name: 'Perler 白' },
  { hex: '#000000', name: 'Perler 黑' },
  { hex: '#CCCCCC', name: 'Perler 浅灰' },
  { hex: '#808080', name: 'Perler 灰' },

  // 暖色
  { hex: '#FFE4B5', name: 'Perler 奶黄' },
  { hex: '#FF8C00', name: 'Perler 暗橙' },
  { hex: '#E63946', name: 'Perler 红' },
  { hex: '#FF9F1C', name: 'Perler 橙' },
  { hex: '#F4A261', name: 'Perler 杏' },

  // 冷色
  { hex: '#457B9D', name: 'Perler 蓝' },
  { hex: '#1D3557', name: 'Perler 深蓝' },
  { hex: '#2A9D8F', name: 'Perler 绿松' },
  { hex: '#00CED1', name: 'Perler 暗青' },
  { hex: '#20B2AA', name: 'Perler 浅蓝绿' },
  { hex: '#264653', name: 'Perler 墨绿' },

  // 粉紫
  { hex: '#FF1493', name: 'Perler 深粉' },
  { hex: '#E5989B', name: 'Perler 粉' },
  { hex: '#B56576', name: 'Perler 紫' },
  { hex: '#6D597A', name: 'Perler 灰紫' },

  // 其他
  { hex: '#D4A373', name: 'Perler 棕' },
  { hex: '#BC6C25', name: 'Perler 深棕' },
  { hex: '#606C38', name: 'Perler 军绿' },
  { hex: '#936639', name: 'Perler 卡其' },
];

const hamaColorDefs: { hex: string; name: string }[] = [
  { hex: '#FFFFFF', name: 'Hama 白' },
  { hex: '#000000', name: 'Hama 黑' },
  { hex: '#D3D3D3', name: 'Hama 浅灰' },
  { hex: '#A9A9A9', name: 'Hama 灰' },
  { hex: '#696969', name: 'Hama 深灰' },
  { hex: '#FFD700', name: 'Hama 金黄' },
  { hex: '#FFC0CB', name: 'Hama 粉' },
  { hex: '#FF6B6B', name: 'Hama 珊瑚' },
  { hex: '#DC143C', name: 'Hama 红' },
  { hex: '#40E0D0', name: 'Hama 绿松石' },
  { hex: '#FA9A22', name: 'Hama 橙黄' },
  { hex: '#6B8E23', name: 'Hama 橄榄绿' },
  { hex: '#3CB371', name: 'Hama 绿' },
  { hex: '#4682B4', name: 'Hama 钢蓝' },
  { hex: '#8B008B', name: 'Hama 紫' },
  { hex: '#D2691E', name: 'Hama 橙褐' },
  { hex: '#8B4513', name: 'Hama 棕' },
];

const nabbiColorDefs: { hex: string; name: string }[] = [
  { hex: '#FFFFFF', name: 'Nabbi 白' },
  { hex: '#F0F8FF', name: 'Nabbi 爱丽丝蓝' },
  { hex: '#E0FFFF', name: 'Nabbi 浅青' },
  { hex: '#FA8072', name: 'Nabbi 三文鱼' },
  { hex: '#98D8C8', name: 'Nabbi 薄荷' },
  { hex: '#F7DC6F', name: 'Nabbi 淡黄' },
  { hex: '#BB8FCE', name: 'Nabbi 淡紫' },
  { hex: '#85C1E9', name: 'Nabbi 天蓝' },
  { hex: '#F1948A', name: 'Nabbi 浅粉' },
  { hex: '#82E0AA', name: 'Nabbi 浅绿' },
];



// ====== 色域转换工具 ======

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** sRGB → CIE XYZ (D65) */
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  return {
    x: 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    y: 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    z: 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  };
}

/** CIE XYZ → CIE L*a*b* (D65 参照白点) */
function xyzToLab(x: number, y: number, z: number): { L: number; a: number; b: number } {
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  const fx = x / xn > 0.008856 ? Math.cbrt(x / xn) : (7.787 * x / xn + 16 / 116);
  const fy = y / yn > 0.008856 ? Math.cbrt(y / yn) : (7.787 * y / yn + 16 / 116);
  const fz = z / zn > 0.008856 ? Math.cbrt(z / zn) : (7.787 * z / zn + 16 / 116);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** 一步 sRGB → CIE Lab */
function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const { x, y, z } = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// ====== Mard 标准编号映射 ======
// 来源: Mard 官方 221 色卡 (pd.anqstar.com/colors)
const MARD_STD_NUMBERS: Record<string, string> = {
  '#FAF4C8': 'Mard_A1',
  '#FFFFD5': 'Mard_A2',
  '#FEFF8B': 'Mard_A3',
  '#FBED56': 'Mard_A4',
  '#F4D738': 'Mard_A5',
  '#FEAC4C': 'Mard_A6',
  '#FE8B4C': 'Mard_A7',
  '#FFDA45': 'Mard_A8',
  '#FF995B': 'Mard_A9',
  '#F77C31': 'Mard_A10',
  '#FFDD99': 'Mard_A11',
  '#FE9F72': 'Mard_A12',
  '#FFC365': 'Mard_A13',
  '#FD543D': 'Mard_A14',
  '#FFF365': 'Mard_A15',
  '#FFFF9F': 'Mard_A16',
  '#FFE36E': 'Mard_A17',
  '#FEBE7D': 'Mard_A18',
  '#FD7C72': 'Mard_A19',
  '#FFD568': 'Mard_A20',
  '#FFE395': 'Mard_A21',
  '#F4F57D': 'Mard_A22',
  '#E6C9B7': 'Mard_A23',
  '#F7F8A2': 'Mard_A24',
  '#FFD67D': 'Mard_A25',
  '#FFC830': 'Mard_A26',
  '#E6EE31': 'Mard_B1',
  '#63F347': 'Mard_B2',
  '#9EF780': 'Mard_B3',
  '#5DE035': 'Mard_B4',
  '#35E352': 'Mard_B5',
  '#65E2A6': 'Mard_B6',
  '#3DAF80': 'Mard_B7',
  '#1C9C4F': 'Mard_B8',
  '#27523A': 'Mard_B9',
  '#95D3C2': 'Mard_B10',
  '#5D722A': 'Mard_B11',
  '#166F41': 'Mard_B12',
  '#CAEB7B': 'Mard_B13',
  '#ADE946': 'Mard_B14',
  '#2E5132': 'Mard_B15',
  '#C5ED9C': 'Mard_B16',
  '#9BB13A': 'Mard_B17',
  '#E6EE49': 'Mard_B18',
  '#24B88C': 'Mard_B19',
  '#C2F0CC': 'Mard_B20',
  '#156A6B': 'Mard_B21',
  '#0B3C43': 'Mard_B22',
  '#303A21': 'Mard_B23',
  '#EEFCA5': 'Mard_B24',
  '#4E846D': 'Mard_B25',
  '#8D7A35': 'Mard_B26',
  '#CCE1AF': 'Mard_B27',
  '#9EE5B9': 'Mard_B28',
  '#C5E254': 'Mard_B29',
  '#E2FCB1': 'Mard_B30',
  '#B0E792': 'Mard_B31',
  '#9CAB5A': 'Mard_B32',
  '#E8FFE7': 'Mard_C1',
  '#A9F9FC': 'Mard_C2',
  '#A0E2FB': 'Mard_C3',
  '#41CCFF': 'Mard_C4',
  '#01ACEB': 'Mard_C5',
  '#50AAF0': 'Mard_C6',
  '#3677D2': 'Mard_C7',
  '#0F54C0': 'Mard_C8',
  '#324BCA': 'Mard_C9',
  '#3EBCE2': 'Mard_C10',
  '#28DDDE': 'Mard_C11',
  '#1C334D': 'Mard_C12',
  '#CDE8FF': 'Mard_C13',
  '#D5FDFF': 'Mard_C14',
  '#22C4C6': 'Mard_C15',
  '#1557A8': 'Mard_C16',
  '#04D1F6': 'Mard_C17',
  '#1D3344': 'Mard_C18',
  '#1887A2': 'Mard_C19',
  '#176DAF': 'Mard_C20',
  '#BEDDFF': 'Mard_C21',
  '#67B4BE': 'Mard_C22',
  '#C8E2FF': 'Mard_C23',
  '#7CC4FF': 'Mard_C24',
  '#A9E5E5': 'Mard_C25',
  '#3CAED8': 'Mard_C26',
  '#D3DFFA': 'Mard_C27',
  '#BBCFED': 'Mard_C28',
  '#34488E': 'Mard_C29',
  '#AEB4F2': 'Mard_D1',
  '#858EDD': 'Mard_D2',
  '#2F54AF': 'Mard_D3',
  '#182A84': 'Mard_D4',
  '#B843C5': 'Mard_D5',
  '#AC7BDE': 'Mard_D6',
  '#8854B3': 'Mard_D7',
  '#E2D3FF': 'Mard_D8',
  '#D5B9F8': 'Mard_D9',
  '#361851': 'Mard_D10',
  '#B9BAE1': 'Mard_D11',
  '#DE9AD4': 'Mard_D12',
  '#B90095': 'Mard_D13',
  '#8B279B': 'Mard_D14',
  '#2F1F90': 'Mard_D15',
  '#E3E1EE': 'Mard_D16',
  '#C4D4F6': 'Mard_D17',
  '#A45EC7': 'Mard_D18',
  '#D8C3D7': 'Mard_D19',
  '#9C32B2': 'Mard_D20',
  '#9A009B': 'Mard_D21',
  '#333A95': 'Mard_D22',
  '#EBDAFC': 'Mard_D23',
  '#7786E5': 'Mard_D24',
  '#494FC7': 'Mard_D25',
  '#DFC2F8': 'Mard_D26',
  '#FDD3CC': 'Mard_E1',
  '#FEC0DF': 'Mard_E2',
  '#FFB7E7': 'Mard_E3',
  '#E8649E': 'Mard_E4',
  '#F551A2': 'Mard_E5',
  '#F13D74': 'Mard_E6',
  '#C63478': 'Mard_E7',
  '#FFDBE9': 'Mard_E8',
  '#E970CC': 'Mard_E9',
  '#D33793': 'Mard_E10',
  '#FCDDD2': 'Mard_E11',
  '#F78FC3': 'Mard_E12',
  '#B5006D': 'Mard_E13',
  '#FFD1BA': 'Mard_E14',
  '#F8C7C9': 'Mard_E15',
  '#FFF3EB': 'Mard_E16',
  '#FFE2EA': 'Mard_E17',
  '#FFC7DB': 'Mard_E18',
  '#FEBAD5': 'Mard_E19',
  '#D8C7D1': 'Mard_E20',
  '#BD9DA1': 'Mard_E21',
  '#B785A1': 'Mard_E22',
  '#937A8D': 'Mard_E23',
  '#E1BCE8': 'Mard_E24',
  '#FD957B': 'Mard_F1',
  '#FC3D46': 'Mard_F2',
  '#F74941': 'Mard_F3',
  '#FC283C': 'Mard_F4',
  '#E7002F': 'Mard_F5',
  '#943630': 'Mard_F6',
  '#971937': 'Mard_F7',
  '#BC0028': 'Mard_F8',
  '#E2677A': 'Mard_F9',
  '#8A4526': 'Mard_F10',
  '#5A2121': 'Mard_F11',
  '#FD4E6A': 'Mard_F12',
  '#F35744': 'Mard_F13',
  '#FFA9AD': 'Mard_F14',
  '#D30022': 'Mard_F15',
  '#FEC2A6': 'Mard_F16',
  '#E69C79': 'Mard_F17',
  '#D37C46': 'Mard_F18',
  '#C1444A': 'Mard_F19',
  '#CD9391': 'Mard_F20',
  '#F7B4C6': 'Mard_F21',
  '#FDC0D0': 'Mard_F22',
  '#F67E66': 'Mard_F23',
  '#E698AA': 'Mard_F24',
  '#E54B4F': 'Mard_F25',
  '#FFE2CE': 'Mard_G1',
  '#FFC4AA': 'Mard_G2',
  '#F4C3A5': 'Mard_G3',
  '#E1B383': 'Mard_G4',
  '#EDB045': 'Mard_G5',
  '#E99C17': 'Mard_G6',
  '#9D5B3E': 'Mard_G7',
  '#753832': 'Mard_G8',
  '#E6B483': 'Mard_G9',
  '#D98C39': 'Mard_G10',
  '#E0C593': 'Mard_G11',
  '#FFC890': 'Mard_G12',
  '#B7714A': 'Mard_G13',
  '#8D614C': 'Mard_G14',
  '#FCF9E0': 'Mard_G15',
  '#F2D9BA': 'Mard_G16',
  '#78524B': 'Mard_G17',
  '#FFE4CC': 'Mard_G18',
  '#E07935': 'Mard_G19',
  '#A94023': 'Mard_G20',
  '#B88558': 'Mard_G21',
  '#FDFBFF': 'Mard_H1',
  '#FEFFFF': 'Mard_H2',
  '#B6B1BA': 'Mard_H3',
  '#89858C': 'Mard_H4',
  '#48464E': 'Mard_H5',
  '#2F2B2F': 'Mard_H6',
  '#000000': 'Mard_H7',
  '#E7D6DB': 'Mard_H8',
  '#EDEDED': 'Mard_H9',
  '#EEE9EA': 'Mard_H10',
  '#CECDD5': 'Mard_H11',
  '#FFF5ED': 'Mard_H12',
  '#F5ECD2': 'Mard_H13',
  '#CFD7D3': 'Mard_H14',
  '#98A6A8': 'Mard_H15',
  '#1D1414': 'Mard_H16',
  '#F1EDED': 'Mard_H17',
  '#FFFDF0': 'Mard_H18',
  '#F6EFE2': 'Mard_H19',
  '#949FA3': 'Mard_H20',
  '#FFFBE1': 'Mard_H21',
  '#CACAD4': 'Mard_H22',
  '#9A9D94': 'Mard_H23',
  '#BCC6B8': 'Mard_M1',
  '#8AA386': 'Mard_M2',
  '#697D80': 'Mard_M3',
  '#E3D2BC': 'Mard_M4',
  '#D0CCAA': 'Mard_M5',
  '#B0A782': 'Mard_M6',
  '#B4A497': 'Mard_M7',
  '#B38281': 'Mard_M8',
  '#A58767': 'Mard_M9',
  '#C5B2BC': 'Mard_M10',
  '#9F7594': 'Mard_M11',
  '#644749': 'Mard_M12',
  '#D19066': 'Mard_M13',
  '#C77362': 'Mard_M14',
  '#757D78': 'Mard_M15',
};

// ====== 构建色号库 ======

type ColorDef = { hex: string; name: string; brand: BeadColor['brand'] };

const allColorDefs: ColorDef[] = [
  ...mardColorDefs.map(d => ({ ...d, brand: 'mard' as const })),
  ...perlerColorDefs.map(d => ({ ...d, brand: 'perler' as const })),
  ...hamaColorDefs.map(d => ({ ...d, brand: 'hama' as const })),
  ...nabbiColorDefs.map(d => ({ ...d, brand: 'nabbi' as const })),
];

export const beadColors: BeadColor[] = allColorDefs.map((color, index) => {
  const { r, g, b } = hexToRgb(color.hex);
  const { L, a, b: bVal } = rgbToLab(r, g, b);
  // 标准编号：Mard 用官方色号，其他品牌暂用序号
  const stdNum = color.brand === 'mard'
    ? (MARD_STD_NUMBERS[color.hex.toUpperCase()] || `Mard_${String(index + 1).padStart(3, '0')}`)
    : `${color.brand}_${String(index + 1).padStart(3, '0')}`;
  return {
    ...color,
    id: `${color.brand}-${index}`,
    r, g, b,
    L, a,
    bVal,
    stdNum,
  };
});

// ====== 查询函数 ======

export function getColorsByBrand(brand: BeadColor['brand']): BeadColor[] {
  return beadColors.filter(c => c.brand === brand);
}

export function getAllBrands(): BeadColor['brand'][] {
  return ['mard', 'perler', 'hama', 'nabbi'];
}

/**
 * CIE Lab ΔE76 色差公式 — 目前最实用的感知均匀色差公式
 * 值越小 = 人眼看起来越接近
 * ΔE < 1: 肉眼无法区分
 * ΔE < 3: 非常接近
 * ΔE < 6: 可接受
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  // 实时计算 Lab 色差（不使用预计算值，因为目标色是变动的）
  const lab1 = rgbToLab(r1, g1, b1);
  const lab2 = rgbToLab(r2, g2, b2);
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function findClosestColor(
  r: number, g: number, b: number,
  brand?: BeadColor['brand']
): BeadColor {
  const colors = brand ? getColorsByBrand(brand) : beadColors;
  const targetLab = rgbToLab(r, g, b);

  let closest = colors[0];
  let minDistance = deltaE(targetLab, closest);

  for (const color of colors) {
    const distance = deltaE(targetLab, color);
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }

  return closest;
}

/** 用预计算的 Lab 算 ΔE76 */
function deltaE(lab: { L: number; a: number; b: number }, color: BeadColor): number {
  const dL = lab.L - color.L;
  const da = lab.a - color.a;
  const db = lab.b - color.bVal;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export const brandNames: Record<BeadColor['brand'], string> = {
  mard: 'Mard',
  perler: 'Perler',
  hama: 'Hama',
  nabbi: 'Nabbi',
};
