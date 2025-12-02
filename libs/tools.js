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
      console.log('Getting tool info for:', toolId);
      // 检查缓存，如果已存在则直接返回
      if (this._toolCache[toolId]) {
        console.log('Using cached tool info');
        callback(this._toolCache[toolId]);
        return;
      }

      // 确定当前页面路径，以便正确加载tools.json
      const currentPath = window.location.pathname;
      const currentUrl = window.location.href;
      let jsonPath;

      // 根据当前页面位置确定正确的tools.json路径
      if (currentPath.includes('tools/')) {
        jsonPath = '../libs/tools.json';  // 从tools子目录访问
      } else {
        jsonPath = 'libs/tools.json';     // 从根目录访问
      }

      console.log('Current path:', currentPath);
      console.log('Current URL:', currentUrl);
      console.log('Loading tools.json from:', jsonPath);

      $.getJSON(jsonPath, function(data) {
        console.log('tools.json loaded successfully:', data);
        if (data && data.tools) {
          const toolInfo = data.tools.find(tool => tool.id === toolId);
          console.log('Found tool info:', toolInfo);
          // 缓存获取到的工具信息（即使为null也缓存，避免重复请求）
          fsTools._toolCache[toolId] = toolInfo;
          callback(toolInfo);
        } else {
          console.error('Invalid tools.json structure');
          fsTools._toolCache[toolId] = null;
          callback(null);
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load tools.json:', textStatus, errorThrown);
        // 失败时尝试更具体的备选路径
        const altJsonPath = currentPath.includes('tools/') ? 'tools.json' : '../tools/tools.json';
        console.log('Trying alternative path:', altJsonPath);

        $.getJSON(altJsonPath, function(data) {
          console.log('tools.json loaded successfully from alternative path');
          if (data && data.tools) {
            const toolInfo = data.tools.find(tool => tool.id === toolId);
            fsTools._toolCache[toolId] = toolInfo;
            callback(toolInfo);
          } else {
            fsTools._toolCache[toolId] = null;
            callback(null);
          }
        }).fail(function() {
          console.error('All attempts to load tools.json failed');
          fsTools._toolCache[toolId] = null;
          callback(null);
        });
      });
    },

    // 获取工具作者信息（异步版本，从tools.json加载，取不到就是空）
    getToolAuthorAsync: function(toolId, callback) {
      console.log('Getting author for tool:', toolId);
      this.getToolInfo(toolId, function(toolInfo) {
        console.log('Tool info received in getToolAuthorAsync:', toolInfo);
        if (toolInfo && toolInfo.authors && Array.isArray(toolInfo.authors) && toolInfo.authors.length > 0) {
          const authorStr = toolInfo.authors.join(", ");
          console.log('Author string generated:', authorStr);
          callback(authorStr);
        } else {
          console.log('No authors found or invalid authors format');
          // 取不到就是空字符串
          callback('');
        }
      });
    },

    // 仅为首页加载所有工具信息（首页需要显示所有工具列表）
    loadAllToolsInfo: function(callback) {
      console.log('Loading all tools info');
      // 确定当前页面路径，以便正确加载tools.json
      const currentPath = window.location.pathname;
      const currentUrl = window.location.href;
      let jsonPath;

      // 使用与getToolInfo一致的路径检测逻辑
      if (currentPath.includes('tools/')) {
        jsonPath = '../tools/tools.json';
      } else {
        jsonPath = 'tools/tools.json';
      }

      console.log('Current path:', currentPath);
      console.log('Current URL:', currentUrl);
      console.log('Loading tools.json from:', jsonPath);

      $.getJSON(jsonPath, function(data) {
        console.log('All tools info loaded successfully');
        if (data && data.tools) {
          callback(data.tools);
        } else {
          console.error('Invalid tools.json structure');
          callback([]);
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load tools.json:', textStatus, errorThrown);
        // 失败时尝试更具体的备选路径
        const altJsonPath = currentPath.includes('tools/') ? 'tools.json' : '../tools/tools.json';
        console.log('Trying alternative path:', altJsonPath);

        $.getJSON(altJsonPath, function(data) {
          console.log('tools.json loaded successfully from alternative path');
          if (data && data.tools) {
            callback(data.tools);
          } else {
            callback([]);
          }
        }).fail(function() {
          console.error('All attempts to load tools.json failed');
          callback([]);
        });
      });
    }
  };

  return fsTools;
});