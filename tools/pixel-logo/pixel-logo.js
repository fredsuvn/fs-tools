/**
 * Pixel Logo Maker - JavaScript功能实现
 */

// 全局变量
let canvas;
let ctx;
let currentSize = 64;
let currentTool = 'pencil';
let currentColor = '#000000';
let currentBrushSize = 1;
let recentColorsSize = 24;
let isDrawing = false;
let pixelData = [];
let currentBackgroundColor = '#FFFFFF';
let showGrid = true;
let gridCanvas;
let gridCtx;

// 全局变量 - 选择工具
let isSelecting = false;
let selectionStartX = 0;
let selectionStartY = 0;
let selectionEndX = 0;
let selectionEndY = 0;
let selectionCanvas;
let selectionCtx;

// 存储选择区域的数组
let selectionRegions = [];
const MAX_SELECTION_REGIONS = 8;

// 粘贴功能相关
let isPasting = false;
let pasteData = null;
let pasteOffsetX = 0;
let pasteOffsetY = 0;

// 历史记录功能 - 撤销和重做
let undoStack = [];
let redoStack = [];

// 移除了选择工具相关变量

// 保存当前画布状态到撤销栈
function saveState() {
    // 深拷贝当前像素数据
    const state = pixelData.map(row => [...row]);
    undoStack.push(state);
    // 限制撤销栈大小
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    // 清空重做栈
    redoStack = [];
}

// 撤销操作
function undo() {
    if (undoStack.length > 0) {
        // 保存当前状态到重做栈
        redoStack.push(pixelData.map(row => [...row]));
        // 恢复上一个状态
        pixelData = undoStack.pop();
        // 重绘画布
        redrawCanvas();
    }
}

// 重做操作
function redo() {
    if (redoStack.length > 0) {
        // 保存当前状态到撤销栈
        undoStack.push(pixelData.map(row => [...row]));
        // 恢复下一个状态
        pixelData = redoStack.pop();
        // 重绘画布
        redrawCanvas();
    }
}

// 选择工具辅助函数
// 移除了选择工具相关函数

// 移除了自动复制选择区域功能



// 文件上传相关变量
let uploadArea;
let fileInput;

// 初始化颜色预览
function updateColorPreview() {
    const colorPreview = document.getElementById('color-preview');
    if (colorPreview) {
        if (currentColor === '' || currentColor === 'transparent') {
            // 使用棋盘格背景表示透明色
            colorPreview.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)';
            colorPreview.style.backgroundSize = '8px 8px';
            colorPreview.style.backgroundPosition = '0 0, 4px 4px';
            colorPreview.style.backgroundColor = 'transparent';
        } else {
            // 普通颜色直接设置背景色
            colorPreview.style.backgroundImage = 'none';
            colorPreview.style.backgroundColor = currentColor;
        }
    }

    // 更新画笔大小指示器的边框颜色
    const brushSizeIndicator = document.getElementById('brush-size-indicator');
    if (brushSizeIndicator && brushSizeIndicator.classList.contains('visible')) {
        if (currentTool === 'eraser') {
            // 橡皮擦工具始终使用白色边框
            brushSizeIndicator.style.borderColor = '#ffffff';
        } else {
            // 其他工具使用当前选择的颜色作为边框颜色
            brushSizeIndicator.style.borderColor = currentColor;
        }
    }
}

// 更新画笔尺寸光标
function updateBrushSizeCursor() {
    if (!canvas) return;
    // 移除所有画笔尺寸类
    for (let i = 1; i <= 6; i++) {
        canvas.classList.remove(`brush-size-${i}`);
    }

    // 铅笔和橡皮擦工具都不应用圆形光标，使用各自的SVG图标
    // 铅笔工具使用铅笔SVG图标，橡皮擦工具使用橡皮擦SVG图标
}

// DOM元素
let canvasElement;
let colorPicker;
let sizeSelector;
let clearButton;
let exportSvgButton;
let exportBase64Button;
let downloadImageButton;
let exportSvgBtn;
let exportBase64Btn;
let exportMarkdownBtn;
let dropArea;
let imageImport;
let pixelSizeSlider;
let pixelSizeValue;
let tabButtons;
let outputPanels;
let copyButtons;
let brushSizeSlider;
let brushSizeValue;
let toolButtons;
let showGridCheckbox;
// 背景按钮已移除，默认使用半透明背景

// 初始化函数
function init() {


    // 获取DOM元素
    canvasElement = document.getElementById('pixel-canvas');
    colorPicker = document.getElementById('color-picker');
    sizeSelector = document.getElementById('canvas-size');
    clearButton = document.getElementById('clear-canvas');
    previewButton = document.getElementById('preview-button');
    exportSvgButton = document.getElementById('export-svg');
    exportBase64Button = document.getElementById('export-base64');
    downloadImageButton = document.getElementById('download-image');
    exportSvgBtn = document.getElementById('export-svg-btn');
    exportBase64Btn = document.getElementById('export-base64-btn');
    exportMarkdownBtn = document.getElementById('export-markdown-btn');
    dropArea = document.getElementById('drop-area');
    imageImport = document.getElementById('image-import');
    pixelSizeSlider = document.getElementById('pixel-size');
    pixelSizeValue = document.getElementById('pixel-size-value');
    brushSizeSlider = document.getElementById('brush-size');
    brushSizeValue = document.getElementById('brush-size-value');
    toolButtons = document.querySelectorAll('.tool-btn');
    tabButtons = document.querySelectorAll('.tab-btn');
    outputPanels = document.querySelectorAll('.output-panel');
    copyButtons = document.querySelectorAll('.copy-btn');
    showGridCheckbox = document.getElementById('show-grid');
    // 初始化上传区域
    uploadArea = document.getElementById('upload-area');
    fileInput = document.getElementById('file-input');
    // 背景按钮已移除

    // 设置Canvas
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    // 创建网格画布
    gridCanvas = document.createElement('canvas');
    gridCtx = gridCanvas.getContext('2d');
    gridCanvas.style.position = 'absolute';
    gridCanvas.style.pointerEvents = 'none';

    // 创建选择框画布
    selectionCanvas = document.createElement('canvas');
    selectionCtx = selectionCanvas.getContext('2d');
    selectionCanvas.style.position = 'absolute';
    selectionCanvas.style.pointerEvents = 'none';
    selectionCanvas.style.zIndex = '10';

    // 初始设置选择框画布尺寸 - 将在resizeCanvas中进一步设置
    selectionCanvas.width = 1;
    selectionCanvas.height = 1;

    // 确保画布容器有相对定位
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(gridCanvas);
    canvas.parentElement.appendChild(selectionCanvas);

    // 初始化画布
    resizeCanvas(currentSize);
    clearCanvas(false);

    // 设置默认显示网格线
    showGridCheckbox.checked = true;

    // 更新网格显示
    updateGrid();

    // 初始化工具状态
    // 1. 设置铅笔工具按钮为激活状态
    const pencilBtn = document.querySelector('.tool-btn[data-tool="pencil"]');
    if (pencilBtn) {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        pencilBtn.classList.add('active');
    }

    // 2. 设置初始光标样式
    canvas.classList.remove('cursor-eraser', 'cursor-fill', 'cursor-color-extractor');
    canvas.classList.add('cursor-pencil');

    // 3. 更新画笔尺寸光标
    updateBrushSizeCursor();

    // 4. 显示画笔大小指示器
    const brushSizeIndicator = document.getElementById('brush-size-indicator');
    if (brushSizeIndicator) {
        brushSizeIndicator.classList.add('visible');
    }

    // 绑定事件监听器
    bindEvents();

    // 绑定文件上传事件
    bindUploadEvents();

    // 初始化显示8个选择区域标签
    updateSelectionTabs();
}

// 绑定文件上传事件
function bindUploadEvents() {
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择变化事件
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // 拖拽上传事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    // 处理文件放置
    uploadArea.addEventListener('drop', handleDrop, false);
}

// 阻止默认拖拽行为
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}



// 处理文件放置
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// 处理上传的文件
function handleFile(file) {
    if (!file || !file.type.match('image.*')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 将图像绘制到画布
            drawImageToCanvas(img);
            // 提取颜色
            extractColorsFromImage(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 将图像绘制到画布
function drawImageToCanvas(img) {
    // 清空画布
    clearCanvas();

    // 创建临时画布用于处理图像
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = currentSize;
    tempCanvas.height = currentSize;

    // 将图像绘制到临时画布，调整大小以适应
    tempCtx.drawImage(img, 0, 0, currentSize, currentSize);

    // 获取像素数据
    const imageData = tempCtx.getImageData(0, 0, currentSize, currentSize);
    const data = imageData.data;

    // 将图像像素转换为像素艺术
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const index = (y * currentSize + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // 检查透明度
            if (a < 128) {
                // 透明像素
                drawPixel(x, y, '');
            } else {
                // 将RGB转换为十六进制颜色
                const color = rgbToHex(r, g, b);
                drawPixel(x, y, color);
            }
        }
    }

    // 更新网格显示
    updateGrid();
}

// 从图像中提取颜色
function extractColorsFromImage(img) {
    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);

    // 获取图像数据
    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    // 使用Map存储颜色及其出现频率
    const colorMap = new Map();

    // 遍历像素
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // 跳过透明像素
        if (a < 128) continue;

        const color = rgbToHex(r, g, b);

        if (colorMap.has(color)) {
            colorMap.set(color, colorMap.get(color) + 1);
        } else {
            colorMap.set(color, 1);
        }
    }

    // 按出现频率排序颜色
    const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);

    // 限制颜色数量
    const maxColors = 64;
    const extractedColors = sortedColors.slice(0, maxColors);

    // 显示提取的颜色
    displayExtractedColors(extractedColors);
}

// 显示提取的颜色

// RGB转十六进制颜色

// 调整画布大小
function resizeCanvas(size) {
    currentSize = size;

    canvas.width = size;
    canvas.height = size;

    // 计算最佳像素大小以适应容器
    const canvasContainer = document.querySelector('.canvas-container') || canvas.parentElement;
    const containerRect = canvasContainer.getBoundingClientRect();
    const availableWidth = containerRect.width - 30; // 考虑内边距

    // 获取canvas-controls的高度，从可用高度中减去
    const canvasControls = document.querySelector('.canvas-controls');
    const controlsHeight = canvasControls ? canvasControls.offsetHeight : 0;

    // 获取selection-tabs的高度，从可用高度中减去
    const selectionTabs = document.getElementById('selection-tabs');
    const tabsHeight = selectionTabs ? selectionTabs.offsetHeight : 0;

    const availableHeight = containerRect.height - 30 - controlsHeight - tabsHeight; // 考虑内边距、预览按钮和标签栏高度

    // 计算像素大小以尽可能填充空间
    let pixelSize = Math.floor(Math.min(availableWidth, availableHeight) / currentSize);
    // 确保像素大小至少为4px以保证可用性
    pixelSize = Math.max(pixelSize, 4);

    // 设置主画布尺寸
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size * pixelSize}px`;
    canvas.style.height = `${size * pixelSize}px`;

    // 设置网格画布尺寸 - 与主画布的实际显示尺寸完全一致
    gridCanvas.width = size * pixelSize;
    gridCanvas.height = size * pixelSize;
    gridCanvas.style.width = `${size * pixelSize}px`;
    gridCanvas.style.height = `${size * pixelSize}px`;

    // 确保网格画布的位置和尺寸在调整后仍然正确
    setTimeout(() => {
        alignGridCanvas();
        updateGrid();
    }, 0);

    // 设置选择框画布尺寸 - 与主画布保持一致
    selectionCanvas.width = size;
    selectionCanvas.height = size;
    selectionCanvas.style.width = `${size * pixelSize}px`;
    selectionCanvas.style.height = `${size * pixelSize}px`;

    // 确保网格画布与主画布对齐
    alignGridCanvas();

    // 重新初始化像素数据 - 使用'transparent'表示透明/无像素
    pixelData = Array(size).fill().map(() => Array(size).fill('transparent'));

    // 清空选择区域


    // 清空画布
    ctx.clearRect(0, 0, size, size);

    // 更新网格
    updateGrid();


}

// 清空画布
function clearCanvas(saveStateToHistory = true) {
    // 保存当前状态到撤销栈（除非明确要求不保存）
    if (saveStateToHistory) {
        saveState();
    }

    ctx.clearRect(0, 0, currentSize, currentSize);

    // 重置像素数据 - 使用空字符串表示透明/无像素
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            pixelData[y][x] = '';
        }
    }
}

// 确保网格画布与主画布对齐
function alignGridCanvas() {
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();

    // 计算主画布在容器中的精确偏移量
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    // 确保网格画布只覆盖主画布区域，不包括tabs区域
    gridCanvas.style.position = 'absolute';
    gridCanvas.style.left = `${offsetX}px`;
    gridCanvas.style.top = `${offsetY}px`;
    gridCanvas.style.width = `${canvasRect.width}px`;
    gridCanvas.style.height = `${canvasRect.height}px`;

    // 确保网格画布的内部尺寸与显示尺寸一致
    gridCanvas.width = canvasRect.width;
    gridCanvas.height = canvasRect.height;

    // 设置选择框画布位置与主画布对齐
    selectionCanvas.style.left = `${offsetX}px`;
    selectionCanvas.style.top = `${offsetY}px`;
}

// 更新网格显示
function updateGrid() {
    if (!showGrid) {
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        return;
    }

    // 清空网格画布
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // 设置网格样式 - 半透明黑色实线
    gridCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    gridCtx.lineWidth = 1.0;
    gridCtx.setLineDash([]);

    // 计算像素大小
    const pixelSize = gridCanvas.width / currentSize;

    // 绘制垂直线
    for (let x = 0; x <= currentSize; x++) {
        gridCtx.beginPath();
        gridCtx.moveTo(x * pixelSize, 0);
        gridCtx.lineTo(x * pixelSize, gridCanvas.height);
        gridCtx.stroke();
    }

    // 绘制水平线
    for (let y = 0; y <= currentSize; y++) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y * pixelSize);
        gridCtx.lineTo(gridCanvas.width, y * pixelSize);
        gridCtx.stroke();
    }
}



// 重绘画布
function redrawCanvas() {
    // 清空背景
    ctx.clearRect(0, 0, currentSize, currentSize);

    // 重绘所有像素
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color && color !== 'transparent') {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // 更新网格
    updateGrid();

    // 移除了绘制选择区域的代码
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

// 获取画布上指定像素的颜色
function getPixelColor(x, y) {
    // 确保在画布范围内
    if (x >= 0 && x < currentSize && y >= 0 && y < currentSize) {
        const color = pixelData[y][x] || '';
        // 统一透明色表示
        return color === '' ? 'transparent' : color;
    }
    return 'transparent';
}

// 填充算法（区域填充功能）
function floodFill(startX, startY, targetColor, replacementColor) {
    // 如果目标颜色和替换颜色相同，直接返回
    if (targetColor === replacementColor) return;

    // 保存当前状态到撤销栈
    saveState();

    // 使用队列进行广度优先搜索
    const queue = [];
    queue.push({x: startX, y: startY});

    // 记录已访问的像素
    const visited = Array(currentSize).fill().map(() => Array(currentSize).fill(false));

    while (queue.length > 0) {
        const {x, y} = queue.shift();

        // 检查边界和是否已访问
        if (x < 0 || x >= currentSize || y < 0 || y >= currentSize || visited[y][x]) {
            continue;
        }

        // 检查当前像素颜色是否匹配目标颜色（统一处理透明色）
        const currentPixelColor = pixelData[y][x] || '';
        const normalizedCurrentColor = currentPixelColor === '' ? 'transparent' : currentPixelColor;
        const normalizedTargetColor = targetColor === '' ? 'transparent' : targetColor;

        if (normalizedCurrentColor === normalizedTargetColor) {
            // 标记为已访问
            visited[y][x] = true;

            // 填充像素
            pixelData[y][x] = replacementColor;

            // 根据颜色类型进行不同的绘制处理
            if (replacementColor === '' || replacementColor === 'transparent') {
                ctx.clearRect(x, y, 1, 1);
            } else {
                ctx.fillStyle = replacementColor;
                ctx.fillRect(x, y, 1, 1);
            }

            // 将相邻像素加入队列
            queue.push({x: x + 1, y: y});
            queue.push({x: x - 1, y: y});
            queue.push({x: x, y: y + 1});
            queue.push({x: x, y: y - 1});
        }
    }
}

// 计算画笔覆盖的网格范围（与drawPixel函数逻辑一致）
function getBrushCoverage(x, y) {
    const halfSize = Math.floor(currentBrushSize / 2);
    const startX = x - halfSize;
    const startY = y - halfSize;
    const endX = x + halfSize;
    const endY = y + halfSize;

    return {
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        width: currentBrushSize,
        height: currentBrushSize
    };
}

// 绘制像素点（支持不同画笔尺寸和透明色）
function drawPixel(x, y, color) {
    const coverage = getBrushCoverage(x, y);

    // 根据画笔尺寸绘制多个像素
    for (let dy = 0; dy < coverage.height; dy++) {
        for (let dx = 0; dx < coverage.width; dx++) {
            const nx = coverage.startX + dx;
            const ny = coverage.startY + dy;

            // 确保在画布范围内
            if (nx >= 0 && nx < currentSize && ny >= 0 && ny < currentSize) {
                // 更新像素数据 - 统一使用'transparent'表示透明色
                if (color === '') {
                    pixelData[ny][nx] = 'transparent';
                } else {
                    pixelData[ny][nx] = color;
                }

                // 根据颜色类型进行不同的绘制处理
                if (color === 'transparent' || color === '') {
                    ctx.clearRect(nx, ny, 1, 1);
                } else {
                    ctx.fillStyle = color;
                    ctx.fillRect(nx, ny, 1, 1);
                }
            }
        }
    }
}

// 添加颜色到最近颜色列表
function addToRecentColors(color) {
    // 移除已存在的相同颜色
    recentColors = recentColors.filter(c => c !== color);

    // 添加到开头
    recentColors.unshift(color);

    // 限制最多8个颜色
    if (recentColors.length > recentColorsSize) {
        recentColors = recentColors.slice(0, recentColorsSize);
    }

    // 保存到本地存储
    localStorage.setItem('pixelLogoRecentColors', JSON.stringify(recentColors));

    // 重新渲染
    renderRecentColors();
}

// 最近颜色数组（全局变量）
let recentColors = [];

// 渲染最近颜色
function renderRecentColors() {
    const recentColorsGrid = document.getElementById('recent-colors-grid');
    if (!recentColorsGrid) return;

    recentColorsGrid.innerHTML = '';
    recentColors.forEach(color => {
        let swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.setAttribute('data-color', color);
        swatch.setAttribute('title', color);
        if (color === 'transparent') {
            swatch.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)';
            swatch.style.backgroundSize = '8px 8px';
            swatch.style.backgroundPosition = '0 0, 4px 4px';
        } else {
            swatch.style.backgroundColor = color;
        }

        swatch.addEventListener('click', function() {
            // 移除所有active状态
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            // 添加active状态到当前点击的样本
            swatch.classList.add('active');

            // 设置当前颜色
            currentColor = color;
            // 如果颜色不是透明色，才更新颜色选择器的值
            if (color !== 'transparent') {
                colorPicker.value = color;
            }
            updateColorPreview();
        });

        recentColorsGrid.appendChild(swatch);
    });
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

    // 提取颜色集合
    const colorSet = new Set();

    // 将像素数据绘制到主画布
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = imageData[index];
            const g = imageData[index + 1];
            const b = imageData[index + 2];
            const a = imageData[index + 3];

            // 如果像素不是完全透明的（a > 0）
            if (a > 0) {
                const hexColor = rgbToHex(r, g, b);
                drawPixel(x + offsetX, y + offsetY, hexColor);
                colorSet.add(hexColor);
            }
        }
    }

    // 显示提取的颜色
    displayExtractedColors(Array.from(colorSet));

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
    const pixelSize = 1; // SVG中每个像素的大小为1x1
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${currentSize}" height="${currentSize}" viewBox="0 0 ${currentSize} ${currentSize}">`;



    // 添加每个像素作为矩形
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color !== '') { // 只有有颜色的像素才添加
                svgContent += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />`;
            }
        }
    }

    svgContent += '</svg>';

    // 更新输出面板
    document.querySelector('#svg-output code').textContent = svgContent;


    return svgContent;
}

// 导出为Base64
function exportAsBase64() {
    // 创建导出用的画布
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    const scale = 1; // 缩放比例为1，与像素大小相同

    exportCanvas.width = currentSize * scale;
    exportCanvas.height = currentSize * scale;



    // 绘制放大的像素
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color !== '') { // 只有有颜色的像素才绘制
                exportCtx.fillStyle = color;
                exportCtx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    // 获取Base64数据并去掉data前缀
    const base64WithPrefix = exportCanvas.toDataURL('image/png');
    const base64 = base64WithPrefix.replace('data:image/png;base64,', '');

    // 更新输出面板
    document.querySelector('#base64-output code').textContent = base64;

    return base64;
}

// 下载画布为图片
// 导出为Markdown
function exportAsMarkdown() {
    // 获取Base64数据（没有前缀）
    const base64WithoutPrefix = exportAsBase64();
    // 添加前缀以形成完整的data URL
    const base64WithPrefix = `data:image/png;base64,${base64WithoutPrefix}`;
    // 创建Markdown格式
    const markdown = `![Pixel Logo](${base64WithPrefix})`;
    // 更新输出面板
    document.querySelector('#markdown-output code').textContent = markdown;
    return markdown;
}

function downloadCanvasAsImage() {
    // 创建一个新画布用于导出
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    const scale = 8; // 放大倍数，使图片更清晰

    exportCanvas.width = currentSize * scale;
    exportCanvas.height = currentSize * scale;



    // 绘制放大的像素
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color !== '') { // 只有有颜色的像素才绘制
                exportCtx.fillStyle = color;
                exportCtx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.download = 'pixel-logo.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();


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


    }).catch(err => {

        alert('Failed to copy text');
    });
}

// 处理图片上传
function handleImageUpload(file) {
    if (!file.type.match('image.*')) {

        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 对于颜色提取，使用pixelSize=1来确保提取所有颜色
            createPixelArtFromImage(img, 1);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 绑定事件监听器
function bindEvents() {
    // 获取画笔大小指示器元素
    const brushSizeIndicator = document.getElementById('brush-size-indicator');

    // 画布事件
    canvas.addEventListener('mousedown', (e) => {
        const coords = getPixelCoordinates(e);

        if (currentTool === 'fill') {
            // 填充工具：执行区域填充
            const targetColor = getPixelColor(coords.x, coords.y);
            // 允许填充空区域（透明区域）
            floodFill(coords.x, coords.y, targetColor, currentColor);
        } else if (currentTool === 'color-extractor') {
            // 颜色吸取器工具：不执行绘制逻辑，由click事件处理
            return;
        } else if (currentTool === 'select') {
            // 框选工具：开始框选
            isSelecting = true;
            selectionStartX = coords.x;
            selectionStartY = coords.y;
            selectionEndX = coords.x;
            selectionEndY = coords.y;
            // 清除之前的选框并立即绘制新的选框
            clearSelectionCanvas();
            drawSelectionRect();
        } else {
            // 铅笔和橡皮擦工具：开始绘制
            isDrawing = true;
            // 保存当前状态（连续绘制只保存一次）
            saveState();
            // 如果是橡皮擦工具，使用'transparent'表示透明
            // 如果是铅笔工具，直接使用currentColor（包括透明色）
            const color = currentTool === 'eraser' ? 'transparent' : currentColor;
            drawPixel(coords.x, coords.y, color);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing && currentTool !== 'fill' && currentTool !== 'color-extractor' && currentTool !== 'select') {
            const coords = getPixelCoordinates(e);
            const color = currentTool === 'eraser' ? 'transparent' : currentColor;
            drawPixel(coords.x, coords.y, color);
        }

        if (isSelecting && currentTool === 'select') {
            const coords = getPixelCoordinates(e);
            selectionEndX = coords.x;
            selectionEndY = coords.y;
            drawSelectionRect();
        }

        // 更新画笔大小指示器位置
        updateBrushSizeIndicator(e, brushSizeIndicator);

        // 粘贴预览逻辑
        if (isPasting && pasteData) {
            // 获取鼠标在画布上的像素坐标
            const coords = getPixelCoordinates(e);
            const { width, height } = pasteData;

            // 计算粘贴的左上角坐标，使鼠标位于预览图中心（对齐网格）
            pasteOffsetX = coords.x - Math.floor(width / 2);
            pasteOffsetY = coords.y - Math.floor(height / 2);

            // 绘制粘贴预览
            drawPastePreview();
        }
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
        if (isSelecting) {
            isSelecting = false;
            // 不再自动清除选框，保持选中区域显示直到下次选择
            // clearSelectionCanvas();
        }
    });

    // 鼠标点击画布时处理粘贴操作
    canvas.addEventListener('click', (e) => {
        if (isPasting && pasteData) {
            // 执行粘贴操作
            pasteToCanvas();
        }
    });

    // 窗口失去焦点时取消粘贴模式
    window.addEventListener('blur', () => {
        if (isPasting) {
            cancelPaste();
        }
    });

    // 处理Ctrl+C和Ctrl+V快捷键
    window.addEventListener('keydown', (e) => {
        // Ctrl+C保存选择区域
        if (currentTool === 'select' && e.ctrlKey && e.key === 'c') {
            saveSelectionRegion();
            // 清除当前选中区域
            clearSelectionCanvas();
            // 重置选择区域坐标
            selectionStartX = selectionEndX = -1;
            selectionStartY = selectionEndY = -1;
        }
        // Ctrl+V粘贴选择区域
        else if (e.ctrlKey && e.key === 'v') {
            // 找到当前选中的tab
            const activeTab = document.querySelector('.selection-tab.active');
            if (activeTab && activeTab.dataset.regionId) {
                const regionId = parseInt(activeTab.dataset.regionId);
                const region = selectionRegions.find(r => r && r.id === regionId);

                if (region) {
                    // 开始粘贴模式
                    isPasting = true;
                    pasteData = region;
                    console.log('开始粘贴模式:', region);
                }
            }
        }
    });

    // 鼠标进入画布时显示画笔大小指示器
    canvas.addEventListener('mouseenter', (e) => {
        // 所有工具都显示指示器
        brushSizeIndicator.classList.add('visible');
        updateBrushSizeIndicator(e, brushSizeIndicator);
    });

    // 鼠标离开画布时隐藏画笔大小指示器
    canvas.addEventListener('mouseleave', () => {
        brushSizeIndicator.classList.remove('visible');
    });

    // 更新画笔大小指示器位置和大小的函数
    function updateBrushSizeIndicator(e, indicator) {
        // 所有工具都显示指示器
        if (!indicator) return;

        // 使用与鼠标事件完全相同的坐标计算方法
        const coords = getPixelCoordinates(e);

        // 完全照搬drawPixel函数的逻辑
        const coverage = getBrushCoverage(coords.x, coords.y);

        // 获取画布容器的边界矩形（而不是画布本身）
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvasContainer) return;

        const containerRect = canvasContainer.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        // 计算画布在容器内的偏移量
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;

        // 计算缩放因子（与getPixelCoordinates函数一致）
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        // 完全照搬drawPixel中的循环逻辑
        // 计算指示器应该覆盖的像素范围
        let minX = coverage.startX;
        let minY = coverage.startY;
        let maxX = coverage.startX + coverage.width - 1;
        let maxY = coverage.startY + coverage.height - 1;

        // 确保在画布范围内（与drawPixel中的边界检查一致）
        minX = Math.max(0, minX);
        minY = Math.max(0, minY);
        maxX = Math.min(currentSize - 1, maxX);
        maxY = Math.min(currentSize - 1, maxY);

        // 计算指示器的位置和大小
        // 将画布坐标转换为屏幕坐标，并加上容器内偏移量
        const left = minX / scaleX + offsetX;
        const top = minY / scaleY + offsetY;
        const width = (maxX - minX + 1) / scaleX;
        const height = (maxY - minY + 1) / scaleY;

        // 设置指示器位置和大小
        indicator.style.left = `${left}px`;
        indicator.style.top = `${top}px`;
        indicator.style.width = `${width}px`;
        indicator.style.height = `${height}px`;

        // 设置指示器边框颜色与选择颜色一致
        // 对于橡皮擦工具，使用白色边框
        if (currentTool === 'eraser') {
            indicator.style.borderColor = '#ffffff';
        } else {
            indicator.style.borderColor = currentColor;
        }
    }

    // 自定义颜色选择器
    const colorPickerDialog = document.getElementById('color-picker-dialog');
    const colorPickerInput = document.getElementById('color-picker-input');
    const colorPickerOk = document.getElementById('color-picker-ok');
    const colorPickerCancel = document.getElementById('color-picker-cancel');
    const colorPickerLabel = document.querySelector('label[for="color-picker"]');
    const colorPreview = document.getElementById('color-preview');

    // 初始化颜色预览
    updateColorPreview();

    // 点击Color标签时显示颜色选择器
    colorPickerLabel.addEventListener('click', () => {
        colorPickerInput.value = currentColor;
        colorPickerDialog.classList.add('show');
    });

    // 关闭颜色选择器
    function closeColorPicker() {
        colorPickerDialog.classList.remove('show');
    }

    // 确定按钮 - 应用选中的颜色
    colorPickerOk.addEventListener('click', () => {
        currentColor = colorPickerInput.value;
        // 如果颜色不是透明色，才更新HTML5颜色选择器的值
        if (currentColor !== 'transparent') {
            colorPicker.value = currentColor;
        }
        // 添加到最近颜色
        addToRecentColors(currentColor);
        updateColorPreview();
        closeColorPicker();
    });

    // 取消按钮 - 不应用颜色，直接关闭
    colorPickerCancel.addEventListener('click', closeColorPicker);

    // 初始化颜色预览
    updateColorPreview();

    // 快速颜色选择
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.style.backgroundColor = swatch.dataset.color;

        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.color;
            if (currentColor !== 'transparent') {
                colorPicker.value = currentColor;
            }

            // 添加到最近颜色
            addToRecentColors(currentColor);

            // 更新颜色预览指示器
            updateColorPreview();

            // 更新活动状态
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
    });

    // 调色盘面板功能
    const paletteSwatches = document.querySelectorAll('.color-palette-grid .color-swatch');
    const addCustomColorBtn = document.getElementById('add-custom-color');
    const clearPaletteBtn = document.getElementById('clear-palette');
    const recentColorsGrid = document.getElementById('recent-colors-grid');

    // 初始化最近颜色
    function initRecentColors() {
        // 从本地存储加载最近颜色
        const savedColors = localStorage.getItem('pixelLogoRecentColors');
        if (savedColors) {
            recentColors = JSON.parse(savedColors);
            renderRecentColors();
        }
    }

    // 颜色样本点击事件处理函数
    function setColorFromSwatch(swatch) {
        // 移除所有active状态
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        // 添加active状态到当前点击的样本
        swatch.classList.add('active');

        const color = swatch.getAttribute('data-color');
        currentColor = color;
        if (currentColor !== 'transparent') {
            colorPicker.value = currentColor;
        }

        // 更新颜色预览指示器
        updateColorPreview();

        // 添加到最近颜色（透明色除外）
        if (color !== 'transparent') {
            addToRecentColors(color);
        }
    }

    // 初始化调色盘颜色
    paletteSwatches.forEach(swatch => {
        if (swatch.dataset.color !== 'transparent') {
            swatch.style.backgroundColor = swatch.dataset.color;
        }

        swatch.addEventListener('click', function() {
            setColorFromSwatch(this);
        });
    });

    // 高级颜色选择器相关变量
    const advancedColorPickerDialog = document.getElementById('color-picker-dialog-advanced');
    const closeColorPickerBtn = document.getElementById('close-color-picker');
    const colorPickerOkBtn = document.getElementById('color-picker-ok-advanced');
    const colorPickerCancelBtn = document.getElementById('color-picker-cancel-advanced');
    const currentColorPreview = document.getElementById('current-color-preview');
    const newColorPreview = document.getElementById('new-color-preview');
    const hueSlider = document.getElementById('hue-slider');
    const saturationSlider = document.getElementById('saturation-slider');
    const lightnessSlider = document.getElementById('lightness-slider');
    const hueInput = document.getElementById('hue-input');
    const saturationInput = document.getElementById('saturation-input');
    const lightnessInput = document.getElementById('lightness-input');
    const hueSpectrum = document.getElementById('hue-spectrum');
    const saturationLightness = document.getElementById('saturation-lightness');
    const slCursor = document.getElementById('sl-cursor');
    const basicColorsGrid = document.getElementById('basic-colors-grid');
    const colorTabs = document.querySelectorAll('.color-tab');

    let selectedHue = 0;
    let selectedSaturation = 100;
    let selectedLightness = 50;
    let selectedColor = '#ff0000';

    // 初始化高级颜色选择器
    function initAdvancedColorPicker() {
        // 初始化基本颜色
        const basicColors = [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            '#FFA500', '#800080', '#A52A2A', '#008000', '#008080', '#000080', '#800000', '#808080'
        ];

        basicColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.setAttribute('data-color', color);
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', function() {
                const colorValue = this.getAttribute('data-color');
                setColorFromHex(colorValue);
            });
            basicColorsGrid.appendChild(swatch);
        });

        // 绑定事件
        bindAdvancedColorPickerEvents();

        // 初始化颜色模式标签
        colorTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                colorTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                // 这里可以添加不同颜色模式的切换逻辑
            });
        });
    }

    // 绑定高级颜色选择器事件
    function bindAdvancedColorPickerEvents() {
        // 色调滑块和输入框同步
        hueSlider.addEventListener('input', function() {
            selectedHue = parseInt(this.value);
            hueInput.value = selectedHue;
            updateColorFromHSL();
        });

        hueInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(360, value));
            selectedHue = value;
            hueSlider.value = value;
            hueInput.value = value;
            updateColorFromHSL();
        });

        // 饱和度滑块和输入框同步
        saturationSlider.addEventListener('input', function() {
            selectedSaturation = parseInt(this.value);
            saturationInput.value = selectedSaturation;
            updateColorFromHSL();
        });

        saturationInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(100, value));
            selectedSaturation = value;
            saturationSlider.value = value;
            saturationInput.value = value;
            updateColorFromHSL();
        });

        // 亮度滑块和输入框同步
        lightnessSlider.addEventListener('input', function() {
            selectedLightness = parseInt(this.value);
            lightnessInput.value = selectedLightness;
            updateColorFromHSL();
        });

        lightnessInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(100, value));
            selectedLightness = value;
            lightnessSlider.value = value;
            lightnessInput.value = value;
            updateColorFromHSL();
        });

        // 色调光谱点击事件
        hueSpectrum.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const hue = Math.round((y / rect.height) * 360);
            selectedHue = Math.max(0, Math.min(360, hue));
            hueSlider.value = selectedHue;
            hueInput.value = selectedHue;
            updateColorFromHSL();
        });

        // 饱和度/亮度区域点击事件
        saturationLightness.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            selectedSaturation = Math.round((x / rect.width) * 100);
            selectedLightness = Math.round(100 - (y / rect.height) * 100);

            saturationSlider.value = selectedSaturation;
            saturationInput.value = selectedSaturation;
            lightnessSlider.value = selectedLightness;
            lightnessInput.value = selectedLightness;

            updateColorFromHSL();
        });

        // 对话框按钮事件
        closeColorPickerBtn.addEventListener('click', closeAdvancedColorPicker);
        colorPickerCancelBtn.addEventListener('click', closeAdvancedColorPicker);
        colorPickerOkBtn.addEventListener('click', applyAdvancedColor);

        // 点击对话框外部关闭
        advancedColorPickerDialog.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAdvancedColorPicker();
            }
        });
    }

    // 从HSL值更新颜色
    function updateColorFromHSL() {
        selectedColor = hslToHex(selectedHue, selectedSaturation, selectedLightness);
        newColorPreview.style.backgroundColor = selectedColor;
        updateSLCursorPosition();
    }

    // 从十六进制颜色设置选择器
    function setColorFromHex(hexColor) {
        const hsl = hexToHsl(hexColor);
        selectedHue = hsl.h;
        selectedSaturation = hsl.s;
        selectedLightness = hsl.l;

        hueSlider.value = selectedHue;
        hueInput.value = selectedHue;
        saturationSlider.value = selectedSaturation;
        saturationInput.value = selectedSaturation;
        lightnessSlider.value = selectedLightness;
        lightnessInput.value = selectedLightness;

        selectedColor = hexColor;
        newColorPreview.style.backgroundColor = selectedColor;
        updateSLCursorPosition();
    }

    // 更新饱和度/亮度光标位置
    function updateSLCursorPosition() {
        const rect = saturationLightness.getBoundingClientRect();
        const x = (selectedSaturation / 100) * rect.width;
        const y = (1 - selectedLightness / 100) * rect.height;

        slCursor.style.left = (x - 4) + 'px';
        slCursor.style.top = (y - 4) + 'px';

        // 更新色调光谱的背景
        hueSpectrum.style.background = `linear-gradient(to bottom,
            hsl(0, 100%, 50%), hsl(30, 100%, 50%), hsl(60, 100%, 50%), hsl(90, 100%, 50%),
            hsl(120, 100%, 50%), hsl(150, 100%, 50%), hsl(180, 100%, 50%), hsl(210, 100%, 50%),
            hsl(240, 100%, 50%), hsl(270, 100%, 50%), hsl(300, 100%, 50%), hsl(330, 100%, 50%), hsl(360, 100%, 50%)
        `;

        // 更新饱和度/亮度区域的背景
        saturationLightness.style.background = `
            linear-gradient(to right, white, hsl(${selectedHue}, 100%, 50%)),
            linear-gradient(to bottom, black, transparent)
        `;
    }

    // HSL转十六进制
    function hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // 十六进制转HSL
    function hexToHsl(hex) {
        let r = 0, g = 0, b = 0;

        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16) / 255;
            g = parseInt(hex[2] + hex[2], 16) / 255;
            b = parseInt(hex[3] + hex[3], 16) / 255;
        } else if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16) / 255;
            g = parseInt(hex[3] + hex[4], 16) / 255;
            b = parseInt(hex[5] + hex[6], 16) / 255;
        }

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    // 打开高级颜色选择器
    function openAdvancedColorPicker() {
        // 设置当前颜色预览
        currentColorPreview.style.backgroundColor = currentColor === 'transparent' ? '#ffffff' : currentColor;

        // 初始化选择器为当前颜色
        if (currentColor !== 'transparent') {
            setColorFromHex(currentColor);
        } else {
            setColorFromHex('#000000');
        }

        advancedColorPickerDialog.style.display = 'block';
    }

    // 关闭高级颜色选择器
    function closeAdvancedColorPicker() {
        advancedColorPickerDialog.style.display = 'none';
    }

    // 应用高级颜色选择器的颜色
    function applyAdvancedColor() {
        currentColor = selectedColor;
        colorPicker.value = selectedColor;
        updateColorPreview();

        // 添加到最近颜色
        addToRecentColors(selectedColor);

        closeAdvancedColorPicker();
    }

    // 添加自定义颜色（使用高级颜色选择器）
    addCustomColorBtn.addEventListener('click', function() {
        openAdvancedColorPicker();
    });

    // 清空调色盘（只清除最近颜色）
    clearPaletteBtn.addEventListener('click', () => {
        if (confirm('确定要清除最近使用的颜色吗？')) {
            recentColors = [];
            localStorage.removeItem('pixelLogoRecentColors');
            renderRecentColors();
        }
    });

    // 初始化功能
    initRecentColors();
    initAdvancedColorPicker();

    // 调色盘功能
    let customPalette = [];
    const customPaletteContainer = document.getElementById('custom-palette');
    const savePaletteBtn = document.getElementById('save-palette');
    const resetPaletteBtn = document.getElementById('reset-palette');

    // 初始化调色盘
    function initCustomPalette() {
        // 初始化默认颜色
        const defaultColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        customPalette = [...defaultColors];
        renderCustomPalette();
    }

    // 渲染调色盘
    function renderCustomPalette() {
        customPaletteContainer.innerHTML = '';

        customPalette.forEach(color => {
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'color-swatch';
            colorSwatch.dataset.color = color;

            if (color === 'transparent') {
                colorSwatch.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)';
                colorSwatch.style.backgroundSize = '8px 8px';
                colorSwatch.style.backgroundPosition = '0 0, 4px 4px';
            } else {
                colorSwatch.style.backgroundColor = color;
            }

            // 点击颜色时选择
            colorSwatch.addEventListener('click', () => {
                currentColor = color;
                if (currentColor !== 'transparent') {
                    colorPicker.value = currentColor;
                }

                // 更新活动状态
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                colorSwatch.classList.add('active');
            });

            // 右键点击删除颜色
            colorSwatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const index = customPalette.indexOf(color);
                if (index > -1) {
                    customPalette.splice(index, 1);
                    renderCustomPalette();
                }
            });

            customPaletteContainer.appendChild(colorSwatch);
        });

        // 添加一个空白的颜色样本，用于添加新颜色
        const addColorSwatch = document.createElement('div');
        addColorSwatch.className = 'color-swatch';
        addColorSwatch.style.backgroundColor = 'transparent';
        addColorSwatch.style.border = '2px dashed #666';
        addColorSwatch.style.display = 'flex';
        addColorSwatch.style.alignItems = 'center';
        addColorSwatch.style.justifyContent = 'center';
        addColorSwatch.style.color = '#666';
        addColorSwatch.innerHTML = '+';

        addColorSwatch.addEventListener('click', () => {
            // 添加当前颜色到调色盘
            if (customPalette.indexOf(currentColor) === -1) {
                customPalette.push(currentColor);
                renderCustomPalette();
            }
        });

        customPaletteContainer.appendChild(addColorSwatch);
    }

    // 保存当前调色盘
    savePaletteBtn.addEventListener('click', () => {
        localStorage.setItem('pixelLogoPalette', JSON.stringify(customPalette));
        // 可以添加一个提示
        // fsLogger.info('调色盘已保存');
    });

    // 重置调色盘
    resetPaletteBtn.addEventListener('click', () => {
        initCustomPalette();
        localStorage.removeItem('pixelLogoPalette');
        // fsLogger.info('调色盘已重置');
    });

    // 加载保存的调色盘
    function loadCustomPalette() {
        const savedPalette = localStorage.getItem('pixelLogoPalette');
        if (savedPalette) {
            customPalette = JSON.parse(savedPalette);
            renderCustomPalette();
        } else {
            initCustomPalette();
        }
    }

    // 初始化调色盘
    loadCustomPalette();

    // 画布大小选择
    sizeSelector.addEventListener('change', () => {
        resizeCanvas(parseInt(sizeSelector.value));
    });

    // 窗口大小改变事件，动态调整画布大小
    window.addEventListener('resize', () => {
        // 重新应用当前大小，但使用新的像素尺寸计算
        resizeCanvas(currentSize);
    });

    // 工具选择 - 按钮方式
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新工具
            currentTool = button.dataset.tool;
            console.log('工具切换:', currentTool);

            // 更新按钮状态
            toolButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 获取画笔大小指示器
            const brushSizeIndicator = document.getElementById('brush-size-indicator');

            // 更新光标和画笔大小指示器
            if (currentTool === 'eraser') {
                canvas.classList.add('cursor-eraser');
                canvas.classList.remove('cursor-pencil', 'cursor-fill', 'cursor-color-extractor');
                // 移除所有画笔尺寸类，确保只使用橡皮擦SVG图标
                for (let i = 1; i <= 6; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            } else if (currentTool === 'fill') {
                canvas.classList.remove('cursor-eraser', 'cursor-pencil', 'cursor-color-extractor');
                canvas.classList.add('cursor-fill');
                // 移除所有画笔尺寸类
                for (let i = 1; i <= 6; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            } else if (currentTool === 'color-extractor') {
                canvas.classList.remove('cursor-eraser', 'cursor-pencil', 'cursor-fill', 'cursor-select');
                canvas.classList.add('cursor-color-extractor');
                // 移除所有画笔尺寸类
                for (let i = 1; i <= 6; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            } else if (currentTool === 'select') {
                canvas.classList.remove('cursor-eraser', 'cursor-pencil', 'cursor-fill', 'cursor-color-extractor');
                canvas.classList.add('cursor-select');
                // 移除所有画笔尺寸类
                for (let i = 1; i <= 6; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            } else {
                // 铅笔工具
                canvas.classList.remove('cursor-eraser', 'cursor-fill', 'cursor-color-extractor', 'cursor-select');
                canvas.classList.add('cursor-pencil');
                // 移除所有画笔尺寸类，确保只使用铅笔SVG图标
                for (let i = 1; i <= 6; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            }
            // 所有工具都显示画笔大小指示器
            brushSizeIndicator.classList.add('visible');
            // 立即更新指示器大小
            if (canvas.matches(':hover')) {
                // 如果鼠标已经在画布上，获取当前鼠标位置并更新指示器
                const rect = canvas.getBoundingClientRect();
                const mousePos = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
                updateBrushSizeIndicator(mousePos, brushSizeIndicator);
            }
        });
    });

    // 键盘事件监听 - 撤销和重做
    document.addEventListener('keydown', function(e) {
        // 调试键盘事件
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v')) {
            console.log('Ctrl key pressed with:', e.key);
        }
        // 移除了ESC键取消选择的代码
        // Ctrl+Z 撤销
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl+Shift+Z 重做
        if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            redo();
        }
        // 移除了Ctrl+C和Ctrl+V处理代码
    });

    // 颜色吸取器功能
    canvas.addEventListener('click', function(e) {

        if (currentTool === 'color-extractor') {
            const coords = getPixelCoordinates(e);
            const x = coords.x;
            const y = coords.y;

            // 确保坐标在有效范围内
            if (x >= 0 && x < currentSize && y >= 0 && y < currentSize) {
                // 获取点击位置的颜色
                let color = pixelData[y][x];

                // 转换透明色表示：空字符串 -> 'transparent'
                if (color === '') {
                    color = 'transparent';
                }

                // 设置为当前颜色
                currentColor = color;
                // 如果颜色不是透明色，更新颜色选择器的值
                if (color !== 'transparent') {
                    colorPicker.value = color;
                }
                updateColorPreview();
                // 添加到最近颜色（包括透明色）
                addToRecentColors(color);

                // 切换为铅笔工具
                currentTool = 'pencil';
                // 更新工具按钮状态
                toolButtons.forEach(btn => btn.classList.remove('active'));
                const pencilBtn = document.querySelector('.tool-btn[data-tool="pencil"]');
                if (pencilBtn) {
                    pencilBtn.classList.add('active');
                }
                // 更新光标
                canvas.classList.remove('cursor-eraser');
                canvas.classList.remove('cursor-fill');
                canvas.classList.remove('cursor-color-extractor');
                canvas.classList.add('cursor-pencil');
            }
        }
    });

    // 画笔尺寸选择
    brushSizeSlider.addEventListener('input', () => {
        currentBrushSize = parseInt(brushSizeSlider.value);
        brushSizeValue.textContent = currentBrushSize;
        // 更新光标（铅笔和橡皮擦工具）
        if (currentTool === 'pencil' || currentTool === 'eraser') {
            updateBrushSizeCursor();
        }
        // 更新画笔大小指示器
        const brushSizeIndicator = document.getElementById('brush-size-indicator');
        if (brushSizeIndicator && brushSizeIndicator.classList.contains('visible')) {
            // 检查鼠标是否在画布上
            const mousePos = {
                clientX: canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2,
                clientY: canvas.getBoundingClientRect().top + canvas.getBoundingClientRect().height / 2
            };
            updateBrushSizeIndicator(mousePos, brushSizeIndicator);
        }
    });



    // 网格线显示开关
    showGridCheckbox.addEventListener('change', () => {
        showGrid = showGridCheckbox.checked;
        updateGrid();
    });

    // 背景按钮已移除，默认使用半透明背景
    canvas.parentElement.classList.add('transparent-bg');
    currentBackgroundColor = 'transparent';



    // 快速颜色选择器现在直接应用颜色，无需确认取消按钮

    // 清空画布
    clearButton.addEventListener('click', clearCanvas);

    // 预览按钮功能
    const previewModal = document.getElementById('preview-modal');
    const closePreviewBtn = document.getElementById('close-preview');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomValue = document.getElementById('zoom-value');

    // 初始化缩放滑块事件
    zoomSlider.addEventListener('input', function() {
        const zoomLevel = this.value / 100;
        previewCanvas.style.transform = `scale(${zoomLevel})`;
        zoomValue.textContent = `${this.value}%`;
    });

    // 显示预览
    function showPreview() {
        // 设置预览画布大小与原画布相同
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;

        // 将当前画布内容复制到预览画布
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.drawImage(canvas, 0, 0);

        // 显示模态窗口
        previewModal.classList.add('active');

        // 更新按钮文本
        previewButton.textContent = 'Exit Preview';

        // 设置退出预览按钮样式与预览按钮一致
        closePreviewBtn.classList.add('preview-btn');
        closePreviewBtn.textContent = 'Exit Preview';

        // 设置预览图像为像素大小，支持最大500%放大
        setTimeout(() => {
            const modalContent = document.querySelector('.preview-modal-content');
            const modalBody = document.querySelector('.preview-modal-body');

            // 获取画布的像素尺寸（不是显示尺寸）
            const pixelWidth = canvas.width;
            const pixelHeight = canvas.height;

            // 设置预览画布为像素大小（如32x32, 64x64等）
            previewCanvas.style.width = `${pixelWidth}px`;
            previewCanvas.style.height = `${pixelHeight}px`;
            previewCanvas.style.maxWidth = 'none';
            previewCanvas.style.maxHeight = 'none';

            // 显示标题栏和缩放控件
            const modalHeader = document.querySelector('.preview-modal-header');
            const modalFooter = document.querySelector('.preview-modal-footer');
            if (modalHeader) modalHeader.style.display = 'block';
            if (modalFooter) modalFooter.style.display = 'block';

            // 设置模态主体正常内边距
            modalBody.style.padding = '20px';

            // 重置缩放为100%（像素大小）
            previewCanvas.style.transform = 'scale(1)';
            previewCanvas.style.transformOrigin = 'center';

            // 重置缩放滑块为100%
            zoomSlider.value = 100;
            zoomValue.textContent = '100%';

            // 设置缩放滑块最大值为500%
            zoomSlider.max = 500;
        }, 100);
    }

    // 关闭预览
    function closePreview() {
        // 隐藏模态窗口
        previewModal.classList.remove('active');

        // 更新按钮文本
        previewButton.textContent = 'Preview';

        // 恢复退出预览按钮的原始样式
        closePreviewBtn.classList.remove('preview-btn');
        closePreviewBtn.textContent = '×';
    }

    // 预览按钮点击事件
    previewButton.addEventListener('click', function() {
        if (previewModal.classList.contains('active')) {
            closePreview();
        } else {
            showPreview();
        }
    });

    // 关闭预览按钮点击事件
    closePreviewBtn.addEventListener('click', closePreview);

    // 点击模态窗口外部关闭预览
    previewModal.addEventListener('click', function(event) {
        if (event.target === previewModal) {
            closePreview();
        }
    });

    // 导出SVG
    exportSvgButton.addEventListener('click', () => {
        const svg = exportAsSvg();
        // 切换到SVG选项卡
        tabButtons[0].click();
    });

    // 导出Base64
    exportBase64Button.addEventListener('click', () => {
        const base64 = exportAsBase64();
        // 切换到Base64选项卡
        tabButtons[1].click();
    });

    // 下载图片
    downloadImageButton.addEventListener('click', downloadCanvasAsImage);

    // 新添加的导出按钮
    exportSvgBtn.addEventListener('click', () => {
        const svg = exportAsSvg();
        // 切换到SVG选项卡
        tabButtons[0].click();
    });

    exportBase64Btn.addEventListener('click', () => {
        const base64 = exportAsBase64();
        // 切换到Base64选项卡
        tabButtons[1].click();
    });

    exportMarkdownBtn.addEventListener('click', () => {
        const markdown = exportAsMarkdown();
        // 切换到Markdown选项卡
        // 找到Markdown选项卡按钮并点击
        const markdownTabBtn = document.querySelector('[data-tab="markdown"]');
        if (markdownTabBtn) {
            markdownTabBtn.click();
        }
    });

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
    copyButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // 查找按钮所在的输出面板
            const outputPanel = button.closest('.output-panel');
            const codeElement = outputPanel.querySelector('code');
            const text = codeElement.textContent;

            if (text) {
                copyToClipboard(text, button);
            }
        });
    });

    // 初始化画笔尺寸光标
    updateBrushSizeCursor();
}

// 显示提取的颜色
function displayExtractedColors(colors) {
    const extractedColorsPalette = document.getElementById('extracted-colors-palette');

    // 清空现有的颜色
    extractedColorsPalette.innerHTML = '';

    // 从pixelData中提取颜色并统计使用频率
    const colorFrequency = {};

    // 遍历像素数据，统计每个颜色的使用频率
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color && color !== '') {
                if (colorFrequency[color]) {
                    colorFrequency[color]++;
                } else {
                    colorFrequency[color] = 1;
                }
            }
        }
    }

    // 将颜色频率对象转换为数组并按频率排序（从高到低）
    const sortedByFrequency = Object.entries(colorFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);

    // 限制显示的颜色数量（使用与外部一致的maxColors值）
    const maxColors = 64;
    const limitedColors = sortedByFrequency.slice(0, maxColors);

    // 如果没有颜色，显示提示
    if (limitedColors.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No colors used in pixel art';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#666';
        emptyMessage.style.fontSize = '11px';
        emptyMessage.style.padding = '10px';
        extractedColorsPalette.appendChild(emptyMessage);
        return;
    }

    // 添加颜色小方格
    limitedColors.forEach(color => {
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'color-swatch';
        colorSwatch.dataset.color = color;
        colorSwatch.style.backgroundColor = color;
        colorSwatch.title = color;

        // 点击颜色小方格时设置为当前颜色
        colorSwatch.addEventListener('click', () => {
            currentColor = color;
            if (currentColor !== 'transparent') {
                colorPicker.value = currentColor;
            }

            // 更新颜色预览指示器
            updateColorPreview();

            // 更新活动状态
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            colorSwatch.classList.add('active');
        });

        extractedColorsPalette.appendChild(colorSwatch);
    });
}

// 清除选择框画布
function clearSelectionCanvas() {
    if (selectionCtx) {
        selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
}

// 保存选择区域
function saveSelectionRegion() {
    // 确保当前有选中区域
    if (selectionStartX === selectionEndX && selectionStartY === selectionEndY) {
        return;
    }

    // 计算选择区域的范围
    const startX = Math.min(selectionStartX, selectionEndX);
    const startY = Math.min(selectionStartY, selectionEndY);
    const endX = Math.max(selectionStartX, selectionEndX);
    const endY = Math.max(selectionStartY, selectionEndY);
    const width = endX - startX + 1;
    const height = endY - startY + 1;

    // 读取选择区域内的像素数据
    const regionData = [];
    for (let y = startY; y <= endY; y++) {
        const row = [];
        for (let x = startX; x <= endX; x++) {
            row.push(getPixelColor(x, y));
        }
        regionData.push(row);
    }

    // 创建新的选择区域记录
    const region = {
        id: Date.now(),
        data: regionData,
        width: width,
        height: height,
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        timestamp: Date.now()
    };

    // 按照从1到8的顺序找空的按钮
    let added = false;
    for (let i = 0; i < MAX_SELECTION_REGIONS; i++) {
        if (!selectionRegions[i]) {
            selectionRegions[i] = region;
            added = true;
            break;
        }
    }

    // 如果全满，依次前进覆盖复制
    if (!added) {
        // 移除第一个元素，其他元素前移
        selectionRegions.shift();
        // 在末尾添加新元素
        selectionRegions.push(region);
    }

    // 更新选择区域标签
    updateSelectionTabs();

    // 找到新添加的区域在数组中的索引
    const newIndex = selectionRegions.findIndex(r => r && r.id === region.id);
    if (newIndex !== -1) {
        // 将新添加的区域对应的tab设置为选中状态
        setTimeout(() => {
            const tabs = document.querySelectorAll('.selection-tab');
            if (tabs[newIndex]) {
                // 移除所有tab的active类
                tabs.forEach(t => t.classList.remove('active'));
                // 为新添加的tab添加active类
                tabs[newIndex].classList.add('active');
            }
        }, 0);
    }
}

// 更新选择区域标签
function updateSelectionTabs() {
    const tabsContainer = document.getElementById('selection-tabs');
    if (!tabsContainer) return;

    // 在更新前保存当前选中的regionId
    let activeRegionId = null;
    const activeTab = document.querySelector('.selection-tab.active');
    if (activeTab && activeTab.dataset.regionId) {
        activeRegionId = parseInt(activeTab.dataset.regionId);
    }

    // 清空现有标签
    tabsContainer.innerHTML = '';

    // 始终创建8个标签，无论是否有复制数据
    for (let i = 0; i < MAX_SELECTION_REGIONS; i++) {
        const tab = document.createElement('div');
        const region = selectionRegions[i];

        // 根据是否有数据设置不同的样式类
        if (region) {
            tab.className = 'selection-tab selection-tab-filled';
            tab.dataset.regionId = region.id;

            // 如果该区域是之前选中的，并且数据没有被清除/覆盖，则保持选中状态
            if (region.id === activeRegionId) {
                tab.classList.add('active');
            }
        } else {
            tab.className = 'selection-tab selection-tab-empty';
            tab.dataset.regionId = null;
        }

        tab.textContent = `Copy ${i + 1}`;

        // 添加关闭按钮，但只有有数据的标签才显示
        if (region) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeSelectionRegion(region.id);
            });
            tab.appendChild(closeBtn);
        }

        // 添加点击事件
        tab.addEventListener('click', () => {
            if (region) {
                // 移除所有tab的active类
                document.querySelectorAll('.selection-tab').forEach(t => t.classList.remove('active'));
                // 为当前tab添加active类
                tab.classList.add('active');
                // 可以添加切换显示该区域的功能
                console.log('选择区域:', region);
            }
        });

        tabsContainer.appendChild(tab);
    }
}

// 删除选择区域（仅清空指定位置的数据，不移动后面的按钮）
function removeSelectionRegion(regionId) {
    // 找到要删除的区域在数组中的索引
    const index = selectionRegions.findIndex(region => region && region.id === regionId);
    if (index !== -1) {
        // 仅清空该位置的数据，不删除元素，保持数组结构
        selectionRegions[index] = null;
    }
    updateSelectionTabs();
}

// 绘制粘贴预览
function drawPastePreview() {
    if (!pasteData || !selectionCtx) return;

    // 获取主画布的实际显示尺寸
    const rect = canvas.getBoundingClientRect();

    // 确保选择框画布大小与主画布显示尺寸一致（与drawSelectionRect保持一致）
    selectionCanvas.width = rect.width;
    selectionCanvas.height = rect.height;

    // 清除之前的选择框和预览
    clearSelectionCanvas();

    const { data, width, height } = pasteData;

    // 计算网格大小（每个像素的显示大小）
    const pixelSize = rect.width / currentSize;

    // 计算预览区域的实际像素坐标（考虑缩放）
    const startX = pasteOffsetX;
    const startY = pasteOffsetY;

    // 绘制半透明的预览
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = data[y][x];
            if (color && color !== 'transparent') {
                const canvasX = startX + x;
                const canvasY = startY + y;

                // 确保在画布范围内
                if (canvasX >= 0 && canvasX < currentSize && canvasY >= 0 && canvasY < currentSize) {
                    // 根据pixelSize缩放坐标和尺寸
                    const drawX = canvasX * pixelSize;
                    const drawY = canvasY * pixelSize;

                    selectionCtx.fillStyle = color;
                    selectionCtx.globalAlpha = 0.7;
                    selectionCtx.fillRect(drawX, drawY, pixelSize, pixelSize);

                    // 绘制边框
                    selectionCtx.strokeStyle = '#333';
                    selectionCtx.globalAlpha = 1.0;
                    selectionCtx.strokeRect(drawX, drawY, pixelSize, pixelSize);
                }
            }
        }
    }

    // 绘制整个预览区域的边框
    selectionCtx.strokeStyle = '#000';
    selectionCtx.lineWidth = 1;
    const borderX = startX * pixelSize;
    const borderY = startY * pixelSize;
    const borderWidth = width * pixelSize;
    const borderHeight = height * pixelSize;
    selectionCtx.strokeRect(borderX, borderY, borderWidth, borderHeight);
}

// 执行粘贴操作
function pasteToCanvas() {
    if (!pasteData) return;

    // 保存当前状态到撤销栈
    saveState();

    const { data, width, height } = pasteData;

    // 将数据复制到画布上
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = data[y][x];
            const canvasX = pasteOffsetX + x;
            const canvasY = pasteOffsetY + y;

            // 确保在画布范围内
            if (canvasX >= 0 && canvasX < currentSize && canvasY >= 0 && canvasY < currentSize) {
                // 直接传递颜色给drawPixel函数，它会处理透明色
                drawPixel(canvasX, canvasY, color);
            }
        }
    }

    // 结束粘贴模式
    cancelPaste();
}

// 取消粘贴模式
function cancelPaste() {
    isPasting = false;
    pasteData = null;
    pasteOffsetX = 0;
    pasteOffsetY = 0;

    // 清除预览
    clearSelectionCanvas();
}

// 绘制选择框
function drawSelectionRect() {
    if (!selectionCtx) return;

    // 获取主画布的实际显示尺寸
    const rect = canvas.getBoundingClientRect();

    // 确保选择框画布大小与主画布显示尺寸一致
    selectionCanvas.width = rect.width;
    selectionCanvas.height = rect.height;

    // 清除之前的选框
    clearSelectionCanvas();

    // 计算选框的像素坐标范围
    const startX = Math.min(selectionStartX, selectionEndX);
    const startY = Math.min(selectionStartY, selectionEndY);
    const endX = Math.max(selectionStartX, selectionEndX);
    const endY = Math.max(selectionStartY, selectionEndY);

    // 计算选框的宽度和高度（像素数）
    const width = endX - startX + 1;
    const height = endY - startY + 1;

    // 计算每个像素在屏幕上的实际大小
    const pixelSize = rect.width / currentSize;

    // 计算选框的屏幕坐标
    const rectX = startX * pixelSize;
    const rectY = startY * pixelSize;
    const rectWidth = width * pixelSize;
    const rectHeight = height * pixelSize;

    // 绘制选框边框 - 使用当前选中的颜色
    selectionCtx.strokeStyle = currentColor === 'transparent' ? '#000000' : currentColor;
    selectionCtx.lineWidth = 2;
    selectionCtx.setLineDash([]);

    // 绘制选框边框
    selectionCtx.beginPath();
    selectionCtx.rect(rectX, rectY, rectWidth, rectHeight);
    selectionCtx.stroke();
}

// 当页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);