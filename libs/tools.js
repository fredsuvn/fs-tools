/*!
 * tools.js - Common JavaScript for fs-tools
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
    global.fsTools = factory(global, global.jQuery);
  }
}(typeof window !== 'undefined' ? window : this, function(window, $) {
  'use strict';

  var fsTools = {
    // 每个工具单独的缓存，避免加载所有工具数据
    _toolCache: {},

    // 私有方法：统一获取tools.json的路径
    _getJsonPath: function() {
      const currentPath = window.location.pathname;
      // 简化的路径检测逻辑：
      // 1. 如果路径包含 '/tools/'，说明在tools的子目录下
      // 2. 否则视为在根目录下（如index.html）
      return currentPath.includes('/tools/') ? '../../libs/tools.json' : 'libs/tools.json';
    },



    // 从 tools.json 获取特定工具的信息（只获取一次并缓存）
    getToolInfo: function(toolId, callback) {
      // 检查缓存，如果已存在则直接返回
      if (this._toolCache[toolId]) {
        callback(this._toolCache[toolId]);
        return;
      }

      // 使用统一的方法获取tools.json的路径
      const jsonPath = this._getJsonPath();

      // 保存当前this上下文
      const self = this;

      $.getJSON(jsonPath, function(data) {
        if (data && data.tools) {


          const toolInfo = data.tools.find(tool => tool.id === toolId);
          // 缓存获取到的工具信息（即使为null也缓存，避免重复请求）
          fsTools._toolCache[toolId] = toolInfo;
          callback(toolInfo);
        } else {
          fsLogger.error('Invalid tools.json structure');
          fsTools._toolCache[toolId] = null;
          callback(null);
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        fsLogger.error('Failed to load tools.json:', textStatus, errorThrown);
        // 使用统一的方法获取tools.json的路径
        const altJsonPath = self._getJsonPath();

        $.getJSON(altJsonPath, function(data) {
          if (data && data.tools) {
            const toolInfo = data.tools.find(tool => tool.id === toolId);
            fsTools._toolCache[toolId] = toolInfo;
            callback(toolInfo);
          } else {
            fsTools._toolCache[toolId] = null;
            callback(null);
          }
        }).fail(function() {
          fsLogger.error('All attempts to load tools.json failed');
          fsTools._toolCache[toolId] = null;
          callback(null);
        });
      });
    },

    // 获取工具作者信息（异步版本，从tools.json加载，取不到就是空）
    getToolAuthorAsync: function(toolId, callback) {
      this.getToolInfo(toolId, function(toolInfo) {
        if (toolInfo && toolInfo.authors && Array.isArray(toolInfo.authors) && toolInfo.authors.length > 0) {
          const authorStr = toolInfo.authors.join(", ");
          callback(authorStr);
        } else {
          // 取不到就是空字符串
          callback('');
        }
      });
    },

    // 仅为首页加载所有工具信息（首页需要显示所有工具列表）
    loadAllToolsInfo: function(callback) {
      // 使用统一的方法获取tools.json的路径
      const jsonPath = this._getJsonPath();

      // 保存当前this上下文
      const self = this;

      $.getJSON(jsonPath, function(data) {
        if (data && data.tools) {


          callback(data.tools);
        } else {
          fsLogger.error('Invalid tools.json structure');
          callback([]);
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        fsLogger.error('Failed to load tools.json:', textStatus, errorThrown);
        // 使用统一的方法获取tools.json的路径
        const altJsonPath = self._getJsonPath();

        $.getJSON(altJsonPath, function(data) {
          if (data && data.tools) {


            callback(data.tools);
          } else {
            callback([]);
          }
        }).fail(function() {
          fsLogger.error('All attempts to load tools.json failed');
          callback([]);
        });
      });
    }
  };

  return fsTools;
});