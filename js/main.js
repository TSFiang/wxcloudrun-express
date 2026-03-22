let ctx;

class Main {
  aniId = 0;
  gameInfo;
  lastTime = 0;
  
  // 帧率控制
  targetFPS = 60;
  fixedDeltaTime = 1000 / 60;
  accumulatedTime = 0;
  maxAccumulatedTime = 200;
  fps = 0;
  frameCount = 0;
  fpsUpdateTime = 0;

  constructor() {
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
    if (typeof FeedbackManager === 'undefined') {
      console.error('FeedbackManager class not found');
      return;
    }
    
    let canvasElement;
    if (typeof canvas !== 'undefined') {
      canvasElement = canvas;
    } else if (typeof GameGlobal !== 'undefined' && GameGlobal.canvas) {
      canvasElement = GameGlobal.canvas;
    } else {
      console.error('Canvas element not found');
      return;
    }

    ctx = canvasElement.getContext('2d');

    if (typeof GameGlobal === 'undefined') {
      if (typeof window !== 'undefined') {
        window.GameGlobal = {};
      } else {
        console.error('GameGlobal not found');
        return;
      }
    }
    GameGlobal.databus = new DataBus();
    GameGlobal.musicManager = new Music();
    GameGlobal.feedbackManager = new FeedbackManager();
    GameGlobal.main = this;
    
    // 初始化用户认证管理器
    if (typeof AuthManager !== 'undefined') {
      GameGlobal.authManager = new AuthManager();
      console.log('用户认证管理器初始化完成');
    }
    
    // 初始化成就管理器
    if (typeof AchievementManager !== 'undefined') {
      GameGlobal.achievementManager = new AchievementManager();
      console.log('成就管理器初始化完成');
    }
    
    // 初始化广告管理器
    if (typeof AdManager !== 'undefined') {
      GameGlobal.adManager = new AdManager();
    }

    this.gameInfo = new GameInfo();

    this.gameInfo.on('startGame', this.startGame.bind(this));
    this.gameInfo.on('collection', this.showCollection.bind(this));
    this.gameInfo.on('leaderboard', this.showLeaderboard.bind(this));
    this.gameInfo.on('achievement', this.showAchievement.bind(this));
    this.gameInfo.on('settings', this.showSettings.bind(this));
    this.gameInfo.on('backToMenu', this.backToMenu.bind(this));
    this.gameInfo.on('restart', this.restart.bind(this));
    this.gameInfo.on('share', this.share.bind(this));
    this.gameInfo.on('watchAd', this.watchAd.bind(this));
    this.gameInfo.on('pause', this.pause.bind(this));

    this.start();
  }
  
  /**
   * 设置帧率上限
   * @param {number} fps - 目标帧率（60或120）
   */
  setFPSLimit(fps) {
    this.targetFPS = fps;
    this.fixedDeltaTime = 1000 / fps;
    console.log(`FPS limit set to ${fps}, fixedDeltaTime: ${this.fixedDeltaTime.toFixed(2)}ms`);
  }

  start() {
    GameGlobal.databus.reset();
    cancelAnimationFrame(this.aniId);
    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    
    // 应用设置中的帧率
    if (GameGlobal.databus && GameGlobal.databus.settings) {
      this.setFPSLimit(GameGlobal.databus.settings.fpsLimit || 60);
    }
    
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  startGame() {
    GameGlobal.databus.startGame();
  }

  showCollection() {
    GameGlobal.databus.gameState = 'collection';
  }

  showLeaderboard() {
    GameGlobal.databus.gameState = 'menu';
  }

  showAchievement() {
    GameGlobal.databus.gameState = 'achievement';
  }

  showSettings() {
    GameGlobal.databus.gameState = 'settings';
  }
  
  showAchievement() {
    GameGlobal.databus.gameState = 'achievement';
  }

  backToMenu() {
    GameGlobal.databus.reset();
  }

  restart() {
    GameGlobal.databus.startGame();
  }

  share() {
    console.log('分享战绩');
  }

  watchAd() {
    console.log('看广告复活');
    
    // 检查广告是否可用
    if (GameGlobal.adManager && GameGlobal.adManager.isRewardedVideoAvailable()) {
      // 显示激励视频广告
      GameGlobal.adManager.showRewardedVideoAd(
        // 成功回调：用户完整观看广告后复活
        () => {
          console.log('广告观看成功，执行复活');
          GameGlobal.databus.revive();
        },
        // 失败回调
        (errMsg) => {
          console.log('广告观看失败:', errMsg);
          // 可以选择直接复活或提示用户
          // GameGlobal.databus.revive(); // 如果想失败也复活，取消注释
          wx.showToast({
            title: errMsg || '广告加载失败',
            icon: 'none'
          });
        }
      );
    } else {
      // 广告不可用，直接复活（开发阶段）
      console.log('广告不可用，直接复活');
      GameGlobal.databus.revive();
    }
  }

  pause() {
    const databus = GameGlobal.databus;
    if (databus.gameState === 'playing') {
      databus.gameState = 'paused';
      databus.isPaused = true;
    } else if (databus.gameState === 'paused') {
      databus.gameState = 'playing';
      databus.isPaused = false;
    }
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    GameGlobal.feedbackManager.applyShake(ctx);

    this.gameInfo.render(ctx);

    GameGlobal.databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx);
      }
    });

    GameGlobal.feedbackManager.render(ctx);

    GameGlobal.feedbackManager.resetShake(ctx);
    
    // 绘制性能监控（调试模式）
    this.renderDebugInfo(ctx);
  }
  
  // 绘制调试信息
  renderDebugInfo(ctx) {
    if (GameGlobal.databus.settings && GameGlobal.databus.settings.showDebug) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(5, canvas.height - 50, 100, 45);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`FPS: ${this.fps}`, 10, canvas.height - 35);
      ctx.fillText(`Frame: ${GameGlobal.databus.frame}`, 10, canvas.height - 20);
    }
  }

  // 游戏逻辑更新（使用固定时间步进）
  update(deltaTime) {
    GameGlobal.databus.frame++;

    GameGlobal.feedbackManager.update(deltaTime);

    if (GameGlobal.databus.gameState === 'playing') {
      const scaledDeltaTime = deltaTime * GameGlobal.feedbackManager.timeScale;
      
      GameGlobal.databus.updatePlatforms();
      GameGlobal.databus.updatePlayer(scaledDeltaTime);
    }
  }

  // 帧循环（固定时间步进）
  loop(currentTime) {
    // 计算帧间隔
    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // 累积时间
    this.accumulatedTime += frameTime;
    
    // 限制最大累积时间，防止切换标签页后死循环
    if (this.accumulatedTime > this.maxAccumulatedTime) {
      this.accumulatedTime = this.maxAccumulatedTime;
    }
    
    // 使用固定时间步进更新逻辑
    let updates = 0;
    const maxUpdates = 5; // 每帧最多更新次数，防止卡顿
    
    while (this.accumulatedTime >= this.fixedDeltaTime && updates < maxUpdates) {
      this.update(this.fixedDeltaTime / 1000); // 转换为秒
      this.accumulatedTime -= this.fixedDeltaTime;
      updates++;
    }
    
    // 渲染（每帧都渲染）
    this.render();
    
    // 计算FPS
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

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