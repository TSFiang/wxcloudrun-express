/**
 * 对象池实现
 * 用于平台、粒子等高频创建/销毁对象，减少 GC 压力
 */
class Pool {
  constructor() {
    this._pools = {};
  }

  /**
   * 获取指定类型的对象池数组
   */
  _getPool(name) {
    if (!this._pools[name]) {
      this._pools[name] = [];
    }
    return this._pools[name];
  }

  /**
   * 从池中取一个对象，池空则用工厂函数创建
   * @param {string} name - 池名称
   * @param {Function} factory - 工厂函数（池空时调用）
   * @returns {Object}
   */
  get(name, factory) {
    const pool = this._getPool(name);
    if (pool.length > 0) {
      return pool.pop();
    }
    return factory();
  }

  /**
   * 将对象回收到池中
   * @param {string} name - 池名称
   * @param {Object} obj - 要回收的对象
   * @param {Function} [reset] - 重置函数（可选）
   */
  put(name, obj, reset) {
    if (reset) reset(obj);
    this._getPool(name).push(obj);
  }

  /**
   * 批量回收数组中的对象
   * @param {string} name - 池名称
   * @param {Array} arr - 对象数组
   * @param {Function} [reset] - 重置函数
   */
  putAll(name, arr, reset) {
    const pool = this._getPool(name);
    for (let i = 0; i < arr.length; i++) {
      if (reset) reset(arr[i]);
      pool.push(arr[i]);
    }
    arr.length = 0;
  }

  /**
   * 获取池中可用对象数量
   */
  size(name) {
    return this._getPool(name).length;
  }

  /**
   * 清空指定类型的池
   */
  clear(name) {
    if (name) {
      delete this._pools[name];
    } else {
      this._pools = {};
    }
  }
}

// 全局单例
if (typeof window !== 'undefined') {
  window.Pool = Pool;
}
if (typeof GameGlobal !== 'undefined') {
  GameGlobal.Pool = Pool;
}
