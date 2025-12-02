/*!
 * logger.js - Logger for fs-tools
 * Author: sunqian
 */

!function(global, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], function($) {
      return factory(global, $);
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(global, require('jquery'));
  } else {
    // Browser globals (this is window)
    global.fsLogger = factory(global, global.jQuery);
  }
}(typeof window !== 'undefined' ? window : this, function(window, $) {
  'use strict';

  // 日志级别常量
  var LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  // 日志级别名称映射
  var LEVEL_NAMES = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'WARN',
    3: 'ERROR',
    4: 'NONE'
  };

  // 默认配置
  var defaultConfig = {
    level: 'info', // 默认使用info级别，具体配置会从tools.json加载
    timestamp: true,
    showLevel: true,
    consoleOutput: true
  };

  // 私有方法：统一获取tools.json的路径
  function _getJsonPath() {
    const currentPath = window.location.pathname;
    // 简化的路径检测逻辑：
    // 1. 如果路径包含 '/tools/'，说明在tools的子目录下
    // 2. 否则视为在根目录下（如index.html）
    return currentPath.includes('/tools/') ? '../../libs/tools.json' : 'libs/tools.json';
  }

  // 当前配置
  var currentConfig = Object.assign({}, defaultConfig);

  // 获取日志级别数值
  function getLevelValue(levelName) {
    var level = levelName ? levelName.toUpperCase() : 'ERROR';
    return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.ERROR;
  }

  // 格式化日志消息
  function formatMessage(level, message, args) {
    var parts = [];

    // 添加时间戳
    if (currentConfig.timestamp) {
      parts.push('[' + new Date().toISOString() + ']');
    }

    // 添加日志级别
    if (currentConfig.showLevel) {
      parts.push('[' + LEVEL_NAMES[level] + ']');
    }

    // 添加消息
    parts.push(message);

    // 处理额外参数
    if (args && args.length > 0) {
      args.forEach(function(arg) {
        if (typeof arg === 'object') {
          try {
            parts.push(JSON.stringify(arg));
          } catch (e) {
            parts.push('[Object]');
          }
        } else {
          parts.push(String(arg));
        }
      });
    }

    return parts.join(' ');
  }

  // 检查是否应该记录该级别的日志
  function shouldLog(level) {
    var currentLevel = getLevelValue(currentConfig.level);
    return level >= currentLevel;
  }

  // 核心日志函数
  var fsLogger = {
    // 配置日志系统
    configure: function(config) {
      if (config && typeof config === 'object') {
        // 创建配置副本，确保日志级别转换为小写
        const configCopy = Object.assign({}, config);
        if (configCopy.level) {
          configCopy.level = configCopy.level.toLowerCase();
        }
        Object.assign(currentConfig, configCopy);
      }
      return this;
    },

    // 获取当前配置
    getConfig: function() {
      return Object.assign({}, currentConfig);
    },

    // 设置日志级别
    setLevel: function(level) {
      if (level && typeof level === 'string') {
        // 确保日志级别始终是小写
        currentConfig.level = level.toLowerCase();
      }
      return this;
    },

    // 调试日志
    debug: function(message) {
      if (shouldLog(LOG_LEVELS.DEBUG)) {
        var formatted = formatMessage(LOG_LEVELS.DEBUG, message, Array.prototype.slice.call(arguments, 1));
        if (currentConfig.consoleOutput) {
          console.debug(formatted);
        }
      }
      return this;
    },

    // 信息日志
    info: function(message) {
      if (shouldLog(LOG_LEVELS.INFO)) {
        var formatted = formatMessage(LOG_LEVELS.INFO, message, Array.prototype.slice.call(arguments, 1));
        if (currentConfig.consoleOutput) {
          console.info(formatted);
        }
      }
      return this;
    },

    // 警告日志
    warn: function(message) {
      if (shouldLog(LOG_LEVELS.WARN)) {
        var formatted = formatMessage(LOG_LEVELS.WARN, message, Array.prototype.slice.call(arguments, 1));
        if (currentConfig.consoleOutput) {
          console.warn(formatted);
        }
      }
      return this;
    },

    // 错误日志
    error: function(message) {
      if (shouldLog(LOG_LEVELS.ERROR)) {
        var formatted = formatMessage(LOG_LEVELS.ERROR, message, Array.prototype.slice.call(arguments, 1));
        if (currentConfig.consoleOutput) {
          console.error(formatted);
        }
      }
      return this;
    },

    // 显示Toast消息（用于用户界面反馈）
    showToast: function(message, type) {
      var toastClass = 'fs-toast-' + (type || 'info');
      var toast = $('<div>').addClass('fs-toast ' + toastClass).text(message);

      $('body').append(toast);

      // 显示动画
      toast.hide().fadeIn(300);

      // 3秒后自动消失
      setTimeout(function() {
        toast.fadeOut(300, function() {
          $(this).remove();
        });
      }, 3000);

      return this;
    },

    // 检查是否启用调试模式
    isDebugEnabled: function() {
      return shouldLog(LOG_LEVELS.DEBUG);
    },

    // 检查是否启用信息模式
    isInfoEnabled: function() {
      return shouldLog(LOG_LEVELS.INFO);
    },

    // 检查是否启用警告模式
    isWarnEnabled: function() {
      return shouldLog(LOG_LEVELS.WARN);
    },

    // 检查是否启用错误模式
    isErrorEnabled: function() {
      return shouldLog(LOG_LEVELS.ERROR);
    }
  };

  // 从tools.json加载日志配置
  function loadLoggerConfigFromJson() {
    try {
      $.ajax({
        url: _getJsonPath(),
        dataType: 'json',
        async: true,
        success: function(data) {
          // 检查是否存在logger配置
          if (data && data.logger) {
            // 使用原生console进行初始化配置日志，确保在配置加载过程中不会丢失信息
            console.log('Loading logger configuration from tools.json:', data.logger);
            fsLogger.configure(data.logger);
            // 配置加载成功后，使用logger输出日志
            fsLogger.debug('Logger configuration loaded successfully from tools.json');
          } else {
            console.log('No logger configuration found in tools.json, using default');
            fsLogger.debug('Using default logger configuration');
          }
        },
        error: function(xhr, status, error) {
          console.error('Failed to load tools.json for logger configuration:', error);
          // 使用默认配置，不中断功能
          fsLogger.debug('Using default logger configuration due to load failure');
        }
      });
    } catch (e) {
      console.error('Error while loading logger configuration:', e.message);
      // 使用默认配置，不中断功能
    }
  }

  // 自动初始化：从tools.json加载配置
  $(document).ready(function() {
    // 优先尝试直接从tools.json加载配置
    loadLoggerConfigFromJson();

    // 同时保留与fsTools的兼容性
    if (window.fsTools && typeof fsTools.loadAllToolsInfo === 'function') {
      fsTools.loadAllToolsInfo(function() {
        // 配置已经在tools.js中加载完成并应用
        fsLogger.debug('Logger configuration may have been updated by fsTools');
      });
    } else {
      fsLogger.debug('fsTools not available');
    }
  });

  return fsLogger;
});