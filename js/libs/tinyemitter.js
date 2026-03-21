// TinyEmitter库 - 事件发射器
// 兼容微信小游戏、浏览器和Node.js环境

(function(global, factory) {
  // 微信小游戏环境
  if (typeof wx !== 'undefined' && typeof wx.createCanvas !== 'undefined') {
    global.TinyEmitter = factory();
  }
  // 浏览器环境
  else if (typeof window !== 'undefined') {
    window.TinyEmitter = factory();
  }
  // Node.js环境
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  }
  // 其他环境
  else {
    global.TinyEmitter = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function() {
  // TinyEmitter构造函数
  function TinyEmitter() {
    this.e = {};
  }

  TinyEmitter.prototype.on = function(name, fn, ctx) {
    if (!this.e[name]) {
      this.e[name] = [];
    }
    this.e[name].push({ fn: fn, ctx: ctx });
    return this;
  };

  TinyEmitter.prototype.once = function(name, fn, ctx) {
    var self = this;
    function on() {
      self.off(name, on);
      fn.apply(ctx, arguments);
    }
    on._ = fn;
    return this.on(name, on, ctx);
  };

  TinyEmitter.prototype.emit = function(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    var events = this.e[name] || [];
    for (var i = 0; i < events.length; i++) {
      events[i].fn.apply(events[i].ctx, args);
    }
    return this;
  };

  TinyEmitter.prototype.off = function(name, fn) {
    var events = this.e[name] || [];
    var remaining = [];
    for (var i = 0; i < events.length; i++) {
      if (events[i].fn !== fn && events[i].fn._ !== fn) {
        remaining.push(events[i]);
      }
    }
    if (remaining.length) {
      this.e[name] = remaining;
    } else {
      delete this.e[name];
    }
    return this;
  };

  return TinyEmitter;
}));