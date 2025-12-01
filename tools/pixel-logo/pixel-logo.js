$(document).ready(function() {
  // 全局变量
  let canvas, ctx;
  let currentTool = 'pencil';
  let currentColor = '#000000';
  let canvasSize = 32;
  let pixelSize = 10;
  let isDrawing = false;
  let pixelData = [];

  // 初始化函数
  function init() {
    canvas = document.getElementById('pixelCanvas');
    ctx = canvas.getContext('2d');

    // 初始化画布
    resizeCanvas();

    // 初始化像素数据
    initPixelData();

    // 绘制网格
    drawGrid();

    // 绑定事件
    bindEvents();

    // 更新预览
    updatePreview();
  }

  // 调整画布大小
  function resizeCanvas() {
    canvas.width = canvasSize * pixelSize;
    canvas.height = canvasSize * pixelSize;
    canvas.style.width = (canvasSize * pixelSize) + 'px';
    canvas.style.height = (canvasSize * pixelSize) + 'px';
  }

  // 初始化像素数据
  function initPixelData() {
    pixelData = [];
    for (let y = 0; y < canvasSize; y++) {
      pixelData[y] = [];
      for (let x = 0; x < canvasSize; x++) {
        pixelData[y][x] = '#FFFFFF'; // 白色背景
      }
    }
  }

  // 绘制网格
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制像素
    for (let y = 0; y < canvasSize; y++) {
      for (let x = 0; x < canvasSize; x++) {
        ctx.fillStyle = pixelData[y][x];
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

        // 绘制网格线
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  // 绑定事件
  function bindEvents() {
    // 工具按钮事件
    $('#pencilBtn').click(function() {
      setTool('pencil');
    });

    $('#eraserBtn').click(function() {
      setTool('eraser');
    });

    $('#clearBtn').click(function() {
      clearCanvas();
    });

    $('#importBtn').click(function() {
      $('#imageInput').click();
    });

    // 颜色选择器
    $('#colorPicker').change(function() {
      currentColor = $(this).val();
    });

    // 画布大小选择
    $('#canvasSize').change(function() {
      canvasSize = parseInt($(this).val());
      resizeCanvas();
      initPixelData();
      drawGrid();
      updatePreview();
    });

    // 图片导入
    $('#imageInput').change(function(e) {
      importImage(e.target.files[0]);
    });

    // 导出按钮
    $('#exportSvgBtn').click(function() {
      exportAsSVG();
    });

    $('#exportMarkdownBtn').click(function() {
      exportAsMarkdown();
    });

    $('#copyBtn').click(function() {
      copyToClipboard();
    });

    // 画布鼠标事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // 触摸事件支持
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
  }

  // 设置当前工具
  function setTool(tool) {
    currentTool = tool;
    $('.tool-btn').removeClass('active');

    if (tool === 'pencil') {
      $('#pencilBtn').addClass('active');
    } else if (tool === 'eraser') {
      $('#eraserBtn').addClass('active');
    }
  }

  // 开始绘制
  function startDrawing(e) {
    isDrawing = true;
    draw(e);
  }

  // 绘制
  function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    if (x >= 0 && x < canvasSize && y >= 0 && y < canvasSize) {
      if (currentTool === 'pencil') {
        pixelData[y][x] = currentColor;
      } else if (currentTool === 'eraser') {
        pixelData[y][x] = '#FFFFFF'; // 擦除为白色
      }

      drawGrid();
      updatePreview();
    }
  }

  // 停止绘制
  function stopDrawing() {
    isDrawing = false;
  }

  // 触摸事件处理
  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }

  // 清空画布
  function clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
      initPixelData();
      drawGrid();
      updatePreview();
    }
  }

  // 导入图片
  function importImage(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // 创建临时canvas处理图片
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;

        // 绘制并缩放图片
        tempCtx.drawImage(img, 0, 0, canvasSize, canvasSize);

        // 获取像素数据
        const imageData = tempCtx.getImageData(0, 0, canvasSize, canvasSize);

        // 转换为像素画
        for (let y = 0; y < canvasSize; y++) {
          for (let x = 0; x < canvasSize; x++) {
            const index = (y * canvasSize + x) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const a = imageData.data[index + 3];

            if (a > 128) { // 非透明像素
              pixelData[y][x] = rgbToHex(r, g, b);
            } else {
              pixelData[y][x] = '#FFFFFF'; // 透明区域设为白色
            }
          }
        }

        drawGrid();
        updatePreview();

        // 显示成功消息
        showMessage('Image imported successfully!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // RGB转十六进制
  function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // 更新预览
  function updatePreview() {
    const previewArea = document.getElementById('previewArea');

    // 创建像素网格预览
    let previewHTML = '<div class="pixel-grid" style="transform: scale(2); transform-origin: center;">';

    for (let y = 0; y < canvasSize; y++) {
      previewHTML += '<div class="pixel-row">';
      for (let x = 0; x < canvasSize; x++) {
        previewHTML += `<div class="pixel" style="background-color: ${pixelData[y][x]}"></div>`;
      }
      previewHTML += '</div>';
    }

    previewHTML += '</div>';
    previewArea.innerHTML = previewHTML;
  }

  // 导出为SVG
  function exportAsSVG() {
    let svgCode = `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">\n`;

    for (let y = 0; y < canvasSize; y++) {
      for (let x = 0; x < canvasSize; x++) {
        if (pixelData[y][x] !== '#FFFFFF') { // 只导出非白色像素
          svgCode += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${pixelData[y][x]}"/>\n`;
        }
      }
    }

    svgCode += '</svg>';
    $('#codeOutput').val(svgCode);
    showMessage('SVG code generated!');
  }

  // 导出为Markdown
  function exportAsMarkdown() {
    let markdownCode = '```\n';

    for (let y = 0; y < canvasSize; y++) {
      let row = '';
      for (let x = 0; x < canvasSize; x++) {
        if (pixelData[y][x] === '#FFFFFF') {
          row += '⬜'; // 白色像素
        } else {
          row += '⬛'; // 非白色像素
        }
      }
      markdownCode += row + '\n';
    }

    markdownCode += '```';
    $('#codeOutput').val(markdownCode);
    showMessage('Markdown code generated!');
  }

  // 复制到剪贴板
  function copyToClipboard() {
    const codeOutput = document.getElementById('codeOutput');
    codeOutput.select();
    codeOutput.setSelectionRange(0, 99999); // 移动设备支持

    try {
      document.execCommand('copy');
      showMessage('Code copied to clipboard!');
    } catch (err) {
      showMessage('Failed to copy code: ' + err);
    }
  }

  // 显示消息
  function showMessage(message) {
    // 创建临时消息元素
    const messageEl = $('<div>').text(message).css({
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#48bb78',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '5px',
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    });

    $('body').append(messageEl);

    // 3秒后自动消失
    setTimeout(() => {
      messageEl.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  }

  // 初始化应用
  init();
});