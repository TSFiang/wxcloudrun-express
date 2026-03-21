// 确保全局变量可用
if (typeof GameGlobal === 'undefined') {
  window.GameGlobal = {};
}

// 检测是否在微信小游戏环境，并将结果挂载到全局对象
if (typeof window.isWechatGame === 'undefined') {
  window.isWechatGame = typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined';
}

let canvas;
let SCREEN_WIDTH;
let SCREEN_HEIGHT;

if (window.isWechatGame) {
  // 微信小游戏环境
  GameGlobal.canvas = wx.createCanvas();
  canvas = GameGlobal.canvas;
  
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  
  canvas.width = windowInfo.screenWidth;
  canvas.height = windowInfo.screenHeight;
  
  SCREEN_WIDTH = windowInfo.screenWidth;
  SCREEN_HEIGHT = windowInfo.screenHeight;
  
  // 将常量挂载到全局对象
  GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
  GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
} else {
  // 浏览器环境 - 延迟初始化，等待DOM加载完成
  // 设置默认值
  SCREEN_WIDTH = 375;
  SCREEN_HEIGHT = 667;
  
  // 将常量挂载到全局对象
  window.SCREEN_WIDTH = SCREEN_WIDTH;
  window.SCREEN_HEIGHT = SCREEN_HEIGHT;
  
  // 在DOM加载完成后初始化canvas
  window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('gameCanvas');
    
    if (canvas) {
      canvas.width = SCREEN_WIDTH;
      canvas.height = SCREEN_HEIGHT;
      window.canvas = canvas;
      console.log('Canvas initialized successfully');
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