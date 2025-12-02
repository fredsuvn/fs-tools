/*!
 * fs-tools.js - Common JavaScript for fs-tools
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

    // 从 tools.json 获取特定工具的信息（只获取一次并缓存）
    getToolInfo: function(toolId, callback) {
      // 检查缓存，如果已存在则直接返回
      if (this._toolCache[toolId]) {
        callback(this._toolCache[toolId]);
        return;
      }

      $.getJSON('tools/tools.json', function(data) {
        if (data && data.tools) {
          const toolInfo = data.tools.find(tool => tool.id === toolId);
          // 缓存获取到的工具信息（即使为null也缓存，避免重复请求）
          fsTools._toolCache[toolId] = toolInfo;
          callback(toolInfo);
        } else {
          fsTools._toolCache[toolId] = null;
          callback(null);
        }
      }).fail(function() {
        console.error('Failed to load tools.json');
        fsTools._toolCache[toolId] = null;
        callback(null);
      });
    },

    // 获取工具作者信息（异步版本，从tools.json加载，取不到就是空）
    getToolAuthorAsync: function(toolId, callback) {
      this.getToolInfo(toolId, function(toolInfo) {
        if (toolInfo && toolInfo.authors && toolInfo.authors.length > 0) {
          callback(toolInfo.authors.join(", "));
        } else {
          // 取不到就是空字符串
          callback('');
        }
      });
    },

    // 仅为首页加载所有工具信息（首页需要显示所有工具列表）
    loadAllToolsInfo: function(callback) {
      // 首页可以加载所有工具信息
      $.getJSON('tools/tools.json', function(data) {
        if (data && data.tools) {
          callback(data.tools);
        } else {
          callback([]);
        }
      }).fail(function() {
        console.error('Failed to load tools.json');
        callback([]);
      });
    }
  };

  return fsTools;
});