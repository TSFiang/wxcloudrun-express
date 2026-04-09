/**
 * 游戏主循环
 * 固定时间步进（60/120 FPS），帧时间统一传递
 */
let ctx;

class Main {
  aniId = 0;
  gameInfo = null;
  lastTime = 0;

  targetFPS = 60;
  fixedDeltaTime = 1000 / 60;
  accumulatedTime = 0;
  maxAccumulatedTime = 200;

  fps = 0;
  frameCount = 0;
  fpsUpdateTime = 0;

  // 帧内缓存的时间戳（减少 Date.now() 调用）
  now = 0;

  constructor() {
    // 安全校验
    if (typeof DataBus === 'undefined') { console.error('DataBus not found'); return; }
    if (typeof Music === 'undefined')   { console.error('Music not found'); return; }
    if (typeof GameInfo === 'undefined') { console.error('GameInfo not found'); return; }
    if (typeof FeedbackManager === 'undefined') { console.error('FeedbackManager not found'); return; }

    // Canvas 初始化
    let canvasEl;
    if (typeof canvas !== 'undefined') {
      canvasEl = canvas;
    } else if (typeof GameGlobal !== 'undefined' && GameGlobal.canvas) {
      canvasEl = GameGlobal.canvas;
    } else {
      console.error('Canvas not found');
      return;
    }
    ctx = canvasEl.getContext('2d');

    if (typeof GameGlobal === 'undefined') {
      if (typeof window !== 'undefined') {
        window.GameGlobal = {};
      } else {
        console.error('GameGlobal not found');
        return;
      }
    }

    // 初始化全局系统
    GameGlobal.databus = new DataBus();
    GameGlobal.musicManager = new Music();
    GameGlobal.feedbackManager = new FeedbackManager();

    // 对象池引用
    GameGlobal.databus.pool = new Pool();

    if (typeof AdManager !== 'undefined') {
      GameGlobal.adManager = new AdManager();
    }

    this.gameInfo = new GameInfo();
    GameGlobal.main = this;

    // 事件绑定
    this.gameInfo.on('startGame', () => GameGlobal.databus.startGame());
    this.gameInfo.on('collection', () => { GameGlobal.databus.gameState = 'collection'; });
    this.gameInfo.on('leaderboard', () => { GameGlobal.databus.gameState = 'menu'; });
    this.gameInfo.on('settings', () => { GameGlobal.databus.gameState = 'settings'; });
    this.gameInfo.on('backToMenu', () => GameGlobal.databus.reset());
    this.gameInfo.on('restart', () => GameGlobal.databus.startGame());
    this.gameInfo.on('share', () => {});
    this.gameInfo.on('watchAd', () => this._watchAd());
    this.gameInfo.on('pause', () => this._togglePause());

    this.start();
  }

  setFPSLimit(fps) {
    this.targetFPS = fps;
    this.fixedDeltaTime = 1000 / fps;
  }

  start() {
    GameGlobal.databus.reset();
    cancelAnimationFrame(this.aniId);
    this.lastTime = performance.now();
    this.accumulatedTime = 0;

    if (GameGlobal.databus.settings) {
      this.setFPSLimit(GameGlobal.databus.settings.fpsLimit || 60);
    }

    this.aniId = requestAnimationFrame((t) => this.loop(t));
  }

  _watchAd() {
    const db = GameGlobal.databus;
    const adm = GameGlobal.adManager;
    if (adm && adm.isRewardedVideoAvailable()) {
      adm.showRewardedVideoAd(
        () => db.revive(),
        (msg) => {
          if (typeof wx !== 'undefined') {
            wx.showToast({ title: msg || '广告加载失败', icon: 'none' });
          }
        }
      );
    } else {
      db.revive();
    }
  }

  _togglePause() {
    const db = GameGlobal.databus;
    if (db.gameState === 'playing') {
      db.gameState = 'paused';
      db.isPaused = true;
    } else if (db.gameState === 'paused') {
      db.gameState = 'playing';
      db.isPaused = false;
    }
  }

  // ─── 渲染 ──────────────────────────────────────
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fm = GameGlobal.feedbackManager;
    fm.applyShake(ctx);
    this.gameInfo.render(ctx);

    const anis = GameGlobal.databus.animations;
    for (let i = 0; i < anis.length; i++) {
      if (anis[i].isPlaying) anis[i].aniRender(ctx);
    }

    fm.render(ctx);
    fm.resetShake(ctx);

    this._renderDebug(ctx);
  }

  _renderDebug(ctx) {
    const db = GameGlobal.databus;
    if (!db.settings || !db.settings.showDebug) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(5, canvas.height - 50, 100, 45);
    ctx.fillStyle = '#00FF00';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('FPS: ' + this.fps, 10, canvas.height - 35);
    ctx.fillText('Frame: ' + db.frame, 10, canvas.height - 20);
  }

  // ─── 逻辑更新（固定时间步）────────────────────
  update(deltaTime) {
    const db = GameGlobal.databus;
    db.frame++;

    GameGlobal.feedbackManager.update(deltaTime);

    if (db.gameState === 'playing') {
      const scaledDT = deltaTime * GameGlobal.feedbackManager.timeScale;
      db.updatePlatforms();
      db.updatePlayer(scaledDT);
    }
  }

  // ─── 帧循环 ────────────────────────────────────
  loop(currentTime) {
    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulatedTime += frameTime;
    if (this.accumulatedTime > this.maxAccumulatedTime) {
      this.accumulatedTime = this.maxAccumulatedTime;
    }

    // 缓存当前时间戳
    this.now = Date.now();

    let updates = 0;
    while (this.accumulatedTime >= this.fixedDeltaTime && updates < 5) {
      this.update(this.fixedDeltaTime / 1000);
      this.accumulatedTime -= this.fixedDeltaTime;
      updates++;
    }

    this.render();

    // FPS 统计
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    this.aniId = requestAnimationFrame((t) => this.loop(t));
  }
}

if (typeof window !== 'undefined') window.Main = Main;
if (typeof GameGlobal !== 'undefined') GameGlobal.Main = Main;
