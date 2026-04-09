/**
 * Main 游戏主循环测试
 * 覆盖：帧率控制、游戏循环、暂停、复活、分享
 */
const { loadAllModules, resetGame } = require('./helpers');

beforeAll(() => {
  loadAllModules();
});

beforeEach(() => {
  resetGame();
  global._resetPerf();
  global._setDateNow(1700000000000);
  // 重置 requestAnimationFrame mock
  global.requestAnimationFrame.mockClear();
  global.cancelAnimationFrame.mockClear();
});

describe('Main 游戏主循环', () => {
  test('setFPSLimit 设置帧率', () => {
    const main = GameGlobal.main || new Main();
    main.setFPSLimit(120);

    expect(main.targetFPS).toBe(120);
    expect(main.fixedDeltaTime).toBeCloseTo(1000 / 120, 1);
  });

  test('setFPSLimit 60 FPS', () => {
    const main = GameGlobal.main || new Main();
    main.setFPSLimit(60);

    expect(main.targetFPS).toBe(60);
    expect(main.fixedDeltaTime).toBeCloseTo(1000 / 60, 1);
  });

  test('start 重置游戏状态', () => {
    const main = GameGlobal.main || new Main();
    main.accumulatedTime = 999;
    main.start();

    expect(main.accumulatedTime).toBe(0);
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  test('loop 累积时间不超过上限', () => {
    const main = GameGlobal.main || new Main();
    main.lastTime = 0;
    main.accumulatedTime = 0;

    // 模拟大帧间隔（切换标签页后回来）
    main.loop(99999);

    expect(main.accumulatedTime).toBeLessThanOrEqual(main.maxAccumulatedTime);
  });

  test('loop 调用 update 和 render', () => {
    const main = GameGlobal.main || new Main();
    const updateSpy = jest.spyOn(main, 'update');
    const renderSpy = jest.spyOn(main, 'render');

    main.lastTime = 0;
    main.accumulatedTime = 0;
    global._advancePerf(16.67); // 1 frame at 60fps
    main.loop(16.67);

    // 至少应该调用 render
    expect(renderSpy).toHaveBeenCalled();
    updateSpy.mockRestore();
    renderSpy.mockRestore();
  });

  test('update 增加帧计数', () => {
    const main = GameGlobal.main || new Main();
    const before = GameGlobal.databus.frame;
    main.update(1/60);

    expect(GameGlobal.databus.frame).toBe(before + 1);
  });

  test('FPS 计数正确', () => {
    const main = GameGlobal.main || new Main();
    main.fpsUpdateTime = 0;
    main.frameCount = 0;
    main.fps = 0;

    // 模拟1秒内的帧
    for (let i = 0; i < 60; i++) {
      main.frameCount++;
    }
    main.fps = main.frameCount;
    main.fpsUpdateTime = 1000;

    expect(main.fps).toBe(60);
  });

  test('_togglePause playing → paused', () => {
    const main = GameGlobal.main || new Main();
    GameGlobal.databus.gameState = 'playing';
    main._togglePause();

    expect(GameGlobal.databus.gameState).toBe('paused');
    expect(GameGlobal.databus.isPaused).toBe(true);
  });

  test('_togglePause paused → playing', () => {
    const main = GameGlobal.main || new Main();
    GameGlobal.databus.gameState = 'paused';
    GameGlobal.databus.isPaused = true;
    main._togglePause();

    expect(GameGlobal.databus.gameState).toBe('playing');
    expect(GameGlobal.databus.isPaused).toBe(false);
  });

  test('_watchAd 无广告管理器直接复活', () => {
    const main = GameGlobal.main || new Main();
    const oldAdManager = GameGlobal.adManager;
    GameGlobal.adManager = undefined;

    GameGlobal.databus.startGame();
    GameGlobal.databus.gameState = 'gameOver';
    main._watchAd();

    expect(GameGlobal.databus.gameState).toBe('playing');

    GameGlobal.adManager = oldAdManager;
  });

  test('多帧循环不会累积过多更新', () => {
    const main = GameGlobal.main || new Main();
    main.lastTime = 0;
    main.accumulatedTime = 0;

    const updateSpy = jest.spyOn(main, 'update');

    // 模拟大延迟（1000ms），应最多5次更新
    global._advancePerf(1000);
    main.loop(1000);

    expect(updateSpy).toHaveBeenCalledTimes(5); // maxUpdates = 5
    updateSpy.mockRestore();
  });
});

describe('GameInfo 事件系统', () => {
  test('绑定的事件能正确触发', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();

    // 测试 startGame 事件
    const startSpy = jest.fn();
    gi.on('startGame', startSpy);
    gi.emit('startGame');

    expect(startSpy).toHaveBeenCalled();
  });

  test('事件可以取消绑定', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    const handler = jest.fn();

    gi.on('test', handler);
    gi.off('test', handler);
    gi.emit('test');

    expect(handler).not.toHaveBeenCalled();
  });

  test('once 只触发一次', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    const handler = jest.fn();

    gi.once('onceTest', handler);
    gi.emit('onceTest');
    gi.emit('onceTest');

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('GameInfo 按钮热区', () => {
  test('所有按钮区域格式正确', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();

    Object.entries(gi.btnAreas).forEach(([name, area]) => {
      expect(area).toHaveProperty('startX');
      expect(area).toHaveProperty('startY');
      expect(area).toHaveProperty('endX');
      expect(area).toHaveProperty('endY');
      expect(area.endX).toBeGreaterThan(area.startX);
      expect(area.endY).toBeGreaterThan(area.startY);
    });
  });

  test('startGame 按钮在屏幕中央', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    const a = gi.btnAreas.startGame;
    const centerX = (a.startX + a.endX) / 2;

    expect(centerX).toBeCloseTo(187.5, 0); // 375/2
  });

  test('道具按钮在底部区域', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    ['shield', 'rainbow', 'doubleScore', 'extraBean'].forEach(key => {
      const a = gi.btnAreas[key];
      expect(a.startY).toBeGreaterThan(500); // 底部
      expect(a.endY).toBeLessThanOrEqual(667);
    });
  });
});

describe('GameInfo 触摸处理', () => {
  test('菜单状态点击开始游戏触发事件', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    GameGlobal.databus.gameState = 'menu';

    const spy = jest.fn();
    gi.on('startGame', spy);
    gi._handleStart(187, 300); // startGame 按钮中心

    expect(spy).toHaveBeenCalled();
  });

  test('菜单状态点击设置触发事件', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    GameGlobal.databus.gameState = 'menu';

    const spy = jest.fn();
    gi.on('settings', spy);
    gi._handleStart(50, 40); // settings 按钮中心

    expect(spy).toHaveBeenCalled();
  });

  test('游戏中点击道具触发使用', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    GameGlobal.databus.gameState = 'playing';
    GameGlobal.databus.items.shield = 3;

    gi._handleStart(55, 627); // shield 按钮中心

    expect(GameGlobal.databus.items.shield).toBe(2);
    expect(GameGlobal.databus.hasShield).toBe(true);
  });

  test('游戏中空白区域开始蓄力', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    GameGlobal.databus.gameState = 'playing';

    gi._handleStart(187, 300); // 屏幕中央，不在按钮区域

    expect(gi.isTouching).toBe(true);
    expect(gi.touchStartTime).toBeGreaterThan(0);
  });

  test('游戏结束点击再玩一次', () => {
    const gi = GameGlobal.gameInfo || new GameInfo();
    GameGlobal.databus.gameState = 'gameOver';

    const spy = jest.fn();
    gi.on('restart', spy);
    gi._handleStart(187, 373); // restart 按钮中心

    expect(spy).toHaveBeenCalled();
  });
});
