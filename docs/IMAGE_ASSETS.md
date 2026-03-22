# 拼豆跳跳消 - 图片资源清单

## 一、当前已有资源

| 文件名 | 尺寸 | 用途 | 状态 |
|-------|------|------|------|
| bg.jpg | 375x667 | 背景图 | ✅ 已有 |
| image_695435480469248.png | - | 背景精灵图 | ✅ 已有 |
| image_720350330364146.png | - | 玩家精灵图 | ✅ 已有 |

---

## 二、P0 必须添加（影响核心体验）

### 2.1 游戏Logo

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| logo.png | 300x100 | PNG透明 | 游戏主标题Logo |

**设计要求**：
- 风格：卡通扁平
- 配色：主色 #4CAF50，辅色 #2196F3
- 文字：「拼豆跳跳消」
- 可包含拼豆元素装饰

### 2.2 主按钮

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| btn_start_normal.png | 200x50 | PNG透明 | 开始游戏-正常态 |
| btn_start_pressed.png | 200x50 | PNG透明 | 开始游戏-按下态 |
| btn_restart_normal.png | 160x50 | PNG透明 | 重新开始-正常态 |
| btn_restart_pressed.png | 160x50 | PNG透明 | 重新开始-按下态 |
| btn_revive_normal.png | 160x50 | PNG透明 | 看广告复活-正常态 |
| btn_revive_pressed.png | 160x50 | PNG透明 | 看广告复活-按下态 |

**设计要求**：
- 圆角矩形：圆角半径 10px
- 正常态：填充色 #4CAF50，白色文字
- 按下态：填充色 #388E3C（深绿），或添加内阴影

### 2.3 拼豆图片

| 文件名 | 尺寸 | 格式 | 颜色代码 |
|-------|------|------|---------|
| bean_red.png | 40x40 | PNG透明 | #E53935 |
| bean_blue.png | 40x40 | PNG透明 | #1E88E5 |
| bean_green.png | 40x40 | PNG透明 | #43A047 |
| bean_yellow.png | 40x40 | PNG透明 | #FDD835 |
| bean_purple.png | 40x40 | PNG透明 | #8E24AA |

**设计要求**：
- 形状：圆形或豆形
- 风格：扁平卡通，带高光
- 边缘：可添加深色描边（1-2px）

### 2.4 平台图片

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| platform_normal.png | 100x30 | PNG透明 | 普通平台 |
| platform_moving.png | 100x30 | PNG透明 | 移动平台 |
| platform_bounce.png | 100x30 | PNG透明 | 弹跳平台 |
| platform_disappear.png | 100x30 | PNG透明 | 消失平台 |
| platform_danger.png | 100x30 | PNG透明 | 危险平台 |

**设计要求**：
- 形状：圆角矩形
- 普通平台：绿色 #4CAF50
- 移动平台：蓝色 #2196F3 + 箭头装饰
- 弹跳平台：黄色 #FFC107 + 弹簧图案
- 消失平台：灰色 #9E9E9E + 虚线边框
- 危险平台：红色 #F44336 + 警告图案

---

## 三、P1 建议添加（提升视觉体验）

### 3.1 功能按钮

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| btn_pause.png | 50x50 | PNG透明 | 暂停按钮 |
| btn_resume.png | 50x50 | PNG透明 | 继续按钮 |
| btn_settings.png | 60x60 | PNG透明 | 设置按钮 |
| btn_back.png | 60x40 | PNG透明 | 返回按钮 |
| btn_share.png | 160x50 | PNG透明 | 分享按钮 |

**设计要求**：
- 暂停：双竖线图标
- 继续：三角形播放图标
- 设置：齿轮图标
- 返回：左箭头图标
- 分享：分享图标

### 3.2 道具图标

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| item_shield.png | 64x64 | PNG透明 | 护盾道具 |
| item_rainbow.png | 64x64 | PNG透明 | 彩虹道具 |
| item_double.png | 64x64 | PNG透明 | 双倍分数 |
| item_bean.png | 64x64 | PNG透明 | 额外拼豆 |

**设计要求**：
- 护盾：盾牌形状，蓝色 #2196F3
- 彩虹：彩虹弧形，多彩
- 双倍：数字「2x」，金色 #FFC107
- 拼豆：拼豆形状，绿色 #4CAF50

### 3.3 面板背景

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| panel_bg.png | 335x500 | PNG透明 9-patch | 通用面板背景 |
| panel_title.png | 300x60 | PNG透明 | 标题栏背景 |

**设计要求**：
- 圆角矩形：圆角半径 15px
- 背景：白色或浅灰，带阴影
- 可拉伸（9-patch）

### 3.4 蓄力条

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| power_bar_bg.png | 200x20 | PNG透明 | 蓄力条背景 |
| power_bar_fill.png | 196x16 | PNG透明 | 蓄力条填充 |

**设计要求**：
- 背景：深灰色圆角矩形
- 填充：渐变色（绿→黄→红）
- 可拉伸

---

## 四、P2 可选添加（锦上添花）

### 4.1 特效图片

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| effect_shield_01.png | 80x80 | PNG透明 | 护盾光环帧1 |
| effect_shield_02.png | 80x80 | PNG透明 | 护盾光环帧2 |
| effect_shield_03.png | 80x80 | PNG透明 | 护盾光环帧3 |
| effect_particle.png | 16x16 | PNG透明 | 通用粒子 |
| effect_star.png | 32x32 | PNG透明 | 消除星星 |
| effect_plus.png | 24x24 | PNG透明 | 加分效果 |

### 4.2 图鉴图标

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| collection_animals.png | 64x64 | PNG透明 | 小动物图鉴 |
| collection_desserts.png | 64x64 | PNG透明 | 甜品图鉴 |
| collection_stars.png | 64x64 | PNG透明 | 星星图鉴 |
| collection_hearts.png | 64x64 | PNG透明 | 爱心图鉴 |
| collection_cartoons.png | 64x64 | PNG透明 | 卡通图鉴 |
| collection_locked.png | 64x64 | PNG透明 | 未解锁图标 |

### 4.3 进度装饰

| 文件名 | 尺寸 | 格式 | 说明 |
|-------|------|------|------|
| progress_bg.png | 200x20 | PNG透明 | 进度条背景 |
| progress_fill.png | 196x16 | PNG透明 | 进度条填充 |
| title_decoration.png | 375x200 | PNG透明 | 标题装饰 |

---

## 五、目录结构

```
images/
├── ui/
│   ├── buttons/
│   │   ├── btn_start_normal.png
│   │   ├── btn_start_pressed.png
│   │   ├── btn_restart_normal.png
│   │   ├── btn_restart_pressed.png
│   │   ├── btn_revive_normal.png
│   │   ├── btn_revive_pressed.png
│   │   ├── btn_pause.png
│   │   ├── btn_resume.png
│   │   ├── btn_settings.png
│   │   ├── btn_back.png
│   │   └── btn_share.png
│   ├── panels/
│   │   ├── panel_bg.png
│   │   └── panel_title.png
│   └── icons/
│       ├── logo.png
│       └── title_decoration.png
├── game/
│   ├── platforms/
│   │   ├── platform_normal.png
│   │   ├── platform_moving.png
│   │   ├── platform_bounce.png
│   │   ├── platform_disappear.png
│   │   └── platform_danger.png
│   ├── beans/
│   │   ├── bean_red.png
│   │   ├── bean_blue.png
│   │   ├── bean_green.png
│   │   ├── bean_yellow.png
│   │   └── bean_purple.png
│   └── items/
│       ├── item_shield.png
│       ├── item_rainbow.png
│       ├── item_double.png
│       └── item_bean.png
├── effects/
│   ├── shields/
│   │   ├── effect_shield_01.png
│   │   ├── effect_shield_02.png
│   │   └── effect_shield_03.png
│   └── particles/
│       ├── effect_particle.png
│       ├── effect_star.png
│       └── effect_plus.png
├── collection/
│   ├── collection_animals.png
│   ├── collection_desserts.png
│   ├── collection_stars.png
│   ├── collection_hearts.png
│   ├── collection_cartoons.png
│   └── collection_locked.png
└── backgrounds/
    ├── bg.jpg
    ├── image_695435480469248.png
    └── image_720350330364146.png
```

---

## 六、美术规范

### 6.1 配色方案

| 用途 | 颜色 | 色值 |
|-----|------|------|
| 主色调 | 绿色 | #4CAF50 |
| 辅助色 | 蓝色 | #2196F3 |
| 强调色 | 橙色 | #FF9800 |
| 警告色 | 红色 | #F44336 |
| 成功色 | 绿色 | #43A047 |
| 背景色 | 浅灰 | #F5F5F5 |
| 文字色 | 深灰 | #333333 |
| 次要文字 | 中灰 | #666666 |

### 6.2 字体规范

| 用途 | 字号 | 字重 | 颜色 |
|-----|------|------|------|
| 大标题 | 36px | Bold | #333333 |
| 中标题 | 24px | Bold | #333333 |
| 正文 | 18px | Regular | #333333 |
| 小文字 | 14px | Regular | #666666 |
| 按钮文字 | 20px | Bold | #FFFFFF |

### 6.3 圆角规范

| 元素 | 圆角半径 |
|-----|---------|
| 按钮 | 10px |
| 面板 | 15px |
| 图标 | 8px |
| 平台 | 5px |
| 拼豆 | 圆形 |

### 6.4 图片规格

| 类型 | 格式 | 色深 | 压缩质量 | 最大文件大小 |
|-----|------|------|---------|-------------|
| UI按钮 | PNG-24 | 32位 | 中等 | 20KB |
| 游戏元素 | PNG-8/24 | 8/32位 | 高 | 10KB |
| 背景图 | JPG | 24位 | 80% | 100KB |
| 特效图 | PNG-24 | 32位 | 低 | 15KB |

---

## 七、资源统计

| 优先级 | 数量 | 预估总大小 |
|-------|------|-----------|
| P0 必须添加 | 18张 | ~200KB |
| P1 建议添加 | 15张 | ~150KB |
| P2 可选添加 | 17张 | ~150KB |
| **总计** | **50张** | **~500KB** |

---

## 八、制作建议

### 8.1 工具推荐

- **矢量设计**：Figma、Sketch、Adobe Illustrator
- **位图编辑**：Photoshop、GIMP
- **图标制作**：IconFont、IconPark
- **压缩优化**：TinyPNG、ImageOptim

### 8.2 设计流程

1. 确定配色方案和风格
2. 制作P0资源（核心体验）
3. 集成测试效果
4. 制作P1资源（视觉提升）
5. 制作P2资源（锦上添花）
6. 整体优化压缩

### 8.3 注意事项

- 所有PNG图片必须透明背景
- 按钮需要提供正常态和按下态
- 特效图片需要考虑动画帧
- 保持风格统一性
- 注意版权问题

---

## 九、更新记录

| 日期 | 更新内容 | 更新人 |
|-----|---------|-------|
| 2024-03-22 | 创建资源清单 | - |

---

*本文档用于指导美术资源制作，请按照优先级顺序完成。*
