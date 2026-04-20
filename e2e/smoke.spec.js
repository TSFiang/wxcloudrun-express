const { test, expect } = require('@playwright/test');

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 667;

async function clickCanvas(page, x, y) {
  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas bounding box not found');

  const clickX = box.x + (x / DESIGN_WIDTH) * box.width;
  const clickY = box.y + (y / DESIGN_HEIGHT) * box.height;
  await page.mouse.click(clickX, clickY);
}

async function holdCanvas(page, x, y, ms = 120) {
  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas bounding box not found');

  const holdX = box.x + (x / DESIGN_WIDTH) * box.width;
  const holdY = box.y + (y / DESIGN_HEIGHT) * box.height;
  await page.mouse.move(holdX, holdY);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test('页面真实启动后可以开始、跳跃、结束并复活', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.error')).toHaveCount(0);
  await expect(page.locator('#gameCanvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.GameGlobal && GameGlobal.main && GameGlobal.databus))).toBe(true);

  // 1. 从真实页面点击“开始游戏”
  await clickCanvas(page, 187.5, 298.5);
  await expect.poll(() => page.evaluate(() => GameGlobal.databus.gameState)).toBe('playing');

  // 2. 跳过倒计时与教程，使用真实鼠标按下/抬起触发跳跃
  await page.evaluate(() => {
    GameGlobal.databus.gameStartTime = Date.now() - 1000;
    GameGlobal.databus.isGameStarted = true;
    GameGlobal.databus.isFirstPlay = false;
    GameGlobal.databus.settings.showTutorial = false;
  });

  await holdCanvas(page, 187.5, 300, 150);
  await expect.poll(() => page.evaluate(() => GameGlobal.databus.player.isJumping)).toBe(true);

  // 3. 强制进入 game over
  await page.evaluate(() => {
    const db = GameGlobal.databus;
    db.hasShield = false;
    db.player.y = 9999;
    db.player.isJumping = true;
    db.updatePlayer(1 / 60);
  });
  await expect.poll(() => page.evaluate(() => GameGlobal.databus.gameState)).toBe('gameOver');

  // 4. 点击“看广告复活”并验证回到 playing
  await clickCanvas(page, 187.5, 493.5);
  await expect.poll(() => page.evaluate(() => GameGlobal.databus.gameState), { timeout: 5000 }).toBe('playing');
});
