let databusInstance;

/**
 * 全局状态管理器（单例模式）
 * @class DataBus
 * @description 负责管理游戏的所有状态，包括玩家、平台、收集系统、道具系统等
 * @example
 * const databus = new DataBus();
 * databus.startGame();
 */
class DataBus {
  /** @type {string} 当前游戏状态 */
  gameState = 'menu';
  
  /** @type {boolean} 游戏是否暂停 */
  isPaused = false;
  
  /** @type {number} 当前帧数 */
  frame = 0;
  
  /** @type {number} 当前分数 */
  score = 0;
  
  /** @type {number} 最高分 */
  highScore = 0;
  
  /** @type {number} 游戏时间（秒） */
  time = 0;
  
  /** @type {boolean} 游戏是否开始移动 */
  isGameStarted = false;
  
  /** @type {boolean} 是否首次游戏 */
  isFirstPlay = true;
  
  /** @type {number} 教程步骤（0-2） */
  tutorialStep = 0;
  
  /** @type {Object} 游戏设置 */
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
  
  /** @type {Object} 玩家状态 */
  player = {
    x: 0,
    y: 0,
    size: 30,
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    power: 0,
    maxPower: 100,
    state: 'stand',
    currentPlatform: null,
  };
  
  /** @type {number} 土狼时间（秒）- 离开平台后仍允许跳跃的窗口 */
  coyoteTime = 0.12;
  
  /** @type {number} 土狼时间计时器 */
  coyoteTimer = 0;
  
  /** @type {number} 输入缓冲窗口（秒） */
  inputBufferTime = 0.1;
  
  /** @type {number} 跳跃输入缓冲计时器 */
  jumpBufferTimer = 0;
  
  /** @type {number} 短跳速度阈值 */
  jumpCutOff = 0.5;
  
  /** @type {number} 下落加速度倍率 */
  fallAcceleration = 2.5;
  
  /** @type {number} 命中停顿时间（秒） */
  hitStopDuration = 0.08;
  
  /** @type {boolean} 是否处于命中停顿状态 */
  isHitStop = false;
  
  /** @type {number} 命中停顿计时器 */
  hitStopTimer = 0;
  
  /** @type {Array} 平台数组 */
  platforms = [];
  
  /** @type {number} 平台移动速度 */
  platformSpeed = 1;
  
  /** @type {number} 基础平台间距 */
  basePlatformGap = 100;
  
  /** @type {number} 基础平台大小 */
  basePlatformSize = 80;
  
  /** @type {Array<string>} 收集的拼豆颜色数组 */
  collectedBeans = [];
  
  /** @type {number} 最大收集数量 */
  maxCollected = 6;
  
  /** @type {number} 拼豆碎片数量 */
  beanPieces = 0;
  
  /** @type {Object} 拼豆图鉴 */
  beanCollection = {
    animals: { unlocked: false, pieces: 0, total: 8, unlockAt: 8 },
    desserts: { unlocked: false, pieces: 0, total: 12, unlockAt: 12 },
    stars: { unlocked: false, pieces: 0, total: 16, unlockAt: 16 },
    hearts: { unlocked: false, pieces: 0, total: 20, unlockAt: 20 },
    cartoons: { unlocked: false, pieces: 0, total: 25, unlockAt: 25 }
  };
  
  /** @type {Object} 道具数量 */
  items = {
    shield: 0,
    rainbow: 0,
    doubleScore: 0,
    extraBean: 0
  };
  
  /** @type {boolean} 是否有护盾保护 */
  hasShield = false;
  
  /** @type {boolean} 双倍分数是否激活 */
  doubleScoreActive = false;
  
  /** @type {number} 双倍分数结束时间戳 */
  doubleScoreEndTime = 0;
  
  /** @type {Array} 动画数组 */
  animations = [];
  
  /** @type {Pool} 对象池实例 */
  pool = new Pool();

  constructor() {
    if (databusInstance) return databusInstance;
    databusInstance = this;
  }
  
  /**
   * 获取是否显示教程
   * @returns {boolean} 首次游戏或设置开启时返回true
   */
  get showTutorial() {
    return this.isFirstPlay || this.settings.showTutorial;
  }
  
  /**
   * 设置是否显示教程
   * @param {boolean} value - 是否显示教程
   */
  set showTutorial(value) {
    this.settings.showTutorial = value;
  }

  /**
   * 重置游戏状态到初始值
   * @description 清空分数、平台、收集栏等，但保留道具
   */
  reset() {
    this.frame = 0;
    this.score = 0;
    this.time = 0;
    this.isGameStarted = false;
    this.gameStartTime = null; // 重置游戏开始时间
    this.player = {
      x: 0,
      y: 0,
      size: 30,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      power: 0,
      maxPower: 100,
      state: 'stand',
      currentPlatform: null, // 重置当前平台
    };
    this.platforms = [];
    this.platformSpeed = 1; // 降低初始速度
    this.basePlatformGap = 100; // 增加间距
    this.basePlatformSize = 80; // 增大平台
    this.collectedBeans = [];
    this.beanPieces = 0;
    // 道具不清空，保留玩家积累的道具
    // 测试阶段：如果没有道具，给初始道具（每个3个）
    if (this.items.shield === 0 && this.items.rainbow === 0 && 
        this.items.doubleScore === 0 && this.items.extraBean === 0) {
      this.items = { shield: 3, rainbow: 3, doubleScore: 3, extraBean: 3 };
    }
    this.animations = [];
    this.gameState = 'menu';
    this.isPaused = false; // 重置暂停状态
    
    // 教程状态：首次游戏显示教程，之后根据设置决定
    // showTutorial 现在通过 getter 直接引用 settings.showTutorial
    // 无需额外同步
  }

  // 游戏结束
  gameOver() {
    // 检查是否有护盾保护
    if (this.hasShield) {
      // 使用护盾，避免游戏结束
      this.hasShield = false;
      console.log('护盾保护了你！继续游戏');
      
      // 玩家实际渲染大小
      const playerRenderWidth = 60;
      const playerRenderHeight = 80;
      
      // 找一个可见的平台
      let targetPlatform = this.player.currentPlatform;
      if (!targetPlatform || targetPlatform.x < 0 || targetPlatform.x > 375) {
        // 找一个在屏幕内的平台
        for (let i = this.platforms.length - 1; i >= 0; i--) {
          const p = this.platforms[i];
          if (p.x > 0 && p.x + p.size < 375) {
            targetPlatform = p;
            break;
          }
        }
      }
      
      if (targetPlatform) {
        // 使用渲染大小计算位置
        this.player.x = targetPlatform.x + targetPlatform.size / 2 - playerRenderWidth / 2;
        this.player.y = targetPlatform.y - playerRenderHeight;
        this.player.isJumping = false;
        this.player.velocityY = 0;
        this.player.velocityX = 0;
        this.player.state = 'stand';
        console.log('护盾保护 - 玩家位置:', this.player.x, this.player.y);
      }
      
      return; // 不结束游戏
    }
    
    this.gameState = 'gameOver';
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  // 游戏成功
  gameSuccess() {
    this.gameState = 'success';
  }

  // 开始游戏
  startGame() {
    this.reset();
    this.gameState = 'playing';
    this.initPlatforms();
    this.initPlayer();
    
    // 添加延迟开始，给玩家准备时间
    this.isGameStarted = false;
    this.gameStartTime = Date.now() + 3000; // 3秒后开始移动平台，显示3/2/1倒计时
  }
  
  // 复活（看广告后继续游戏）
  revive() {
    // 保持当前分数和进度
    const currentScore = this.score;
    const currentPlatformSpeed = this.platformSpeed;
    
    // 恢复游戏状态
    this.gameState = 'playing';
    this.isGameStarted = true;
    
    // 玩家实际渲染大小
    const playerRenderWidth = 60;
    const playerRenderHeight = 80;
    
    // 屏幕边界
    const screenWidth = 375;
    const screenHeight = 667;
    
    // 找到一个在屏幕可见范围内的平台
    let targetPlatform = null;
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      // 平台必须在屏幕内可见
      if (p.x > 0 && p.x + p.size < screenWidth && p.y > 100 && p.y < screenHeight - 200) {
        targetPlatform = p;
        break;
      }
    }
    
    // 如果找到合适的平台
    if (targetPlatform) {
      // 计算玩家位置，确保在屏幕内
      let playerX = targetPlatform.x + targetPlatform.size / 2 - playerRenderWidth / 2;
      let playerY = targetPlatform.y - playerRenderHeight;
      
      // 确保玩家在屏幕水平范围内
      playerX = Math.max(10, Math.min(playerX, screenWidth - playerRenderWidth - 10));
      
      // 确保玩家在屏幕垂直范围内
      playerY = Math.max(50, Math.min(playerY, screenHeight - 200));
      
      this.player.x = playerX;
      this.player.y = playerY;
      this.player.isJumping = false;
      this.player.velocityY = 0;
      this.player.velocityX = 0;
      this.player.currentPlatform = targetPlatform;
      this.player.state = 'stand';
      
      console.log('复活成功 - 玩家位置:', playerX, playerY, '平台位置:', targetPlatform.x, targetPlatform.y);
    } else {
      // 没有找到合适的平台，在屏幕中央创建一个新平台
      const newPlatform = {
        x: screenWidth / 2 - 50,
        y: 350,
        size: 100,
        color: '#4CAF50',
        type: 'normal',
        isMoving: false
      };
      this.platforms.push(newPlatform);
      
      // 将玩家放在新平台上
      this.player.x = newPlatform.x + newPlatform.size / 2 - playerRenderWidth / 2;
      this.player.y = newPlatform.y - playerRenderHeight;
      this.player.isJumping = false;
      this.player.velocityY = 0;
      this.player.velocityX = 0;
      this.player.currentPlatform = newPlatform;
      this.player.state = 'stand';
      
      console.log('复活成功 - 创建新平台，玩家位置:', this.player.x, this.player.y);
    }
    
    // 恢复分数和速度
    this.score = currentScore;
    this.platformSpeed = currentPlatformSpeed;
    
    console.log('复活完成！当前分数:', this.score);
  }

  // 初始化平台
  initPlatforms() {
    this.platforms = [];
    // 调整平台初始位置，避免被底部UI遮挡
    // UI区域：道具栏(507-547)、收集栏(567-617)
    // 游戏区域：100-500，平台初始位置设在中间偏下
    const startY = 350; // 从567调整到350，留出足够空间
    
    // 第一个平台是山形起始平台（特殊设计）
    const mountainPlatform = {
      x: 0,
      y: startY,
      size: this.basePlatformSize * 1.5, // 更大的起始平台
      color: '#8B4513', // 棕色，山的颜色
      type: 'mountain', // 特殊类型：山
      isMoving: false, // 山不移动
      isStartPlatform: true, // 标记为起始平台
      bounceMultiplier: 1,
      disappearDelay: 0,
      disappearTimer: 0,
      isDisappearing: false,
      isDanger: false,
      damage: 0
    };
    this.platforms.push(mountainPlatform);
    
    // 生成后续平台（增加到12个，业界标准）
    for (let i = 1; i < 12; i++) {
      const platform = {
        x: mountainPlatform.x + mountainPlatform.size + (i - 1) * (this.basePlatformSize + this.basePlatformGap),
        y: startY + (Math.random() - 0.5) * 3, // 限制初始平台高度波动为±1.5像素
        size: this.basePlatformSize,
        color: this.getRandomColor(),
        type: 'normal', // 初始平台都是普通类型
        isMoving: false, // 初始平台不移动
        moveDirection: Math.random() > 0.5 ? 1 : -1,
        pulseAlpha: 0.5,
        
        // 新增平台特殊属性
        bounceMultiplier: 1,
        disappearDelay: 0,
        disappearTimer: 0,
        isDisappearing: false,
        isDanger: false,
        damage: 0
      };
      this.platforms.push(platform);
    }
  }

  // 初始化玩家
  initPlayer() {
    const firstPlatform = this.platforms[0];
    // 如果是山形起始平台，玩家站在山顶中央
    if (firstPlatform.type === 'mountain') {
      this.player.x = firstPlatform.x + firstPlatform.size * 0.5 - this.player.size / 2;
      this.player.y = firstPlatform.y - this.player.size;
    } else {
      // 普通平台
      this.player.x = firstPlatform.x + firstPlatform.size / 2 - this.player.size / 2;
      this.player.y = firstPlatform.y - this.player.size;
    }
  }

  // 获取随机颜色
  getRandomColor() {
    const colors = ['red', 'yellow', 'blue', 'green', 'purple'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 获取随机平台类型（扩展到5种类型）
  getRandomPlatformType() {
    // 根据分数阶段调整平台类型概率
    const difficultyLevel = Math.floor(this.score / 100);
    
    let probabilities;
    
    if (difficultyLevel === 0) {
      // 初期（0-50分）：教学期，更多静态平台
      probabilities = {
        normal: 0.6,      // 60% 静态平台
        moving: 0.2,      // 20% 移动平台
        bouncy: 0.1,      // 10% 弹跳平台
        disappearing: 0.05, // 5% 消失平台
        danger: 0.05      // 5% 危险平台
      };
    } else if (difficultyLevel === 1) {
      // 中期（50-100分）：适应期
      probabilities = {
        normal: 0.5,      // 50%
        moving: 0.25,     // 25%
        bouncy: 0.12,     // 12%
        disappearing: 0.08, // 8%
        danger: 0.05      // 5%
      };
    } else if (difficultyLevel === 2) {
      // 后期（100-200分）：标准期
      probabilities = {
        normal: 0.45,     // 45%
        moving: 0.25,     // 25%
        bouncy: 0.12,     // 12%
        disappearing: 0.08, // 8%
        danger: 0.1       // 10%
      };
    } else if (difficultyLevel === 3) {
      // 挑战期（200-400分）
      probabilities = {
        normal: 0.4,      // 40%
        moving: 0.25,     // 25%
        bouncy: 0.15,     // 15%
        disappearing: 0.1, // 10%
        danger: 0.1       // 10%
      };
    } else {
      // 专家期（400+分）
      probabilities = {
        normal: 0.35,     // 35%
        moving: 0.25,     // 25%
        bouncy: 0.15,     // 15%
        disappearing: 0.12, // 12%
        danger: 0.13      // 13%
      };
    }
    
    // 随机选择平台类型
    const random = Math.random();
    let cumulative = 0;
    
    for (const [type, prob] of Object.entries(probabilities)) {
      cumulative += prob;
      if (random <= cumulative) {
        return type;
      }
    }
    
    return 'normal';
  }

  // 获取当前难度参数（分段设计：先慢后快）
  getCurrentDifficulty() {
    const difficultyStages = [
      { score: 0,    speed: 0.6,   gap: 70,  moveProb: 0.1 },   // 新手期：非常慢
      { score: 30,   speed: 0.8,   gap: 75,  moveProb: 0.15 },  // 适应期：缓慢加速
      { score: 80,   speed: 1.0,   gap: 85,  moveProb: 0.2 },   // 成长期：正常速度
      { score: 150,  speed: 1.5,   gap: 95,  moveProb: 0.3 },   // 进阶期：开始加速
      { score: 300,  speed: 2.2,   gap: 110, moveProb: 0.4 },   // 高手期：较快
      { score: 500,  speed: 3.0,   gap: 125, moveProb: 0.5 },   // 大师期：很快
      { score: 800,  speed: 4.0,   gap: 140, moveProb: 0.6 },   // 专家期：极快
      { score: 9999, speed: 5.0,   gap: 150, moveProb: 0.7 }    // 上限：极限速度
    ];
    
    for (let i = difficultyStages.length - 1; i >= 0; i--) {
      if (this.score >= difficultyStages[i].score) {
        return difficultyStages[i];
      }
    }
    
    return difficultyStages[0];
  }

  // 生成新平台
  generatePlatform() {
    const lastPlatform = this.platforms[this.platforms.length - 1];
    
    // 获取当前难度参数
    const difficulty = this.getCurrentDifficulty();
    
    // 使用分段设计的参数
    const platformGap = difficulty.gap + Math.random() * 10;
    const platformSpeed = difficulty.speed;
    const moveProbability = difficulty.moveProb;
    
    // 动态调整平台大小，随分数增加而减小（降低减小速度，保持最小值更大）
    const sizeReduction = Math.min(this.score * 0.0003, 0.25); // 最大减少25%
    const platformSize = Math.max(this.basePlatformSize * (1 - sizeReduction), this.basePlatformSize * 0.6); // 最小保持60%
    
    // 优化高度波动：根据难度阶段调整（业界标准）
    const difficultyLevel = Math.floor(this.score / 50); // 每50分一个阶段
    const heightVariation = {
      0: { min: 20, max: 40 },   // 初期：容易跳跃
      1: { min: 30, max: 60 },   // 中期：正常挑战
      2: { min: 40, max: 80 },   // 后期：高难度
      3: { min: 50, max: 100 }   // 专家：最大挑战
    };
    
    const range = heightVariation[Math.min(difficultyLevel, 3)];
    const heightOffset = (Math.random() - 0.5) * (range.min + Math.random() * (range.max - range.min));
    
    // 获取平台类型
    const platformType = this.getRandomPlatformType();
    
    const platform = {
      x: lastPlatform.x + platformSize + platformGap + Math.random() * 5, // 减少随机偏移
      y: lastPlatform.y + heightOffset, // 使用优化后的高度波动
      size: platformSize,
      color: this.getRandomColor(),
      type: platformType,
      isMoving: platformType === 'moving', // 只有移动平台才移动
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      pulseAlpha: 0.5, // 移动平台视觉提示用
      
      // 新增平台特殊属性
      bounceMultiplier: platformType === 'bouncy' ? 1.5 : 1, // 弹跳平台跳跃倍数
      disappearDelay: platformType === 'disappearing' ? 0.5 : 0, // 消失平台延迟
      disappearTimer: 0, // 消失计时器
      isDisappearing: false, // 是否正在消失
      isDanger: platformType === 'danger', // 是否危险平台
      damage: platformType === 'danger' ? 1 : 0 // 伤害值
    };
    
    // 确保平台在屏幕范围内，避免被UI遮挡
    // UI区域：道具栏(507-547)、收集栏(567-617)
    // 平台安全区域：100-480
    platform.y = Math.max(100, Math.min(480, platform.y));
    
    this.platforms.push(platform);
  }

  // 更新平台
  updatePlatforms() {
    // 移除屏幕外的平台
    this.platforms = this.platforms.filter(platform => platform.x + platform.size > 0);
    
    // 只有游戏开始后才移动平台
    if (this.isGameStarted && Date.now() >= this.gameStartTime) {
      // 获取当前难度参数
      const difficulty = this.getCurrentDifficulty();
      const currentSpeed = difficulty.speed;
      
      // 移动平台
      this.platforms.forEach(platform => {
        // 移动平台（使用分段设计的速度）
        platform.x -= currentSpeed;
        
        // 如果玩家站在这个平台上，同步移动玩家
        if (!this.player.isJumping && this.player.currentPlatform === platform) {
          this.player.x -= currentSpeed;
        }
        
        // 移动平台的额外移动（优化移动范围和速度）
        if (platform.isMoving) {
          // 优化移动速度：匹配玩家跳跃能力（业界标准）
          // 玩家最大跳跃高度约120px，跳跃时间0.5秒
          // 平台移动不超过跳跃高度的30% = 36px
          // 每帧速度 = 36 / 30帧 = 1.2px/帧
          const baseMoveSpeed = 0.8; // 基础速度
          const speedBonus = Math.min(this.score * 0.002, 0.4); // 最大增加0.4
          const moveSpeed = baseMoveSpeed + speedBonus;
          
          platform.y += platform.moveDirection * moveSpeed;
          
          // 限制移动范围在安全区域内（100-480像素）
          // 避免与UI元素冲突
          if (platform.y <= 100 || platform.y >= 480) {
            platform.moveDirection *= -1;
            // 确保平台在安全范围内
            platform.y = Math.max(100, Math.min(480, platform.y));
          }
        }
      });
      
      // 生成新平台
      const lastPlatform = this.platforms[this.platforms.length - 1];
      if (lastPlatform && lastPlatform.x < window.SCREEN_WIDTH - difficulty.gap) {
        this.generatePlatform();
      }
    }
  }

  // 处理跳跃（带输入缓冲）
  jump(power) {
    // 记录跳跃输入到缓冲区
    this.jumpBufferTimer = this.inputBufferTime;
    this.bufferedJumpPower = power;
    
    // 尝试执行跳跃
    this.tryJump();
  }
  
  // 尝试执行跳跃（检查是否可以跳跃）
  tryJump() {
    // 检查倒计时是否结束
    if (this.gameStartTime && Date.now() < this.gameStartTime) {
      return;
    }
    
    // 检查是否可以跳跃（站立中或在土狼时间内）
    const canJump = !this.player.isJumping || this.coyoteTimer > 0;
    
    if (canJump && this.jumpBufferTimer > 0) {
      // 第一次跳跃时，开始游戏移动
      if (!this.isGameStarted) {
        this.isGameStarted = true;
      }
      
      this.player.isJumping = true;
      this.player.state = 'jump';
      
      // 重置计时器
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      
      // 优化跳跃参数，参考Box2D横版游戏最佳实践
      const power = this.bufferedJumpPower || 50;
      this.player.velocityY = -power * 0.15; // 降低垂直速度（从0.18降到0.15）
      this.player.velocityX = power * 0.05; // 增加水平速度（从0.04增到0.05）
      
      // 触发跳跃反馈
      this.triggerJumpFeedback();
    }
  }
  
  // 触发跳跃反馈
  triggerJumpFeedback() {
    // 播放跳跃音效
    if (GameGlobal.musicManager && GameGlobal.databus.settings.sound) {
      // 可以添加跳跃音效
    }
    
    // 触发振动反馈
    if (GameGlobal.databus.settings.vibration && typeof wx !== 'undefined') {
      wx.vibrateShort({ type: 'light' });
    }
    
    // 触发视觉反馈
    if (GameGlobal.feedbackManager) {
      // 创建跳跃粒子效果
      GameGlobal.feedbackManager.createParticles(
        this.player.x + this.player.size / 2,
        this.player.y + this.player.size,
        'jump'
      );
      
      // 轻微屏幕震动
      GameGlobal.feedbackManager.triggerScreenShake(2, 100);
    }
  }
  
  // 触发落地反馈
  triggerLandFeedback() {
    // 触发视觉反馈
    if (GameGlobal.feedbackManager) {
      // 创建落地粒子效果
      GameGlobal.feedbackManager.createParticles(
        this.player.x + this.player.size / 2,
        this.player.y + this.player.size,
        'land'
      );
      
      // 轻微屏幕震动
      GameGlobal.feedbackManager.triggerScreenShake(3, 150);
      
      // 触发命中停顿
      GameGlobal.feedbackManager.triggerHitStop(50);
    }
    
    // 触发振动反馈
    if (GameGlobal.databus.settings.vibration && typeof wx !== 'undefined') {
      wx.vibrateShort({ type: 'medium' });
    }
  }
  
  // 触发收集反馈
  triggerCollectFeedback() {
    // 触发视觉反馈
    if (GameGlobal.feedbackManager) {
      // 创建收集粒子效果
      GameGlobal.feedbackManager.createParticles(
        this.player.x + this.player.size / 2,
        this.player.y + this.player.size / 2,
        'collect'
      );
      
      // 中等屏幕震动
      GameGlobal.feedbackManager.triggerScreenShake(4, 200);
      
      // 触发命中停顿
      GameGlobal.feedbackManager.triggerHitStop(80);
    }
    
    // 触发振动反馈
    if (GameGlobal.databus.settings.vibration && typeof wx !== 'undefined') {
      wx.vibrateShort({ type: 'heavy' });
    }
  }

  // 更新玩家
  updatePlayer(deltaTime = 1/60) {
    // 如果倒计时还没结束，不更新玩家位置
    if (this.gameStartTime && Date.now() < this.gameStartTime) {
      return;
    }
    
    // 更新输入缓冲计时器
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime;
      // 尝试执行缓冲的跳跃
      this.tryJump();
    }
    
    // 更新土狼时间计时器
    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= deltaTime;
    }
    
    // 首先检查玩家是否站在平台上（在应用任何移动之前）
    if (!this.player.isJumping && this.player.currentPlatform) {
      const platform = this.player.currentPlatform;
      
      // 使用胶囊体碰撞检测：检查玩家底部圆形区域是否在平台上
      const playerCenterX = this.player.x + this.player.size / 2;
      const playerBottomY = this.player.y + this.player.size;
      const playerRadius = this.player.size / 2; // 胶囊体底部圆形半径
      
      // 检查玩家底部圆形是否与平台相交
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.size;
      const platformTop = platform.y;
      
      // 水平方向：玩家中心到平台的最近点
      const closestX = Math.max(platformLeft, Math.min(playerCenterX, platformRight));
      const distanceX = Math.abs(playerCenterX - closestX);
      
      // 垂直方向：玩家底部到平台顶部的距离
      const distanceY = playerBottomY - platformTop;
      
      // 胶囊体碰撞检测：圆形与平台顶部的碰撞
      const isOnPlatform = distanceX < playerRadius && 
                          distanceY >= -2 && distanceY <= 5;
      
      if (isOnPlatform) {
        // 玩家仍然站在平台上，保持位置
        this.player.y = platform.y - this.player.size;
        // 重置土狼时间
        this.coyoteTimer = this.coyoteTime;
        return; // 不需要继续处理
      } else {
        // 玩家已经离开平台，开始掉落
        this.player.isJumping = true;
        this.player.velocityY = 0;
        this.player.velocityX = 0;
        this.player.currentPlatform = null;
        // 土狼时间已经启动，允许短暂时间内仍可跳跃
      }
    }
    
    // 应用重力和移动（跳跃或掉落状态）
    if (this.player.isJumping) {
      // 优化重力参数：降低重力加速度，让跳跃手感更好
      this.player.velocityY += 0.4; // 降低重力（从0.5降到0.4）
      this.player.y += this.player.velocityY;
      this.player.x += this.player.velocityX;
    }
    
    // 检测与平台的碰撞（只在跳跃/掉落时）
    if (this.player.isJumping && this.player.velocityY > 0) {
      // 碰撞检测优化：子步进检测（防止高速穿透）
      const subSteps = Math.abs(this.player.velocityY) > 3 ? 3 : 1;
      
      for (let step = 0; step < subSteps; step++) {
        const stepY = this.player.y + (this.player.velocityY / subSteps) * step;
        const stepBottomY = stepY + this.player.size;
        
        for (const platform of this.platforms) {
          // 使用胶囊体碰撞检测
          const playerCenterX = this.player.x + this.player.size / 2;
          const playerRadius = this.player.size / 2;
          
          let platformLeft, platformRight, platformTop;
          
          // 山形平台的特殊碰撞检测
          if (platform.type === 'mountain') {
            // 山顶平台区域（只有山顶部分可以站立）
            platformLeft = platform.x + platform.size * 0.3;
            platformRight = platform.x + platform.size * 0.7;
            platformTop = platform.y;
          } else {
            // 普通平台
            platformLeft = platform.x;
            platformRight = platform.x + platform.size;
            platformTop = platform.y;
          }
          
          // 水平方向：玩家中心到平台的最近点
          const closestX = Math.max(platformLeft, Math.min(playerCenterX, platformRight));
          const distanceX = Math.abs(playerCenterX - closestX);
          
          // 垂直方向：玩家底部到平台顶部的距离
          const distanceY = stepBottomY - platformTop;
          
          // 使用连续碰撞检测：检查上一帧到当前帧的路径
          const prevPlayerBottomY = stepBottomY - this.player.velocityY;
          
          // 胶囊体碰撞检测：圆形与平台顶部的碰撞
          if (distanceX < playerRadius && 
              prevPlayerBottomY <= platformTop && 
              stepBottomY >= platformTop) {
            
            // 检查是否是危险平台
            if (platform.isDanger) {
              // 玩家碰到危险平台，游戏结束
              this.gameOver();
              return;
            }
            
            // 检查是否是消失平台
            if (platform.type === 'disappearing' && !platform.isDisappearing) {
              // 开始消失计时
              platform.isDisappearing = true;
              platform.disappearTimer = platform.disappearDelay;
            }
            
            // 玩家落在平台上
            this.player.isJumping = false;
            this.player.velocityY = 0;
            this.player.velocityX = 0;
            this.player.y = platformTop - this.player.size;
            
            // 触发落地反馈
            this.triggerLandFeedback();
            
            // 检查是否是新的平台
            if (this.player.currentPlatform !== platform) {
              this.player.currentPlatform = platform;
              
              // 山形起始平台不加分，不收集拼豆
              if (platform.type !== 'mountain') {
                // 收集拼豆
                this.player.state = 'collect';
                this.collectBean(platform.color);
                
                // 处理特殊平台类型
                this.handlePlatformType(platform.type);
                
                // 增加分数（检查双倍分数效果）
                let scoreGain = 1;
                if (this.doubleScoreActive && Date.now() < this.doubleScoreEndTime) {
                  scoreGain = 2; // 双倍分数
                } else if (this.doubleScoreActive && Date.now() >= this.doubleScoreEndTime) {
                  // 双倍分数时间结束
                  this.doubleScoreActive = false;
                }
                this.score += scoreGain;
                
                // 增加平台速度
                this.platformSpeed = 1 + Math.min(this.score * 0.005, 3);
                
                // 触发收集反馈
                this.triggerCollectFeedback();
              }
              
              // 短暂延迟后恢复站立状态
              setTimeout(() => {
                this.player.state = 'stand';
              }, 300);
            } else {
              // 同一个平台
              this.player.state = 'stand';
            }
            
            return; // 找到平台后立即返回
          }
        }
      }
    }
    
    // 更新消失平台
    this.updateDisappearingPlatforms(deltaTime);
    
    // 检测是否掉落
    if (this.player.y > window.SCREEN_HEIGHT) {
      this.gameOver();
    }
  }

  // 收集拼豆
  collectBean(color) {
    // 先添加拼豆（允许临时超过最大数量）
    this.collectedBeans.push(color);
    
    // 立即检查并消除
    this.checkCollection();
    
    // 如果消除后仍然超过最大数量，移除最早添加的拼豆
    while (this.collectedBeans.length > this.maxCollected) {
      this.collectedBeans.shift(); // 移除最早添加的
    }
  }

  // 检查并消除收集栏
  checkCollection() {
    // 检查收集栏中是否有3个相同颜色的拼豆
    const colorCount = {};
    
    // 统计每种颜色的数量
    for (const color of this.collectedBeans) {
      colorCount[color] = (colorCount[color] || 0) + 1;
    }
    
    // 检查是否有任何颜色达到3个
    for (const [color, count] of Object.entries(colorCount)) {
      if (count >= 3) {
        // 消除3个相同颜色的拼豆（只移除3个，不是全部）
        let removed = 0;
        const newCollected = this.collectedBeans.filter(c => {
          if (c === color && removed < 3) {
            removed++;
            return false; // 移除
          }
          return true; // 保留
        });
        
        this.collectedBeans = newCollected;
        
        // 增加分数（检查双倍分数）
        if (this.doubleScoreActive && Date.now() < this.doubleScoreEndTime) {
          this.score += 20;
        } else {
          this.score += 10;
        }
        
        // 获得拼豆碎片
        this.beanPieces++;
        
        // 消除成功，奖励一个道具
        this.giveRandomItem();
        
        // 检查是否解锁拼豆图鉴
        this.checkBeanCollection();
        
        // 检查是否还有其他可以消除的
        this.checkCollection();
        
        return true;
      }
    }
    
    // 当收集栏中有3个不同颜色时，也赠送一个道具
    const uniqueColors = Object.keys(colorCount);
    if (uniqueColors.length >= 3 && this.collectedBeans.length >= 3) {
      this.giveRandomItem();
      console.log('收集3个不同颜色，获得道具！');
    }
    
    return false;
  }
  
  // 随机赠送一个道具
  giveRandomItem() {
    const itemTypes = ['shield', 'rainbow', 'doubleScore', 'extraBean'];
    const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    this.items[randomItem]++;
  }

  // 检查拼豆图鉴解锁
  checkBeanCollection() {
    // 简单实现，实际可以根据拼豆碎片数量解锁不同图鉴
    if (this.beanPieces >= 8) {
      this.beanCollection.animals.unlocked = true;
      this.beanCollection.animals.pieces = Math.min(this.beanPieces, this.beanCollection.animals.total);
    }
    
    if (this.beanPieces >= 12) {
      this.beanCollection.desserts.unlocked = true;
      this.beanCollection.desserts.pieces = Math.min(this.beanPieces, this.beanCollection.desserts.total);
    }
    
    if (this.beanPieces >= 16) {
      this.beanCollection.stars.unlocked = true;
      this.beanCollection.stars.pieces = Math.min(this.beanPieces, this.beanCollection.stars.total);
    }
    
    if (this.beanPieces >= 20) {
      this.beanCollection.hearts.unlocked = true;
      this.beanCollection.hearts.pieces = Math.min(this.beanPieces, this.beanCollection.hearts.total);
    }
    
    if (this.beanPieces >= 25) {
      this.beanCollection.cartoons.unlocked = true;
      this.beanCollection.cartoons.pieces = Math.min(this.beanPieces, this.beanCollection.cartoons.total);
    }
  }

  // 处理特殊平台类型
  handlePlatformType(type) {
    switch (type) {
      case 'bouncy':
        // 弹跳平台：增加跳跃高度
        this.player.velocityY *= 1.5; // 跳跃高度增加50%
        break;
        
      case 'disappearing':
        // 消失平台：已在碰撞检测中处理
        break;
        
      case 'danger':
        // 危险平台：已在碰撞检测中处理
        break;
        
      default:
        // 普通平台：无特殊效果
        break;
    }
  }
  
  // 更新消失平台
  updateDisappearingPlatforms(deltaTime) {
    this.platforms = this.platforms.filter(platform => {
      if (platform.isDisappearing) {
        platform.disappearTimer -= deltaTime;
        
        // 消失时间到，移除平台
        if (platform.disappearTimer <= 0) {
          return false; // 移除平台
        }
      }
      
      return true; // 保留平台
    });
  }

  // 使用道具
  useItem(type) {
    console.log('useItem called with type:', type, 'current count:', this.items[type]);
    
    if (this.items[type] > 0) {
      this.items[type]--;
      
      switch (type) {
        case 'shield':
          // 护盾：激活护盾保护，失误一次不掉落
          this.hasShield = true;
          console.log('护盾已激活！');
          break;
          
        case 'rainbow':
          // 彩虹：随机当作任意颜色，直接凑3消
          this.useRainbow();
          break;
          
        case 'doubleScore':
          // 双倍分数：激活10秒双倍分数
          this.doubleScoreActive = true;
          this.doubleScoreEndTime = Date.now() + 10000; // 10秒
          console.log('双倍分数已激活！持续10秒');
          break;
          
        case 'extraBean':
          // 额外拼豆：直接获得3颗拼豆碎片
          this.beanPieces += 3;
          this.checkBeanCollection();
          console.log('获得3颗拼豆碎片！');
          break;
      }
      
      return true;
    }
    
    console.log('道具数量不足，无法使用');
    return false;
  }
  
  // 使用彩虹道具
  useRainbow() {
    if (this.collectedBeans.length > 0) {
      // 找到数量最多的颜色
      const colorCount = {};
      for (const color of this.collectedBeans) {
        colorCount[color] = (colorCount[color] || 0) + 1;
      }
      
      // 找到数量最多的颜色
      let maxColor = this.collectedBeans[0];
      let maxCount = 0;
      for (const [color, count] of Object.entries(colorCount)) {
        if (count > maxCount) {
          maxCount = count;
          maxColor = color;
        }
      }
      
      // 添加彩虹作为该颜色，凑够3个
      const needCount = 3 - maxCount;
      for (let i = 0; i < needCount; i++) {
        this.collectedBeans.push(maxColor);
      }
      
      // 触发消除
      this.checkCollection();
      console.log(`彩虹道具：添加${needCount}个${maxColor}颜色拼豆`);
    } else {
      // 如果收集栏为空，随机添加3个相同颜色
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 3; i++) {
        this.collectedBeans.push(randomColor);
      }
      this.checkCollection();
      console.log(`彩虹道具：添加3个${randomColor}颜色拼豆`);
    }
  }
}

// 将DataBus类挂载到全局对象
if (typeof window !== 'undefined') {
  window.DataBus = DataBus;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.DataBus = DataBus;
}
