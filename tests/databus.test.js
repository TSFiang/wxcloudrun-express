/**
 * DataBus 核心游戏逻辑测试
 * 覆盖：状态管理、玩家物理、平台生成、跳跃、碰撞、收集、道具
 */
const { loadAllModules, resetGame, createMockPlatform, createMockPlayer } = require('./helpers');

beforeAll(() => {
  loadAllModules();
});

beforeEach(() => {
  resetGame();
  global._setDateNow(1700000000000);
});

describe('DataBus 单例模式', () => {
  test('多次 new 返回同一实例', () => {
    const a = new DataBus();
    const b = new DataBus();
    expect(a).toBe(b);
  });
});

describe('reset 重置', () => {
  test('重置后回到 menu 状态', () => {
    const db = GameGlobal.databus;
    db.gameState = 'playing';
    db.score = 100;
    db.reset();

    expect(db.gameState).toBe('menu');
    expect(db.score).toBe(0);
    expect(db.frame).toBe(0);
    expect(db.platforms).toHaveLength(0);
    expect(db.collectedBeans).toHaveLength(0);
  });

  test('重置后保留已有道具（非初始）', () => {
    const db = GameGlobal.databus;
    db.items = { shield: 5, rainbow: 3, doubleScore: 2, extraBean: 1 };
    db.reset();

    expect(db.items.shield).toBe(5);
    expect(db.items.rainbow).toBe(3);
  });

  test('全零道具时给初始道具（各1个）', () => {
    const db = GameGlobal.databus;
    db.items = { shield: 0, rainbow: 0, doubleScore: 0, extraBean: 0 };
    db.reset();

    expect(db.items.shield).toBe(1);
    expect(db.items.rainbow).toBe(1);
  });

  test('重置后帧计数器归零', () => {
    const db = GameGlobal.databus;
    db._standDelayFrames = 10;
    db._standDelayActive = true;
    db.reset();

    expect(db._standDelayFrames).toBe(0);
    expect(db._standDelayActive).toBe(false);
  });
});

describe('startGame 开始游戏', () => {
  test('状态变为 playing', () => {
    const db = GameGlobal.databus;
    db.startGame();
    expect(db.gameState).toBe('playing');
  });

  test('初始化了12个平台', () => {
    const db = GameGlobal.databus;
    db.startGame();
    expect(db.platforms).toHaveLength(12);
  });

  test('第一个平台是山形', () => {
    const db = GameGlobal.databus;
    db.startGame();
    expect(db.platforms[0].type).toBe('mountain');
  });

  test('前3个平台都是 normal（教学期）', () => {
    const db = GameGlobal.databus;
    db.startGame();
    expect(db.platforms[1].type).toBe('normal');
    expect(db.platforms[2].type).toBe('normal');
  });

  test('玩家在第一个平台上', () => {
    const db = GameGlobal.databus;
    db.startGame();
    const p = db.player;
    const plat = db.platforms[0];
    // 玩家应该在平台上方
    expect(p.y).toBe(plat.y - p.size);
  });

  test('倒计时设置正确', () => {
    const db = GameGlobal.databus;
    db.startGame();
    expect(db.gameStartTime).toBeGreaterThan(Date.now());
    expect(db.isGameStarted).toBe(false);
  });
});

describe('jump 跳跃系统', () => {
  test('跳跃设置 isJumping=true', () => {
    const db = GameGlobal.databus;
    db.startGame();
    // 倒计时结束后才能跳
    db.gameStartTime = Date.now() - 1000;
    db.jump(50);

    expect(db.player.isJumping).toBe(true);
    expect(db.player.state).toBe('jump');
  });

  test('跳跃产生正确的速度', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.jump(80);

    expect(db.player.velocityY).toBe(-80 * db.jumpVelocityScale);
    expect(db.player.velocityX).toBe(80 * db.jumpHorizontalScale);
  });

  test('倒计时期间不能跳跃', () => {
    const db = GameGlobal.databus;
    db.startGame();
    // gameStartTime 在未来
    db.jump(50);

    expect(db.player.isJumping).toBe(false);
  });

  test('输入缓冲：跳跃成功执行', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.player.isJumping = false;
    db.jump(50);

    // 跳跃应该成功执行
    expect(db.player.isJumping).toBe(true);
    expect(db.player.velocityY).toBe(-50 * db.jumpVelocityScale);
  });
});

describe('updatePlayer 玩家更新', () => {
  test('跳跃中应用重力', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.player.isJumping = true;
    db.player.velocityY = -5;
    db.player.y = 200;
    db.player.x = 50;

    const oldVy = db.player.velocityY;
    db.updatePlayer(1/60);

    expect(db.player.velocityY).toBe(oldVy + db.gravity);
  });

  test('掉落出屏幕触发 gameOver', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.player.y = 9999; // 远超屏幕
    db.player.isJumping = true;

    db.updatePlayer(1/60);

    expect(db.gameState).toBe('gameOver');
  });

  test('帧计数器恢复站立状态', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db._standDelayActive = true;
    db._standDelayFrames = 1;

    db.updatePlayer(1/60);

    expect(db.player.state).toBe('stand');
    expect(db._standDelayActive).toBe(false);
  });
});

describe('gameOver 游戏结束', () => {
  test('正常结束设置状态', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.score = 100;
    db.hasShield = false;
    db.gameOver();

    expect(db.gameState).toBe('gameOver');
  });

  test('更新最高分', () => {
    const db = GameGlobal.databus;
    db.highScore = 50;
    db.score = 100;
    db.hasShield = false;
    db.gameOver();

    expect(db.highScore).toBe(100);
  });

  test('不更新更低的分数', () => {
    const db = GameGlobal.databus;
    db.highScore = 200;
    db.score = 100;
    db.hasShield = false;
    db.gameOver();

    expect(db.highScore).toBe(200);
  });

  test('护盾保护不结束游戏', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.hasShield = true;
    db.score = 100;

    db.gameOver();

    expect(db.gameState).toBe('playing');
    expect(db.hasShield).toBe(false);
  });
});

describe('collectBean 收集系统', () => {
  test('收集拼豆加入数组', () => {
    const db = GameGlobal.databus;
    db.collectBean('#FF6B6B');
    expect(db.collectedBeans).toContain('#FF6B6B');
  });

  test('3个相同颜色触发消除', () => {
    const db = GameGlobal.databus;
    const beforeScore = db.score;

    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');

    // 消除后应该加分
    expect(db.score).toBeGreaterThan(beforeScore);
    // 消除后该颜色应该少于3个
    const redCount = db.collectedBeans.filter(c => c === '#FF6B6B').length;
    expect(redCount).toBeLessThan(3);
  });

  test('消除增加拼豆碎片', () => {
    const db = GameGlobal.databus;
    const before = db.beanPieces;

    db.collectBean('#4ECDC4');
    db.collectBean('#4ECDC4');
    db.collectBean('#4ECDC4');

    expect(db.beanPieces).toBe(before + 1);
  });

  test('消除奖励一个道具', () => {
    const db = GameGlobal.databus;
    const totalBefore = db.items.shield + db.items.rainbow + db.items.doubleScore + db.items.extraBean;

    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');

    const totalAfter = db.items.shield + db.items.rainbow + db.items.doubleScore + db.items.extraBean;
    expect(totalAfter).toBeGreaterThan(totalBefore);
  });

  test('超过 maxCollected 移除最早的', () => {
    const db = GameGlobal.databus;
    // 收集6个不同颜色（不触发消除）
    const colors = ['#1', '#2', '#3', '#4', '#5', '#6', '#7'];
    colors.forEach(c => db.collectBean(c));

    expect(db.collectedBeans.length).toBeLessThanOrEqual(db.maxCollected);
  });

  test('3个不同颜色也送道具', () => {
    const db = GameGlobal.databus;
    const totalBefore = db.items.shield + db.items.rainbow + db.items.doubleScore + db.items.extraBean;

    db.collectBean('#111111');
    db.collectBean('#222222');
    db.collectBean('#333333');

    const totalAfter = db.items.shield + db.items.rainbow + db.items.doubleScore + db.items.extraBean;
    expect(totalAfter).toBeGreaterThan(totalBefore);
  });
});

describe('道具系统', () => {
  test('useItem shield 激活护盾', () => {
    const db = GameGlobal.databus;
    db.items.shield = 1;
    const result = db.useItem('shield');

    expect(result).toBe(true);
    expect(db.hasShield).toBe(true);
    expect(db.items.shield).toBe(0);
  });

  test('useItem doubleScore 激活双倍', () => {
    const db = GameGlobal.databus;
    db.items.doubleScore = 1;
    db.useItem('doubleScore');

    expect(db.doubleScoreActive).toBe(true);
    expect(db.doubleScoreEndTime).toBeGreaterThan(Date.now());
  });

  test('useItem extraBean 增加碎片', () => {
    const db = GameGlobal.databus;
    db.items.extraBean = 1;
    const before = db.beanPieces;
    db.useItem('extraBean');

    expect(db.beanPieces).toBe(before + 3);
    expect(db.items.extraBean).toBe(0);
  });

  test('useItem rainbow 收集栏为空也能用', () => {
    const db = GameGlobal.databus;
    db.items.rainbow = 1;
    db.collectedBeans = [];
    db.score = 0;
    const result = db.useItem('rainbow');

    expect(result).toBe(true);
    // 彩虹添加3个同色 → 立即消除 → 分数增加
    expect(db.score).toBeGreaterThan(0);
  });

  test('useItem 数量为0返回false', () => {
    const db = GameGlobal.databus;
    db.items.shield = 0;
    const result = db.useItem('shield');

    expect(result).toBe(false);
    expect(db.hasShield).toBe(false);
  });
});

describe('难度系统', () => {
  test('_getDifficulty 0分返回新手参数', () => {
    const db = GameGlobal.databus;
    db.score = 0;
    const d = db._getDifficulty();

    expect(d.speed).toBe(0.6);
    expect(d.gap).toBe(70);
  });

  test('_getDifficulty 高分返回高速参数', () => {
    const db = GameGlobal.databus;
    db.score = 9999;
    const d = db._getDifficulty();

    expect(d.speed).toBe(5.0);
    expect(d.gap).toBe(150);
  });

  test('_getRandomPlatformType 返回有效类型', () => {
    const db = GameGlobal.databus;
    const validTypes = ['normal', 'moving', 'bouncy', 'disappearing', 'danger'];

    for (let i = 0; i < 100; i++) {
      const type = db._getRandomPlatformType();
      expect(validTypes).toContain(type);
    }
  });
});

describe('平台生成', () => {
  test('generatePlatform 添加新平台', () => {
    const db = GameGlobal.databus;
    db.startGame();
    const count = db.platforms.length;

    db.generatePlatform();

    expect(db.platforms).toHaveLength(count + 1);
  });

  test('新平台在最后一个平台右侧', () => {
    const db = GameGlobal.databus;
    db.startGame();
    const lastX = db.platforms[db.platforms.length - 1].x;

    db.generatePlatform();

    const newLast = db.platforms[db.platforms.length - 1];
    expect(newLast.x).toBeGreaterThan(lastX);
  });

  test('平台y坐标在安全范围内', () => {
    const db = GameGlobal.databus;
    db.startGame();

    for (let i = 0; i < 20; i++) {
      db.generatePlatform();
    }

    db.platforms.forEach(p => {
      if (p.type !== 'mountain') {
        expect(p.y).toBeGreaterThanOrEqual(100);
        expect(p.y).toBeLessThanOrEqual(480);
      }
    });
  });
});

describe('updatePlatforms 平台更新', () => {
  test('平台随游戏向左移动', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.isGameStarted = true;
    db.gameStartTime = Date.now() - 1000;

    const oldX = db.platforms[1].x;
    db.updatePlatforms();

    expect(db.platforms[1].x).toBeLessThan(oldX);
  });

  test('移出屏幕的平台被清理', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.platforms.push(createMockPlatform({ x: -200, size: 80 })); // 完全在屏幕外

    db.updatePlatforms();

    // x=-200, size=80, x+size=-120 < 0, 应该被移除
    const offscreen = db.platforms.filter(p => p.x + p.size < 0);
    expect(offscreen).toHaveLength(0);
  });
});

describe('revive 复活系统', () => {
  test('复活后恢复 playing 状态', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameState = 'gameOver';
    db.score = 50;
    db.platformSpeed = 2;

    db.revive();

    expect(db.gameState).toBe('playing');
    expect(db.score).toBe(50);
    expect(db.platformSpeed).toBe(2);
  });

  test('复活后玩家在平台上', () => {
    const db = GameGlobal.databus;
    db.startGame();

    db.revive();

    expect(db.player.isJumping).toBe(false);
    expect(db.player.velocityY).toBe(0);
    expect(db.player.state).toBe('stand');
  });
});

describe('图鉴系统', () => {
  test('collectCollectionItem 收集新道具', () => {
    const db = GameGlobal.databus;
    const item = { category: 'animals', item: '🐶' };
    const result = db.collectCollectionItem(item);

    expect(result).toBe(true);
    expect(db.beanCollection.animals.collected).toContain('🐶');
    expect(db.score).toBe(5); // 加5分
  });

  test('重复收集返回 false', () => {
    const db = GameGlobal.databus;
    db.beanCollection.animals.collected.push('🐶');

    const item = { category: 'animals', item: '🐶' };
    const result = db.collectCollectionItem(item);

    expect(result).toBe(false);
  });

  test('集齐全部解锁', () => {
    const db = GameGlobal.databus;
    // 收集7个，再收1个就满
    db.beanCollection.animals.collected = ['🐶','🐱','🐰','🦊','🐻','🐼','🐨'];

    db.collectCollectionItem({ category: 'animals', item: '🦁' });

    expect(db.beanCollection.animals.unlocked).toBe(true);
  });
});
