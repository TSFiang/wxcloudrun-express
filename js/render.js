// 确保全局变量可用
if (typeof GameGlobal === 'undefined') {
  window.GameGlobal = {};
}

// 检测是否在微信小游戏环境
if (typeof window.isWechatGame === 'undefined') {
  window.isWechatGame = typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined';
}

// 设计稿尺寸
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 667;

let canvas;
let SCREEN_WIDTH;
let SCREEN_HEIGHT;
let SCALE_X;
let SCALE_Y;
let SCALE;

if (window.isWechatGame) {
  // 微信小游戏环境
  GameGlobal.canvas = wx.createCanvas();
  canvas = GameGlobal.canvas;
  
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  
  // 获取设备像素比
  const dpr = windowInfo.pixelRatio || 1;
  
  // 设置canvas实际大小
  canvas.width = windowInfo.screenWidth * dpr;
  canvas.height = windowInfo.screenHeight * dpr;
  
  // 设置CSS大小
  SCREEN_WIDTH = windowInfo.screenWidth;
  SCREEN_HEIGHT = windowInfo.screenHeight;
  
  // 计算缩放比例
  SCALE_X = SCREEN_WIDTH / DESIGN_WIDTH;
  SCALE_Y = SCREEN_HEIGHT / DESIGN_HEIGHT;
  SCALE = Math.min(SCALE_X, SCALE_Y);
  
  // 将常量挂载到全局对象
  GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
  GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
  GameGlobal.SCALE_X = SCALE_X;
  GameGlobal.SCALE_Y = SCALE_Y;
  GameGlobal.SCALE = SCALE;
  GameGlobal.DESIGN_WIDTH = DESIGN_WIDTH;
  GameGlobal.DESIGN_HEIGHT = DESIGN_HEIGHT;
} else {
  // 浏览器环境 - 延迟初始化，等待DOM加载完成
  SCREEN_WIDTH = DESIGN_WIDTH;
  SCREEN_HEIGHT = DESIGN_HEIGHT;
  SCALE_X = 1;
  SCALE_Y = 1;
  SCALE = 1;
  
  // 将常量挂载到全局对象
  window.SCREEN_WIDTH = SCREEN_WIDTH;
  window.SCREEN_HEIGHT = SCREEN_HEIGHT;
  window.SCALE_X = SCALE_X;
  window.SCALE_Y = SCALE_Y;
  window.SCALE = SCALE;
  window.DESIGN_WIDTH = DESIGN_WIDTH;
  window.DESIGN_HEIGHT = DESIGN_HEIGHT;
  
  // 在DOM加载完成后初始化canvas
  window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('gameCanvas');
    
    if (canvas) {
      // 获取设备像素比
      const dpr = window.devicePixelRatio || 1;
      
      // 获取实际屏幕尺寸
      const actualWidth = window.innerWidth;
      const actualHeight = window.innerHeight;
      
      // 计算缩放比例
      SCALE_X = actualWidth / DESIGN_WIDTH;
      SCALE_Y = actualHeight / DESIGN_HEIGHT;
      SCALE = Math.min(SCALE_X, SCALE_Y);
      
      // 设置canvas的CSS大小
      canvas.style.width = actualWidth + 'px';
      canvas.style.height = actualHeight + 'px';
      
      // 设置canvas的实际渲染大小（考虑设备像素比）
      canvas.width = actualWidth * dpr;
      canvas.height = actualHeight * dpr;
      
      // 更新全局变量
      SCREEN_WIDTH = actualWidth;
      SCREEN_HEIGHT = actualHeight;
      window.SCREEN_WIDTH = SCREEN_WIDTH;
      window.SCREEN_HEIGHT = SCREEN_HEIGHT;
      window.SCALE_X = SCALE_X;
      window.SCALE_Y = SCALE_Y;
      window.SCALE = SCALE;
      window.canvas = canvas;
      
      console.log('Canvas initialized successfully');
      console.log('Screen size:', SCREEN_WIDTH, 'x', SCREEN_HEIGHT);
      console.log('Scale:', SCALE, '(X:', SCALE_X, ', Y:', SCALE_Y, ')');
      console.log('Device pixel ratio:', dpr);
    } else {
      console.error('Canvas element not found');
    }
  });
}

// 将常量挂载到全局对象
window.SCREEN_WIDTH = SCREEN_WIDTH;
window.SCREEN_HEIGHT = SCREEN_HEIGHT;
window.SCALE_X = SCALE_X;
window.SCALE_Y = SCALE_Y;
window.SCALE = SCALE;
window.DESIGN_WIDTH = DESIGN_WIDTH;
window.DESIGN_HEIGHT = DESIGN_HEIGHT;

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
  GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
  GameGlobal.SCALE_X = SCALE_X;
  GameGlobal.SCALE_Y = SCALE_Y;
  GameGlobal.SCALE = SCALE;
  GameGlobal.DESIGN_WIDTH = DESIGN_WIDTH;
  GameGlobal.DESIGN_HEIGHT = DESIGN_HEIGHT;
}

// 确保canvas变量在全局可用
window.canvas = canvas;

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.canvas = canvas;
}

// 辅助函数：将设计稿坐标转换为实际坐标
function adaptX(x) {
  return x * SCALE_X;
}

function adaptY(y) {
  return y * SCALE_Y;
}

function adaptSize(size) {
  return size * SCALE;
}

// 将辅助函数挂载到全局对象
window.adaptX = adaptX;
window.adaptY = adaptY;
window.adaptSize = adaptSize;

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.adaptX = adaptX;
  GameGlobal.adaptY = adaptY;
  GameGlobal.adaptSize = adaptSize;
}