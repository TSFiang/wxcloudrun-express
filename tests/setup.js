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

// ★ 关键：全局 canvas
global.canvas = mockCanvas;

let _dateNow = 1700000000000;
const origDateNow = Date.now;
Date.now = jest.fn(() => _dateNow);
global._setDateNow = (v) => { _dateNow = v; };
global._advanceDateNow = (ms) => { _dateNow += ms; };
global._restoreDateNow = () => { Date.now = origDateNow; };

let _perfNow = 0;
global.performance = { now: jest.fn(() => _perfNow) };
global._advancePerf = (ms) => { _perfNow += ms; };
global._resetPerf = () => { _perfNow = 0; };

let _rafId = 0;
global.requestAnimationFrame = jest.fn(() => { _rafId++; return _rafId; });
global.cancelAnimationFrame = jest.fn();

// 同步到 window

// window mock
global.window = {
  canvas: mockCanvas,
  requestAnimationFrame: global.requestAnimationFrame,
  cancelAnimationFrame: global.cancelAnimationFrame,
  performance: global.performance,
  SCREEN_WIDTH: 375,
  SCREEN_HEIGHT: 667,
  addEventListener: jest.fn(),
  innerWidth: 375,
  innerHeight: 667,
};

global.document = {
  getElementById: jest.fn(() => mockCanvas),
  createElement: jest.fn(() => ({ style: {} })),
  body: { appendChild: jest.fn() },
};

global.GameGlobal = { canvas: mockCanvas, SCREEN_WIDTH: 375, SCREEN_HEIGHT: 667 };

module.exports = { mockCtx, mockCanvas };
