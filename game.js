// 微信小游戏环境
if (typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined') {
  try {
    // 按正确顺序加载模块
    require('./js/utils.js');
    require('./js/libs/tinyemitter.js');
    require('./js/base/pool.js');
    require('./js/base/sprite.js');
    require('./js/runtime/logger.js');
    require('./js/runtime/resourceloader.js');
    require('./js/runtime/admanager.js');
    require('./js/render.js');
    require('./js/databus.js');
    require('./js/feedback.js');
    require('./js/runtime/music.js');
    require('./js/runtime/gameinfo.js');
    require('./js/main.js');

    if (typeof GameGlobal === 'undefined') GameGlobal = {};
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
    setTimeout(() => new Main(), 100);
  }
}
