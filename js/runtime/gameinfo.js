/**
 * UI 渲染 + 触摸/鼠标事件处理
 * 使用公共工具函数消除重复代码
 */

// 确保 TinyEmitter 可用
if (typeof TinyEmitter === 'undefined') console.error('TinyEmitter not found');
const Emitter = TinyEmitter;

// ─── 图片资源 ─────────────────────────────────────
const backgroundImage = createImage();
backgroundImage.src = 'images/image_695435480469248.png';

const playerSpriteSheet = createImage();
playerSpriteSheet.src = 'images/image_720350330364146.png';

const itemSpriteSheet = createImage();
itemSpriteSheet.src = 'images/image_106693423325902.png';

const platformSpriteSheet = createImage();
platformSpriteSheet.src = 'images/image_209397380965441.png';

const startPlatformImage = createImage();
startPlatformImage.src = 'images/image_148523117485869.png';

// 精灵帧定义
const itemFrames = {
  shield:      { x: 0,    y: 0 },
  rainbow:     { x: 0.5,  y: 0 },
  doubleScore: { x: 0,    y: 0.5 },
  extraBean:   { x: 0.5,  y: 0.5 }
};

const platformFrames = {
  normal:       { x: 0, y: 0 },
  moving:       { x: 0, y: 0.2 },
  bouncy:       { x: 0, y: 0.4 },
  disappearing: { x: 0, y: 0.6 },
  danger:       { x: 0, y: 0.8 }
};

const playerFrames = {
  stand:   { x: 0,   y: 0,   width: 288, height: 384 },
  jump:    { x: 288, y: 384, width: 288, height: 384 },
  collect: { x: 288, y: 768, width: 288, height: 384 },
  fail:    { x: 576, y: 768, width: 288, height: 384 }
};

// ─── 云朵系统 ─────────────────────────────────────
class CloudSystem {
  constructor() {
    this.clouds = [];
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      this.clouds.push({
        x: Math.random() * 500,
        y: 50 + Math.random() * 200,
        width: 60 + Math.random() * 80,
        height: 30 + Math.random() * 40,
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4
      });
    }
  }

  update() {
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.x -= c.speed;
      if (c.x + c.width < 0) {
        c.x = 400 + Math.random() * 100;
        c.y = 50 + Math.random() * 200;
      }
    }
  }

  render(ctx) {
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      ctx.save();
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = '#ffffff';
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, c.height / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - c.width / 4, cy + 5, c.height / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + c.width / 4, cy + 5, c.height / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy - c.height / 4, c.height / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

const cloudSystem = new CloudSystem();

// ─── GameInfo 类 ──────────────────────────────────
class GameInfo extends Emitter {
  constructor() {
    super();
    if (!this.e) this.e = {};

    // 按钮热区（设计稿坐标）
    this.btnAreas = {
      startGame:   { startX: 87.5,  startY: 273.5, endX: 287.5, endY: 323.5 },
      collection:  { startX: 87.5,  startY: 353.5, endX: 287.5, endY: 403.5 },
      leaderboard: { startX: 87.5,  startY: 433.5, endX: 287.5, endY: 483.5 },
      settings:    { startX: 20,    startY: 20,    endX: 80,    endY: 60 },
      restart:     { startX: 107.5, startY: 353.5, endX: 267.5, endY: 393.5 },
      share:       { startX: 107.5, startY: 413.5, endX: 267.5, endY: 453.5 },
      watchAd:     { startX: 107.5, startY: 473.5, endX: 267.5, endY: 513.5 },
      backToMenu:  { startX: 20,    startY: 20,    endX: 100,   endY: 60 },
      pause:       { startX: 315,   startY: 40,    endX: 355,   endY: 80 },
      shield:      { startX: 20,    startY: 597,   endX: 90,    endY: 657 },
      rainbow:     { startX: 100,   startY: 597,   endX: 170,   endY: 657 },
      doubleScore: { startX: 180,   startY: 597,   endX: 250,   endY: 657 },
      extraBean:   { startX: 260,   startY: 597,   endX: 330,   endY: 657 }
    };

    this.isTouching = false;
    this.touchStartTime = 0;

    this._bindEvents();
  }

  _bindEvents() {
    const self = this;
    if (window.isWechatGame) {
      wx.onTouchStart((e) => self._onTouchStart(e));
      wx.onTouchEnd((e) => self._onTouchEnd(e));
      wx.onTouchMove(() => {});
      wx.onTouchCancel(() => { self.isTouching = false; self.touchStartTime = 0; });
    } else if (typeof window !== 'undefined') {
      const bind = () => {
        const c = window.canvas || document.getElementById('gameCanvas');
        if (!c) { setTimeout(bind, 100); return; }
        c.addEventListener('touchstart', (e) => self._onTouchStart(e), { passive: true });
        c.addEventListener('touchend', (e) => self._onTouchEnd(e), { passive: true });
        c.addEventListener('touchmove', () => {}, { passive: true });
        c.addEventListener('touchcancel', () => { self.isTouching = false; self.touchStartTime = 0; }, { passive: true });
        c.addEventListener('mousedown', (e) => {
          const rect = e.target.getBoundingClientRect();
          const scale = window.canvasScale || 1;
          self._handleStart((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
        });
        c.addEventListener('mouseup', () => self._onTouchEnd(null));
        c.addEventListener('mousemove', () => {});
      };
      bind();
    }
  }

  // ─── 坐标提取 ──────────────────────────────────
  _onTouchStart(event) {
    if (GameGlobal.musicManager) GameGlobal.musicManager.onUserInteract();

    if (window.isWechatGame) {
      const t = event.touches[0];
      const pos = eventToCanvas(t.clientX, t.clientY);
      this._handleStart(pos.x, pos.y);
    } else if (event.touches) {
      const t = event.touches[0];
      const pos = eventToCanvas(t.clientX, t.clientY);
      this._handleStart(pos.x, pos.y);
    }
  }

  _onTouchEnd(event) {
    const gs = GameGlobal.databus.gameState;
    if (gs === 'playing' && this.isTouching) {
      const power = Math.min((Date.now() - this.touchStartTime) / 10, GameGlobal.databus.player.maxPower);
      GameGlobal.databus.jump(power);
      this.isTouching = false;
    }
  }

  // ─── 统一触摸处理 ──────────────────────────────
  _handleStart(x, y) {
    const db = GameGlobal.databus;
    const gs = db.gameState;

    // 教程
    if (db.showTutorial && gs === 'playing') {
      db.tutorialStep++;
      if (db.tutorialStep >= 3) { db.showTutorial = false; db.isFirstPlay = false; }
      return;
    }

    switch (gs) {
      case 'menu':      this._menuTouch(x, y); break;
      case 'playing':   this._playingTouchStart(x, y); break;
      case 'paused':    if (isInArea(x, y, this.btnAreas.pause)) this.emit('pause'); break;
      case 'gameOver':  this._gameOverTouch(x, y); break;
      case 'collection': if (isInArea(x, y, this.btnAreas.backToMenu)) this.emit('backToMenu'); break;
      case 'settings':  this._settingsTouch(x, y); break;
    }
  }

  _menuTouch(x, y) {
    const a = this.btnAreas;
    if (isInArea(x, y, a.startGame))      this.emit('startGame');
    else if (isInArea(x, y, a.collection))  this.emit('collection');
    else if (isInArea(x, y, a.leaderboard)) this.emit('leaderboard');
    else if (isInArea(x, y, a.settings))    this.emit('settings');
  }

  _playingTouchStart(x, y) {
    // 道具点击
    const a = this.btnAreas;
    if (isInArea(x, y, a.shield))      { GameGlobal.databus.useItem('shield'); return; }
    if (isInArea(x, y, a.rainbow))     { GameGlobal.databus.useItem('rainbow'); return; }
    if (isInArea(x, y, a.doubleScore)) { GameGlobal.databus.useItem('doubleScore'); return; }
    if (isInArea(x, y, a.extraBean))   { GameGlobal.databus.useItem('extraBean'); return; }
    // 暂停
    if (isInArea(x, y, a.pause)) { this.emit('pause'); return; }

    // 蓄力
    if (this.isTouching) { this.isTouching = false; this.touchStartTime = 0; }
    this.isTouching = true;
    this.touchStartTime = Date.now();
  }

  _gameOverTouch(x, y) {
    const a = this.btnAreas;
    if (isInArea(x, y, a.restart))    this.emit('restart');
    else if (isInArea(x, y, a.share)) this.emit('share');
    else if (isInArea(x, y, a.watchAd)) this.emit('watchAd');
    else if (isInArea(x, y, a.backToMenu)) this.emit('backToMenu');
  }

  _settingsTouch(x, y) {
    const db = GameGlobal.databus;
    const s = db.settings;
    const a = this.btnAreas;

    if (isInArea(x, y, a.backToMenu)) { db.gameState = 'menu'; return; }

    const options = [
      { key: 'music', y: 130 }, { key: 'sound', y: 185 },
      { key: 'vibration', y: 240 }, { key: 'showTutorial', y: 295 },
      { key: 'difficulty', y: 350 }, { key: 'quality', y: 405 },
      { key: 'fpsLimit', y: 460 }, { key: 'showDebug', y: 515 }
    ];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (y >= opt.y - 20 && y <= opt.y + 20 && x >= 30 && x <= 345) {
        if (typeof s[opt.key] === 'boolean') {
          s[opt.key] = !s[opt.key];
          if (opt.key === 'music' && GameGlobal.musicManager) GameGlobal.musicManager.syncWithSettings();
        } else if (opt.key === 'difficulty') {
          s.difficulty = s.difficulty === 'easy' ? 'normal' : s.difficulty === 'normal' ? 'hard' : 'easy';
        } else if (opt.key === 'quality') {
          s.quality = s.quality === 'high' ? 'medium' : s.quality === 'medium' ? 'low' : 'high';
        } else if (opt.key === 'fpsLimit') {
          s.fpsLimit = s.fpsLimit === 60 ? 120 : 60;
          if (GameGlobal.main && GameGlobal.main.setFPSLimit) GameGlobal.main.setFPSLimit(s.fpsLimit);
        }
        return;
      }
    }
  }

  // ─── 渲染入口 ──────────────────────────────────
  render(ctx) {
    switch (GameGlobal.databus.gameState) {
      case 'menu':       this._renderMenu(ctx); break;
      case 'playing':    this._renderPlaying(ctx); break;
      case 'paused':     this._renderPlaying(ctx); this._renderPaused(ctx); break;
      case 'gameOver':   this._renderGameOver(ctx); break;
      case 'collection': this._renderCollection(ctx); break;
      case 'settings':   this._renderSettings(ctx); break;
    }
  }

  // ─── 通用文字 ──────────────────────────────────
  _setFont(ctx, size, color) {
    ctx.fillStyle = color || '#333333';
    ctx.font = (size || 20) + 'px Arial';
  }

  // ─── 主菜单 ────────────────────────────────────
  _renderMenu(ctx) {
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    cloudSystem.update();
    cloudSystem.render(ctx);

    // 标题
    this._setFont(ctx, 48, '#ffffff');
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillText('拼豆跳跳消', SCREEN_WIDTH / 2, 150);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 说明
    this._setFont(ctx, 16, 'rgba(255,255,255,0.9)');
    ctx.fillText('长按蓄力跳跃', SCREEN_WIDTH / 2, 200);
    ctx.fillText('收集相同颜色拼豆消除', SCREEN_WIDTH / 2, 230);
    ctx.fillText('解锁拼豆图鉴', SCREEN_WIDTH / 2, 260);

    this._drawBtn(ctx, '开始游戏', this.btnAreas.startGame);
    this._drawBtn(ctx, '我的图鉴', this.btnAreas.collection);
    this._drawBtn(ctx, '排行榜', this.btnAreas.leaderboard);
    this._drawBtn(ctx, '设置', this.btnAreas.settings);

    this._drawBannerAd(ctx);
    ctx.textAlign = 'left';
  }

  // ─── 游戏中 ────────────────────────────────────
  _renderPlaying(ctx) {
    const db = GameGlobal.databus;
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    cloudSystem.update();
    cloudSystem.render(ctx);

    this._renderTopInfo(ctx);
    this._renderPlatforms(ctx);
    this._renderCollectibles(ctx);
    this._renderPlayer(ctx);

    if (this.isTouching) this._renderPowerBar(ctx);

    this._renderCollectedBeans(ctx);
    this._renderItems(ctx);
    this._drawBtn(ctx, '暂停', this.btnAreas.pause);

    // 倒计时
    if (db.gameStartTime && Date.now() < db.gameStartTime) {
      const rem = Math.ceil((db.gameStartTime - Date.now()) / 1000);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      this._setFont(ctx, 48, '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillText(rem.toString(), SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
      this._setFont(ctx, 20, '#ffffff');
      ctx.fillText('准备开始...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 40);
    }

    // 教程
    if (db.showTutorial && db.gameState === 'playing') this._renderTutorial(ctx);
  }

  _renderTopInfo(ctx) {
    const db = GameGlobal.databus;
    this._setFont(ctx, 20, '#ffffff');
    ctx.textAlign = 'left';
    ctx.fillText('分数: ' + db.score, 50, 30);
    this._setFont(ctx, 16, '#ffffff');
    ctx.fillText('最高分: ' + db.highScore, 50, 55);

    ctx.textAlign = 'center';
    ctx.fillText('拼豆: ' + db.beanPieces, SCREEN_WIDTH / 2, 40);

    if (db.doubleScoreActive && Date.now() < db.doubleScoreEndTime) {
      const rem = Math.ceil((db.doubleScoreEndTime - Date.now()) / 1000);
      this._setFont(ctx, 18, '#FFD700');
      ctx.textAlign = 'right';
      ctx.fillText('2x ' + rem + 's', SCREEN_WIDTH - 20, 30);
    }
  }

  // ─── 平台渲染 ──────────────────────────────────
  _renderPlatforms(ctx) {
    const platforms = GameGlobal.databus.platforms;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.type === 'mountain') {
        this._renderMountainPlatform(ctx, p);
      } else {
        this._renderPlatform(ctx, p);
      }
    }
  }

  _renderPlatform(ctx, p) {
    if (p.isDisappearing) {
      ctx.globalAlpha = Math.max(0, 1 - p.disappearTimer / (p.disappearDelay || 1));
    }

    const sw = platformSpriteSheet.naturalWidth || platformSpriteSheet.width;
    const sh = platformSpriteSheet.naturalHeight || platformSpriteSheet.height;

    if (platformSpriteSheet.complete && sw > 0) {
      const frame = platformFrames[p.type] || platformFrames.normal;
      ctx.drawImage(platformSpriteSheet,
        frame.x * sw, frame.y * sh, sw, sh * 0.2,
        p.x, p.y, p.size, 25);
    } else {
      this._renderPlatformFallback(ctx, p);
    }

    if (p.isDisappearing) ctx.globalAlpha = 1;
  }

  _renderPlatformFallback(ctx, p) {
    const colors = {
      normal: p.color, moving: p.color,
      bouncy: '#4CAF50', disappearing: '#9E9E9E', danger: '#F44336'
    };
    ctx.fillStyle = colors[p.type] || p.color;
    ctx.fillRect(p.x, p.y, p.size, 10);

    // 特殊标记
    if (p.type === 'bouncy') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⬆️', p.x + p.size / 2, p.y - 3);
    } else if (p.type === 'danger') {
      const spikeCount = Math.floor(p.size / 15);
      const sw = p.size / spikeCount;
      ctx.fillStyle = '#B71C1C';
      for (let i = 0; i < spikeCount; i++) {
        ctx.beginPath();
        ctx.moveTo(p.x + sw * i, p.y);
        ctx.lineTo(p.x + sw * i + sw / 2, p.y - 8);
        ctx.lineTo(p.x + sw * (i + 1), p.y);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.type === 'disappearing') {
      ctx.strokeStyle = '#616161';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + p.size * 0.3, p.y + 2);
      ctx.lineTo(p.x + p.size * 0.5, p.y + 8);
      ctx.stroke();
    }
  }

  _renderMountainPlatform(ctx, p) {
    if (startPlatformImage.complete && startPlatformImage.width > 0) {
      const scale = p.size / 350;
      const ih = 180 * scale;
      ctx.drawImage(startPlatformImage, p.x, p.y - ih + 60, p.size, ih);
    } else {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 80);
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(1, '#FFA500');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 80);
      ctx.lineTo(p.x + p.size * 0.5, p.y);
      ctx.lineTo(p.x + p.size, p.y + 80);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(p.x + p.size * 0.3, p.y - 5, p.size * 0.4, 15);
    }
  }

  // ─── 玩家渲染 ──────────────────────────────────
  _renderPlayer(ctx) {
    const db = GameGlobal.databus;
    const p = db.player;
    const frame = playerFrames[p.state] || playerFrames.stand;
    const sw = 60, sh = 80;
    const dx = p.x + (p.size - sw) / 2;
    const dy = p.y + (p.size - sh) / 2;

    // 护盾光效
    if (db.hasShield) {
      const r = Math.max(sw, sh) / 2 + 10;
      const cx = dx + sw / 2, cy = dy + sh / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,200,255,0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,200,255,' + pulse + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.drawImage(playerSpriteSheet,
      frame.x, frame.y, frame.width, frame.height,
      dx, dy, sw, sh);
  }

  // ─── 蓄力条 ────────────────────────────────────
  _renderPowerBar(ctx) {
    const power = Math.min((Date.now() - this.touchStartTime) / 10, 100);
    const bw = 200, bh = 20, bx = (SCREEN_WIDTH - bw) / 2, by = 70;

    drawRoundRect(ctx, bx, by, bw, bh, 10, 'rgba(255,255,255,0.95)', '#333333', 1);

    const pw = (power / 100) * (bw - 4);
    if (pw > 0) {
      ctx.fillStyle = '#FFB6C1';
      fillRoundRect(ctx, bx + 2, by + 2, pw, bh - 4, 8);
    }

    this._setFont(ctx, 14, '#333333');
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(power) + '%', SCREEN_WIDTH / 2, 85);
  }

  // ─── 收集栏 ────────────────────────────────────
  _renderCollectedBeans(ctx) {
    const db = GameGlobal.databus;
    const collected = db.collectedBeans;
    const max = db.maxCollected;
    const bw = SCREEN_WIDTH - 40, bh = 45, bx = 20, by = SCREEN_HEIGHT - 120;

    drawRoundRect(ctx, bx, by, bw, bh, 10, 'rgba(255,255,255,0.95)', '#333333', 1);

    const beanSize = 30;
    const spacing = (bw - beanSize * max) / (max + 1);

    for (let i = 0; i < max; i++) {
      const x = bx + spacing + i * (beanSize + spacing);
      const y = by + (bh - beanSize) / 2;
      if (i < collected.length) {
        ctx.fillStyle = MACARON_COLORS[i % MACARON_COLORS.length];
        ctx.beginPath();
        ctx.arc(x + beanSize / 2, y + beanSize / 2, beanSize / 2, 0, Math.PI * 2);
        ctx.fill();
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(x + beanSize / 3, y + beanSize / 3, beanSize / 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + beanSize / 2, y + beanSize / 2, beanSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // ─── 道具栏 ────────────────────────────────────
  _renderItems(ctx) {
    const items = GameGlobal.databus.items;
    this._drawItemBtn(ctx, 'shield', items.shield, this.btnAreas.shield);
    this._drawItemBtn(ctx, 'rainbow', items.rainbow, this.btnAreas.rainbow);
    this._drawItemBtn(ctx, 'doubleScore', items.doubleScore, this.btnAreas.doubleScore);
    this._drawItemBtn(ctx, 'extraBean', items.extraBean, this.btnAreas.extraBean);
  }

  _drawItemBtn(ctx, type, count, area) {
    const w = area.endX - area.startX, h = area.endY - area.startY;
    drawRoundRect(ctx, area.startX, area.startY, w, h, 12, 'rgba(255,255,255,0.95)');

    const sw = itemSpriteSheet.naturalWidth || itemSpriteSheet.width;
    const sh = itemSpriteSheet.naturalHeight || itemSpriteSheet.height;

    if (itemSpriteSheet.complete && sw > 0) {
      const imgSize = Math.min(w, h) - 10;
      const frame = itemFrames[type];
      ctx.drawImage(itemSpriteSheet,
        frame.x * sw, frame.y * sh, sw * 0.5, sh * 0.5,
        area.startX + (w - imgSize) / 2, area.startY + (h - imgSize) / 2 - 5,
        imgSize, imgSize);
    } else {
      const icons = { shield: '🛡️', rainbow: '🌈', doubleScore: '2x', extraBean: '🫘' };
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#999999';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[type], (area.startX + area.endX) / 2, (area.startY + area.endY) / 2 - 5);
    }

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x' + count, area.endX - 5, area.endY - 3);
  }

  // ─── 图鉴道具渲染 ──────────────────────────────
  _renderCollectibles(ctx) {
    const items = GameGlobal.databus.collectibleItems;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.collected) continue;

      // 发光
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(it.x + it.size / 2, (it.displayY || it.y) + it.size / 2, it.size / 2 + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = it.size + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.item, it.x + it.size / 2, (it.displayY || it.y) + it.size / 2);
    }
  }

  // ─── 游戏结束 ──────────────────────────────────
  _renderGameOver(ctx) {
    const db = GameGlobal.databus;
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.textAlign = 'center';
    this._setFont(ctx, 36, '#ffffff');
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);
    this._setFont(ctx, 24, '#ffffff');
    ctx.fillText('最终得分: ' + db.score, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
    ctx.fillText('拼豆数量: ' + db.beanPieces, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);
    ctx.fillText('历史最高分: ' + db.highScore, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 10);

    this._drawBtn(ctx, '再玩一次', this.btnAreas.restart);
    this._drawBtn(ctx, '分享战绩', this.btnAreas.share);
    this._drawBtn(ctx, '看广告复活', this.btnAreas.watchAd);
    this._drawBtn(ctx, '返回', this.btnAreas.backToMenu);
    ctx.textAlign = 'left';
  }

  // ─── 图鉴 ──────────────────────────────────────
  _renderCollection(ctx) {
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.textAlign = 'center';
    this._setFont(ctx, 36, '#ffffff');
    ctx.fillText('拼豆图鉴', SCREEN_WIDTH / 2, 50);
    this._setFont(ctx, 12, '#cccccc');
    ctx.fillText('游戏中收集图鉴道具解锁', SCREEN_WIDTH / 2, 80);

    const db = GameGlobal.databus;
    const cats = Object.keys(db.beanCollection);

    cats.forEach((key, idx) => {
      const col = db.beanCollection[key];
      const x = 20, y = 100 + idx * 110, w = 335, h = 100;

      const bgColor = col.unlocked ? 'rgba(100,200,100,0.3)' :
                       col.collected.length > 0 ? 'rgba(255,200,100,0.3)' :
                       'rgba(100,100,100,0.3)';
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = col.unlocked ? '#4CAF50' : '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.textAlign = 'left';
      this._setFont(ctx, 18, '#ffffff');
      ctx.fillText(col.icon + ' ' + col.name, x + 10, y + 25);

      ctx.textAlign = 'right';
      this._setFont(ctx, 12, '#cccccc');
      ctx.fillText(col.collected.length + '/' + col.total, x + w - 10, y + 25);

      // 已收集项
      for (let i = 0; i < col.total; i++) {
        const ix = x + 10 + (i % 8) * 35, iy = y + 45;
        if (i < col.collected.length) {
          ctx.font = '26px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(col.collected[i], ix + 15, iy + 15);
        } else {
          ctx.fillStyle = 'rgba(50,50,50,0.5)';
          ctx.fillRect(ix, iy, 30, 30);
          ctx.strokeStyle = '#444444';
          ctx.lineWidth = 1;
          ctx.strokeRect(ix, iy, 30, 30);
        }
      }

      if (col.unlocked) {
        this._setFont(ctx, 12, '#4CAF50');
        ctx.textAlign = 'right';
        ctx.fillText('已完成 ✓', x + w - 10, y + h - 10);
      }
    });

    this._drawBtn(ctx, '返回', this.btnAreas.backToMenu);
    ctx.textAlign = 'left';
  }

  // ─── 设置界面 ──────────────────────────────────
  _renderSettings(ctx) {
    const s = GameGlobal.databus.settings;
    ctx.drawImage(backgroundImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.textAlign = 'center';
    this._setFont(ctx, 36, '#000000');
    ctx.fillText('设置', SCREEN_WIDTH / 2, 80);

    const options = [
      { key: 'music', label: '背景音乐' },
      { key: 'sound', label: '音效' },
      { key: 'vibration', label: '振动' },
      { key: 'showTutorial', label: '新手教程' },
      { key: 'difficulty', label: '难度' },
      { key: 'quality', label: '画质' },
      { key: 'fpsLimit', label: '帧率上限' },
      { key: 'showDebug', label: '调试信息' }
    ];

    options.forEach((opt, idx) => {
      const y = 130 + idx * 55;
      ctx.textAlign = 'left';
      this._setFont(ctx, 18, '#000000');
      ctx.fillText(opt.label, 50, y);

      ctx.textAlign = 'right';
      const v = s[opt.key];
      let display;
      if (typeof v === 'boolean') display = v ? '开' : '关';
      else if (opt.key === 'fpsLimit') display = v + ' FPS';
      else if (opt.key === 'difficulty') display = { easy: '简单', normal: '普通', hard: '困难' }[v] || v;
      else if (opt.key === 'quality') display = { high: '高', medium: '中', low: '低' }[v] || v;
      else display = v;

      ctx.fillText(display, SCREEN_WIDTH - 50, y);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, y - 20, SCREEN_WIDTH - 60, 40);
    });

    this._drawBtn(ctx, '返回', this.btnAreas.backToMenu);
    ctx.textAlign = 'left';
  }

  // ─── 暂停界面 ──────────────────────────────────
  _renderPaused(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = 'center';
    this._setFont(ctx, 36, '#ffffff');
    ctx.fillText('游戏暂停', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
    this._setFont(ctx, 20, '#ffffff');
    ctx.fillText('点击暂停按钮继续游戏', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 10);
    ctx.textAlign = 'left';
  }

  // ─── 教程界面 ──────────────────────────────────
  _renderTutorial(ctx) {
    const step = GameGlobal.databus.tutorialStep;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.textAlign = 'center';
    this._setFont(ctx, 24, '#ffffff');

    const texts = [
      ['欢迎来到拼豆跳跳消！', '长按屏幕蓄力，松开跳跃', '点击屏幕继续'],
      ['跳到平台上收集拼豆', '收集3个相同颜色的拼豆可以消除', '点击屏幕继续'],
      ['收集3个不同颜色的拼豆', '可以随机获得一个道具', '点击屏幕开始游戏']
    ];

    const t = texts[Math.min(step, 2)];
    ctx.fillText(t[0], SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 60);
    ctx.fillText(t[1], SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    ctx.fillText(t[2], SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
  }

  // ─── 通用按钮绘制 ──────────────────────────────
  _drawBtn(ctx, text, area) {
    const w = area.endX - area.startX, h = area.endY - area.startY;
    drawRoundRect(ctx, area.startX, area.startY, w, h, 20, 'rgba(255,255,255,0.95)');
    this._setFont(ctx, 20, '#666666');
    ctx.textAlign = 'center';
    ctx.fillText(text, (area.startX + area.endX) / 2, (area.startY + area.endY) / 2 + 5);
  }

  _drawBannerAd(ctx) {
    const ah = 60, ay = SCREEN_HEIGHT - ah;
    drawRoundRect(ctx, 0, ay, SCREEN_WIDTH, ah, 15, 'rgba(224,224,224,0.9)');
    this._setFont(ctx, 14, '#666666');
    ctx.textAlign = 'center';
    ctx.fillText('广告位', SCREEN_WIDTH / 2, ay + ah / 2 + 5);
  }
}

if (typeof window !== 'undefined') window.GameInfo = GameInfo;
if (typeof GameGlobal !== 'undefined') GameGlobal.GameInfo = GameInfo;
