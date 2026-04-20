# 拼豆跳跳消

一款休闲跳跃类微信小游戏，结合了跳跃、收集、消除三种玩法。

## 游戏简介

玩家通过长按蓄力跳跃，在平台间跳跃收集彩色拼豆。当收集到3个相同颜色的拼豆时会触发消除，获得分数和碎片奖励。碎片可用于解锁拼豆图鉴。

## 核心玩法

- **跳跃**：长按屏幕蓄力，松开跳跃，蓄力越久跳得越远
- **收集**：在平台上收集彩色拼豆
- **消除**：3个相同颜色拼豆自动消除，获得分数和碎片
- **道具**：护盾、彩虹、双倍分数、额外拼豆

## 技术特性

- 固定时间步进帧率控制（60/120 FPS可选）
- 土狼时间（Coyote Time）和输入缓冲
- 连续碰撞检测（CCD）
- 对象池优化内存
- 模块化架构设计

## 源码目录介绍

```
├── audio/                                      // 音频资源
│   └── bgm.mp3                                 // 背景音乐
├── images/                                     // 图片资源
│   ├── bg.jpg                                  // 背景图
│   ├── image_695435480469248.png              // 背景精灵图
│   └── image_720350330364146.png              // 玩家精灵图
├── js/
│   ├── base/                                   // 基础类
│   │   ├── animation.js                        // 帧动画实现
│   │   ├── pool.js                             // 对象池实现
│   │   └── sprite.js                           // 精灵基类
│   ├── libs/                                   // 第三方库
│   │   └── tinyemitter.js                      // 事件发射器
│   ├── runtime/                                // 运行时模块
│   │   ├── admanager.js                        // 广告管理器
│   │   ├── background.js                       // 背景渲染
│   │   ├── gameinfo.js                         // UI渲染和交互
│   │   ├── logger.js                           // 日志系统
│   │   ├── music.js                            // 音乐管理器
│   │   └── resourceloader.js                   // 资源加载器
│   ├── databus.js                              // 全局状态管理
│   ├── feedback.js                             // 反馈系统（震动、粒子）
│   ├── main.js                                 // 游戏主入口
│   └── render.js                               // 基础渲染配置
├── game.html                                   // 浏览器测试入口
├── game.js                                     // 微信小游戏入口
├── game.json                                   // 游戏配置
├── project.config.json                         // 项目配置
└── README.md                                   // 项目说明
```

## 模块说明

### 核心模块

| 文件 | 功能 |
|-----|------|
| `main.js` | 游戏主循环、帧率控制、事件绑定 |
| `databus.js` | 全局状态管理、游戏逻辑、碰撞检测 |
| `gameinfo.js` | UI渲染、触摸事件处理 |

### 运行时模块

| 文件 | 功能 |
|-----|------|
| `admanager.js` | 微信广告接入（Banner、激励视频、插屏） |
| `music.js` | 背景音乐控制 |
| `logger.js` | 日志记录和错误上报 |
| `resourceloader.js` | 资源预加载 |

### 基础模块

| 文件 | 功能 |
|-----|------|
| `pool.js` | 对象池，减少GC |
| `sprite.js` | 精灵基类 |
| `animation.js` | 帧动画 |

## 游戏状态

```
menu → playing → gameOver
  ↓        ↓
settings  paused
  ↓
collection
```

## 道具系统

| 道具 | 效果 |
|-----|------|
| 🛡️ 护盾 | 激活后失误一次不掉落 |
| 🌈 彩虹 | 自动凑齐3个相同颜色消除 |
| 2x 双倍分数 | 10秒内得分翻倍 |
| 🫘 额外拼豆 | 直接获得3颗拼豆碎片 |

## 平台类型

| 类型 | 特性 |
|-----|------|
| 普通 | 静止平台 |
| 移动 | 左右移动 |
| 弹跳 | 弹跳力增强 |
| 消失 | 踩后消失 |
| 危险 | 红色警告 |

## 配置说明

### 帧率设置

在设置界面可切换：
- 60 FPS：标准帧率
- 120 FPS：高刷新率

### 调试模式

开启后显示：
- 实时FPS
- 当前帧数

## 广告接入

1. 在微信公众平台开通流量主
2. 创建广告位获取广告单元ID
3. 修改 `js/runtime/admanager.js` 中的 `adUnitIds`

```javascript
this.adUnitIds = {
  banner: 'adunit-xxx',
  rewarded: 'adunit-xxx',
  interstitial: 'adunit-xxx'
};
```

## 开发调试

### 浏览器测试

```bash
python3 -m http.server 8080
# 访问 http://localhost:8080/game.html
```

### 微信开发者工具

1. 导入项目目录
2. 填写 AppID
3. 编译运行

## 技术栈

- 原生 Canvas 2D
- 微信小游戏 API
- ES6+ JavaScript

## 版本历史

- v1.0.0 - 基础玩法实现
- v1.1.0 - 道具系统
- v1.2.0 - 图鉴系统
- v1.3.0 - 广告接入
- v1.4.0 - 帧率控制优化

## 许可证
<a href="https://deepwiki.com/TSFiang/wxcloudrun-express"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>

MIT License
