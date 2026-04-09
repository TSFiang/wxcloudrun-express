/**
 * Canvas 初始化与屏幕适配
 * 支持微信小游戏和浏览器双环境
 */

// 确保全局对象存在
if (typeof GameGlobal === 'undefined') {
  window.GameGlobal = {};
}

// 环境检测
const isWechatGame = typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined';
window.isWechatGame = isWechatGame;

let canvas;

if (isWechatGame) {
  // ─── 微信小游戏环境 ────────────────────────────
  GameGlobal.canvas = wx.createCanvas();
  canvas = GameGlobal.canvas;
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;

  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const sw = info.windowWidth || info.screenWidth;
  const sh = info.windowHeight || info.screenHeight;
  const scale = Math.min(sw / SCREEN_WIDTH, sh / SCREEN_HEIGHT);

  window.canvasScale = scale;
  window.canvasOffsetLeft = (sw - SCREEN_WIDTH * scale) / 2;
  window.canvasOffsetTop = (sh - SCREEN_HEIGHT * scale) / 2;
  window.screenWidth = sw;
  window.screenHeight = sh;
  GameGlobal.canvasScale = scale;
  GameGlobal.canvasOffsetLeft = window.canvasOffsetLeft;
  GameGlobal.canvasOffsetTop = window.canvasOffsetTop;

} else {
  // ─── 浏览器环境 ────────────────────────────────
  window.addEventListener('DOMContentLoaded', function () {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    const scale = Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT);
    canvas.style.width = (SCREEN_WIDTH * scale) + 'px';
    canvas.style.height = (SCREEN_HEIGHT * scale) + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = ((window.innerWidth - SCREEN_WIDTH * scale) / 2) + 'px';
    canvas.style.top = ((window.innerHeight - SCREEN_HEIGHT * scale) / 2) + 'px';

    window.canvas = canvas;
    window.canvasScale = scale;
  });
}

// 全局暴露
window.canvas = canvas;
if (typeof GameGlobal !== 'undefined') GameGlobal.canvas = canvas;
