/**
 * FeedbackManager 反馈系统测试
 * 覆盖：屏幕震动、粒子系统（含对象池）、命中停顿
 */
const { loadAllModules, mockCtx } = require('./helpers');

beforeAll(() => {
  loadAllModules();
});

describe('FeedbackManager', () => {
  let fm;

  beforeEach(() => {
    fm = new FeedbackManager();
    // 清除 mock 调用记录
    mockCtx.beginPath.mockClear();
    mockCtx.arc.mockClear();
    mockCtx.fill.mockClear();
    mockCtx.save.mockClear();
    mockCtx.restore.mockClear();
    mockCtx.translate.mockClear();
  });

  test('初始状态正确', () => {
    expect(fm.particles).toHaveLength(0);
    expect(fm.particlePool).toHaveLength(0);
    expect(fm.timeScale).toBe(1);
    expect(fm.hitStopTimer).toBe(0);
    expect(fm.screenShake.intensity).toBe(0);
  });

  describe('屏幕震动', () => {
    test('triggerScreenShake 设置震动参数', () => {
      fm.triggerScreenShake(10, 300);

      expect(fm.screenShake.intensity).toBe(10);
      expect(fm.screenShake.duration).toBe(300);
    });

    test('默认参数', () => {
      fm.triggerScreenShake();

      expect(fm.screenShake.intensity).toBe(5);
      expect(fm.screenShake.duration).toBe(200);
    });

    test('震动结束后 offset 归零', () => {
      fm.triggerScreenShake(5, 100);
      fm.screenShake.startTime = Date.now() - 200; // 已过期
      fm._updateScreenShake();

      expect(fm.screenShake.offset.x).toBe(0);
      expect(fm.screenShake.offset.y).toBe(0);
      expect(fm.screenShake.duration).toBe(0);
    });

    test('applyShake 调用 translate', () => {
      fm.screenShake.offset = { x: 3, y: -2 };
      fm.applyShake(mockCtx);

      expect(mockCtx.translate).toHaveBeenCalledWith(3, -2);
    });

    test('offset为0时不调用translate', () => {
      fm.screenShake.offset = { x: 0, y: 0 };
      fm.applyShake(mockCtx);

      expect(mockCtx.translate).not.toHaveBeenCalled();
    });

    test('resetShake 恢复偏移', () => {
      fm.screenShake.offset = { x: 5, y: -3 };
      fm.resetShake(mockCtx);

      expect(mockCtx.translate).toHaveBeenCalledWith(-5, 3);
    });
  });

  describe('粒子系统', () => {
    test('createParticles jump 创建8个粒子', () => {
      fm.createParticles(100, 200, 'jump');
      expect(fm.particles).toHaveLength(8);
    });

    test('createParticles land 创建12个粒子', () => {
      fm.createParticles(100, 200, 'land');
      expect(fm.particles).toHaveLength(12);
    });

    test('createParticles collect 创建15个粒子', () => {
      fm.createParticles(100, 200, 'collect');
      expect(fm.particles).toHaveLength(15);
    });

    test('createParticles match 创建20个粒子', () => {
      fm.createParticles(100, 200, 'match');
      expect(fm.particles).toHaveLength(20);
    });

    test('粒子有正确的初始位置', () => {
      fm.createParticles(50, 80, 'jump');
      fm.particles.forEach(p => {
        expect(p.x).toBe(50);
        expect(p.y).toBe(80);
      });
    });

    test('粒子有速度', () => {
      fm.createParticles(0, 0, 'jump');
      fm.particles.forEach(p => {
        expect(typeof p.vx).toBe('number');
        expect(typeof p.vy).toBe('number');
      });
    });

    test('粒子生命周期递减', () => {
      fm.createParticles(0, 0, 'jump');
      const beforeLifetime = fm.particles[0].lifetime;
      fm._updateParticles(0.016); // ~1 frame at 60fps

      expect(fm.particles[0].lifetime).toBeLessThan(beforeLifetime);
    });

    test('粒子过期后被回收到池中', () => {
      fm.createParticles(0, 0, 'jump');
      const poolBefore = fm.particlePool.length;

      // 设置所有粒子即将过期
      fm.particles.forEach(p => { p.lifetime = -1; });
      fm._updateParticles(0.016);

      expect(fm.particles).toHaveLength(0);
      expect(fm.particlePool.length).toBeGreaterThan(poolBefore);
    });

    test('对象池复用粒子', () => {
      // 创建并回收
      fm.createParticles(0, 0, 'jump');
      fm.particles.forEach(p => { p.lifetime = -1; });
      fm._updateParticles(0.016);

      const poolSize = fm.particlePool.length;

      // 再次创建，应该从池中取
      fm.createParticles(0, 0, 'jump');
      expect(fm.particlePool.length).toBeLessThan(poolSize);
    });

    test('renderParticles 绘制粒子', () => {
      fm.createParticles(100, 200, 'collect');
      fm._renderParticles(mockCtx);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('alpha 随生命周期变化', () => {
      fm.createParticles(0, 0, 'jump');
      const p = fm.particles[0];
      const maxLifetime = p.maxLifetime;

      // 半生命周期时 alpha ≈ 0.5
      p.lifetime = maxLifetime / 2;
      p.alpha = p.lifetime / p.maxLifetime;
      expect(p.alpha).toBeCloseTo(0.5, 1);
    });

    test('粒子受重力影响 vy 增加', () => {
      fm.createParticles(0, 0, 'jump');
      const p = fm.particles[0];
      const oldVy = p.vy;

      fm._updateParticles(0.016);

      expect(p.vy).toBeGreaterThan(oldVy); // vy += 0.1
    });
  });

  describe('命中停顿', () => {
    test('triggerHitStop 设置停顿', () => {
      fm.triggerHitStop(100);

      expect(fm.hitStopTimer).toBe(100);
      expect(fm.timeScale).toBe(0);
    });

    test('默认持续时间 80ms', () => {
      fm.triggerHitStop();
      expect(fm.hitStopTimer).toBe(80);
    });

    test('停顿结束后恢复 timeScale', () => {
      fm.triggerHitStop(50);
      fm._updateTimeScale(0.1); // 100ms > 50ms

      expect(fm.hitStopTimer).toBe(0);
      expect(fm.timeScale).toBe(1);
    });

    test('停顿中 timeScale=0', () => {
      fm.triggerHitStop(100);
      fm._updateTimeScale(0.01); // 10ms < 100ms

      expect(fm.timeScale).toBe(0);
    });
  });

  describe('主循环接口', () => {
    test('update 更新所有子系统', () => {
      fm.triggerScreenShake(5, 200);
      fm.createParticles(0, 0, 'jump');
      fm.triggerHitStop(100);

      fm.update(0.016);

      // 粒子应该被更新
      fm.particles.forEach(p => {
        expect(p.lifetime).toBeLessThan(p.maxLifetime);
      });
    });

    test('render 调用粒子渲染', () => {
      fm.createParticles(0, 0, 'jump');
      fm.render(mockCtx);

      expect(mockCtx.save).toHaveBeenCalled();
    });
  });
});
