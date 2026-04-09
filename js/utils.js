/**
 * 公共工具模块
 * 集中管理常量、绘制工具函数、坐标转换等
 */

// ─── 屏幕常量 ─────────────────────────────────────
const SCREEN_WIDTH = 375;
const SCREEN_HEIGHT = 667;

// ─── 颜色常量 ─────────────────────────────────────
const BEAN_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

// 马卡龙低饱和颜色（用于收集栏渲染）
const MACARON_COLORS = [
  '#FFB6C1', '#87CEFA', '#98FB98', '#FFFFE0',
  '#D8BFD8', '#FFDAB9', '#E0FFFF', '#F0E68C'
];

// ─── 工厂函数 ─────────────────────────────────────
function createImage() {
  if (typeof wx !== 'undefined' && wx.createImage) {
    return wx.createImage();
  }
  return new Image();
}

// ─── 圆角矩形绘制工具 ─────────────────────────────
/**
 * 填充圆角矩形
 */
function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * 描边圆角矩形
 */
function strokeRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}

/**
 * 绘制完整圆角矩形（填充 + 描边 + 阴影）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r - 圆角半径
 * @param {string} fill - 填充颜色
 * @param {string} [stroke] - 描边颜色（可选）
 * @param {number} [lineWidth] - 描边宽度
 */
function drawRoundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth) {
  // 阴影
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  fillRoundRect(ctx, x, y + 2, w, h, r);
  ctx.restore();

  // 填充
  ctx.fillStyle = fill;
  fillRoundRect(ctx, x, y, w, h, r);

  // 描边
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth || 1;
    strokeRoundRect(ctx, x, y, w, h, r);
  }
}

// ─── 坐标转换 ─────────────────────────────────────
/**
 * 将触摸/鼠标事件坐标转换为 canvas 内部坐标
 * 统一处理微信和浏览器两种环境
 */
function eventToCanvas(clientX, clientY) {
  if (typeof wx !== 'undefined' && wx.createCanvas) {
    // 微信小游戏：屏幕坐标 → 设计稿坐标
    const sw = (typeof window !== 'undefined' && window.screenWidth) || SCREEN_WIDTH;
    const sh = (typeof window !== 'undefined' && window.screenHeight) || SCREEN_HEIGHT;
    return {
      x: clientX * (SCREEN_WIDTH / sw),
      y: clientY * (SCREEN_HEIGHT / sh)
    };
  }

  // 浏览器环境
  const scale = (typeof window !== 'undefined' && window.canvasScale) || 1;
  const canvasEl = (typeof window !== 'undefined' && window.canvas) ||
                   (typeof document !== 'undefined' && document.getElementById('gameCanvas'));

  if (canvasEl && canvasEl.getBoundingClientRect) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale
    };
  }

  // 回退
  const offX = (typeof window !== 'undefined' && window.canvasOffsetLeft) || 0;
  const offY = (typeof window !== 'undefined' && window.canvasOffsetTop) || 0;
  return {
    x: (clientX - offX) / scale,
    y: (clientY - offY) / scale
  };
}

// ─── 碰撞检测辅助 ─────────────────────────────────
/**
 * 检查点是否在矩形区域内
 */
function isInArea(x, y, area) {
  return x >= area.startX && x <= area.endX && y >= area.startY && y <= area.endY;
}

/**
 * 胶囊体与平台顶部的碰撞检测
 * @param {Object} player - { x, y, size }
 * @param {Object} platform - { x, y, size, type }
 * @returns {boolean}
 */
function capsulePlatformCollision(player, platform) {
  const cx = player.x + player.size / 2;
  const bottomY = player.y + player.size;
  const radius = player.size / 2;

  let pLeft, pRight, pTop;

  if (platform.type === 'mountain') {
    pLeft = platform.x + platform.size * 0.3;
    pRight = platform.x + platform.size * 0.7;
  } else {
    pLeft = platform.x;
    pRight = platform.x + platform.size;
  }
  pTop = platform.y;

  const closestX = Math.max(pLeft, Math.min(cx, pRight));
  const distX = Math.abs(cx - closestX);
  const distY = bottomY - pTop;

  return distX < radius && distY >= -2 && distY <= 5;
}

// ─── 挂载到全局 ───────────────────────────────────
if (typeof window !== 'undefined') {
  window.SCREEN_WIDTH = SCREEN_WIDTH;
  window.SCREEN_HEIGHT = SCREEN_HEIGHT;
  window.BEAN_COLORS = BEAN_COLORS;
  window.MACARON_COLORS = MACARON_COLORS;
  window.createImage = createImage;
  window.fillRoundRect = fillRoundRect;
  window.strokeRoundRect = strokeRoundRect;
  window.drawRoundRect = drawRoundRect;
  window.eventToCanvas = eventToCanvas;
  window.isInArea = isInArea;
  window.capsulePlatformCollision = capsulePlatformCollision;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
  GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
  GameGlobal.BEAN_COLORS = BEAN_COLORS;
  GameGlobal.MACARON_COLORS = MACARON_COLORS;
  GameGlobal.createImage = createImage;
  GameGlobal.fillRoundRect = fillRoundRect;
  GameGlobal.strokeRoundRect = strokeRoundRect;
  GameGlobal.drawRoundRect = drawRoundRect;
  GameGlobal.eventToCanvas = eventToCanvas;
  GameGlobal.isInArea = isInArea;
  GameGlobal.capsulePlatformCollision = capsulePlatformCollision;
}
