// 微信小游戏环境
if (typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined') {
  // 微信小游戏环境使用require加载模块
  try {
    // 加载必要的模块（按正确顺序）
    require('./js/libs/tinyemitter.js');
    require('./js/base/pool.js');
    require('./js/runtime/logger.js');
    require('./js/runtime/resourceloader.js');
    require('./js/runtime/admanager.js');
    require('./js/runtime/authmanager.js');
    require('./js/render.js');
    require('./js/databus.js');
    require('./js/feedback.js');
    require('./js/runtime/music.js');
    require('./js/runtime/gameinfo.js');
    require('./js/main.js');
    
    // 确保GameGlobal存在
    if (typeof GameGlobal === 'undefined') {
      GameGlobal = {};
    }
    
    // 创建Main实例
    if (typeof Main !== 'undefined') {
      new Main();
    } else {
      console.error('Main class not found');
    }
  } catch (error) {
    console.error('Error loading modules:', error);
  }
} else {
  // 浏览器环境
  if (typeof Main !== 'undefined') {
    new Main();
  } else {
    // 如果Main类还未加载，等待一下再尝试
    setTimeout(() => {
      new Main();
    }, 100);
  }
}
