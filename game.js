// 微信小游戏环境
if (typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined') {
  // 确保GameGlobal存在
  if (typeof GameGlobal === 'undefined') {
    GameGlobal = {};
  }
  
  // 直接创建Main实例
  // 假设所有脚本已经通过微信小游戏的构建系统加载
  if (typeof Main !== 'undefined') {
    new Main();
  } else {
    console.error('Main class not found');
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
