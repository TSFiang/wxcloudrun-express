// 按钮系统重构方案

## 问题分析

1. **按钮位置错位**：用户点击"开始游戏"无效，但在"我的图鉴"位置才能点击
2. **按钮名称不一致**：btnAreas中定义的按钮名称可能不一致
3. **渲染和点击检测不匹配**：按钮渲染位置和点击检测位置可能不一致

## 根本原因

1. **按钮区域定义不清晰**：
   - btnAreas中定义了startGame，但在某些地方可能使用了错误的名称
   - 按钮的Y坐标计算可能有误

2. **缺少统一的按钮管理**：
   - 每个界面的按钮分散定义
   - 没有统一的按钮ID系统

## 解决方案

### 1. 统一按钮区域定义

```javascript
// 按钮区域定义 - 使用统一的命名和坐标系统
this.btnAreas = {
  // 主界面按钮 (Y坐标从300开始，每个按钮间隔80)
  startGame: {
    startX: 87.5,
    startY: 300,
    endX: 287.5,
    endY: 350,
  },
  collection: {
    startX: 87.5,
    startY: 380,
    endX: 287.5,
    endY: 430,
  },
  leaderboard: {
    startX: 87.5,
    startY: 460,
    endX: 287.5,
    endY: 510,
  },
  settings: {
    startX: 20,
    startY: 20,
    endX: 80,
    endY: 60,
  },
  
  // 游戏中按钮
  pause: {
    startX: 315,
    startY: 40,
    endX: 355,
    endY: 80,
  },
  
  // 游戏结束按钮
  restart: {
    startX: 107.5,
    startY: 350,
    endX: 267.5,
    endY: 400,
  },
  share: {
    startX: 107.5,
    startY: 420,
    endX: 267.5,
    endY: 470,
  },
  watchAd: {
    startX: 107.5,
    startY: 490,
    endX: 267.5,
    endY: 540,
  },
  backToMenu: {
    startX: 20,
    startY: 20,
    endX: 100,
    endY: 60,
  },
  
  // 道具按钮
  shield: {
    startX: 40,
    startY: 507,
    endX: 80,
    endY: 547,
  },
  rainbow: {
    startX: 100,
    startY: 507,
    endX: 140,
    endY: 547,
  },
  doubleScore: {
    startX: 160,
    startY: 507,
    endX: 200,
    endY: 547,
  },
  extraBean: {
    startX: 220,
    startY: 507,
    endX: 260,
    endY: 547,
  },
};
```

### 2. 统一按钮渲染方法

```javascript
// 绘制按钮 - 确保渲染和点击检测使用相同的区域
drawButton(ctx, text, area) {
  if (!area) {
    console.error('Button area is undefined for text:', text);
    return;
  }
  
  // 绘制按钮背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(area.startX, area.startY, area.endX - area.startX, area.endY - area.startY);
  
  // 绘制按钮边框
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(area.startX, area.startY, area.endX - area.startX, area.endY - area.startY);
  
  // 绘制按钮文本
  this.setFont(ctx, 20, '#333333');
  ctx.textAlign = 'center';
  ctx.fillText(text, (area.startX + area.endX) / 2, (area.startY + area.endY) / 2 + 5);
}
```

### 3. 统一按钮点击检测

```javascript
// 检查点是否在区域内
isInArea(x, y, area) {
  if (!area) {
    console.error('Button area is undefined');
    return false;
  }
  
  return x >= area.startX && x <= area.endX && y >= area.startY && y <= area.endY;
}
```

### 4. 添加调试日志

```javascript
// 处理主界面触摸
handleMenuTouch(x, y) {
  console.log('handleMenuTouch:', x, y);
  console.log('startGame area:', this.btnAreas.startGame);
  console.log('collection area:', this.btnAreas.collection);
  
  if (this.isInArea(x, y, this.btnAreas.startGame)) {
    console.log('startGame button clicked');
    this.emit('startGame');
  } else if (this.isInArea(x, y, this.btnAreas.collection)) {
    console.log('collection button clicked');
    this.emit('collection');
  } else if (this.isInArea(x, y, this.btnAreas.leaderboard)) {
    console.log('leaderboard button clicked');
    this.emit('leaderboard');
  } else if (this.isInArea(x, y, this.btnAreas.settings)) {
    console.log('settings button clicked');
    this.emit('settings');
  }
}
```

## 实施步骤

1. 重新定义所有按钮区域，使用统一的坐标系统
2. 确保所有按钮渲染使用相同的区域定义
3. 添加调试日志，帮助定位问题
4. 测试所有按钮功能

## 预防措施

1. 使用统一的按钮ID系统
2. 添加按钮区域验证
3. 添加调试日志
4. 定期测试所有按钮功能