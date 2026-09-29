// 在浏览器页面中执行，由 generate-test-fixtures.ts 通过 addScriptTag 注入。
// 保持为纯 JS 文件，避免 TS 编译产生的辅助函数在 page.evaluate 序列化时丢失。

/** 四角三角标记的颜色：左上、右上、右下、左下，用于判断裁切与翻转 */
const CORNER_COLORS = ['#fa5252', '#40c057', '#fab005', '#228be6'];
/** 三角标记边长占短边的比例 */
const CORNER_RATIO = 0.12;
/** 中心圆半径占短边的比例 */
const CIRCLE_RATIO = 0.2;
/** 标签字号占短边的比例 */
const LABEL_RATIO = 0.07;
/** 网格线把宽和高各分成的份数 */
const GRID_DIVISIONS = 10;
/** 线宽按短边缩放，保证大图缩小显示时线条仍可见 */
const LINE_WIDTH_DIVISOR = 300;
const JPEG_QUALITY = 0.92;

window.drawTestFixture = function drawTestFixture(spec) {
  const { width, height, colors, name } = spec;
  const shortSide = Math.min(width, height);
  const lineWidth = Math.max(1, shortSide / LINE_WIDTH_DIVISOR);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 1; i < GRID_DIVISIONS; i++) {
    const x = (width * i) / GRID_DIVISIONS;
    const y = (height * i) / GRID_DIVISIONS;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = lineWidth * 2;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, height);
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.stroke();

  const radius = shortSide * CIRCLE_RATIO;
  ctx.lineWidth = lineWidth * 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  const size = shortSide * CORNER_RATIO;
  const corners = [
    [0, 0, size, 0, 0, size],
    [width, 0, width - size, 0, width, size],
    [width, height, width - size, height, width, height - size],
    [0, height, size, height, 0, height - size],
  ];
  corners.forEach((points, index) => {
    ctx.fillStyle = CORNER_COLORS[index];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    ctx.lineTo(points[2], points[3]);
    ctx.lineTo(points[4], points[5]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  const fontSize = shortSide * LABEL_RATIO;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = fontSize / 8;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillStyle = '#ffffff';
  const labelY = cy + radius + fontSize * 0.6;
  ctx.strokeText(name, cx, labelY);
  ctx.fillText(name, cx, labelY);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};
