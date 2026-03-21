// 假设render.js已经在HTML中加载
// 其他类将在全局作用域中可用

let ctx; // 声明ctx变量，在构造函数中初始化

/**
 * 游戏主函数
 */
class Main {
  aniId = 0; // 用于存储动画帧的ID
  gameInfo;
  lastTime = Date.now(); // 上次时间

  constructor() {
    // 确保所有类在全局作用域中可用
    if (typeof DataBus === 'undefined') {
      console.error('DataBus class not found');
      return;
    }
    if (typeof Music === 'undefined') {
      console.error('Music class not found');
      return;
    }
    if (typeof GameInfo === 'undefined') {
      console.error('GameInfo class not found');
      return;
    }
    
    // 获取canvas元素
    let canvasElement;
    if (typeof canvas !== 'undefined') {
      canvasElement = canvas;
    } else if (typeof GameGlobal !== 'undefined' && GameGlobal.canvas) {
      canvasElement = GameGlobal.canvas;
    } else {
      console.error('Canvas element not found');
      return;
    }

    // 初始化canvas上下文
    ctx = canvasElement.getContext('2d');

    // 创建全局实例
    if (typeof GameGlobal === 'undefined') {
      if (typeof window !== 'undefined') {
        window.GameGlobal = {};
      } else {
        // 在微信小游戏环境中，GameGlobal应该已经存在
        console.error('GameGlobal not found');
        return;
      }
    }
    GameGlobal.databus = new DataBus(); // 全局数据管理，用于管理游戏状态和数据
    GameGlobal.musicManager = new Music(); // 全局音乐管理实例

    // 创建游戏UI显示
    this.gameInfo = new GameInfo();

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

// 将Main类挂载到全局对象
if (typeof window !== 'undefined') {
  window.Main = Main;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.Main = Main;
}