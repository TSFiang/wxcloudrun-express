/**
 * 全局状态管理器（单例模式）
 * 负责管理游戏的所有状态：玩家、平台、收集系统、道具系统等
 */
let databusInstance;

class DataBus {
  // ─── 游戏状态 ──────────────────────────────────
  gameState = 'menu';
  isPaused = false;
  frame = 0;
  score = 0;
  highScore = 0;
  time = 0;
  isGameStarted = false;
  isFirstPlay = true;
  tutorialStep = 0;

  // ─── 设置 ──────────────────────────────────────
  settings = {
    sound: true,
    music: true,
    vibration: true,
    showTutorial: true,
    difficulty: 'normal',
    quality: 'high',
    showDebug: false,
    fpsLimit: 60
  };

  // ─── 玩家状态 ──────────────────────────────────
  player = {
    x: 0, y: 0, size: 30,
    velocityY: 0, velocityX: 0,
    isJumping: false, power: 0, maxPower: 100,
    state: 'stand', currentPlatform: null
  };

  // ─── 跳跃物理参数 ──────────────────────────────
  coyoteTime = 0.12;
  coyoteTimer = 0;
  inputBufferTime = 0.1;
  jumpBufferTimer = 0;
  bufferedJumpPower = 50;
  gravity = 0.4;
  jumpVelocityScale = 0.15;
  jumpHorizontalScale = 0.05;

  // ─── 平台 ──────────────────────────────────────
  platforms = [];
  platformSpeed = 1;
  basePlatformGap = 100;
  basePlatformSize = 80;

  // ─── 收集系统 ──────────────────────────────────
  collectedBeans = [];
  maxCollected = 6;
  beanPieces = 0;

  beanCollection = {
    animals:    { name: '小动物', icon: '🐶', unlocked: false, collected: [], total: 8, items: ['🐶','🐱','🐰','🦊','🐻','🐼','🐨','🦁'] },
    desserts:   { name: '甜品',   icon: '🍰', unlocked: false, collected: [], total: 8, items: ['🍰','🎂','🍩','🍪','🍫','🍬','🍭','🍮'] },
    stars:      { name: '星星',   icon: '⭐', unlocked: false, collected: [], total: 8, items: ['⭐','🌟','✨','💫','🌠','🔮','💎','💍'] },
    hearts:     { name: '爱心',   icon: '❤️', unlocked: false, collected: [], total: 8, items: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍'] },
    cartoons:   { name: '卡通',   icon: '🎨', unlocked: false, collected: [], total: 8, items: ['🎨','🎭','🎪','🎢','🎡','🎠','🎯','🎲'] }
  };

  collectibleItems = [];

  // ─── 道具 ──────────────────────────────────────
  items = { shield: 0, rainbow: 0, doubleScore: 0, extraBean: 0 };
  hasShield = false;
  doubleScoreActive = false;
  doubleScoreEndTime = 0;

  // ─── 动画 ──────────────────────────────────────
  animations = [];

  // ─── 帧计数器（替代 setTimeout）────────────────
  _standDelayFrames = 0;
  _standDelayActive = false;

  // ─── 对象池 ────────────────────────────────────
  pool = null; // 在 Main 中初始化

  constructor() {
    if (databusInstance) return databusInstance;
    databusInstance = this;
  }

  get showTutorial() {
    return this.isFirstPlay || this.settings.showTutorial;
  }

  set showTutorial(value) {
    this.settings.showTutorial = value;
  }

  // ─── 重置 ──────────────────────────────────────
  reset() {
    this.frame = 0;
    this.score = 0;
    this.time = 0;
    this.isGameStarted = false;
    this.gameStartTime = null;

    this.player = {
      x: 0, y: 0, size: 30,
      velocityY: 0, velocityX: 0,
      isJumping: false, power: 0, maxPower: 100,
      state: 'stand', currentPlatform: null
    };

    this.platforms = [];
    this.platformSpeed = 1;
    this.basePlatformGap = 100;
    this.basePlatformSize = 80;
    this.collectedBeans = [];
    this.beanPieces = 0;
    this.collectibleItems = [];
    this.animations = [];
    this.gameState = 'menu';
    this.isPaused = false;

    // 帧计数器重置
    this._standDelayFrames = 0;
    this._standDelayActive = false;

    // 道具保留，但测试阶段给初始道具
    if (this.items.shield === 0 && this.items.rainbow === 0 &&
        this.items.doubleScore === 0 && this.items.extraBean === 0) {
      this.items = { shield: 1, rainbow: 1, doubleScore: 1, extraBean: 1 };
    }
  }

  // ─── 游戏结束 ──────────────────────────────────
  gameOver() {
    // 护盾保护
    if (this.hasShield) {
      this.hasShield = false;
      const prw = 60, prh = 80;
      let tp = this.player.currentPlatform;
      if (!tp || tp.x < 0 || tp.x > SCREEN_WIDTH) {
        for (let i = this.platforms.length - 1; i >= 0; i--) {
          const p = this.platforms[i];
          if (p.x > 0 && p.x + p.size < SCREEN_WIDTH) { tp = p; break; }
        }
      }
      if (tp) {
        this.player.x = tp.x + tp.size / 2 - prw / 2;
        this.player.y = tp.y - prh;
        this.player.isJumping = false;
        this.player.velocityY = 0;
        this.player.velocityX = 0;
        this.player.state = 'stand';
      }
      return;
    }

    this.gameState = 'gameOver';
    if (this.score > this.highScore) this.highScore = this.score;
  }

  // ─── 开始游戏 ──────────────────────────────────
  startGame() {
    this.reset();
    this.gameState = 'playing';
    this.initPlatforms();
    this.initPlayer();
    this.isGameStarted = false;
    this.gameStartTime = Date.now() + 3000;
  }

  // ─── 复活 ──────────────────────────────────────
  revive() {
    const curScore = this.score;
    const curSpeed = this.platformSpeed;
    this.gameState = 'playing';
    this.isGameStarted = true;

    const prw = 60, prh = 80;
    let target = null;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      if (p.x > 0 && p.x + p.size < SCREEN_WIDTH && p.y > 100 && p.y < SCREEN_HEIGHT - 200) {
        target = p; break;
      }
    }

    if (target) {
      let px = target.x + target.size / 2 - prw / 2;
      let py = target.y - prh;
      px = Math.max(10, Math.min(px, SCREEN_WIDTH - prw - 10));
      py = Math.max(50, Math.min(py, SCREEN_HEIGHT - 200));

      Object.assign(this.player, {
        x: px, y: py, isJumping: false,
        velocityY: 0, velocityX: 0,
        currentPlatform: target, state: 'stand'
      });
    } else {
      const np = { x: SCREEN_WIDTH / 2 - 50, y: 350, size: 100, type: 'normal', isMoving: false };
      this.platforms.push(np);
      Object.assign(this.player, {
        x: np.x + 20, y: np.y - prh, isJumping: false,
        velocityY: 0, velocityX: 0,
        currentPlatform: np, state: 'stand'
      });
    }

    this.score = curScore;
    this.platformSpeed = curSpeed;
  }

  // ─── 平台初始化 ────────────────────────────────
  initPlatforms() {
    this.platforms = [];
    const startY = 350;

    // 起始山形平台
    this.platforms.push({
      x: 0, y: startY,
      size: this.basePlatformSize * 1.5,
      color: '#8B4513', type: 'mountain',
      isMoving: false, isStartPlatform: true,
      bounceMultiplier: 1, disappearDelay: 0,
      disappearTimer: 0, isDisappearing: false,
      isDanger: false, damage: 0
    });

    for (let i = 1; i < 12; i++) {
      const pType = i < 3 ? 'normal' : this._getRandomPlatformType();
      const mtn = this.platforms[0];
      this.platforms.push(this._createPlatform(
        mtn.x + mtn.size + (i - 1) * (this.basePlatformSize + this.basePlatformGap),
        startY + (Math.random() - 0.5) * 3,
        this.basePlatformSize, pType
      ));
    }
  }

  initPlayer() {
    const fp = this.platforms[0];
    if (fp.type === 'mountain') {
      this.player.x = fp.x + fp.size * 0.5 - this.player.size / 2;
    } else {
      this.player.x = fp.x + fp.size / 2 - this.player.size / 2;
    }
    this.player.y = fp.y - this.player.size;
  }

  // ─── 平台生成内部方法 ──────────────────────────
  _createPlatform(x, y, size, pType) {
    return {
      x, y, size,
      color: BEAN_COLORS[Math.floor(Math.random() * BEAN_COLORS.length)],
      type: pType,
      isMoving: pType === 'moving',
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      pulseAlpha: 0.5,
      bounceMultiplier: pType === 'bouncy' ? 1.5 : 1,
      disappearDelay: pType === 'disappearing' ? 3000 : 0,
      disappearTimer: 0, isDisappearing: false,
      isDanger: pType === 'danger',
      damage: pType === 'danger' ? 1 : 0
    };
  }

  _getRandomPlatformType() {
    const dl = Math.floor(this.score / 80);
    const probSets = [
      { normal: 0.40, moving: 0.25, bouncy: 0.15, disappearing: 0.10, danger: 0.10 },
      { normal: 0.35, moving: 0.25, bouncy: 0.15, disappearing: 0.15, danger: 0.10 },
      { normal: 0.30, moving: 0.25, bouncy: 0.20, disappearing: 0.15, danger: 0.10 },
      { normal: 0.25, moving: 0.25, bouncy: 0.20, disappearing: 0.15, danger: 0.15 },
      { normal: 0.20, moving: 0.25, bouncy: 0.20, disappearing: 0.20, danger: 0.15 }
    ];
    const probs = probSets[Math.min(dl, 4)];
    const r = Math.random();
    let cum = 0;
    for (const [type, prob] of Object.entries(probs)) {
      cum += prob;
      if (r <= cum) return type;
    }
    return 'normal';
  }

  // ─── 难度参数（分段设计）──────────────────────
  _getDifficulty() {
    const stages = [
      { score: 0,     speed: 0.6, gap: 70,  moveProb: 0.1 },
      { score: 30,    speed: 0.8, gap: 75,  moveProb: 0.15 },
      { score: 80,    speed: 1.0, gap: 85,  moveProb: 0.2 },
      { score: 150,   speed: 1.5, gap: 95,  moveProb: 0.3 },
      { score: 300,   speed: 2.2, gap: 110, moveProb: 0.4 },
      { score: 500,   speed: 3.0, gap: 125, moveProb: 0.5 },
      { score: 800,   speed: 4.0, gap: 140, moveProb: 0.6 },
      { score: 9999,  speed: 5.0, gap: 150, moveProb: 0.7 }
    ];
    for (let i = stages.length - 1; i >= 0; i--) {
      if (this.score >= stages[i].score) return stages[i];
    }
    return stages[0];
  }

  // ─── 生成新平台 ────────────────────────────────
  generatePlatform() {
    const last = this.platforms[this.platforms.length - 1];
    const diff = this._getDifficulty();

    const gap = diff.gap + Math.random() * 10;
    const sizeReduction = Math.min(this.score * 0.0003, 0.25);
    const pSize = Math.max(this.basePlatformSize * (1 - sizeReduction), this.basePlatformSize * 0.6);

    // 高度波动
    const dl = Math.floor(this.score / 50);
    const ranges = [{ min: 20, max: 40 }, { min: 30, max: 60 }, { min: 40, max: 80 }, { min: 50, max: 100 }];
    const range = ranges[Math.min(dl, 3)];
    const hOff = (Math.random() - 0.5) * (range.min + Math.random() * (range.max - range.min));

    const pType = this._getRandomPlatformType();
    const platform = this._createPlatform(
      last.x + pSize + gap + Math.random() * 5,
      Math.max(100, Math.min(480, last.y + hOff)),
      pSize, pType
    );

    // 图鉴道具 (10%)
    if (Math.random() < 0.1) {
      const item = this._generateCollectible(platform);
      if (item) this.collectibleItems.push(item);
    }

    this.platforms.push(platform);
  }

  // ─── 图鉴道具 ──────────────────────────────────
  _generateCollectible(platform) {
    const cats = Object.keys(this.beanCollection);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const col = this.beanCollection[cat];
    const uncollected = col.items.filter(i => !col.collected.includes(i));
    if (uncollected.length === 0) return null;

    return {
      x: platform.x + platform.size / 2 - 15,
      y: platform.y - 50, size: 30,
      category: cat,
      item: uncollected[Math.floor(Math.random() * uncollected.length)],
      collected: false, floatOffset: 0,
      floatSpeed: 0.05 + Math.random() * 0.05
    };
  }

  collectCollectionItem(item) {
    const col = this.beanCollection[item.category];
    if (!col.collected.includes(item.item)) {
      col.collected.push(item.item);
      if (col.collected.length >= col.total) col.unlocked = true;
      this.score += 5;
      return true;
    }
    return false;
  }

  // ─── 平台更新 ──────────────────────────────────
  updatePlatforms() {
    // 移除屏幕外平台
    this.platforms = this.platforms.filter(p => p.x + p.size > 0);

    if (!this.isGameStarted || Date.now() < this.gameStartTime) return;

    const diff = this._getDifficulty();
    const speed = diff.speed;

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      p.x -= speed;

      // 玩家同步移动
      if (!this.player.isJumping && this.player.currentPlatform === p) {
        this.player.x -= speed;
      }

      // 移动平台
      if (p.isMoving) {
        const ms = 0.8 + Math.min(this.score * 0.002, 0.4);
        p.y += p.moveDirection * ms;
        if (p.y <= 100 || p.y >= 480) {
          p.moveDirection *= -1;
          p.y = Math.max(100, Math.min(480, p.y));
        }
      }
    }

    // 生成新平台
    const last = this.platforms[this.platforms.length - 1];
    if (last && last.x < SCREEN_WIDTH - diff.gap) {
      this.generatePlatform();
    }

    this._updateCollectibleItems(speed);
  }

  _updateCollectibleItems(speed) {
    this.collectibleItems = this.collectibleItems.filter(it => !it.collected && it.x + it.size > 0);
    for (let i = 0; i < this.collectibleItems.length; i++) {
      const it = this.collectibleItems[i];
      it.x -= speed;
      it.floatOffset += it.floatSpeed;
      it.displayY = it.y + Math.sin(it.floatOffset) * 5;
    }
    this._checkCollectibleCollision();
  }

  _checkCollectibleCollision() {
    const pl = this.player;
    const pr = pl.x + 60, pb = pl.y + 80;

    for (let i = 0; i < this.collectibleItems.length; i++) {
      const it = this.collectibleItems[i];
      if (it.collected) continue;
      const ir = it.x + it.size;
      const ib = (it.displayY || it.y) + it.size;

      if (pr > it.x && pl.x < ir && pb > (it.displayY || it.y) && pl.y < ib) {
        it.collected = true;
        this.collectCollectionItem(it);
      }
    }
  }

  // ─── 跳跃 ──────────────────────────────────────
  jump(power) {
    this.jumpBufferTimer = this.inputBufferTime;
    this.bufferedJumpPower = power;
    this._tryJump();
  }

  _tryJump() {
    if (this.gameStartTime && Date.now() < this.gameStartTime) return;

    const canJump = !this.player.isJumping || this.coyoteTimer > 0;
    if (canJump && this.jumpBufferTimer > 0) {
      if (!this.isGameStarted) this.isGameStarted = true;

      this.player.isJumping = true;
      this.player.state = 'jump';
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;

      const power = this.bufferedJumpPower || 50;
      this.player.velocityY = -power * this.jumpVelocityScale;
      this.player.velocityX = power * this.jumpHorizontalScale;

      this._triggerJumpFeedback();
    }
  }

  // ─── 反馈 ──────────────────────────────────────
  _triggerJumpFeedback() {
    if (this.settings.vibration && typeof wx !== 'undefined') {
      wx.vibrateShort({ type: 'light' });
    }
    const fm = (typeof GameGlobal !== 'undefined') ? GameGlobal.feedbackManager : null;
    if (fm) {
      fm.createParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size, 'jump');
      fm.triggerScreenShake(2, 100);
    }
  }

  _triggerLandFeedback() {
    const fm = (typeof GameGlobal !== 'undefined') ? GameGlobal.feedbackManager : null;
    if (fm) {
      fm.createParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size, 'land');
      fm.triggerScreenShake(3, 150);
      fm.triggerHitStop(50);
    }
    if (this.settings.vibration && typeof wx !== 'undefined') {
      wx.vibrateShort({ type: 'medium' });
    }
  }

  _triggerCollectFeedback() {
    const fm = (typeof GameGlobal !== 'undefined') ? GameGlobal.feedbackManager : null;
    if (fm) {
      fm.createParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2, 'collect');
      fm.triggerScreenShake(4, 200);
      fm.triggerHitStop(80);
    }
    if (this.settings.vibration && typeof wx !== 'undefined') {
      wx.vibrateShort({ type: 'heavy' });
    }
  }

  // ─── 玩家更新 ──────────────────────────────────
  updatePlayer(deltaTime) {
    if (this.gameStartTime && Date.now() < this.gameStartTime) return;

    // 输入缓冲
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime;
      this._tryJump();
    }

    // 土狼时间
    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= deltaTime;
    }

    // 站立检测
    if (!this.player.isJumping && this.player.currentPlatform) {
      const p = this.player.currentPlatform;
      if (capsulePlatformCollision(this.player, p)) {
        this.player.y = p.y - this.player.size;
        this.coyoteTimer = this.coyoteTime;
        return;
      } else {
        this.player.isJumping = true;
        this.player.velocityY = 0;
        this.player.velocityX = 0;
        this.player.currentPlatform = null;
      }
    }

    // 重力 & 移动
    if (this.player.isJumping) {
      this.player.velocityY += this.gravity;
      this.player.y += this.player.velocityY;
      this.player.x += this.player.velocityX;
    }

    // 落地碰撞检测
    if (this.player.isJumping && this.player.velocityY > 0) {
      const subSteps = Math.abs(this.player.velocityY) > 3 ? 3 : 1;

      for (let step = 0; step < subSteps; step++) {
        for (let i = 0; i < this.platforms.length; i++) {
          const p = this.platforms[i];

          if (!capsulePlatformCollision(this.player, p)) continue;

          // 危险平台
          if (p.isDanger) { this.gameOver(); return; }

          // 消失平台启动计时
          if (p.type === 'disappearing' && !p.isDisappearing) {
            p.isDisappearing = true;
            p.disappearTimer = p.disappearDelay;
          }

          // 落地
          this.player.isJumping = false;
          this.player.velocityY = 0;
          this.player.velocityX = 0;
          this.player.y = p.y - this.player.size;
          this._triggerLandFeedback();

          if (this.player.currentPlatform !== p) {
            this.player.currentPlatform = p;

            if (p.type !== 'mountain') {
              this.player.state = 'collect';
              this.collectBean(p.color);
              this._handlePlatformType(p.type);

              // 计分
              let sg = 1;
              if (this.doubleScoreActive && Date.now() < this.doubleScoreEndTime) {
                sg = 2;
              } else if (this.doubleScoreActive) {
                this.doubleScoreActive = false;
              }
              this.score += sg;
              this.platformSpeed = 1 + Math.min(this.score * 0.005, 3);
              this._triggerCollectFeedback();
            }

            // 用帧计数器代替 setTimeout
            this._standDelayFrames = 18; // ~0.3s @60fps
            this._standDelayActive = true;
          } else {
            this.player.state = 'stand';
          }
          return;
        }
      }
    }

    // 帧计数器：恢复站立状态
    if (this._standDelayActive) {
      this._standDelayFrames--;
      if (this._standDelayFrames <= 0) {
        this.player.state = 'stand';
        this._standDelayActive = false;
      }
    }

    // 消失平台更新
    this._updateDisappearingPlatforms(deltaTime);

    // 掉落检测
    if (this.player.y > SCREEN_HEIGHT) {
      this.gameOver();
    }
  }

  // ─── 收集拼豆 ──────────────────────────────────
  collectBean(color) {
    this.collectedBeans.push(color);
    this._checkCollection();
    while (this.collectedBeans.length > this.maxCollected) {
      this.collectedBeans.shift();
    }
  }

  _checkCollection() {
    const colorCount = {};
    for (const c of this.collectedBeans) {
      colorCount[c] = (colorCount[c] || 0) + 1;
    }

    for (const [color, count] of Object.entries(colorCount)) {
      if (count >= 3) {
        let removed = 0;
        this.collectedBeans = this.collectedBeans.filter(c => {
          if (c === color && removed < 3) { removed++; return false; }
          return true;
        });

        const sg = (this.doubleScoreActive && Date.now() < this.doubleScoreEndTime) ? 20 : 10;
        this.score += sg;
        this.beanPieces++;
        this._giveRandomItem();
        this._checkBeanCollection();
        this._checkCollection(); // 递归检查连消
        return true;
      }
    }

    // 3个不同颜色也送道具
    const unique = Object.keys(colorCount);
    if (unique.length >= 3 && this.collectedBeans.length >= 3) {
      this._giveRandomItem();
    }
    return false;
  }

  _giveRandomItem() {
    const types = ['shield', 'rainbow', 'doubleScore', 'extraBean'];
    this.items[types[Math.floor(Math.random() * types.length)]]++;
  }

  _checkBeanCollection() {
    const thresholds = [
      { key: 'animals', n: 8 }, { key: 'desserts', n: 12 },
      { key: 'stars', n: 16 }, { key: 'hearts', n: 20 },
      { key: 'cartoons', n: 25 }
    ];
    for (const t of thresholds) {
      if (this.beanPieces >= t.n) {
        this.beanCollection[t.key].unlocked = true;
      }
    }
  }

  _handlePlatformType(type) {
    if (type === 'bouncy') {
      this.player.velocityY *= 1.5;
    }
  }

  _updateDisappearingPlatforms(dt) {
    this.platforms = this.platforms.filter(p => {
      if (p.isDisappearing) {
        p.disappearTimer -= dt;
        return p.disappearTimer > 0;
      }
      return true;
    });
  }

  // ─── 使用道具 ──────────────────────────────────
  useItem(type) {
    if (this.items[type] <= 0) return false;
    this.items[type]--;

    switch (type) {
      case 'shield':
        this.hasShield = true;
        break;
      case 'rainbow':
        this._useRainbow();
        break;
      case 'doubleScore':
        this.doubleScoreActive = true;
        this.doubleScoreEndTime = Date.now() + 10000;
        break;
      case 'extraBean':
        this.beanPieces += 3;
        this._checkBeanCollection();
        break;
    }
    return true;
  }

  _useRainbow() {
    if (this.collectedBeans.length > 0) {
      const colorCount = {};
      for (const c of this.collectedBeans) colorCount[c] = (colorCount[c] || 0) + 1;

      let maxColor = this.collectedBeans[0], maxCount = 0;
      for (const [c, n] of Object.entries(colorCount)) {
        if (n > maxCount) { maxCount = n; maxColor = c; }
      }

      const need = 3 - maxCount;
      for (let i = 0; i < need; i++) this.collectedBeans.push(maxColor);
    } else {
      const rc = BEAN_COLORS[Math.floor(Math.random() * BEAN_COLORS.length)];
      for (let i = 0; i < 3; i++) this.collectedBeans.push(rc);
    }
    this._checkCollection();
  }
}

if (typeof window !== 'undefined') window.DataBus = DataBus;
if (typeof GameGlobal !== 'undefined') GameGlobal.DataBus = DataBus;
