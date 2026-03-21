let loggerInstance;

/**
 * 日志管理器（单例模式）
 * @class Logger
 * @description 统一管理游戏日志，支持不同级别和上报功能
 */
class Logger {
  constructor() {
    if (loggerInstance) return loggerInstance;
    loggerInstance = this;
    
    this.logs = [];
    this.maxLogs = 100;
    this.isDebug = true;
  }
  
  /**
   * 记录信息日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  info(tag, message, data = null) {
    this.log('INFO', tag, message, data);
  }
  
  /**
   * 记录警告日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  warn(tag, message, data = null) {
    this.log('WARN', tag, message, data);
  }
  
  /**
   * 记录错误日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   */
  error(tag, message, error = null) {
    this.log('ERROR', tag, message, error);
    if (error && error.stack) {
      console.error(`[${tag}] Stack:`, error.stack);
    }
  }
  
  /**
   * 记录调试日志
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  debug(tag, message, data = null) {
    if (this.isDebug) {
      this.log('DEBUG', tag, message, data);
    }
  }
  
  /**
   * 内部日志方法
   * @param {string} level - 日志级别
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  log(level, tag, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = { level, tag, message, data, timestamp };
    
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    const consoleMsg = `[${timestamp}] [${level}] [${tag}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(consoleMsg, data || '');
        break;
      case 'WARN':
        console.warn(consoleMsg, data || '');
        break;
      case 'DEBUG':
        console.debug(consoleMsg, data || '');
        break;
      default:
        console.log(consoleMsg, data || '');
    }
  }
  
  /**
   * 获取所有日志
   * @returns {Array} 日志数组
   */
  getLogs() {
    return this.logs;
  }
  
  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
  }
  
  /**
   * 设置调试模式
   * @param {boolean} isDebug - 是否开启调试模式
   */
  setDebug(isDebug) {
    this.isDebug = isDebug;
  }
  
  /**
   * 全局错误处理
   * @param {string} message - 错误消息
   * @param {string} source - 错误来源
   * @param {number} lineno - 行号
   * @param {number} colno - 列号
   * @param {Error} error - 错误对象
   */
  handleError(message, source, lineno, colno, error) {
    this.error('Global', `JS Error: ${message}`, {
      source,
      lineno,
      colno,
      error: error ? error.message : 'Unknown'
    });
    return false;
  }
}

const logger = new Logger();

if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
  
  window.onerror = function(message, source, lineno, colno, error) {
    return logger.handleError(message, source, lineno, colno, error);
  };
  
  window.addEventListener('unhandledrejection', function(event) {
    logger.error('Promise', 'Unhandled Promise Rejection', event.reason);
  });
}

if (typeof GameGlobal !== 'undefined') {
  GameGlobal.Logger = Logger;
  GameGlobal.logger = logger;
}
