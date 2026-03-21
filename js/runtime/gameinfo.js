// 确保TinyEmitter类在全局作用域中可用
if (typeof TinyEmitter === 'undefined') {
  console.error('TinyEmitter class not found');
}

// 创建Emitter别名，兼容现有代码
const Emitter = TinyEmitter;

// 创建图片的通用函数
function createImage() {
  if (window.isWechatGame) {
    return wx.createImage();
  } else if (typeof window !== 'undefined') {
    return new Image();
  }
  return null;
}

const atlas = createImage();
atlas.src = 'images/Common.png';

// 加载背景图片
const backgroundImage = createImage();
backgroundImage.src = 'images/bg.jpg';

// 加载角色精灵图
const playerSpriteSheet = createImage();
playerSpriteSheet.src = 'images/image_720350330364146.png';

// 定义动画帧的位置和大小
// 根据实际图片尺寸（864x1152），3x3网格划分精灵帧
const playerFrames = {
  stand: { x: 0, y: 0, width: 288, height: 384 },
  jump: { x: 288, y: 384, width: 288, height: 384 },
  collect: { x: 288, y: 768, width: 288, height: 384 },
  fail: { x: 576, y: 768, width: 288, height: 384 }
};

// 精灵图缩放比例，用于调整精灵大小
const SPRITE_SCALE = 0.25;

class GameInfo extends Emitter {
  constructor() {
    super();
    
    // 确保事件系统已初始化
    if (!this.e) {
      this.e = {};
    }

    // 引用全局变量（从render.js中定义）
    const SCREEN_WIDTH = window.SCREEN_WIDTH || 375;
    const SCREEN_HEIGHT = window.SCREEN_HEIGHT || 667;

    // 按钮区域
    this.btnAreas = {
      // 主界面按钮
      startGame: {
        startX: (window.SCREEN_WIDTH || 375) / 2 - 100,
        startY: (window.SCREEN_HEIGHT || 667) / 2 - 60,
        endX: (window.SCREEN_WIDTH || 375) / 2 + 100,
        endY: (window.SCREEN_HEIGHT || 667) / 2 - 10,
      },
      collection: {
        startX: (window.SCREEN_WIDTH || 375) / 2 - 100,
        startY: (window.SCREEN_HEIGHT || 667) / 2 + 20,
        endX: (window.SCREEN_WIDTH || 375) / 2 + 100,
        endY: (window.SCREEN_HEIGHT || 667) / 2 + 70,
      },
      leaderboard: {
        startX: (window.SCREEN_WIDTH || 375) / 2 - 100,
        startY: (window.SCREEN_HEIGHT || 667) / 2 + 100,
        endX: (window.SCREEN_WIDTH || 375) / 2 + 100,
        endY: (window.SCREEN_HEIGHT || 667) / 2 + 150,
      },
      settings: {
        startX: 20,
        startY: 20,
        endX: 80,
        endY: 60,
      },
      // 游戏结束按钮
      restart: {
        startX: (window.SCREEN_WIDTH || 375) / 2 - 80,
        startY: (window.SCREEN_HEIGHT || 667) / 2 + 20,
        endX: (window.SCREEN_WIDTH || 375) / 2 + 80,
        endY: (window.SCREEN_HEIGHT || 667) / 2 + 60,
      },
      share: {
        startX: (window.SCREEN_WIDTH || 375) / 2 - 80,
        startY: (window.SCREEN_HEIGHT || 667) / 2 + 80,
        endX: (window.SCREEN_WIDTH || 375) / 2 + 80,
        endY: (window.SCREEN_HEIGHT || 667) / 2 + 120,
      },
      watchAd: {
        startX: (window.SCREEN_WIDTH || 375) / 2 - 80,
        startY: (window.SCREEN_HEIGHT || 667) / 2 + 140,
        endX: (window.SCREEN_WIDTH || 375) / 2 + 80,
        endY: (window.SCREEN_HEIGHT || 667) / 2 + 180,
      },
      backToMenu: {
        startX: 20,
        startY: 20,
        endX: 100,
        endY: 60,
      },
      // 道具按钮
      shield: {
        startX: 40,
        startY: SCREEN_HEIGHT - 160,
        endX: 80,
        endY: SCREEN_HEIGHT - 120,
      },
      rainbow: {
        startX: 100,
        startY: SCREEN_HEIGHT - 160,
        endX: 140,
        endY: SCREEN_HEIGHT - 120,
      },
      doubleScore: {
        startX: 160,
        startY: SCREEN_HEIGHT - 160,
        endX: 200,
        endY: SCREEN_HEIGHT - 120,
      },
      extraBean: {
        startX: 220,
        startY: SCREEN_HEIGHT - 160,
        endX: 260,
        endY: SCREEN_HEIGHT - 120,
      },
      // 暂停按钮
      pause: {
        startX: SCREEN_WIDTH - 60,
        startY: 40,
        endX: SCREEN_WIDTH - 20,
        endY: 80,
      },
    };

    // 触摸状态
    this.isTouching = false;
    this.touchStartTime = 0;

    // 绑定触摸事件
    if (window.isWechatGame) {
      wx.onTouchStart(this.touchStartHandler.bind(this));
      wx.onTouchEnd(this.touchEndHandler.bind(this));
      wx.onTouchMove(this.touchMoveHandler.bind(this));
    } else if (typeof window !== 'undefined') {
      // 浏览器环境 - 延迟绑定事件，确保canvas已初始化
      const bindEvents = () => {
        const canvasElement = window.canvas || document.getElementById('gameCanvas');
        if (canvasElement) {
          canvasElement.addEventListener('touchstart', this.touchStartHandler.bind(this));
          canvasElement.addEventListener('touchend', this.touchEndHandler.bind(this));
          canvasElement.addEventListener('touchmove', this.touchMoveHandler.bind(this));
          // 同时支持鼠标事件
          canvasElement.addEventListener('mousedown', this.mouseDownHandler.bind(this));
          canvasElement.addEventListener('mouseup', this.mouseUpHandler.bind(this));
          canvasElement.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
          console.log('Touch events bound successfully');
        } else {
          console.warn('Canvas not found, retrying in 100ms...');
          setTimeout(bindEvents, 100);
        }
      };
      
      // 立即尝试绑定，如果canvas不存在则延迟重试
      bindEvents();
    }
  }

  setFont(ctx, size = 20, color = '#333333') {
    ctx.fillStyle = color;
    ctx.font = `${size}px Arial`;
  }

  render(ctx) {
    const gameState = GameGlobal.databus.gameState;

    switch (gameState) {
      case 'menu':
        this.renderMenu(ctx);
        break;
      case 'playing':
        this.renderPlaying(ctx);
        // 显示教程提示
        if (GameGlobal.databus.showTutorial) {
          this.renderTutorial(ctx);
        }
        break;
      case 'gameOver':
        this.renderGameOver(ctx);
        break;
      case 'collection':
        this.renderCollection(ctx);
        break;
      case 'settings':
        this.renderSettings(ctx);
        break;
    }
  }
  
  // 渲染设置界面
  renderSettings(ctx) {
    const databus = GameGlobal.databus;
    const settings = databus.settings;
    
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // 绘制标题
    this.setFont(ctx, 36, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('设置', SCREEN_WIDTH / 2, 80);
    
    // 绘制设置选项
    const options = [
      { key: 'music', label: '背景音乐', value: settings.music },
      { key: 'sound', label: '音效', value: settings.sound },
      { key: 'vibration', label: '振动', value: settings.vibration },
      { key: 'showTutorial', label: '新手教程', value: settings.showTutorial },
      { key: 'difficulty', label: '难度', value: settings.difficulty },
      { key: 'quality', label: '画质', value: settings.quality }
    ];
    
    options.forEach((option, index) => {
      const y = 150 + index * 60;
      
      // 绘制选项标签
      this.setFont(ctx, 20, '#ffffff');
      ctx.textAlign = 'left';
      ctx.fillText(option.label, 50, y);
      
      // 绘制选项值
      this.setFont(ctx, 20, '#ffffff');
      ctx.textAlign = 'right';
      
      if (typeof option.value === 'boolean') {
        // 布尔值选项（开关）
        ctx.fillText(option.value ? '开' : '关', SCREEN_WIDTH - 50, y);
      } else {
        // 其他选项（难度、画质）
        ctx.fillText(option.value === 'easy' ? '简单' : 
                    option.value === 'normal' ? '普通' : 
                    option.value === 'hard' ? '困难' : 
                    option.value === 'high' ? '高' : 
                    option.value === 'medium' ? '中' : '低', SCREEN_WIDTH - 50, y);
      }
      
      // 绘制选项区域
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, y - 20, SCREEN_WIDTH - 60, 40);
    });
    
    // 绘制返回按钮
    this.drawButton(ctx, '返回', this.btnAreas.backToMenu);
  }
  
  // 渲染教程提示
  renderTutorial(ctx) {
    const databus = GameGlobal.databus;
    const tutorialStep = databus.tutorialStep;
    
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // 绘制教程文本
    this.setFont(ctx, 24, '#ffffff');
    ctx.textAlign = 'center';
    
    switch (tutorialStep) {
      case 0:
        // 第一步：介绍游戏
        ctx.fillText('欢迎来到拼豆跳跳消！', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 60);
        ctx.fillText('长按屏幕蓄力，松开跳跃', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        ctx.fillText('点击屏幕继续', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        break;
      case 1:
        // 第二步：介绍收集机制
        ctx.fillText('跳到平台上收集拼豆', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 60);
        ctx.fillText('收集3个相同颜色的拼豆可以消除', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        ctx.fillText('点击屏幕继续', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        break;
      case 2:
        // 第三步：介绍道具系统
        ctx.fillText('收集3个不同颜色的拼豆', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 60);
        ctx.fillText('可以随机获得一个道具', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        ctx.fillText('点击屏幕开始游戏', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        break;
    }
  }

  // 渲染主界面
  renderMenu(ctx) {
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 绘制标题
    this.setFont(ctx, 48, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('拼豆跳跳消', SCREEN_WIDTH / 2, 150);

    // 绘制游戏说明
    this.setFont(ctx, 16, '#ffffff');
    ctx.fillText('长按蓄力跳跃', SCREEN_WIDTH / 2, 200);
    ctx.fillText('收集相同颜色拼豆消除', SCREEN_WIDTH / 2, 230);
    ctx.fillText('解锁拼豆图鉴', SCREEN_WIDTH / 2, 260);

    // 绘制按钮
    this.drawButton(ctx, '开始游戏', this.btnAreas.startGame);
    this.drawButton(ctx, '我的图鉴', this.btnAreas.collection);
    this.drawButton(ctx, '排行榜', this.btnAreas.leaderboard);

    // 绘制设置按钮
    this.drawButton(ctx, '设置', this.btnAreas.settings);

    // 绘制底部广告占位
    this.drawBannerAd(ctx);

    ctx.textAlign = 'left';
  }

  // 渲染游戏中
  renderPlaying(ctx) {
    const databus = GameGlobal.databus;
    
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, (window.SCREEN_WIDTH || 375), (window.SCREEN_HEIGHT || 667));
    
    // 显示倒计时
    if (databus.gameStartTime && Date.now() < databus.gameStartTime) {
      const remainingTime = Math.ceil((databus.gameStartTime - Date.now()) / 1000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, (window.SCREEN_WIDTH || 375), (window.SCREEN_HEIGHT || 667));
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      this.setFont(ctx, 48, '#ffffff');
      ctx.fillText(remainingTime.toString(), (window.SCREEN_WIDTH || 375) / 2, (window.SCREEN_HEIGHT || 667) / 2);
      
      this.setFont(ctx, 20, '#ffffff');
      ctx.fillText('准备开始...', (window.SCREEN_WIDTH || 375) / 2, (window.SCREEN_HEIGHT || 667) / 2 + 40);
    }
    
    // 绘制顶部信息栏
    this.renderTopInfo(ctx);
    
    // 绘制平台
    this.renderPlatforms(ctx);
    
    // 绘制玩家
    this.renderPlayer(ctx);
    
    // 绘制蓄力条
    if (this.isTouching) {
      this.renderPowerBar(ctx);
    }
    
    // 绘制底部收集栏
    this.renderCollectedBeans(ctx);
    
    // 绘制道具栏
    this.renderItems(ctx);
    
    // 绘制暂停按钮
    this.drawButton(ctx, '暂停', this.btnAreas.pause);
  }

  // 渲染顶部信息栏
  renderTopInfo(ctx) {
    const databus = GameGlobal.databus;
    
    // 绘制分数
    this.setFont(ctx, 20, '#ffffff');
    ctx.fillText(`分数: ${databus.score}`, 50, 30);
    
    // 绘制最高分
    this.setFont(ctx, 16, '#ffffff');
    ctx.fillText(`最高分: ${databus.highScore}`, 50, 55);
    
    // 绘制拼豆数量
    this.setFont(ctx, 16, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText(`拼豆: ${databus.beanPieces}`, (window.SCREEN_WIDTH || 375) / 2, 40);
  }

  // 渲染平台
  renderPlatforms(ctx) {
    const databus = GameGlobal.databus;
    const platforms = databus.platforms;
    
    platforms.forEach(platform => {
      // 绘制平台
      ctx.fillStyle = platform.color;
      ctx.beginPath();
      ctx.rect(platform.x, platform.y, platform.size, 10);
      ctx.fill();
      
      // 绘制平台类型标记
      if (platform.type !== 'normal') {
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        this.setFont(ctx, 12);
        switch (platform.type) {
          case 'shield':
            ctx.fillText('🛡️', platform.x + platform.size / 2, platform.y - 5);
            break;
          case 'rainbow':
            ctx.fillText('🌈', platform.x + platform.size / 2, platform.y - 5);
            break;
          case 'doubleScore':
            ctx.fillText('2x', platform.x + platform.size / 2, platform.y - 5);
            break;
          case 'extraBean':
            ctx.fillText('🫘', platform.x + platform.size / 2, platform.y - 5);
            break;
        }
      }
    });
  }

  // 渲染玩家
  renderPlayer(ctx) {
    const databus = GameGlobal.databus;
    const player = databus.player;
    
    // 获取当前状态的精灵帧
    const currentFrame = playerFrames[player.state] || playerFrames.stand;
    
    // 直接设置精灵大小，不依赖player.size
    const scaledWidth = 60;
    const scaledHeight = 80;
    
    // 计算精灵的绘制位置，使其居中显示
    const drawX = player.x + (player.size - scaledWidth) / 2;
    const drawY = player.y + (player.size - scaledHeight) / 2;
    
    // 确保Canvas支持透明度
    ctx.globalCompositeOperation = 'source-over';
    
    // 绘制玩家精灵
    ctx.drawImage(
      playerSpriteSheet,
      currentFrame.x,
      currentFrame.y,
      currentFrame.width,
      currentFrame.height,
      drawX,
      drawY,
      scaledWidth,
      scaledHeight
    );
  }

  // 渲染蓄力条
  renderPowerBar(ctx) {
    const databus = GameGlobal.databus;
    const player = databus.player;
    
    const power = Math.min((Date.now() - this.touchStartTime) / 10, player.maxPower);
    
    // 绘制蓄力条背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(SCREEN_WIDTH / 2 - 100, 70, 200, 20);
    
    // 绘制蓄力条
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(SCREEN_WIDTH / 2 - 100, 70, (power / player.maxPower) * 200, 20);
    
    // 绘制蓄力值
    this.setFont(ctx, 14, '#333333');
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(power)}%`, SCREEN_WIDTH / 2, 85);
  }

  // 渲染收集的拼豆
  renderCollectedBeans(ctx) {
    const databus = GameGlobal.databus;
    const collected = databus.collectedBeans;
    const maxCollected = databus.maxCollected;
    
    // 绘制收集栏
    const barWidth = SCREEN_WIDTH - 40;
    const barHeight = 50;
    const barX = 20;
    const barY = SCREEN_HEIGHT - 100;
    
    // 绘制栏背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 绘制栏边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 绘制拼豆
    const beanSize = 35;
    const spacing = (barWidth - beanSize * maxCollected) / (maxCollected + 1);
    
    for (let i = 0; i < maxCollected; i++) {
      const x = barX + spacing + i * (beanSize + spacing);
      const y = barY + (barHeight - beanSize) / 2;
      
      if (i < collected.length) {
        // 绘制有颜色的拼豆
        ctx.fillStyle = collected[i];
        ctx.beginPath();
        ctx.arc(x + beanSize / 2, y + beanSize / 2, beanSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 绘制空位置
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + beanSize / 2, y + beanSize / 2, beanSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 渲染道具栏
  renderItems(ctx) {
    const databus = GameGlobal.databus;
    const items = databus.items;
    
    // 绘制道具按钮
    this.drawItemButton(ctx, '🛡️', items.shield, this.btnAreas.shield);
    this.drawItemButton(ctx, '🌈', items.rainbow, this.btnAreas.rainbow);
    this.drawItemButton(ctx, '2x', items.doubleScore, this.btnAreas.doubleScore);
    this.drawItemButton(ctx, '🫘', items.extraBean, this.btnAreas.extraBean);
  }

  // 绘制道具按钮
  drawItemButton(ctx, icon, count, area) {
    // 绘制按钮背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(area.startX, area.startY, area.endX - area.startX, area.endY - area.startY);
    
    // 绘制按钮边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(area.startX, area.startY, area.endX - area.startX, area.endY - area.startY);
    
    // 绘制道具图标
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, (area.startX + area.endX) / 2, (area.startY + area.endY) / 2);
    
    // 绘制道具数量
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(count, area.endX - 5, area.endY - 5);
  }

  // 渲染游戏结束
  renderGameOver(ctx) {
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 绘制标题
    this.setFont(ctx, 36, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);

    // 绘制分数
    this.setFont(ctx, 24, '#ffffff');
    ctx.fillText(`最终得分: ${GameGlobal.databus.score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
    ctx.fillText(`拼豆数量: ${GameGlobal.databus.beanPieces}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);
    ctx.fillText(`历史最高分: ${GameGlobal.databus.highScore}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 10);

    // 绘制按钮
    this.drawButton(ctx, '再玩一次', this.btnAreas.restart);
    this.drawButton(ctx, '分享战绩', this.btnAreas.share);
    this.drawButton(ctx, '看广告复活', this.btnAreas.watchAd);

    // 绘制返回按钮
    this.drawButton(ctx, '返回', this.btnAreas.backToMenu);

    ctx.textAlign = 'left';
  }

  // 渲染图鉴
  renderCollection(ctx) {
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 绘制标题
    this.setFont(ctx, 36, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('拼豆图鉴', SCREEN_WIDTH / 2, 80);

    // 绘制图鉴项目
    const databus = GameGlobal.databus;
    const collections = databus.beanCollection;
    
    const items = [
      { key: 'animals', name: '小动物', icon: '🐶' },
      { key: 'desserts', name: '甜品', icon: '🍰' },
      { key: 'stars', name: '星星', icon: '⭐' },
      { key: 'hearts', name: '爱心', icon: '❤️' },
      { key: 'cartoons', name: '卡通', icon: '🎨' }
    ];
    
    items.forEach((item, index) => {
      const collection = collections[item.key];
      const x = 50;
      const y = 150 + index * 80;
      
      // 绘制图鉴项
      ctx.fillStyle = collection.unlocked ? 'rgba(255, 255, 255, 0.8)' : 'rgba(200, 200, 200, 0.5)';
      ctx.fillRect(x, y, SCREEN_WIDTH - 100, 60);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, SCREEN_WIDTH - 100, 60);
      
      // 绘制图标和名称
      this.setFont(ctx, 24, '#333333');
      ctx.textAlign = 'left';
      ctx.fillText(`${item.icon} ${item.name}`, x + 20, y + 40);
      
      // 绘制进度
      this.setFont(ctx, 16, '#333333');
      ctx.textAlign = 'right';
      ctx.fillText(`${collection.pieces}/${collection.total}`, SCREEN_WIDTH - 70, y + 40);
    });

    // 绘制返回按钮
    this.drawButton(ctx, '返回', this.btnAreas.backToMenu);

    // 绘制底部广告占位
    this.drawBannerAd(ctx);

    ctx.textAlign = 'left';
  }

  // 绘制按钮
  drawButton(ctx, text, area) {
    // 绘制按钮背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(area.startX, area.startY, area.endX - area.startX, area.endY - area.startY);
    
    // 绘制按钮边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(area.startX, area.startY, area.endX - area.startX, area.endY - area.startY);
    
    // 绘制按钮文本
    this.setFont(ctx, 20, '#333333');
    ctx.textAlign = 'center';
    ctx.fillText(text, (area.startX + area.endX) / 2, (area.startY + area.endY) / 2 + 5);
  }

  // 绘制底部广告占位
  drawBannerAd(ctx) {
    const adHeight = 60;
    const adY = SCREEN_HEIGHT - adHeight;
    
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, adY, SCREEN_WIDTH, adHeight);
    
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, adY, SCREEN_WIDTH, adHeight);
    
    this.setFont(ctx, 14, '#666666');
    ctx.textAlign = 'center';
    ctx.fillText('广告位', SCREEN_WIDTH / 2, adY + adHeight / 2 + 5);
  }

  // 处理触摸开始
  touchStartHandler(event) {
    const { clientX, clientY } = event.touches[0];
    const gameState = GameGlobal.databus.gameState;

    // 处理教程触摸
    if (GameGlobal.databus.showTutorial && gameState === 'playing') {
      this.handleTutorialTouch();
      return;
    }

    switch (gameState) {
      case 'menu':
        this.handleMenuTouch(clientX, clientY);
        break;
      case 'playing':
        this.handlePlayingTouchStart(clientX, clientY);
        break;
      case 'gameOver':
        this.handleGameOverTouch(clientX, clientY);
        break;
      case 'collection':
        this.handleCollectionTouch(clientX, clientY);
        break;
      case 'settings':
        this.handleSettingsTouch(clientX, clientY);
        break;
    }
  }
  
  // 处理设置界面触摸
  handleSettingsTouch(x, y) {
    const databus = GameGlobal.databus;
    const settings = databus.settings;
    
    // 检查是否点击了返回按钮
    if (this.isInArea(x, y, this.btnAreas.backToMenu)) {
      databus.gameState = 'menu';
      return;
    }
    
    // 检查是否点击了设置选项
    const options = [
      { key: 'music', y: 150 },
      { key: 'sound', y: 210 },
      { key: 'vibration', y: 270 },
      { key: 'showTutorial', y: 330 },
      { key: 'difficulty', y: 390 },
      { key: 'quality', y: 450 }
    ];
    
    options.forEach(option => {
      if (y >= option.y - 20 && y <= option.y + 20 && x >= 30 && x <= SCREEN_WIDTH - 30) {
        if (typeof settings[option.key] === 'boolean') {
          // 切换布尔值选项
          settings[option.key] = !settings[option.key];
        } else {
          // 切换其他选项
          if (option.key === 'difficulty') {
            // 循环切换难度
            settings.difficulty = settings.difficulty === 'easy' ? 'normal' : 
                                 settings.difficulty === 'normal' ? 'hard' : 'easy';
          } else if (option.key === 'quality') {
            // 循环切换画质
            settings.quality = settings.quality === 'high' ? 'medium' : 
                               settings.quality === 'medium' ? 'low' : 'high';
          }
        }
      }
    });
  }
  
  // 处理教程触摸
  handleTutorialTouch() {
    const databus = GameGlobal.databus;
    databus.tutorialStep++;
    
    if (databus.tutorialStep >= 3) {
      // 教程结束
      databus.showTutorial = false;
      databus.isFirstPlay = false;
    }
  }

  // 处理触摸移动
  touchMoveHandler(event) {
    // 可以添加移动相关的逻辑
  }
  
  // 处理鼠标按下
  mouseDownHandler(event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.touchStartHandler({ touches: [{ clientX: x, clientY: y }] });
  }
  
  // 处理鼠标抬起
  mouseUpHandler(event) {
    this.touchEndHandler(event);
  }
  
  // 处理鼠标移动
  mouseMoveHandler(event) {
    this.touchMoveHandler(event);
  }

  // 处理触摸结束
  touchEndHandler(event) {
    const gameState = GameGlobal.databus.gameState;

    if (gameState === 'playing' && this.isTouching) {
      this.handlePlayingTouchEnd();
    }
  }

  // 处理游戏中触摸开始
  handlePlayingTouchStart(x, y) {
    const databus = GameGlobal.databus;
    
    // 检查是否点击了道具
    if (this.checkItemTouch(x, y)) {
      return;
    }
    
    // 检查是否点击了暂停按钮
    if (this.isInArea(x, y, this.btnAreas.pause)) {
      // 暂停游戏逻辑
      return;
    }
    
    // 开始蓄力
    this.isTouching = true;
    this.touchStartTime = Date.now();
  }

  // 处理游戏中触摸结束
  handlePlayingTouchEnd() {
    const databus = GameGlobal.databus;
    
    if (this.isTouching) {
      // 计算蓄力值
      const power = Math.min((Date.now() - this.touchStartTime) / 10, databus.player.maxPower);
      
      // 执行跳跃
      databus.jump(power);
      
      // 重置触摸状态
      this.isTouching = false;
    }
  }

  // 检查是否点击了道具
  checkItemTouch(x, y) {
    const databus = GameGlobal.databus;
    
    if (this.isInArea(x, y, this.btnAreas.shield)) {
      databus.useItem('shield');
      return true;
    } else if (this.isInArea(x, y, this.btnAreas.rainbow)) {
      databus.useItem('rainbow');
      return true;
    } else if (this.isInArea(x, y, this.btnAreas.doubleScore)) {
      databus.useItem('doubleScore');
      return true;
    } else if (this.isInArea(x, y, this.btnAreas.extraBean)) {
      databus.useItem('extraBean');
      return true;
    }
    
    return false;
  }

  // 处理主界面触摸
  handleMenuTouch(x, y) {
    if (this.isInArea(x, y, this.btnAreas.startGame)) {
      this.emit('startGame');
    } else if (this.isInArea(x, y, this.btnAreas.collection)) {
      this.emit('collection');
    } else if (this.isInArea(x, y, this.btnAreas.leaderboard)) {
      this.emit('leaderboard');
    } else if (this.isInArea(x, y, this.btnAreas.settings)) {
      this.emit('settings');
    }
  }

  // 处理游戏结束触摸
  handleGameOverTouch(x, y) {
    if (this.isInArea(x, y, this.btnAreas.restart)) {
      this.emit('restart');
    } else if (this.isInArea(x, y, this.btnAreas.share)) {
      this.emit('share');
    } else if (this.isInArea(x, y, this.btnAreas.watchAd)) {
      this.emit('watchAd');
    } else if (this.isInArea(x, y, this.btnAreas.backToMenu)) {
      this.emit('backToMenu');
    }
  }

  // 处理图鉴触摸
  handleCollectionTouch(x, y) {
    if (this.isInArea(x, y, this.btnAreas.backToMenu)) {
      this.emit('backToMenu');
    }
  }

  // 检查点是否在区域内
  isInArea(x, y, area) {
    return x >= area.startX && x <= area.endX && y >= area.startY && y <= area.endY;
  }
}

// 将GameInfo类挂载到全局对象
if (typeof window !== 'undefined') {
  window.GameInfo = GameInfo;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.GameInfo = GameInfo;
}