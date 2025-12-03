/**
 * Pixel Logo Maker - JavaScript功能实现
 */

// 全局变量
let canvas;
let ctx;
let currentSize = 64;
let currentTool = 'brush';
let currentColor = '#000000';
let isDrawing = false;
let pixelData = [];

// DOM元素
let canvasElement;
let colorPicker;
let sizeSelector;
let toolSelector;
let clearButton;
let exportSvgButton;
let exportMarkdownButton;
let downloadImageButton;
let dropArea;
let imageImport;
let pixelSizeSlider;
let pixelSizeValue;
let tabButtons;
let outputPanels;
let copyButtons;

// 初始化函数
function init() {
    fsLogger.info('Initializing Pixel Logo Maker');

    // 获取DOM元素
    canvasElement = document.getElementById('pixel-canvas');
    colorPicker = document.getElementById('color-picker');
    sizeSelector = document.getElementById('canvas-size');
    toolSelector = document.getElementById('tool-select');
    clearButton = document.getElementById('clear-canvas');
    exportSvgButton = document.getElementById('export-svg');
    exportMarkdownButton = document.getElementById('export-markdown');
    downloadImageButton = document.getElementById('download-image');
    dropArea = document.getElementById('drop-area');
    imageImport = document.getElementById('image-import');
    pixelSizeSlider = document.getElementById('pixel-size');
    pixelSizeValue = document.getElementById('pixel-size-value');
    tabButtons = document.querySelectorAll('.tab-btn');
    outputPanels = document.querySelectorAll('.output-panel');
    copyButtons = document.querySelectorAll('.copy-btn');

    // 设置Canvas
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    // 初始化画布
    resizeCanvas(currentSize);
    clearCanvas();

    // 绑定事件监听器
    bindEvents();

    fsLogger.info('Pixel Logo Maker initialized successfully');
}

// 调整画布大小
function resizeCanvas(size) {
    currentSize = size;
    const pixelSize = 8; // 每个像素的显示大小

    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size * pixelSize}px`;
    canvas.style.height = `${size * pixelSize}px`;

    // 重新初始化像素数据
    pixelData = Array(size).fill().map(() => Array(size).fill('#FFFFFF'));

    // 清空画布
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    fsLogger.info(`Canvas resized to ${size}x${size}`);
}

// 清空画布
function clearCanvas() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, currentSize, currentSize);

    // 重置像素数据
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            pixelData[y][x] = '#FFFFFF';
        }
    }

    fsLogger.info('Canvas cleared');
}

// 获取鼠标在画布上的像素坐标
function getPixelCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: Math.floor((event.clientX - rect.left) * scaleX),
        y: Math.floor((event.clientY - rect.top) * scaleY)
    };
}

// 绘制像素点
function drawPixel(x, y, color) {
    if (x >= 0 && x < currentSize && y >= 0 && y < currentSize) {
        pixelData[y][x] = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }
}

// 从图片创建像素画
function createPixelArtFromImage(img, pixelSize) {
    // 创建临时画布用于处理图片
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // 计算缩放后的尺寸
    const width = Math.floor(img.width / pixelSize);
    const height = Math.floor(img.height / pixelSize);

    // 设置临时画布大小
    tempCanvas.width = width;
    tempCanvas.height = height;

    // 将图片缩放到临时画布
    tempCtx.drawImage(img, 0, 0, width, height);

    // 获取缩放后的图像数据
    const imageData = tempCtx.getImageData(0, 0, width, height).data;

    // 清空主画布
    clearCanvas();

    // 计算居中位置
    const offsetX = Math.floor((currentSize - width) / 2);
    const offsetY = Math.floor((currentSize - height) / 2);

    // 将像素数据绘制到主画布
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = imageData[index];
            const g = imageData[index + 1];
            const b = imageData[index + 2];
            const a = imageData[index + 3];

            // 如果像素不是透明的
            if (a > 128) {
                const hexColor = rgbToHex(r, g, b);
                drawPixel(x + offsetX, y + offsetY, hexColor);
            }
        }
    }

    fsLogger.info(`Created pixel art from image with pixel size: ${pixelSize}`);
}

// RGB转十六进制
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

// 导出为SVG
function exportAsSvg() {
    const pixelSize = 10; // SVG中每个像素的大小
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${currentSize * pixelSize}" height="${currentSize * pixelSize}" viewBox="0 0 ${currentSize * pixelSize} ${currentSize * pixelSize}">`;

    // 添加每个像素作为矩形
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color !== '#FFFFFF') { // 跳过白色像素
                svgContent += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
            }
        }
    }

    svgContent += '</svg>';

    // 更新输出面板
    document.querySelector('#svg-output code').textContent = svgContent;

    fsLogger.info('Exported as SVG');
    return svgContent;
}

// 导出为Markdown（使用GitHub Markdown的表格语法）
function exportAsMarkdown() {
    let markdown = '```markdown\n';
    markdown += '<!-- Pixel Art Logo -->\n';
    markdown += '|' + ' '.repeat(currentSize * 2 - 1) + '|\n';
    markdown += '|' + '-'.repeat(currentSize * 2 - 1) + '|\n';

    for (let y = 0; y < currentSize; y++) {
        let row = '|';
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            // 使用不同的字符表示不同的颜色深浅
            if (color === '#000000') {
                row += '█';
            } else if (color === '#FFFFFF') {
                row += ' ';
            } else {
                row += '▓';
            }
            row += ' ';
        }
        markdown += row.slice(0, -1) + '|\n'; // 移除最后的空格
    }

    markdown += '```\n';

    // 更新输出面板
    document.querySelector('#markdown-output code').textContent = markdown;

    fsLogger.info('Exported as Markdown');
    return markdown;
}

// 下载画布为图片
function downloadCanvasAsImage() {
    // 创建一个新画布用于导出
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    const scale = 8; // 放大倍数，使图片更清晰

    exportCanvas.width = currentSize * scale;
    exportCanvas.height = currentSize * scale;

    // 填充背景
    exportCtx.fillStyle = '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 绘制放大的像素
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            exportCtx.fillStyle = pixelData[y][x];
            exportCtx.fillRect(x * scale, y * scale, scale, scale);
        }
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.download = 'pixel-logo.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    fsLogger.info('Canvas downloaded as image');
}

// 复制文本到剪贴板
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
        }, 2000);

        fsLogger.info('Text copied to clipboard');
    }).catch(err => {
        fsLogger.error('Failed to copy text: ' + err);
        alert('Failed to copy text');
    });
}

// 处理图片上传
function handleImageUpload(file) {
    if (!file.type.match('image.*')) {
        fsLogger.error('File is not an image');
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const pixelSize = parseInt(pixelSizeSlider.value);
            createPixelArtFromImage(img, pixelSize);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 绑定事件监听器
function bindEvents() {
    // 画布事件
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const coords = getPixelCoordinates(e);
        const color = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
        drawPixel(coords.x, coords.y, color);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            const coords = getPixelCoordinates(e);
            const color = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
            drawPixel(coords.x, coords.y, color);
        }
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // 颜色选择器
    colorPicker.addEventListener('input', () => {
        currentColor = colorPicker.value;
        fsLogger.info(`Color changed to ${currentColor}`);
    });

    // 快速颜色选择
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.style.backgroundColor = swatch.dataset.color;

        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.color;
            colorPicker.value = currentColor;

            // 更新活动状态
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');

            fsLogger.info(`Quick color selected: ${currentColor}`);
        });
    });

    // 画布大小选择
    sizeSelector.addEventListener('change', () => {
        resizeCanvas(parseInt(sizeSelector.value));
    });

    // 工具选择
    toolSelector.addEventListener('change', () => {
        currentTool = toolSelector.value;
        // 使用CSS类来设置光标，避免直接在代码中嵌入SVG数据
        if (currentTool === 'eraser') {
            canvas.classList.add('cursor-eraser');
            canvas.classList.remove('cursor-brush');
        } else {
            canvas.classList.remove('cursor-eraser');
            canvas.classList.add('cursor-brush');
        }
        fsLogger.info(`Tool changed to ${currentTool}`);
    });

    // 清空画布
    clearButton.addEventListener('click', clearCanvas);

    // 导出SVG
    exportSvgButton.addEventListener('click', () => {
        const svg = exportAsSvg();
        // 切换到SVG选项卡
        tabButtons[0].click();
    });

    // 导出Markdown
    exportMarkdownButton.addEventListener('click', () => {
        const markdown = exportAsMarkdown();
        // 切换到Markdown选项卡
        tabButtons[1].click();
    });

    // 下载图片
    downloadImageButton.addEventListener('click', downloadCanvasAsImage);

    // 拖放区域
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('drag-over');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');

        if (e.dataTransfer.files.length) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    // 点击上传
    dropArea.addEventListener('click', () => {
        imageImport.click();
    });

    imageImport.addEventListener('change', () => {
        if (imageImport.files.length) {
            handleImageUpload(imageImport.files[0]);
        }
    });

    // 像素大小滑块
    pixelSizeSlider.addEventListener('input', () => {
        pixelSizeValue.textContent = pixelSizeSlider.value;
    });

    // 选项卡切换
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;

            // 更新按钮状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新面板显示
            outputPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tab}-output`).classList.add('active');
        });
    });

    // 复制按钮
    copyButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const panelId = index === 0 ? '#svg-output' : '#markdown-output';
            const codeElement = document.querySelector(`${panelId} code`);
            const text = codeElement.textContent;

            if (text) {
                copyToClipboard(text, button);
            }
        });
    });
}

// 当页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);