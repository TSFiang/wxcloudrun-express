// 确保全局变量可用
if (typeof GameGlobal === 'undefined') {
  window.GameGlobal = {};
}

// 检测是否在微信小游戏环境
const isWechatGame = typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined';

let canvas;
let SCREEN_WIDTH;
let SCREEN_HEIGHT;

if (isWechatGame) {
  // 微信小游戏环境
  GameGlobal.canvas = wx.createCanvas();
  canvas = GameGlobal.canvas;
  
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  
  canvas.width = windowInfo.screenWidth;
  canvas.height = windowInfo.screenHeight;
  
  SCREEN_WIDTH = windowInfo.screenWidth;
  SCREEN_HEIGHT = windowInfo.screenHeight;
} else {
  // 浏览器环境
  canvas = document.getElementById('gameCanvas');
  
  if (canvas) {
    canvas.width = 375;
    canvas.height = 667;
  }
  
  SCREEN_WIDTH = 375;
  SCREEN_HEIGHT = 667;
}

// 将常量挂载到全局对象
if (typeof window !== 'undefined') {
  window.SCREEN_WIDTH = SCREEN_WIDTH;
  window.SCREEN_HEIGHT = SCREEN_HEIGHT;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
  GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
}

// 确保canvas变量在全局可用
if (typeof window !== 'undefined') {
  window.canvas = canvas;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.canvas = canvas;
  // 在微信小游戏环境中，将canvas变量也挂载到全局作用域
  if (isWechatGame) {
    canvas = GameGlobal.canvas;
  }
}