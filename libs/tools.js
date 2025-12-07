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



    // 从工具自己的JSON文件获取信息（只获取一次并缓存）
    getToolInfo: function(toolId, callback) {
      // 检查缓存，如果已存在则直接返回
      if (this._toolCache[toolId]) {
        callback(this._toolCache[toolId]);
        return;
      }

      // 特殊处理index.html
      if (toolId === 'index.html') {
        // 从根目录的index.json获取index.html的信息
        let jsonPath;
        const currentPath = window.location.pathname;

        if (currentPath.includes('/tools/')) {
          // 如果在工具页面，需要回退两级到根目录
          jsonPath = '../../index.json';
        } else {
          // 如果在首页，直接加载根目录下的index.json
          jsonPath = 'index.json';
        }

        $.getJSON(jsonPath, function(data) {
          fsTools._toolCache[toolId] = data;
          callback(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
          fsLogger.error('Failed to load index.json:', textStatus, errorThrown);
          // 尝试从tools.json获取作为备选
          const toolsJsonPath = currentPath.includes('/tools/') ? '../../libs/tools.json' : 'libs/tools.json';
          $.getJSON(toolsJsonPath, function(data) {
            if (data && data.tools) {
              const toolInfo = data.tools.find(tool => tool.id === toolId);
              fsTools._toolCache[toolId] = toolInfo;
              callback(toolInfo);
            } else {
              fsTools._toolCache[toolId] = null;
              callback(null);
            }
          }).fail(function() {
            fsLogger.error('All attempts to load index.html info failed');
            fsTools._toolCache[toolId] = null;
            callback(null);
          });
        });
        return;
      }

      // 构建工具JSON文件的路径
      const currentPath = window.location.pathname;
      let jsonPath;

      // 获取当前工具的ID（如果在工具页面）
      let currentToolId = null;
      if (currentPath.includes('/tools/')) {
        // 提取当前工具的目录名作为当前工具ID
        const pathParts = currentPath.split('/');
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i] === 'tools' && i + 1 < pathParts.length) {
            currentToolId = pathParts[i + 1];
            break;
          }
        }
      }

      if (currentToolId === toolId) {
        // 如果是当前工具，直接加载当前目录下的JSON文件
        jsonPath = toolId + '.json';
      } else {
        // 如果是其他工具，使用相对于根目录的路径
        if (currentPath.includes('/tools/')) {
          // 在工具页面，需要回退一级到tools目录
          jsonPath = '../' + toolId + '/' + toolId + '.json';
        } else {
          // 在首页，直接使用tools目录下的路径
          jsonPath = 'tools/' + toolId + '/' + toolId + '.json';
        }
      }

      // 保存当前this上下文
      const self = this;

      $.getJSON(jsonPath, function(data) {
        // 缓存获取到的工具信息
        fsTools._toolCache[toolId] = data;
        callback(data);
      }).fail(function(jqXHR, textStatus, errorThrown) {
        fsLogger.error('Failed to load ' + toolId + '.json:', textStatus, errorThrown);
        // 尝试使用备选路径
        const altJsonPath = currentPath.includes('/tools/') ?
          '../../tools/' + toolId + '/' + toolId + '.json' :
          'libs/tools.json';

        if (altJsonPath === 'libs/tools.json') {
          // 最后尝试从旧的tools.json获取
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
            fsLogger.error('All attempts to load tool info failed');
            fsTools._toolCache[toolId] = null;
            callback(null);
          });
        } else {
          $.getJSON(altJsonPath, function(data) {
            fsTools._toolCache[toolId] = data;
            callback(data);
          }).fail(function() {
            fsLogger.error('All attempts to load ' + toolId + '.json failed');
            fsTools._toolCache[toolId] = null;
            callback(null);
          });
        }
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
      // 首先从tools.json获取工具列表（包含id和enabled状态）
      const jsonPath = this._getJsonPath();

      $.getJSON(jsonPath, function(data) {
        if (data && data.tools) {
          // 过滤出已启用的工具
          const enabledTools = data.tools.filter(tool => tool.enabled !== false);
          const toolIds = enabledTools.map(tool => tool.id);
          const allToolsInfo = [];
          let loadedCount = 0;

          // 如果没有启用的工具，直接返回空数组
          if (toolIds.length === 0) {
            callback(allToolsInfo);
            return;
          }

          // 为每个启用的工具加载详细信息
          toolIds.forEach(toolId => {
            fsTools.getToolInfo(toolId, function(toolInfo) {
              if (toolInfo) {
                allToolsInfo.push(toolInfo);
              }
              loadedCount++;

              // 当所有工具都加载完成后，调用回调函数
              if (loadedCount === toolIds.length) {
                callback(allToolsInfo);
              }
            });
          });
        } else {
          fsLogger.error('Invalid tools.json structure');
          callback([]);
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        fsLogger.error('Failed to load tools.json:', textStatus, errorThrown);
        callback([]);
      });
    }
  };

  return fsTools;
});