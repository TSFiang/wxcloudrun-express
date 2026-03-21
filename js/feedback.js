/**
 * 游戏反馈系统
 * 参考业界最佳实践，提供视觉、音频和触觉反馈
 */
class FeedbackManager {
  constructor() {
    // 屏幕震动参数
    this.screenShake = {
      intensity: 0,
      duration: 0,
      offset: { x: 0, y: 0 }
    };
    
    // 粒子系统
    this.particles = [];
    
    // 时间缩放
    this.timeScale = 1;
    this.hitStopTimer = 0;
  }
  
  // 触发屏幕震动
  triggerScreenShake(intensity = 5, duration = 200) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.startTime = Date.now();
  }
  
  // 更新屏幕震动
  updateScreenShake() {
    if (this.screenShake.duration > 0) {
      const elapsed = Date.now() - this.screenShake.startTime;
      const progress = elapsed / this.screenShake.duration;
      
      if (progress < 1) {
        // 使用衰减的正弦波
        const decay = 1 - progress;
        const shake = Math.sin(elapsed * 0.1) * this.screenShake.intensity * decay;
        this.screenShake.offset.x = shake * (Math.random() - 0.5);
        this.screenShake.offset.y = shake * (Math.random() - 0.5);
      } else {
        this.screenShake.duration = 0;
        this.screenShake.offset = { x: 0, y: 0 };
      }
    }
  }
  
  // 创建粒子效果
  createParticles(x, y, type = 'jump') {
    const particleConfigs = {
      jump: {
        count: 8,
        color: '#ffffff',
        size: 3,
        speed: 2,
        lifetime: 500,
        spread: Math.PI
      },
      land: {
        count: 12,
        color: '#ffdd88',
        size: 4,
        speed: 3,
        lifetime: 600,
        spread: Math.PI * 0.8
      },
      collect: {
        count: 15,
        color: '#ffaa00',
        size: 5,
        speed: 4,
        lifetime: 800,
        spread: Math.PI * 2
      }
    };
    
    const config = particleConfigs[type];
    
    for (let i = 0; i < config.count; i++) {
      const angle = (config.spread / config.count) * i - config.spread / 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * config.speed * (0.5 + Math.random() * 0.5),
        vy: Math.sin(angle) * config.speed * (0.5 + Math.random() * 0.5),
        size: config.size,
        color: config.color,
        lifetime: config.lifetime,
        maxLifetime: config.lifetime,
        alpha: 1
      });
    }
  }
  
  // 更新粒子
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(particle => {
      particle.lifetime -= deltaTime * 1000;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // 重力
      particle.alpha = particle.lifetime / particle.maxLifetime;
      
      return particle.lifetime > 0;
    });
  }
  
  // 渲染粒子
  renderParticles(ctx) {
    this.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  
  // 触发命中停顿
  triggerHitStop(duration = 80) {
    this.hitStopTimer = duration;
    this.timeScale = 0;
  }
  
  // 更新时间缩放
  updateTimeScale(deltaTime) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= deltaTime * 1000;
      if (this.hitStopTimer <= 0) {
        this.hitStopTimer = 0;
        this.timeScale = 1;
      }
    }
  }
  
  // 主更新函数
  update(deltaTime) {
    this.updateScreenShake();
    this.updateParticles(deltaTime);
    this.updateTimeScale(deltaTime);
  }
  
  // 主渲染函数
  render(ctx) {
    this.renderParticles(ctx);
  }
  
  // 应用屏幕震动偏移
  applyShake(ctx) {
    if (this.screenShake.offset.x !== 0 || this.screenShake.offset.y !== 0) {
      ctx.translate(this.screenShake.offset.x, this.screenShake.offset.y);
    }
  }
  
  // 重置屏幕震动偏移
  resetShake(ctx) {
    if (this.screenShake.offset.x !== 0 || this.screenShake.offset.y !== 0) {
      ctx.translate(-this.screenShake.offset.x, -this.screenShake.offset.y);
    }
  }
}

// 将FeedbackManager挂载到全局对象
if (typeof window !== 'undefined') {
  window.FeedbackManager = FeedbackManager;
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.FeedbackManager = FeedbackManager;
}
