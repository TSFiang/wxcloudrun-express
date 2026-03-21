# Bug修复记录

## 2026-03-21

### Bug #1: 重复定义SCREEN_WIDTH和SCREEN_HEIGHT变量

**问题描述**：
- 游戏加载失败，提示"SyntaxError: Can't create duplicate variable: 'SCREEN_WIDTH'"
- 这个问题反复出现多次，每次修复后又会重新出现

**根本原因**：
- SCREEN_WIDTH和SCREEN_HEIGHT在多个文件中被重复定义
- 使用`const`定义的变量不能重复定义，导致语法错误

**修复历史**：
1. **第一次修复**：在render.js中定义SCREEN_WIDTH和SCREEN_HEIGHT，并挂载到window对象
2. **第二次修复**：在gameinfo.js中添加`const SCREEN_WIDTH = window.SCREEN_WIDTH || 375`
3. **第三次修复**：在gameinfo.js构造函数中定义局部变量
4. **第四次修复**：使用固定的设计稿尺寸，在render.js中定义，gameinfo.js中直接使用
5. **第五次修复**：在render.js中定义SCREEN_WIDTH和SCREEN_HEIGHT，在gameinfo.js中直接使用固定值375和667
6. **第六次修复（最终）**：使用sed命令批量替换，但出现了新的语法错误

**最终解决方案**：
- 在render.js中定义SCREEN_WIDTH和SCREEN_HEIGHT，并挂载到window对象
- 在gameinfo.js中直接使用固定值375和667，不再定义变量
- 手动修复sed命令导致的语法错误

**修改的文件**：
- js/render.js：定义SCREEN_WIDTH和SCREEN_HEIGHT
- js/runtime/gameinfo.js：使用固定值375和667

**预防措施**：
- 避免在多个文件中定义相同的常量
- 使用全局变量或固定值，而不是重复定义
- 添加代码审查流程，确保不会引入重复定义
- 不要使用sed命令批量替换，容易出错

---

### Bug #1.1: sed命令导致的语法错误

**问题描述**：
- 游戏加载失败，提示"SyntaxError: Unexpected number '.375'. Expected ')' to end a compound expression"
- GameInfo class not found

**根本原因**：
- 使用sed命令批量替换SCREEN_WIDTH和SCREEN_HEIGHT时，错误地将`window.SCREEN_WIDTH`替换成了`window.375`
- 导致语法错误，JavaScript引擎无法解析`window.375`

**错误示例**：
```javascript
// 错误的替换结果
ctx.drawImage(backgroundImage, 0, 0, (window.375 || 375), (window.667 || 667));

// 正确的应该是
ctx.drawImage(backgroundImage, 0, 0, 375, 667);
```

**解决方案**：
- 手动修复所有`window.375`和`window.667`为正确的固定值375和667
- 不再使用`window.SCREEN_WIDTH || 375`这样的表达式，直接使用固定值

**修改的文件**：
- js/runtime/gameinfo.js：修复所有错误的替换

**预防措施**：
- 不要使用sed命令批量替换，容易出错
- 手动检查和修改代码，确保语法正确
- 添加代码审查流程，确保不会引入语法错误

---

### Bug #2: 游戏重启后无法点击开始游戏按钮

**问题描述**：
- 第一次游玩后，退出到主菜单，"开始游戏"按钮点击不了

**根本原因**：
- backToMenu()方法只是简单地设置了gameState = 'menu'
- 没有重置游戏状态，导致游戏数据残留

**解决方案**：
- 修改backToMenu()方法，调用reset()重置游戏状态

**修改的文件**：
- js/main.js：修改backToMenu()方法

**代码修改**：
```javascript
// 修改前
backToMenu() {
  GameGlobal.databus.gameState = 'menu';
}

// 修改后
backToMenu() {
  GameGlobal.databus.reset();
}
```

---

### Bug #3: 暂停按钮无效

**问题描述**：
- 游戏中的暂停按钮点击后没有反应

**根本原因**：
- 暂停按钮点击后只是return，没有实际功能
- 没有暂停状态的处理逻辑

**解决方案**：
1. 添加pause事件发送
2. 添加pause()方法实现暂停/继续功能
3. 添加暂停状态渲染

**修改的文件**：
- js/runtime/gameinfo.js：添加pause事件发送
- js/main.js：添加pause()方法和pause事件监听器
- js/databus.js：添加isPaused属性

**代码修改**：
```javascript
// gameinfo.js
if (this.isInArea(x, y, this.btnAreas.pause)) {
  this.emit('pause'); // 发送暂停事件
  return;
}

// main.js
pause() {
  const databus = GameGlobal.databus;
  if (databus.gameState === 'playing') {
    databus.gameState = 'paused';
    databus.isPaused = true;
  } else if (databus.gameState === 'paused') {
    databus.gameState = 'playing';
    databus.isPaused = false;
  }
}
```

---

### Bug #4: 游戏节奏太快

**问题描述**：
- 玩家还没反应过来游戏就结束了
- 平台移动速度太快，难度增长太快

**根本原因**：
- 初始平台移动速度太快（2）
- 平台间距太大（80）
- 平台大小太小（60）
- 难度曲线增长太快

**解决方案**：
1. 降低初始速度：从2降低到1
2. 增加平台间距：从80增加到100
3. 增大平台大小：从60增加到80
4. 降低难度增长速度

**修改的文件**：
- js/databus.js：修改初始参数和难度曲线

---

### Bug #5: 触摸事件失效

**问题描述**：
- 按钮点击无效，触摸事件无法响应

**根本原因**：
- Canvas缩放后，触摸坐标没有正确转换
- 触摸事件绑定时机不对

**解决方案**：
1. 添加坐标转换逻辑，将屏幕坐标转换为canvas内部坐标
2. 延迟绑定触摸事件，确保canvas已初始化

**修改的文件**：
- js/runtime/gameinfo.js：添加坐标转换逻辑

**代码修改**：
```javascript
// 鼠标事件处理
mouseDownHandler(event) {
  const rect = event.target.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  
  // 转换坐标到canvas内部坐标
  if (window.canvasScale) {
    x = x / window.canvasScale;
    y = y / window.canvasScale;
  }
  
  this.touchStartHandler({ touches: [{ clientX: x, clientY: y }] });
}
```

---

## 经验教训

1. **避免重复定义**：不要在多个文件中定义相同的常量，使用全局变量或固定值
2. **状态重置**：返回主菜单时必须重置所有游戏状态
3. **坐标转换**：Canvas缩放后必须正确转换触摸坐标
4. **事件绑定时机**：确保DOM元素加载完成后再绑定事件
5. **难度曲线**：游戏难度应该循序渐进，不要一开始就太难

## 最佳实践

1. 使用固定的设计稿尺寸（375x667）
2. Canvas按比例缩放并居中显示
3. 触摸事件添加坐标转换逻辑
4. 游戏状态重置要彻底
5. 添加详细的错误日志和调试信息