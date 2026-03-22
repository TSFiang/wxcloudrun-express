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
backgroundImage.src = 'images/image_695435480469248.png';

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

    // 按钮区域 - 使用固定的设计稿尺寸
    this.btnAreas = {
      // 主界面按钮
      startGame: {
        startX: 87.5, // (375 / 2 - 100)
        startY: 273.5, // (667 / 2 - 60)
        endX: 287.5, // (375 / 2 + 100)
        endY: 323.5, // (667 / 2 - 10)
      },
      collection: {
        startX: 87.5,
        startY: 353.5, // (667 / 2 + 20)
        endX: 287.5,
        endY: 403.5, // (667 / 2 + 70)
      },
      leaderboard: {
        startX: 87.5,
        startY: 433.5, // (667 / 2 + 100)
        endX: 287.5,
        endY: 483.5, // (667 / 2 + 150)
      },
      settings: {
        startX: 20,
        startY: 20,
        endX: 80,
        endY: 60,
      },
      // 游戏结束按钮
      restart: {
        startX: 107.5, // (375 / 2 - 80)
        startY: 353.5, // (667 / 2 + 20)
        endX: 267.5, // (375 / 2 + 80)
        endY: 393.5, // (667 / 2 + 60)
      },
      share: {
        startX: 107.5,
        startY: 413.5, // (667 / 2 + 80)
        endX: 267.5,
        endY: 453.5, // (667 / 2 + 120)
      },
      watchAd: {
        startX: 107.5,
        startY: 473.5, // (667 / 2 + 140)
        endX: 267.5,
        endY: 513.5, // (667 / 2 + 180)
      },
      backToMenu: {
        startX: 20,
        startY: 20,
        endX: 100,
        endY: 60,
      },
      // 道具按钮（增大点击区域）
      shield: {
        startX: 20,
        startY: 597, // (667 - 70)
        endX: 90,
        endY: 657, // (667 - 10)
      },
      rainbow: {
        startX: 100,
        startY: 597,
        endX: 170,
        endY: 657,
      },
      doubleScore: {
        startX: 180,
        startY: 597,
        endX: 250,
        endY: 657,
      },
      extraBean: {
        startX: 260,
        startY: 597,
        endX: 330,
        endY: 657,
      },
      // 暂停按钮
      pause: {
        startX: 315, // (375 - 60)
        startY: 40,
        endX: 355, // (375 - 20)
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
      case 'paused':
        this.renderPlaying(ctx);
        // 显示教程提示
        if (GameGlobal.databus.showTutorial) {
          this.renderTutorial(ctx);
        }
        // 显示暂停界面
        if (gameState === 'paused') {
          this.renderPaused(ctx);
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
    ctx.drawImage(backgroundImage, 0, 0, 375, 667);
    
    // 绘制标题（黑色字体）
    this.setFont(ctx, 36, '#000000');
    ctx.textAlign = 'center';
    ctx.fillText('设置', 375 / 2, 80);
    
    // 绘制设置选项
    const options = [
      { key: 'music', label: '背景音乐', value: settings.music },
      { key: 'sound', label: '音效', value: settings.sound },
      { key: 'vibration', label: '振动', value: settings.vibration },
      { key: 'showTutorial', label: '新手教程', value: settings.showTutorial },
      { key: 'difficulty', label: '难度', value: settings.difficulty },
      { key: 'quality', label: '画质', value: settings.quality },
      { key: 'fpsLimit', label: '帧率上限', value: settings.fpsLimit },
      { key: 'showDebug', label: '调试信息', value: settings.showDebug }
    ];
    
    options.forEach((option, index) => {
      const y = 130 + index * 55;
      
      // 绘制选项标签（黑色字体）
      this.setFont(ctx, 18, '#000000');
      ctx.textAlign = 'left';
      ctx.fillText(option.label, 50, y);
      
      // 绘制选项值（黑色字体）
      this.setFont(ctx, 18, '#000000');
      ctx.textAlign = 'right';
      
      if (typeof option.value === 'boolean') {
        ctx.fillText(option.value ? '开' : '关', 375 - 50, y);
      } else if (option.key === 'fpsLimit') {
        ctx.fillText(option.value + ' FPS', 375 - 50, y);
      } else {
        ctx.fillText(option.value === 'easy' ? '简单' : 
                    option.value === 'normal' ? '普通' : 
                    option.value === 'hard' ? '困难' : 
                    option.value === 'high' ? '高' : 
                    option.value === 'medium' ? '中' : '低', 375 - 50, y);
      }
      
      // 绘制选项区域（黑色边框）
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, y - 20, 375 - 60, 40);
    });
    
    // 绘制返回按钮
    this.drawButton(ctx, '返回', this.btnAreas.backToMenu);
  }
  
  // 渲染暂停界面
  renderPaused(ctx) {
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 375, 667);
    
    // 绘制暂停文字
    this.setFont(ctx, 36, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', 375 / 2, 667 / 2 - 50);
    
    // 绘制提示文字
    this.setFont(ctx, 20, '#ffffff');
    ctx.fillText('点击暂停按钮继续游戏', 375 / 2, 667 / 2 + 10);
    
    ctx.textAlign = 'left';
  }
  
  // 渲染教程提示
  renderTutorial(ctx) {
    const databus = GameGlobal.databus;
    const tutorialStep = databus.tutorialStep;
    
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 375, 667);
    
    // 绘制教程文本
    this.setFont(ctx, 24, '#ffffff');
    ctx.textAlign = 'center';
    
    switch (tutorialStep) {
      case 0:
        // 第一步：介绍游戏
        ctx.fillText('欢迎来到拼豆跳跳消！', 375 / 2, 667 / 2 - 60);
        ctx.fillText('长按屏幕蓄力，松开跳跃', 375 / 2, 667 / 2);
        ctx.fillText('点击屏幕继续', 375 / 2, 667 / 2 + 60);
        break;
      case 1:
        // 第二步：介绍收集机制
        ctx.fillText('跳到平台上收集拼豆', 375 / 2, 667 / 2 - 60);
        ctx.fillText('收集3个相同颜色的拼豆可以消除', 375 / 2, 667 / 2);
        ctx.fillText('点击屏幕继续', 375 / 2, 667 / 2 + 60);
        break;
      case 2:
        // 第三步：介绍道具系统
        ctx.fillText('收集3个不同颜色的拼豆', 375 / 2, 667 / 2 - 60);
        ctx.fillText('可以随机获得一个道具', 375 / 2, 667 / 2);
        ctx.fillText('点击屏幕开始游戏', 375 / 2, 667 / 2 + 60);
        break;
    }
  }

  // 渲染主界面
  renderMenu(ctx) {
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, 375, 667);

    // 绘制标题
    this.setFont(ctx, 48, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('拼豆跳跳消', 375 / 2, 150);

    // 绘制游戏说明
    this.setFont(ctx, 16, '#ffffff');
    ctx.fillText('长按蓄力跳跃', 375 / 2, 200);
    ctx.fillText('收集相同颜色拼豆消除', 375 / 2, 230);
    ctx.fillText('解锁拼豆图鉴', 375 / 2, 260);

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
    ctx.drawImage(backgroundImage, 0, 0, 375, 667);
    
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
    
    // 显示倒计时
    if (databus.gameStartTime && Date.now() < databus.gameStartTime) {
      const remainingTime = Math.ceil((databus.gameStartTime - Date.now()) / 1000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 375, 667);
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      this.setFont(ctx, 48, '#ffffff');
      ctx.fillText(remainingTime.toString(), 375 / 2, 667 / 2);
      
      this.setFont(ctx, 20, '#ffffff');
      ctx.fillText('准备开始...', 375 / 2, 667 / 2 + 40);
    }
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
    ctx.fillText(`拼豆: ${databus.beanPieces}`, 375 / 2, 40);
    
    // 绘制双倍分数倒计时
    if (databus.doubleScoreActive && Date.now() < databus.doubleScoreEndTime) {
      const remainingTime = Math.ceil((databus.doubleScoreEndTime - Date.now()) / 1000);
      this.setFont(ctx, 18, '#FFD700');
      ctx.textAlign = 'right';
      ctx.fillText(`2x ${remainingTime}s`, 375 - 20, 30);
    }
  }

  // 渲染平台
  renderPlatforms(ctx) {
    const databus = GameGlobal.databus;
    const platforms = databus.platforms;
    
    platforms.forEach(platform => {
      // 特殊绘制山形起始平台
      if (platform.type === 'mountain') {
        this.renderMountainPlatform(ctx, platform);
        return; // 跳过普通平台绘制
      }
      
      // 根据平台类型绘制不同样式
      this.renderPlatformByType(ctx, platform);
    });
  }
  
  // 根据平台类型渲染
  renderPlatformByType(ctx, platform) {
    // 检查平台是否正在消失
    if (platform.isDisappearing) {
      ctx.globalAlpha = Math.max(0, 1 - platform.disappearTimer / platform.disappearDelay);
    }
    
    // 根据类型设置颜色
    let platformColor = platform.color;
    let borderColor = '#ffffff';
    let specialEffect = false;
    
    switch (platform.type) {
      case 'normal':
        // 普通平台：原色
        platformColor = platform.color;
        break;
        
      case 'moving':
        // 移动平台：原色+移动提示
        platformColor = platform.color;
        specialEffect = true;
        break;
        
      case 'bouncy':
        // 弹跳平台：绿色+弹簧效果
        platformColor = '#4CAF50';
        borderColor = '#81C784';
        specialEffect = true;
        break;
        
      case 'disappearing':
        // 消失平台：灰色+裂纹效果
        platformColor = '#9E9E9E';
        borderColor = '#BDBDBD';
        specialEffect = true;
        break;
        
      case 'danger':
        // 危险平台：红色+尖刺效果
        platformColor = '#F44336';
        borderColor = '#E53935';
        specialEffect = true;
        break;
    }
    
    // 绘制平台主体
    ctx.fillStyle = platformColor;
    ctx.beginPath();
    ctx.rect(platform.x, platform.y, platform.size, 10);
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(platform.x, platform.y, platform.size, 10);
    
    // 绘制特殊效果
    if (specialEffect) {
      this.renderPlatformSpecialEffect(ctx, platform);
    }
    
    // 重置透明度
    if (platform.isDisappearing) {
      ctx.globalAlpha = 1;
    }
  }
  
  // 渲染平台特殊效果
  renderPlatformSpecialEffect(ctx, platform) {
    switch (platform.type) {
      case 'moving':
        // 移动平台：脉冲动画+方向箭头
        platform.pulseAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
        
        const arrowColor = platform.moveDirection > 0 ? '#4CAF50' : '#FF5722';
        ctx.fillStyle = arrowColor;
        ctx.globalAlpha = platform.pulseAlpha;
        
        // 绘制箭头
        const arrowX = platform.moveDirection > 0 ? 
                       platform.x + platform.size - 15 : 
                       platform.x + 5;
        const arrowY = platform.y + 5;
        
        ctx.beginPath();
        if (platform.moveDirection > 0) {
          // 向下箭头
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX + 10, arrowY);
          ctx.lineTo(arrowX + 5, arrowY + 10);
        } else {
          // 向上箭头
          ctx.moveTo(arrowX, arrowY + 10);
          ctx.lineTo(arrowX + 10, arrowY + 10);
          ctx.lineTo(arrowX + 5, arrowY);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = 1;
        
        // 绘制移动平台边框高亮
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = platform.pulseAlpha;
        ctx.strokeRect(platform.x, platform.y, platform.size, 10);
        ctx.globalAlpha = 1;
        break;
        
      case 'bouncy':
        // 弹跳平台：弹簧效果
        ctx.fillStyle = '#2E7D32';
        ctx.globalAlpha = 0.8;
        
        // 绘制弹簧线条
        const springCount = 3;
        const springWidth = platform.size / (springCount + 1);
        for (let i = 1; i <= springCount; i++) {
          const springX = platform.x + springWidth * i;
          const springY = platform.y + 5;
          
          ctx.beginPath();
          ctx.moveTo(springX - 3, springY);
          ctx.lineTo(springX, springY - 8);
          ctx.lineTo(springX + 3, springY);
          ctx.stroke();
        }
        
        // 绘制弹跳图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬆️', platform.x + platform.size / 2, platform.y - 5);
        ctx.globalAlpha = 1;
        break;
        
      case 'disappearing':
        // 消失平台：裂纹效果
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        
        // 绘制裂纹
        const cracks = [
          { x1: platform.x + platform.size * 0.3, y1: platform.y + 2, x2: platform.x + platform.size * 0.5, y2: platform.y + 8 },
          { x1: platform.x + platform.size * 0.5, y1: platform.y + 2, x2: platform.x + platform.size * 0.7, y2: platform.y + 8 },
          { x1: platform.x + platform.size * 0.2, y1: platform.y + 5, x2: platform.x + platform.size * 0.4, y2: platform.y + 10 }
        ];
        
        cracks.forEach(crack => {
          ctx.beginPath();
          ctx.moveTo(crack.x1, crack.y1);
          ctx.lineTo(crack.x2, crack.y2);
          ctx.stroke();
        });
        
        // 绘制警告图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', platform.x + platform.size / 2, platform.y - 5);
        ctx.globalAlpha = 1;
        break;
        
      case 'danger':
        // 危险平台：尖刺效果
        ctx.fillStyle = '#B71C1C';
        ctx.globalAlpha = 0.9;
        
        // 绘制尖刺
        const spikeCount = Math.floor(platform.size / 15);
        const spikeWidth = platform.size / spikeCount;
        
        for (let i = 0; i < spikeCount; i++) {
          const spikeX = platform.x + spikeWidth * i;
          const spikeY = platform.y;
          
          ctx.beginPath();
          ctx.moveTo(spikeX, spikeY);
          ctx.lineTo(spikeX + spikeWidth / 2, spikeY - 8);
          ctx.lineTo(spikeX + spikeWidth, spikeY);
          ctx.closePath();
          ctx.fill();
        }
        
        // 绘制危险图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💀', platform.x + platform.size / 2, platform.y - 12);
        ctx.globalAlpha = 1;
        break;
    }
  }
  
  // 渲染山形起始平台
  renderMountainPlatform(ctx, platform) {
    const x = platform.x;
    const y = platform.y;
    const width = platform.size;
    
    // 绘制山形（使用渐变色）
    const gradient = ctx.createLinearGradient(x, y, x, y + 100);
    gradient.addColorStop(0, '#8B4513'); // 棕色山顶
    gradient.addColorStop(0.5, '#A0522D'); // 赭色山腰
    gradient.addColorStop(1, '#654321'); // 深棕色山底
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    // 绘制山峰形状
    ctx.moveTo(x, y + 100); // 左下角
    ctx.lineTo(x + width * 0.2, y + 30); // 左侧山腰
    ctx.lineTo(x + width * 0.35, y + 50); // 左侧小峰
    ctx.lineTo(x + width * 0.5, y); // 山顶
    ctx.lineTo(x + width * 0.65, y + 50); // 右侧小峰
    ctx.lineTo(x + width * 0.8, y + 30); // 右侧山腰
    ctx.lineTo(x + width, y + 100); // 右下角
    ctx.closePath();
    ctx.fill();
    
    // 绘制山顶平台（玩家站立区域）
    ctx.fillStyle = '#90EE90'; // 浅绿色草地
    ctx.fillRect(x + width * 0.3, y - 5, width * 0.4, 15);
    
    // 添加一些装饰（小草）
    ctx.strokeStyle = '#228B22'; // 深绿色
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const grassX = x + width * 0.3 + i * (width * 0.4 / 5);
      const grassY = y - 5;
      ctx.beginPath();
      ctx.moveTo(grassX, grassY);
      ctx.lineTo(grassX + 3, grassY - 8);
      ctx.stroke();
    }
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
    
    // 绘制护盾光环效果
    if (databus.hasShield) {
      ctx.beginPath();
      ctx.arc(
        drawX + scaledWidth / 2, 
        drawY + scaledHeight / 2, 
        Math.max(scaledWidth, scaledHeight) / 2 + 10,
        0, 
        Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 添加脉冲效果
      const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
      ctx.beginPath();
      ctx.arc(
        drawX + scaledWidth / 2, 
        drawY + scaledHeight / 2, 
        Math.max(scaledWidth, scaledHeight) / 2 + 15,
        0, 
        Math.PI * 2
      );
      ctx.strokeStyle = `rgba(100, 200, 255, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
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
    ctx.fillRect(375 / 2 - 100, 70, 200, 20);
    
    // 绘制蓄力条
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(375 / 2 - 100, 70, (power / player.maxPower) * 200, 20);
    
    // 绘制蓄力值
    this.setFont(ctx, 14, '#333333');
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(power)}%`, 375 / 2, 85);
  }

  // 渲染收集的拼豆
  renderCollectedBeans(ctx) {
    const databus = GameGlobal.databus;
    const collected = databus.collectedBeans;
    const maxCollected = databus.maxCollected;
    
    // 绘制收集栏（上移，避免与道具栏重叠）
    const barWidth = 375 - 40;
    const barHeight = 45;
    const barX = 20;
    const barY = 667 - 120; // 上移到道具栏上方
    
    // 绘制栏背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 绘制栏边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 绘制拼豆
    const beanSize = 30;
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
    ctx.drawImage(backgroundImage, 0, 0, 375, 667);
    
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 375, 667);

    // 绘制标题
    this.setFont(ctx, 36, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', 375 / 2, 667 / 2 - 100);

    // 绘制分数
    this.setFont(ctx, 24, '#ffffff');
    ctx.fillText(`最终得分: ${GameGlobal.databus.score}`, 375 / 2, 667 / 2 - 50);
    ctx.fillText(`拼豆数量: ${GameGlobal.databus.beanPieces}`, 375 / 2, 667 / 2 - 20);
    ctx.fillText(`历史最高分: ${GameGlobal.databus.highScore}`, 375 / 2, 667 / 2 + 10);

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
    ctx.drawImage(backgroundImage, 0, 0, 375, 667);

    // 绘制标题
    this.setFont(ctx, 36, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillText('拼豆图鉴', 375 / 2, 50);
    
    // 绘制当前碎片总数
    const databus = GameGlobal.databus;
    this.setFont(ctx, 16, '#FFD700');
    ctx.fillText(`当前碎片: ${databus.beanPieces}`, 375 / 2, 80);
    
    // 绘制获取说明
    this.setFont(ctx, 12, '#cccccc');
    ctx.fillText('消除3个相同颜色拼豆可获得碎片', 375 / 2, 100);

    // 绘制图鉴项目
    const collections = databus.beanCollection;
    
    const items = [
      { key: 'animals', name: '小动物', icon: '🐶', unlockAt: 8 },
      { key: 'desserts', name: '甜品', icon: '🍰', unlockAt: 12 },
      { key: 'stars', name: '星星', icon: '⭐', unlockAt: 16 },
      { key: 'hearts', name: '爱心', icon: '❤️', unlockAt: 20 },
      { key: 'cartoons', name: '卡通', icon: '🎨', unlockAt: 25 }
    ];
    
    items.forEach((item, index) => {
      const collection = collections[item.key];
      const x = 30;
      const y = 125 + index * 95;
      const width = 375 - 60;
      const height = 85;
      
      // 绘制图鉴项背景
      if (collection.unlocked) {
        ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
      } else if (databus.beanPieces >= item.unlockAt - 5) {
        // 接近解锁时显示黄色提示
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      }
      ctx.fillRect(x, y, width, height);
      
      ctx.strokeStyle = collection.unlocked ? '#4CAF50' : '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // 绘制图标
      ctx.font = '32px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.icon, x + 15, y + 45);
      
      // 绘制名称
      this.setFont(ctx, 20, collection.unlocked ? '#ffffff' : '#999999');
      ctx.fillText(item.name, x + 60, y + 35);
      
      // 绘制进度条背景
      const progressX = x + 60;
      const progressY = y + 50;
      const progressWidth = width - 80;
      const progressHeight = 12;
      
      ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
      
      // 绘制进度条
      const progress = Math.min(databus.beanPieces / item.unlockAt, 1);
      ctx.fillStyle = collection.unlocked ? '#4CAF50' : '#FFD700';
      ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
      
      // 绘制进度条边框
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(progressX, progressY, progressWidth, progressHeight);
      
      // 绘制解锁条件
      this.setFont(ctx, 12, '#cccccc');
      ctx.textAlign = 'right';
      if (collection.unlocked) {
        ctx.fillText('已解锁 ✓', x + width - 10, y + 35);
      } else {
        const remaining = item.unlockAt - databus.beanPieces;
        ctx.fillText(`还需 ${remaining} 碎片`, x + width - 10, y + 35);
      }
      
      // 绘制碎片数量
      this.setFont(ctx, 10, '#999999');
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.min(databus.beanPieces, item.unlockAt)}/${item.unlockAt}`, x + width - 10, y + 75);
    });

    // 绘制返回按钮
    this.drawButton(ctx, '返回', this.btnAreas.backToMenu);

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
    const adY = 667 - adHeight;
    
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, adY, 375, adHeight);
    
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, adY, 375, adHeight);
    
    this.setFont(ctx, 14, '#666666');
    ctx.textAlign = 'center';
    ctx.fillText('广告位', 375 / 2, adY + adHeight / 2 + 5);
  }

  // 处理触摸开始
  touchStartHandler(event) {
    // 用户首次交互时启动音乐
    if (GameGlobal.musicManager) {
      GameGlobal.musicManager.onUserInteract();
    }
    
    let { clientX, clientY } = event.touches[0];
    
    console.log('Raw touch - clientX:', clientX, 'clientY:', clientY);
    console.log('Canvas scale:', window.canvasScale);
    
    // 转换坐标到canvas内部坐标
    if (window.canvasScale) {
      clientX = clientX / window.canvasScale;
      clientY = clientY / window.canvasScale;
      console.log('Converted touch - clientX:', clientX, 'clientY:', clientY);
    }
    
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
      case 'paused':
        // 暂停状态下也可以点击暂停按钮取消暂停
        if (this.isInArea(clientX, clientY, this.btnAreas.pause)) {
          this.emit('pause');
          return;
        }
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
    
    console.log('Settings touch - x:', x, 'y:', y);
    
    // 检查是否点击了返回按钮
    if (this.isInArea(x, y, this.btnAreas.backToMenu)) {
      console.log('Clicked back button');
      databus.gameState = 'menu';
      return;
    }
    
    // 检查是否点击了设置选项（与渲染顺序一致）
    const options = [
      { key: 'music', y: 130 },
      { key: 'sound', y: 185 },
      { key: 'vibration', y: 240 },
      { key: 'showTutorial', y: 295 },
      { key: 'difficulty', y: 350 },
      { key: 'quality', y: 405 },
      { key: 'fpsLimit', y: 460 },
      { key: 'showDebug', y: 515 }
    ];
    
    let clicked = false;
    options.forEach(option => {
      const inYRange = y >= option.y - 20 && y <= option.y + 20;
      const inXRange = x >= 30 && x <= 375 - 30;
      
      console.log(`Option ${option.key}: inYRange=${inYRange}, inXRange=${inXRange}`);
      
      if (inYRange && inXRange) {
        clicked = true;
        if (typeof settings[option.key] === 'boolean') {
          // 切换布尔值选项
          settings[option.key] = !settings[option.key];
          console.log(`Toggled ${option.key} to ${settings[option.key]}`);
          
          // 特殊处理：音乐设置
          if (option.key === 'music') {
            // 同步音频状态
            if (GameGlobal.musicManager) {
              GameGlobal.musicManager.syncWithSettings();
            }
          }
        } else {
          // 切换其他选项
          if (option.key === 'difficulty') {
            // 循环切换难度
            settings.difficulty = settings.difficulty === 'easy' ? 'normal' : 
                                 settings.difficulty === 'normal' ? 'hard' : 'easy';
            console.log(`Changed difficulty to ${settings.difficulty}`);
          } else if (option.key === 'quality') {
            // 循环切换画质
            settings.quality = settings.quality === 'high' ? 'medium' : 
                               settings.quality === 'medium' ? 'low' : 'high';
            console.log(`Changed quality to ${settings.quality}`);
          } else if (option.key === 'fpsLimit') {
            // 循环切换帧率上限：60 <-> 120
            settings.fpsLimit = settings.fpsLimit === 60 ? 120 : 60;
            console.log(`Changed fpsLimit to ${settings.fpsLimit}`);
            
            // 通知 Main 更新帧率
            if (GameGlobal.main && GameGlobal.main.setFPSLimit) {
              GameGlobal.main.setFPSLimit(settings.fpsLimit);
            }
          }
        }
      }
    });
    
    if (!clicked) {
      console.log('No option clicked');
    }
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
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    // 转换坐标到canvas内部坐标
    if (window.canvasScale) {
      x = x / window.canvasScale;
      y = y / window.canvasScale;
    }
    
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
      this.emit('pause');
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
    
    console.log('checkItemTouch - x:', x, 'y:', y);
    console.log('shield area:', this.btnAreas.shield);
    console.log('rainbow area:', this.btnAreas.rainbow);
    console.log('doubleScore area:', this.btnAreas.doubleScore);
    console.log('extraBean area:', this.btnAreas.extraBean);
    
    if (this.isInArea(x, y, this.btnAreas.shield)) {
      console.log('点击了护盾道具');
      databus.useItem('shield');
      return true;
    } else if (this.isInArea(x, y, this.btnAreas.rainbow)) {
      console.log('点击了彩虹道具');
      databus.useItem('rainbow');
      return true;
    } else if (this.isInArea(x, y, this.btnAreas.doubleScore)) {
      console.log('点击了双倍分数道具');
      databus.useItem('doubleScore');
      return true;
    } else if (this.isInArea(x, y, this.btnAreas.extraBean)) {
      console.log('点击了额外拼豆道具');
      databus.useItem('extraBean');
      return true;
    }
    
    console.log('未点击道具区域');
    return false;
  }

  // 处理主界面触摸
  handleMenuTouch(x, y) {
    console.log('handleMenuTouch - x:', x, 'y:', y);
    console.log('startGame area:', this.btnAreas.startGame);
    console.log('collection area:', this.btnAreas.collection);
    console.log('leaderboard area:', this.btnAreas.leaderboard);
    
    if (this.isInArea(x, y, this.btnAreas.startGame)) {
      console.log('startGame button clicked');
      this.emit('startGame');
    } else if (this.isInArea(x, y, this.btnAreas.collection)) {
      console.log('collection button clicked');
      this.emit('collection');
    } else if (this.isInArea(x, y, this.btnAreas.leaderboard)) {
      console.log('leaderboard button clicked');
      this.emit('leaderboard');
    } else if (this.isInArea(x, y, this.btnAreas.settings)) {
      console.log('settings button clicked');
      this.emit('settings');
    } else {
      console.log('No button clicked');
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