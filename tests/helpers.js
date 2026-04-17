const path = require('path');
const JS_DIR = path.join(__dirname, '..', 'js');

let _loaded = false;

function bridge(names) {
  for (const name of names) {
    if (window[name] !== undefined && global[name] === undefined) {
      global[name] = window[name];
    }
  }
}

function loadAllModules() {
  if (_loaded) return;
  _loaded = true;

  require(path.join(JS_DIR, 'utils.js'));
  bridge(['SCREEN_WIDTH', 'SCREEN_HEIGHT', 'BEAN_COLORS', 'MACARON_COLORS',
    'createImage', 'fillRoundRect', 'strokeRoundRect', 'drawRoundRect',
    'eventToCanvas', 'isInArea', 'capsulePlatformCollision']);

  require(path.join(JS_DIR, 'libs', 'tinyemitter.js'));
  bridge(['TinyEmitter']);

  require(path.join(JS_DIR, 'base', 'pool.js'));
  bridge(['Pool']);

  require(path.join(JS_DIR, 'base', 'sprite.js'));
  bridge(['Sprite']);

  require(path.join(JS_DIR, 'databus.js'));
  bridge(['DataBus']);

  require(path.join(JS_DIR, 'feedback.js'));
  bridge(['FeedbackManager']);

  require(path.join(JS_DIR, 'runtime', 'music.js'));
  bridge(['Music']);

  require(path.join(JS_DIR, 'runtime', 'gameinfo.js'));
  bridge(['GameInfo']);

  // ★ 关键修复：加载 main.js
  require(path.join(JS_DIR, 'main.js'));
  bridge(['Main']);

  GameGlobal.musicManager = new Music();
  GameGlobal.databus = new DataBus();
  GameGlobal.feedbackManager = new FeedbackManager();
  GameGlobal.gameInfo = new GameInfo();
}

function resetLoaded() { _loaded = false; }

function resetGame() {
  if (global.GameGlobal && global.GameGlobal.databus) {
    global.GameGlobal.databus.reset();
    global.GameGlobal.databus.hasShield = false;
    global.GameGlobal.databus.doubleScoreActive = false;
    global.GameGlobal.databus.doubleScoreEndTime = 0;
  }
  if (global.GameGlobal && global.GameGlobal.feedbackManager) {
    const fm = global.GameGlobal.feedbackManager;
    fm.particles = [];
    fm.particlePool = [];
    fm.screenShake = { intensity: 0, duration: 0, startTime: 0, offset: { x: 0, y: 0 } };
    fm.hitStopTimer = 0;
    fm.timeScale = 1;
  }

  // 重置 Main 实例，避免状态污染
  if (global.GameGlobal) {
    global.GameGlobal.main = null;
  }
}

const { mockCtx, mockCanvas } = require('./setup');

module.exports = {
  loadAllModules, resetLoaded, resetGame,
  mockCtx, mockCanvas,
};
