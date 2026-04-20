/**
 * 集成测试
 * 覆盖完整游戏流程：开始→跳跃→落地→收集→消除→道具→结束→复活
 */
const { loadAllModules, resetGame } = require('./helpers');

beforeAll(() => {
  loadAllModules();
});

beforeEach(() => {
  resetGame();
  global._setDateNow(1700000000000);
});

describe('完整游戏流程', () => {
  test('开始游戏 → 跳跃 → 落地 → 收集', () => {
    const db = GameGlobal.databus;

    // 1. 开始游戏
    db.startGame();
    expect(db.gameState).toBe('playing');
    expect(db.platforms).toHaveLength(12);

    // 2. 跳过倒计时
    db.gameStartTime = Date.now() - 1000;
    db.isGameStarted = true;

    // 3. 跳跃
    db.jump(60);
    expect(db.player.isJumping).toBe(true);

    // 4. 模拟落地（手动设置到第二个平台上方）
    const target = db.platforms[1];
    db.player.x = target.x + target.size / 2 - 15;
    db.player.y = target.y - 35; // 给一帧重力/下落留出空间
    db.player.velocityY = 4; // 向下

    // 运行碰撞检测
    db.updatePlayer(1/60);

    // 玩家应该落在平台上
    expect(db.player.isJumping).toBe(false);
    expect(db.score).toBeGreaterThan(0); // 落地得分
  });

  test('连续跳跃 → 收集3个同色 → 消除 → 获得道具', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.isGameStarted = true;

    const totalItemsBefore = db.items.shield + db.items.rainbow + db.items.doubleScore + db.items.extraBean;

    // 手动收集3个同色拼豆
    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');

    // 验证消除
    const redCount = db.collectedBeans.filter(c => c === '#FF6B6B').length;
    expect(redCount).toBeLessThan(3);

    // 验证得分增加
    expect(db.score).toBeGreaterThanOrEqual(10);

    // 验证碎片增加
    expect(db.beanPieces).toBeGreaterThanOrEqual(1);

    // 验证获得道具
    const totalItemsAfter = db.items.shield + db.items.rainbow + db.items.doubleScore + db.items.extraBean;
    expect(totalItemsAfter).toBeGreaterThan(totalItemsBefore);
  });

  test('使用护盾 → 掉落 → 护盾保护', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.isGameStarted = true;

    // 激活护盾
    db.items.shield = 1;
    db.useItem('shield');
    expect(db.hasShield).toBe(true);

    // 模拟掉落
    db.player.y = 9999;
    db.player.isJumping = true;
    db.updatePlayer(1/60);

    // 护盾保护，游戏继续
    expect(db.gameState).toBe('playing');
    expect(db.hasShield).toBe(false);
  });

  test('使用双倍分数 → 消除获得双倍', () => {
    const db = GameGlobal.databus;
    db.startGame();

    // 激活双倍
    db.items.doubleScore = 1;
    db.useItem('doubleScore');
    expect(db.doubleScoreActive).toBe(true);

    // 收集3个同色消除（双倍下应该+20）
    db.score = 0;
    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');
    db.collectBean('#FF6B6B');

    expect(db.score).toBe(20); // 双倍消除分
  });

  test('使用彩虹道具 → 凑齐消除', () => {
    const db = GameGlobal.databus;

    // 先收集2个同色
    db.collectedBeans = ['#FF6B6B', '#FF6B6B'];

    // 使用彩虹
    db.items.rainbow = 1;
    db.useItem('rainbow');

    // 应该消除成功，收集栏不再有3个红色
    const redCount = db.collectedBeans.filter(c => c === '#FF6B6B').length;
    expect(redCount).toBeLessThan(3);
  });

  test('游戏结束 → 看广告复活 → 继续游戏', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.isGameStarted = true;
    db.score = 42;

    // 模拟游戏结束（无护盾）
    db.hasShield = false;
    db.player.y = 9999;
    db.player.isJumping = true;
    db.updatePlayer(1/60);

    expect(db.gameState).toBe('gameOver');
    expect(db.highScore).toBe(42);

    // 复活
    db.revive();
    expect(db.gameState).toBe('playing');
    expect(db.score).toBe(42); // 分数保留
  });

  test('多次消除连锁', () => {
    const db = GameGlobal.databus;

    // 收集6个同色，应该触发2次消除
    const beforePieces = db.beanPieces;
    for (let i = 0; i < 6; i++) {
      db.collectBean('#4ECDC4');
    }

    expect(db.beanPieces).toBe(beforePieces + 2); // 2次消除
  });

  test('平台移动导致玩家掉落', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.isGameStarted = true;

    // 只保留一个平台，避免重新落到其他平台上
    const plat = db.platforms[1];
    db.platforms = [plat];
    db.player.x = plat.x + 20;
    db.player.y = plat.y - 30;
    db.player.isJumping = false;
    db.player.currentPlatform = plat;

    // 平台远离玩家
    db.player.x = 50;
    plat.x = 300;

    db.updatePlayer(1/60);

    // 玩家应该开始掉落
    expect(db.player.isJumping).toBe(true);
  });
});

describe('难度递进测试', () => {
  test('0分 → 新手难度', () => {
    const db = GameGlobal.databus;
    db.score = 0;
    const d = db._getDifficulty();
    expect(d.speed).toBe(0.6);
    expect(d.gap).toBe(70);
  });

  test('30分 → 适应期', () => {
    const db = GameGlobal.databus;
    db.score = 30;
    const d = db._getDifficulty();
    expect(d.speed).toBe(0.8);
  });

  test('80分 → 成长期', () => {
    const db = GameGlobal.databus;
    db.score = 80;
    const d = db._getDifficulty();
    expect(d.speed).toBe(1.0);
  });

  test('150分 → 进阶期', () => {
    const db = GameGlobal.databus;
    db.score = 150;
    const d = db._getDifficulty();
    expect(d.speed).toBe(1.5);
  });

  test('500分 → 大师期', () => {
    const db = GameGlobal.databus;
    db.score = 500;
    const d = db._getDifficulty();
    expect(d.speed).toBe(3.0);
  });

  test('难度单调递增', () => {
    const db = GameGlobal.databus;
    let prevSpeed = 0;
    [0, 30, 80, 150, 300, 500, 800, 9999].forEach(score => {
      db.score = score;
      const d = db._getDifficulty();
      expect(d.speed).toBeGreaterThanOrEqual(prevSpeed);
      prevSpeed = d.speed;
    });
  });
});

describe('边界条件测试', () => {
  test('连续跳跃不会叠加', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.gameStartTime = Date.now() - 1000;
    db.isGameStarted = true;
    db.player.isJumping = true; // 已在跳跃中

    const oldVy = db.player.velocityY;
    db.jump(50);

    // 在空中不能再次跳跃（除非有土狼时间）
    // 第一次 jump 设置了 coyoteTimer=0，所以 tryJump 会检查
    // isJumping=true 且 coyoteTimer=0，应该不能跳
  });

  test('收集栏满时移除最早的', () => {
    const db = GameGlobal.databus;
    // 收集7个不同颜色（maxCollected=6）
    const colors = ['#1', '#2', '#3', '#4', '#5', '#6', '#7'];
    colors.forEach(c => db.collectBean(c));

    expect(db.collectedBeans.length).toBeLessThanOrEqual(6);
    expect(db.collectedBeans).not.toContain('#1'); // 最早的被移除
  });

  test('0分不更新最高分', () => {
    const db = GameGlobal.databus;
    db.highScore = 100;
    db.score = 0;
    db.hasShield = false;
    db.gameOver();

    expect(db.highScore).toBe(100);
  });

  test('平台数量不会无限增长', () => {
    const db = GameGlobal.databus;
    db.startGame();
    db.isGameStarted = true;
    db.gameStartTime = Date.now() - 1000;

    // 运行大量帧
    for (let i = 0; i < 200; i++) {
      db.updatePlatforms();
    }

    // 平台应该被清理，不会无限增长
    expect(db.platforms.length).toBeLessThan(50);
  });
});
