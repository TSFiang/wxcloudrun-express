import './render'; // 初始化Canvas
import GameInfo from './runtime/gameinfo'; // 导入游戏UI类
import Music from './runtime/music'; // 导入音乐类
import DataBus from './databus'; // 导入数据类，用于管理游戏状态和数据

const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文;

GameGlobal.databus = new DataBus(); // 全局数据管理，用于管理游戏状态和数据
GameGlobal.musicManager = new Music(); // 全局音乐管理实例

/**
 * 游戏主函数
 */
export default class Main {
  aniId = 0; // 用于存储动画帧的ID
  gameInfo = new GameInfo(); // 创建游戏UI显示
  lastTime = Date.now(); // 上次时间

  constructor() {
    // 绑定事件
    this.gameInfo.on('startGame', this.startGame.bind(this));
    this.gameInfo.on('collection', this.showCollection.bind(this));
    this.gameInfo.on('leaderboard', this.showLeaderboard.bind(this));
    this.gameInfo.on('settings', this.showSettings.bind(this));
    this.gameInfo.on('backToMenu', this.backToMenu.bind(this));
    this.gameInfo.on('restart', this.restart.bind(this));
    this.gameInfo.on('share', this.share.bind(this));
    this.gameInfo.on('watchAd', this.watchAd.bind(this));

    // 开始游戏
    this.start();
  }

  /**
   * 开始游戏
   */
  start() {
    GameGlobal.databus.reset();
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * 开始游戏
   */
  startGame() {
    GameGlobal.databus.startGame();
  }

  /**
   * 显示图鉴
   */
  showCollection() {
    GameGlobal.databus.gameState = 'collection';
  }

  /**
   * 显示排行榜
   */
  showLeaderboard() {
    // 暂时显示主菜单，实际应该显示排行榜
    GameGlobal.databus.gameState = 'menu';
  }

  /**
   * 显示设置
   */
  showSettings() {
    GameGlobal.databus.gameState = 'settings';
  }

  /**
   * 返回主菜单
   */
  backToMenu() {
    GameGlobal.databus.gameState = 'menu';
  }

  /**
   * 重新开始
   */
  restart() {
    GameGlobal.databus.startGame();
  }

  /**
   * 分享
   */
  share() {
    // 实现分享逻辑
    console.log('分享战绩');
  }

  /**
   * 看广告
   */
  watchAd() {
    // 实现看广告逻辑
    console.log('看广告复活');
    // 复活逻辑
    GameGlobal.databus.startGame();
  }

  /**
   * canvas重绘函数
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布

    // 绘制游戏UI
    this.gameInfo.render(ctx);

    // 绘制动画
    GameGlobal.databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx);
      }
    });
  }

  // 游戏逻辑更新主函数
  update() {
    GameGlobal.databus.frame++; // 增加帧数

    // 处理时间
    const now = Date.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // 游戏中逻辑
    if (GameGlobal.databus.gameState === 'playing') {
      // 更新平台
      GameGlobal.databus.updatePlatforms();
      
      // 更新玩家
      GameGlobal.databus.updatePlayer();
    }
  }

  // 实现游戏帧循环
  loop() {
    this.update(); // 更新游戏逻辑
    this.render(); // 渲染游戏画面

    // 请求下一帧动画
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}