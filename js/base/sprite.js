/**
 * 游戏基础精灵类
 * 兼容 script 标签加载方式
 */
class Sprite {
  constructor(imgSrc, width, height, x, y) {
    this.img = createImage();
    if (imgSrc) this.img.src = imgSrc;

    this.width = width || 0;
    this.height = height || 0;
    this.x = x || 0;
    this.y = y || 0;
    this.visible = true;
    this.isActive = true;
  }

  /**
   * 绘制精灵
   */
  render(ctx) {
    if (!this.visible) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  /**
   * 简单矩形碰撞检测
   */
  isCollideWith(sp) {
    if (!this.visible || !sp.visible) return false;
    if (!this.isActive || !sp.isActive) return false;

    const spX = sp.x + sp.width / 2;
    const spY = sp.y + sp.height / 2;

    return spX >= this.x && spX <= this.x + this.width &&
           spY >= this.y && spY <= this.y + this.height;
  }
}

if (typeof window !== 'undefined') {
  window.Sprite = Sprite;
}
if (typeof GameGlobal !== 'undefined') {
  GameGlobal.Sprite = Sprite;
}
