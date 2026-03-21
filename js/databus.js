// 假设Pool类在全局作用域中可用

let instance;

/**
 * 全局状态管理器
 * 负责管理游戏的状态，包括跳跃、收集、拼豆和游戏状态等
 */
class DataBus {
  // 游戏状态
  gameState = 'menu'; // 游戏状态：menu, playing, gameOver, success, collection, tutorial
  
  // 游戏数据
  frame = 0; // 当前帧数
  score = 0; // 当前分数
  highScore = 0; // 最高分
  time = 0; // 游戏时间
  isGameStarted = false; // 游戏是否开始移动
  
  // 教程相关
  isFirstPlay = true; // 是否首次游戏
  tutorialStep = 0; // 教程步骤
  showTutorial = true; // 是否显示教程
  
  // 设置相关
  settings = {
    sound: true, // 声音开关
    music: true, // 背景音乐开关
    vibration: true, // 振动开关
    showTutorial: true, // 教程开关
    difficulty: 'normal', // 难度：easy, normal, hard
    quality: 'high' // 画质：high, medium, low
  };
  
  // 跳跃相关
  player = {
    x: 0, // 玩家x坐标
    y: 0, // 玩家y坐标
    size: 30, // 玩家大小
    velocityY: 0, // 垂直速度
    velocityX: 0, // 水平速度
    isJumping: false, // 是否正在跳跃
    power: 0, // 蓄力值
    maxPower: 100, // 最大蓄力值
    state: 'stand', // 玩家状态：stand, jump, collect, fail
  };
  
  // 平台相关
  platforms = []; // 平台数组
  platformSpeed = 2; // 平台移动速度
  basePlatformGap = 80; // 基础平台间距
  basePlatformSize = 60; // 基础平台大小
  
  // 收集相关
  collectedBeans = []; // 收集的拼豆
  maxCollected = 6; // 最大收集数量
  
  // 拼豆系统
  beanPieces = 0; // 拼豆碎片数量
  beanCollection = {
    animals: { unlocked: false, pieces: 0, total: 8 },
    desserts: { unlocked: false, pieces: 0, total: 12 },
    stars: { unlocked: false, pieces: 0, total: 16 },
    hearts: { unlocked: false, pieces: 0, total: 12 },
    cartoons: { unlocked: false, pieces: 0, total: 10 }
  };
  
  // 道具系统
  items = {
    shield: 0, // 护盾数量
    rainbow: 0, // 彩虹数量
    doubleScore: 0, // 双倍分数数量
    extraBean: 0 // 额外拼豆数量
  };
  
  // 其他
  animations = []; // 存储动画
  pool = new Pool(); // 初始化对象池

  constructor() {
    // 确保单例模式
    if (instance) return instance;

    instance = this;
  }

  // 重置游戏状态
  reset() {
    this.frame = 0;
    this.score = 0;
    this.time = 0;
    this.isGameStarted = false;
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
    };
    this.platforms = [];
    this.platformSpeed = 2;
    this.basePlatformGap = 80;
    this.basePlatformSize = 60;
    this.collectedBeans = [];
    this.beanPieces = 0;
    this.items = {
      shield: 0,
      rainbow: 0,
      doubleScore: 0,
      extraBean: 0
    };
    this.animations = [];
    this.gameState = 'menu';
    // 重置教程状态
    if (!this.isFirstPlay) {
      this.showTutorial = this.settings.showTutorial;
    }
  }

  // 游戏结束
  gameOver() {
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
  }

  // 初始化平台
  initPlatforms() {
    this.platforms = [];
    const startY = window.SCREEN_HEIGHT - 100;
    
    for (let i = 0; i < 8; i++) {
      const platform = {
        x: i * (this.basePlatformSize + this.basePlatformGap),
        y: startY - Math.random() * 50,
        size: this.basePlatformSize,
        color: this.getRandomColor(),
        type: this.getRandomPlatformType(),
        isMoving: Math.random() > 0.7,
        moveDirection: Math.random() > 0.5 ? 1 : -1
      };
      this.platforms.push(platform);
    }
  }

  // 初始化玩家
  initPlayer() {
    const firstPlatform = this.platforms[0];
    this.player.x = firstPlatform.x + firstPlatform.size / 2 - this.player.size / 2;
    this.player.y = firstPlatform.y - this.player.size;
  }

  // 获取随机颜色
  getRandomColor() {
    const colors = ['red', 'yellow', 'blue', 'green', 'purple'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 获取随机平台类型
  getRandomPlatformType() {
    // 随分数增加，增加特殊平台的出现频率
    const specialChance = 0.1 + Math.min(this.score * 0.0005, 0.5);
    const normalChance = 1 - specialChance;
    
    const types = ['normal', 'shield', 'rainbow', 'doubleScore', 'extraBean'];
    const weights = [normalChance, specialChance * 0.25, specialChance * 0.25, specialChance * 0.25, specialChance * 0.25];
    
    let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return types[i];
      }
    }
    
    return 'normal';
  }

  // 生成新平台
  generatePlatform() {
    const lastPlatform = this.platforms[this.platforms.length - 1];
    
    // 动态调整平台间距，随分数增加而增大
    const platformGap = this.basePlatformGap + Math.min(this.score * 0.05, 40);
    
    // 动态调整平台大小，随分数增加而减小
    const platformSize = Math.max(this.basePlatformSize * (0.9 - Math.min(this.score * 0.001, 0.4)), 30);
    
    const platform = {
      x: lastPlatform.x + platformSize + platformGap + Math.random() * 10,
      y: lastPlatform.y + (Math.random() - 0.5) * 80,
      size: platformSize,
      color: this.getRandomColor(),
      type: this.getRandomPlatformType(),
      isMoving: Math.random() > 0.7,
      moveDirection: Math.random() > 0.5 ? 1 : -1
    };
    
    // 确保平台在屏幕范围内
    platform.y = Math.max(50, Math.min(window.SCREEN_HEIGHT - 100, platform.y));
    
    this.platforms.push(platform);
  }

  // 更新平台
  updatePlatforms() {
    // 移除屏幕外的平台
    this.platforms = this.platforms.filter(platform => platform.x + platform.size > 0);
    
    // 只有游戏开始后才移动平台
    if (this.isGameStarted) {
      // 移动平台
      this.platforms.forEach(platform => {
        // 保存平台的旧位置
        const oldX = platform.x;
        
        // 移动平台
        platform.x -= this.platformSpeed;
        
        // 移动平台的额外移动
        if (platform.isMoving) {
          platform.y += platform.moveDirection * 0.5;
          if (platform.y < 50 || platform.y > window.SCREEN_HEIGHT - 100) {
            platform.moveDirection *= -1;
          }
        }
        
        // 检查玩家是否站在这个平台上
        if (!this.player.isJumping &&
            this.player.x < oldX + platform.size &&
            this.player.x + this.player.size > oldX &&
            this.player.y + this.player.size >= platform.y &&
            this.player.y + this.player.size <= platform.y + 10) {
          // 玩家站在平台上，随平台一起移动
          this.player.x -= this.platformSpeed;
        }
      });
      
      // 检查玩家是否站在任何平台上
      let isOnPlatform = false;
      for (const platform of this.platforms) {
        if (!this.player.isJumping &&
            this.player.x < platform.x + platform.size &&
            this.player.x + this.player.size > platform.x &&
            this.player.y + this.player.size >= platform.y &&
            this.player.y + this.player.size <= platform.y + 10) {
          isOnPlatform = true;
          break;
        }
      }
      
      // 如果玩家不在任何平台上，开始掉落
      if (!this.player.isJumping && !isOnPlatform) {
        this.player.isJumping = true;
        this.player.velocityY = 0;
        this.player.velocityX = 0;
      }
      
      // 生成新平台
      const lastPlatform = this.platforms[this.platforms.length - 1];
      if (lastPlatform && lastPlatform.x < window.SCREEN_WIDTH - this.basePlatformGap) {
        this.generatePlatform();
      }
    }
  }

  // 处理跳跃
  jump(power) {
    if (!this.player.isJumping) {
      // 第一次跳跃时，开始游戏移动
      if (!this.isGameStarted) {
        this.isGameStarted = true;
      }
      
      this.player.isJumping = true;
      this.player.state = 'jump';
      // 调整跳跃强度与距离的关系，增加跳跃高度以解决平台过高的问题
      // 最大蓄力时可以跳约1.5个平台距离，并且能够到达较高的平台
      this.player.velocityY = -power * 0.15; // 垂直速度，控制跳跃高度
      this.player.velocityX = power * 0.04; // 水平速度，控制跳跃距离
    }
  }

  // 更新玩家
  updatePlayer() {
    let isOnPlatform = false;
    
    // 检测与平台的碰撞
    for (const platform of this.platforms) {
      if (this.player.x < platform.x + platform.size &&
          this.player.x + this.player.size > platform.x &&
          this.player.y + this.player.size >= platform.y &&
          this.player.y + this.player.size <= platform.y + 10) {
        isOnPlatform = true;
        
        if (this.player.isJumping && this.player.velocityY > 0) {
          //  landed on platform
          this.player.isJumping = false;
          this.player.velocityY = 0;
          this.player.velocityX = 0;
          this.player.y = platform.y - this.player.size;
          
          // 收集拼豆
          this.player.state = 'collect';
          this.collectBean(platform.color);
          
          // 处理特殊平台
          this.handlePlatformType(platform.type);
          
          // 增加分数
          this.score++;
          
          // 增加平台速度，随分数增加而平滑增加
          this.platformSpeed = 2 + Math.min(this.score * 0.01, 5);
          
          // 短暂延迟后恢复站立状态
          setTimeout(() => {
            this.player.state = 'stand';
          }, 300);
        }
        break;
      }
    }
    
    if (this.player.isJumping) {
      // 应用重力
      this.player.velocityY += 0.5;
      this.player.y += this.player.velocityY;
      this.player.x += this.player.velocityX;
    } else if (!isOnPlatform) {
      // 不在平台上，开始掉落
      this.player.isJumping = true;
      this.player.velocityY = 0;
      this.player.velocityX = 0;
    }
    
    // 检测是否掉落
    if (this.player.y > window.SCREEN_HEIGHT) {
      this.gameOver();
    }
  }

  // 收集拼豆
  collectBean(color) {
    if (this.collectedBeans.length < this.maxCollected) {
      this.collectedBeans.push(color);
      this.checkCollection();
    }
  }

  // 检查并消除收集栏
  checkCollection() {
    // 检查收集栏中是否有3个相同颜色的拼豆
    const colorCount = {};
    
    for (const color of this.collectedBeans) {
      colorCount[color] = (colorCount[color] || 0) + 1;
      if (colorCount[color] >= 3) {
        // 消除3个相同颜色的拼豆
        const newCollected = this.collectedBeans.filter(c => c !== color);
        this.collectedBeans = newCollected;
        
        // 增加分数
        this.score += 10;
        
        // 获得拼豆碎片
        this.beanPieces++;
        
        // 检查是否解锁拼豆图鉴
        this.checkBeanCollection();
        
        return true;
      }
    }
    
    // 当收集栏中满足任意三个颜色时，随机赠送一个道具
    if (this.collectedBeans.length === 3) {
      this.giveRandomItem();
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

  // 处理特殊平台
  handlePlatformType(type) {
    switch (type) {
      case 'shield':
        this.items.shield++;
        break;
      case 'rainbow':
        this.items.rainbow++;
        break;
      case 'doubleScore':
        this.items.doubleScore++;
        break;
      case 'extraBean':
        this.items.extraBean++;
        this.beanPieces++;
        this.checkBeanCollection();
        break;
    }
  }

  // 使用道具
  useItem(type) {
    if (this.items[type] > 0) {
      this.items[type]--;
      
      switch (type) {
        case 'shield':
          // 护盾：失误一次不掉落
          break;
        case 'rainbow':
          // 彩虹：随机当作任意颜色，直接凑3消
          this.useRainbow();
          break;
        case 'doubleScore':
          // 双倍分数：本局分数暂时翻倍
          break;
        case 'extraBean':
          // 额外拼豆：直接获得1颗拼豆
          this.beanPieces++;
          this.checkBeanCollection();
          break;
      }
      
      return true;
    }
    return false;
  }

  // 使用彩虹道具
  useRainbow() {
    if (this.collectedBeans.length > 0) {
      const targetColor = this.collectedBeans[0];
      // 填充相同颜色，凑够3个
      while (this.collectedBeans.length < 3) {
        this.collectedBeans.push(targetColor);
      }
      this.checkCollection();
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
