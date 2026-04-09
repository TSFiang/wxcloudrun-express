/**
 * 游戏反馈系统
 * 屏幕震动、粒子效果、命中停顿
 * 使用对象池管理粒子，减少 GC
 */
class FeedbackManager {
  constructor() {
    this.screenShake = { intensity: 0, duration: 0, startTime: 0, offset: { x: 0, y: 0 } };
    this.particles = [];
    this.particlePool = []; // 简易粒子池
    this.timeScale = 1;
    this.hitStopTimer = 0;
  }

  // ─── 屏幕震动 ──────────────────────────────────
  triggerScreenShake(intensity, duration) {
    this.screenShake.intensity = intensity || 5;
    this.screenShake.duration = duration || 200;
    this.screenShake.startTime = Date.now();
  }

  _updateScreenShake() {
    const s = this.screenShake;
    if (s.duration <= 0) return;
    const elapsed = Date.now() - s.startTime;
    const progress = elapsed / s.duration;
    if (progress < 1) {
      const decay = 1 - progress;
      const shake = Math.sin(elapsed * 0.1) * s.intensity * decay;
      s.offset.x = shake * (Math.random() - 0.5);
      s.offset.y = shake * (Math.random() - 0.5);
    } else {
      s.duration = 0;
      s.offset.x = 0;
      s.offset.y = 0;
    }
  }

  applyShake(ctx) {
    if (this.screenShake.offset.x !== 0 || this.screenShake.offset.y !== 0) {
      ctx.translate(this.screenShake.offset.x, this.screenShake.offset.y);
    }
  }

  resetShake(ctx) {
    if (this.screenShake.offset.x !== 0 || this.screenShake.offset.y !== 0) {
      ctx.translate(-this.screenShake.offset.x, -this.screenShake.offset.y);
    }
  }

  // ─── 粒子系统（对象池）────────────────────────
  createParticles(x, y, type) {
    const configs = {
      jump:    { count: 8,  color: '#ffffff', size: 3, speed: 2, lifetime: 500, spread: Math.PI },
      land:    { count: 12, color: '#ffdd88', size: 4, speed: 3, lifetime: 600, spread: Math.PI * 0.8 },
      collect: { count: 15, color: '#ffaa00', size: 5, speed: 4, lifetime: 800, spread: Math.PI * 2 },
      match:   { count: 20, color: '#ff6b6b', size: 6, speed: 5, lifetime: 1000, spread: Math.PI * 2 }
    };

    const cfg = configs[type] || configs.jump;

    for (let i = 0; i < cfg.count; i++) {
      const angle = (cfg.spread / cfg.count) * i - cfg.spread / 2;
      const p = this._acquireParticle();
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * cfg.speed * (0.5 + Math.random() * 0.5);
      p.vy = Math.sin(angle) * cfg.speed * (0.5 + Math.random() * 0.5);
      p.size = cfg.size;
      p.color = cfg.color;
      p.lifetime = cfg.lifetime;
      p.maxLifetime = cfg.lifetime;
      p.alpha = 1;
      this.particles.push(p);
    }
  }

  _acquireParticle() {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop();
    }
    return { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', lifetime: 0, maxLifetime: 1, alpha: 1 };
  }

  _releaseParticle(p) {
    this.particlePool.push(p);
  }

  _updateParticles(dt) {
    const alive = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.lifetime -= dt * 1000;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.alpha = Math.max(0, p.lifetime / p.maxLifetime);
      if (p.lifetime > 0) {
        alive.push(p);
      } else {
        this._releaseParticle(p);
      }
    }
    this.particles = alive;
  }

  _renderParticles(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── 命中停顿 ──────────────────────────────────
  triggerHitStop(duration) {
    this.hitStopTimer = duration || 80;
    this.timeScale = 0;
  }

  _updateTimeScale(dt) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt * 1000;
      if (this.hitStopTimer <= 0) {
        this.hitStopTimer = 0;
        this.timeScale = 1;
      }
    }
  }

  // ─── 主循环接口 ────────────────────────────────
  update(deltaTime) {
    this._updateScreenShake();
    this._updateParticles(deltaTime);
    this._updateTimeScale(deltaTime);
  }

  render(ctx) {
    this._renderParticles(ctx);
  }
}

if (typeof window !== 'undefined') window.FeedbackManager = FeedbackManager;
if (typeof GameGlobal !== 'undefined') GameGlobal.FeedbackManager = FeedbackManager;
