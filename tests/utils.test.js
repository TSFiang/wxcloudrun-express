/**
 * Utils 模块测试
 * 覆盖：常量、绘制工具、坐标转换、碰撞检测
 */
const { loadAllModules, createMockPlatform, createMockPlayer } = require('./helpers');

beforeAll(() => {
  loadAllModules();
});

describe('常量', () => {
  test('SCREEN_WIDTH = 375', () => {
    expect(window.SCREEN_WIDTH).toBe(375);
  });

  test('SCREEN_HEIGHT = 667', () => {
    expect(window.SCREEN_HEIGHT).toBe(667);
  });

  test('BEAN_COLORS 是7种颜色的数组', () => {
    expect(window.BEAN_COLORS).toHaveLength(7);
    expect(window.BEAN_COLORS[0]).toMatch(/^#/);
  });

  test('MACARON_COLORS 是8种颜色的数组', () => {
    expect(window.MACARON_COLORS).toHaveLength(8);
  });
});

describe('createImage', () => {
  test('浏览器环境返回 Image 对象', () => {
    const img = window.createImage();
    expect(img).toBeDefined();
    expect(img).toHaveProperty('src');
  });
});

describe('fillRoundRect', () => {
  test('正确调用 Canvas 路径方法', () => {
    const ctx = global.window.canvas.getContext('2d');
    window.fillRoundRect(ctx, 10, 20, 100, 50, 10);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});

describe('strokeRoundRect', () => {
  test('正确调用 Canvas 描边方法', () => {
    const ctx = global.window.canvas.getContext('2d');
    window.strokeRoundRect(ctx, 10, 20, 100, 50, 10);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('drawRoundRect', () => {
  test('填充 + 描边 + 阴影完整绘制', () => {
    const ctx = global.window.canvas.getContext('2d');
    window.drawRoundRect(ctx, 10, 20, 100, 50, 10, '#ffffff', '#333333', 2);

    expect(ctx.fillStyle).toBe('#ffffff');
    expect(ctx.strokeStyle).toBe('#333333');
    expect(ctx.lineWidth).toBe(2);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  test('不传描边参数时只填充', () => {
    const ctx = global.window.canvas.getContext('2d');
    window.drawRoundRect(ctx, 10, 20, 100, 50, 10, '#ffffff');

    expect(ctx.fillStyle).toBe('#ffffff');
  });
});

describe('eventToCanvas', () => {
  test('浏览器环境正确转换坐标', () => {
    global.window.canvasScale = 2;
    const pos = window.eventToCanvas(100, 200);
    // canvas.getBoundingClientRect 返回 {left:0, top:0}
    // 所以 x = (100 - 0) / 2 = 50
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(100);
  });

  test('scale=1 时坐标不变', () => {
    global.window.canvasScale = 1;
    const pos = window.eventToCanvas(50, 100);
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(100);
  });
});

describe('isInArea', () => {
  const area = { startX: 10, startY: 20, endX: 100, endY: 80 };

  test('区域内点返回 true', () => {
    expect(window.isInArea(50, 50, area)).toBe(true);
  });

  test('边界点返回 true', () => {
    expect(window.isInArea(10, 20, area)).toBe(true);
    expect(window.isInArea(100, 80, area)).toBe(true);
  });

  test('区域外点返回 false', () => {
    expect(window.isInArea(5, 50, area)).toBe(false);
    expect(window.isInArea(50, 10, area)).toBe(false);
    expect(window.isInArea(150, 50, area)).toBe(false);
    expect(window.isInArea(50, 100, area)).toBe(false);
  });

  test('四个角都测试', () => {
    expect(window.isInArea(10, 20, area)).toBe(true);   // 左上
    expect(window.isInArea(100, 20, area)).toBe(true);  // 右上
    expect(window.isInArea(10, 80, area)).toBe(true);   // 左下
    expect(window.isInArea(100, 80, area)).toBe(true);  // 右下
  });
});

describe('capsulePlatformCollision', () => {
  test('玩家在平台上应碰撞', () => {
    const player = createMockPlayer({ x: 120, y: 320 }); // size=30, bottom=350
    const platform = createMockPlatform({ x: 100, y: 350, size: 80 });
    // cx=135, radius=15, platformLeft=100, platformRight=180
    // closestX=135, distX=0 < 15 ✓
    // bottomY=350, distY=350-350=0, -2<=0<=5 ✓
    expect(window.capsulePlatformCollision(player, platform)).toBe(true);
  });

  test('玩家未到达平台不应碰撞', () => {
    const player = createMockPlayer({ x: 0, y: 320 });
    const platform = createMockPlatform({ x: 200, y: 350, size: 80 });
    // cx=15, radius=15, platformLeft=200, closestX=200, distX=185 > 15
    expect(window.capsulePlatformCollision(player, platform)).toBe(false);
  });

  test('玩家过高不应碰撞', () => {
    const player = createMockPlayer({ x: 120, y: 200 }); // bottom=230, far above platform
    const platform = createMockPlatform({ x: 100, y: 350, size: 80 });
    expect(window.capsulePlatformCollision(player, platform)).toBe(false);
  });

  test('玩家过低不应碰撞', () => {
    const player = createMockPlayer({ x: 120, y: 400 }); // bottom=430, below platform
    const platform = createMockPlatform({ x: 100, y: 350, size: 80 });
    expect(window.capsulePlatformCollision(player, platform)).toBe(false);
  });

  test('山形平台只有中间可站立', () => {
    const player = createMockPlayer({ x: 45, y: 320 }); // cx=60, radius=15
    const platform = createMockPlatform({ x: 0, y: 350, size: 120, type: 'mountain' });
    // mountain: pLeft=0+120*0.3=36, pRight=0+120*0.7=84
    // closestX=max(36, min(60,84))=60, distX=0 < 15 ✓
    expect(window.capsulePlatformCollision(player, platform)).toBe(true);
  });

  test('山形平台边缘不可站立', () => {
    const player = createMockPlayer({ x: -5, y: 320 }); // cx=10
    const platform = createMockPlatform({ x: 0, y: 350, size: 120, type: 'mountain' });
    // pLeft=36, closestX=36, distX=26 > 15
    expect(window.capsulePlatformCollision(player, platform)).toBe(false);
  });
});
