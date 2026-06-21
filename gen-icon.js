const { PNG } = require('pngjs');
const fs = require('fs');

// Create app icon for all required sizes
const sizes = {
  '/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-mdpi': 48,
  '/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-hdpi': 72,
  '/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-xhdpi': 96,
  '/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-xxhdpi': 144,
  '/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-xxxhdpi': 192,
};

const BLUE1 = [37, 99, 235];   // #2563eb
const BLUE2 = [29, 78, 216];   // #1d4ed8
const AMBER = [245, 158, 11];  // #f59e0b
const WHITE = [255, 255, 255];
const GREEN = [5, 150, 105];   // #059669
const LTBLUE = [147, 197, 253]; // #93c5fd

function drawIcon(size, dest) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2, cy = size / 2;
  const r = size * 0.44; // globe radius
  const halfR = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: rounded square with gradient
      const corner = size * 0.22;
      const edgeDist = Math.max(Math.abs(dx) - halfR, Math.abs(dy) - halfR, 0);
      const bgDist = Math.sqrt(edgeDist * edgeDist + 
        Math.min(Math.abs(dx) - halfR, Math.abs(dy) - halfR, 0) ** 2);
      
      // Check if inside rounded square
      let inRounded = false;
      if (Math.abs(dx) < halfR && Math.abs(dy) < halfR) {
        inRounded = true;
      } else if (Math.abs(dx) >= halfR && Math.abs(dy) >= halfR) {
        // Corner region
        const cx2 = Math.abs(dx) - halfR;
        const cy2 = Math.abs(dy) - halfR;
        inRounded = (cx2 * cx2 + cy2 * cy2) <= corner * corner;
      } else {
        inRounded = true;
      }

      if (inRounded) {
        // Background gradient (top-left to bottom-right)
        const t = (x + y) / (size * 2);
        const bgR = Math.round(BLUE1[0] + t * (BLUE2[0] - BLUE1[0]));
        const bgG = Math.round(BLUE1[1] + t * (BLUE2[1] - BLUE1[1]));
        const bgB = Math.round(BLUE1[2] + t * (BLUE2[2] - BLUE1[2]));

        if (dist <= r) {
          // Globe area
          if (Math.abs(dx) < size * 0.02 && Math.abs(dy) < size * 0.06) {
            // Compass needle vertical line
            png.data[idx] = AMBER[0]; png.data[idx+1] = AMBER[1]; png.data[idx+2] = AMBER[2];
          } else if (Math.abs(dy) < size * 0.02 && Math.abs(dx) < size * 0.06) {
            // Compass needle horizontal line
            png.data[idx] = AMBER[0]; png.data[idx+1] = AMBER[1]; png.data[idx+2] = AMBER[2];
          } else if ((Math.abs(dx) < size * 0.03) && (Math.abs(dy) < size * 0.08) && (dy < 0)) {
            // Compass top (red/green indicator)
            png.data[idx] = GREEN[0]; png.data[idx+1] = GREEN[1]; png.data[idx+2] = GREEN[2];
          } else {
            // Globe surface - checker of ocean and land
            const lat = dy / r;
            const lon = dx / r;
            const noise1 = Math.sin(lat * 8 + lon * 5) * 0.5 + 0.5;
            const noise2 = Math.sin(lat * 3 - lon * 7 + 1.2) * 0.5 + 0.5;
            const land = (noise1 * noise2) > 0.35;
            if (land) {
              // Land - green tint
              png.data[idx] = Math.round(bgR * 0.6 + GREEN[0] * 0.4);
              png.data[idx+1] = Math.round(bgG * 0.3 + GREEN[1] * 0.7);
              png.data[idx+2] = Math.round(bgB * 0.5 + GREEN[2] * 0.5);
            } else {
              // Ocean - light blue
              png.data[idx] = Math.round(bgR * 0.5 + LTBLUE[0] * 0.5);
              png.data[idx+1] = Math.round(bgG * 0.5 + LTBLUE[1] * 0.5);
              png.data[idx+2] = Math.round(bgB * 0.3 + LTBLUE[2] * 0.7);
            }
          }

          // Globe border
          if (dist > r - size * 0.03 && dist <= r) {
            png.data[idx] = Math.round(WHITE[0] * 0.7 + png.data[idx] * 0.3);
            png.data[idx+1] = Math.round(WHITE[1] * 0.7 + png.data[idx+1] * 0.3);
            png.data[idx+2] = Math.round(WHITE[2] * 0.7 + png.data[idx+2] * 0.3);
          }
        } else {
          // Background (outside globe, inside rounded square)
          png.data[idx] = bgR;
          png.data[idx+1] = bgG;
          png.data[idx+2] = bgB;
        }
      } else {
        // Outside rounded square - transparent
        png.data[idx] = 0;
        png.data[idx+1] = 0;
        png.data[idx+2] = 0;
      }
      png.data[idx+3] = inRounded ? 255 : 0;
    }
  }

  // Add a small star/sparkle at top-right of globe
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (png.data[idx+3] === 0) continue;
      const dx = x - (cx + r * 0.55);
      const dy = y - (cy - r * 0.55);
      if (Math.abs(dx) < size * 0.04 && Math.abs(dy) < size * 0.04) {
        png.data[idx] = AMBER[0]; png.data[idx+1] = AMBER[1]; png.data[idx+2] = AMBER[2];
      }
    }
  }

  fs.writeFileSync(dest + '/ic_launcher.png', PNG.sync.write(png));
  console.log(`  ${size}x${size} -> ${dest.replace('/mnt/d/', 'D:\\')}\\ic_launcher.png`);
}

// Generate all sizes
Object.entries(sizes).forEach(([dir, sz]) => {
  require('fs').mkdirSync(dir, { recursive: true });
  drawIcon(sz, dir);
});

// Also generate and update the nitron project icons
// The nitron project uses icon-192.png and icon-512.png in the root
const nitronDir = '/home/hsx/.openclaw/workspace/travel-apk-starter';
const png192 = new PNG({ width: 192, height: 192 });
const png512 = new PNG({ width: 512, height: 512 });

// Copy Android icons for nitron
fs.copyFileSync(sizes['/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-xxxhdpi'] + '/ic_launcher.png',
  nitronDir + '/icon-192.png');
console.log('  Updated nitron icon-192.png');

// Generate 512x512 from the 192 one scaled up
const src192 = PNG.sync.read(fs.readFileSync(sizes['/mnt/d/工作区/去哪玩-安卓/app/src/main/res/mipmap-xxxhdpi'] + '/ic_launcher.png'));
const dst512 = new PNG({ width: 512, height: 512 });
for (let y = 0; y < 512; y++) {
  for (let x = 0; x < 512; x++) {
    const sx = Math.floor(x * 192 / 512);
    const sy = Math.floor(y * 192 / 512);
    const si = (sy * 192 + sx) * 4;
    const di = (y * 512 + x) * 4;
    dst512.data[di] = src192.data[si];
    dst512.data[di+1] = src192.data[si+1];
    dst512.data[di+2] = src192.data[si+2];
    dst512.data[di+3] = src192.data[si+3];
  }
}
fs.writeFileSync(nitronDir + '/icon-512.png', PNG.sync.write(dst512));
console.log('  Updated nitron icon-512.png');

console.log('\n✅ All icons generated!');
