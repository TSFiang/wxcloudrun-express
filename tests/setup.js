/**
 * 测试环境全局 Mock
 * 模拟浏览器/微信小游戏 API
 */

// ─── Canvas Mock ──────────────────────────────────
const mockCtx = {
  fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '',
  globalAlpha: 1, lineWidth: 1,
  shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
  globalCompositeOperation: 'source-over',
  beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
  quadraticCurveTo: jest.fn(), closePath: jest.fn(),
  fill: jest.fn(), stroke: jest.fn(), arc: jest.fn(), rect: jest.fn(),
  fillRect: jest.fn(), fillText: jest.fn(), strokeRect: jest.fn(),
  drawImage: jest.fn(), save: jest.fn(), restore: jest.fn(), translate: jest.fn(),
  clearRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  measureText: jest.fn(() => ({ width: 50 })),
};

const mockCanvas = {
  width: 375, height: 667,
  getContext: jest.fn(() => mockCtx),
  getBoundingClientRect: jest.fn(() => ({ left: 0, top: 0, width: 375, height: 667 })),
  style: {},
};

// ─── Date.now 控制 ───────────────────────────────
let _dateNow = 1700000000000;
const origDateNow = Date.now;
Date.now = jest.fn(() => _dateNow);
global._setDateNow = (v) => { _dateNow = v; };
global._advanceDateNow = (ms) => { _dateNow += ms; };
global._restoreDateNow = () => { Date.now = origDateNow; };

// ─── performance.now ─────────────────────────────
let _perfNow = 0;
global.performance = { now: jest.fn(() => _perfNow) };
global._advancePerf = (ms) => { _perfNow += ms; };
global._resetPerf = () => { _perfNow = 0; };

// ─── requestAnimationFrame ───────────────────────
let _rafId = 0;
global.requestAnimationFrame = jest.fn(() => { _rafId++; return _rafId; });
global.cancelAnimationFrame = jest.fn();

// ─── setInterval / setTimeout ────────────────────
global.setInterval = jest.fn(() => 1);
global.clearInterval = jest.fn();
global.setTimeout = jest.fn((cb, ms) => { return 1; });

// ─── Image 全局构造函数 ──────────────────────────
global.Image = class {
  constructor() { this.src = ''; this.complete = false; this.width = 0; this.height = 0; }
};

// ─── Audio 全局构造函数 ──────────────────────────
global.Audio = class {
  constructor() {
    this.src = '';
    this.loop = false;
    this.autoplay = false;
    this.volume = 1;
    this.paused = true;
    this.currentTime = 0;
  }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
};

// ─── window 对象 ─────────────────────────────────
global.window = {
  canvas: mockCanvas,
  canvasScale: 1,
  canvasOffsetLeft: 0,
  canvasOffsetTop: 0,
  isWechatGame: false,
  SCREEN_WIDTH: 375,
  SCREEN_HEIGHT: 667,
  addEventListener: jest.fn(),
  innerWidth: 375,
  innerHeight: 667,
  Image: class { constructor() { this.src = ''; this.complete = false; this.width = 0; this.height = 0; } },
};

// ─── document 对象 ───────────────────────────────
global.document = {
  getElementById: jest.fn(() => mockCanvas),
  createElement: jest.fn((tag) => ({ className: '', innerHTML: '', style: {} })),
  body: { appendChild: jest.fn() },
};

// ─── GameGlobal 对象 ─────────────────────────────
global.GameGlobal = { canvas: mockCanvas, SCREEN_WIDTH: 375, SCREEN_HEIGHT: 667 };

// ─── 导出 ────────────────────────────────────────
module.exports = { mockCtx, mockCanvas };
