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
    /**
     * Returns the author of a tool.
     * @param {string} toolName - The name of the tool.
     * @returns {string} The author of the tool.
     */
    getToolAuthor: function(toolName) {
      switch(toolName) {
        case 'index.html':
          return 'TRAE[DeepSeek-V3.1/Doubal-Seed-Code]';
        case 'jmh-visualizer':
          return 'TRAE[DeepSeek-V3.1/Doubal-Seed-Code]';
        case 'pixel-logo':
          return 'TRAE[DeepSeek-V3.1]';
        default:
          return 'Unknown';
      }
    }
  };

  return fsTools;
});