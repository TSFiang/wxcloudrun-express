// 确保全局变量可用
if (typeof GameGlobal === 'undefined') {
  window.GameGlobal = {};
}

// 检测是否在微信小游戏环境
if (typeof window.isWechatGame === 'undefined') {
  window.isWechatGame = typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined';
}

// 使用固定的设计稿尺寸
const SCREEN_WIDTH = 375;
const SCREEN_HEIGHT = 667;

let canvas;

if (window.isWechatGame) {
  // 微信小游戏环境
  GameGlobal.canvas = wx.createCanvas();
  canvas = GameGlobal.canvas;
  
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const screenWidth = windowInfo.windowWidth || windowInfo.screenWidth;
  const screenHeight = windowInfo.windowHeight || windowInfo.screenHeight;
  
  // 设置canvas大小为设计稿尺寸
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  
  // 计算缩放比例和偏移量
  const scaleX = screenWidth / SCREEN_WIDTH;
  const scaleY = screenHeight / SCREEN_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  
  // 保存到全局变量
  window.canvasScale = scale;
  window.canvasOffsetLeft = (screenWidth - SCREEN_WIDTH * scale) / 2;
  window.canvasOffsetTop = (screenHeight - SCREEN_HEIGHT * scale) / 2;
  window.screenWidth = screenWidth;
  window.screenHeight = screenHeight;
  
  GameGlobal.canvasScale = scale;
  GameGlobal.canvasOffsetLeft = window.canvasOffsetLeft;
  GameGlobal.canvasOffsetTop = window.canvasOffsetTop;
  
  console.log('微信小游戏 Canvas 初始化');
  console.log('屏幕尺寸:', screenWidth, 'x', screenHeight);
  console.log('Canvas尺寸:', SCREEN_WIDTH, 'x', SCREEN_HEIGHT);
  console.log('缩放比例:', scale);
  console.log('偏移量:', window.canvasOffsetLeft, window.canvasOffsetTop);
} else {
  // 浏览器环境 - 延迟初始化，等待DOM加载完成
  window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('gameCanvas');
    
    if (canvas) {
      // 设置canvas大小为设计稿尺寸
      canvas.width = SCREEN_WIDTH;
      canvas.height = SCREEN_HEIGHT;
      
      // 设置CSS样式，保持宽高比
      const scaleX = window.innerWidth / SCREEN_WIDTH;
      const scaleY = window.innerHeight / SCREEN_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      
      canvas.style.width = (SCREEN_WIDTH * scale) + 'px';
      canvas.style.height = (SCREEN_HEIGHT * scale) + 'px';
      canvas.style.position = 'absolute';
      canvas.style.left = ((window.innerWidth - SCREEN_WIDTH * scale) / 2) + 'px';
      canvas.style.top = ((window.innerHeight - SCREEN_HEIGHT * scale) / 2) + 'px';
      
      window.canvas = canvas;
      window.canvasScale = scale;
      
      console.log('Canvas initialized successfully');
      console.log('Canvas size:', SCREEN_WIDTH, 'x', SCREEN_HEIGHT);
      console.log('Scale:', scale);
    } else {
      console.error('Canvas element not found');
    }
  });
}

// 将常量挂载到全局对象
window.SCREEN_WIDTH = SCREEN_WIDTH;
window.SCREEN_HEIGHT = SCREEN_HEIGHT;

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
  GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
}

// 确保canvas变量在全局可用
window.canvas = canvas;

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.canvas = canvas;
}