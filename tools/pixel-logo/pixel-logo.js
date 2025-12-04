/**
 * Pixel Logo Maker - JavaScript功能实现
 */

// 全局变量
let canvas;
let ctx;
let currentSize = 64;
let currentTool = 'brush';
let currentColor = '#000000';
let currentBrushSize = 1;
let isDrawing = false;
let pixelData = [];
let currentBackgroundColor = '#FFFFFF';
let showGrid = true;
let gridCanvas;
let gridCtx;

// DOM元素
let canvasElement;
let colorPicker;
let sizeSelector;
let clearButton;
let exportSvgButton;
let exportBase64Button;
let downloadImageButton;
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
    exportSvgButton = document.getElementById('export-svg');
    exportBase64Button = document.getElementById('export-base64');
    downloadImageButton = document.getElementById('download-image');
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
    // 背景按钮已移除

    // 设置Canvas
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    // 创建网格画布
    gridCanvas = document.createElement('canvas');
    gridCtx = gridCanvas.getContext('2d');
    gridCanvas.style.position = 'absolute';
    gridCanvas.style.pointerEvents = 'none';

    // 确保画布容器有相对定位
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(gridCanvas);

    // 初始化画布
    resizeCanvas(currentSize);
    clearCanvas();

    // 设置默认显示网格线
    showGridCheckbox.checked = true;



    // 更新网格显示
    updateGrid();

    // 绑定事件监听器
    bindEvents();


}

// 调整画布大小
function resizeCanvas(size) {
    currentSize = size;

    canvas.width = size;
    canvas.height = size;

    // 计算最佳像素大小以适应容器
    const canvasContainer = document.querySelector('.canvas-container') || canvas.parentElement;
    const containerRect = canvasContainer.getBoundingClientRect();
    const availableWidth = containerRect.width - 30; // 考虑内边距
    const availableHeight = containerRect.height - 30; // 考虑内边距

    // 计算像素大小以尽可能填充空间
    let pixelSize = Math.floor(Math.min(availableWidth, availableHeight) / currentSize);
    // 确保像素大小至少为4px以保证可用性
    pixelSize = Math.max(pixelSize, 4);

    // 设置主画布尺寸
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size * pixelSize}px`;
    canvas.style.height = `${size * pixelSize}px`;

    // 设置网格画布尺寸 - 与实际显示尺寸一致
    gridCanvas.width = size * pixelSize;
    gridCanvas.height = size * pixelSize;
    gridCanvas.style.width = `${size * pixelSize}px`;
    gridCanvas.style.height = `${size * pixelSize}px`;

    // 确保网格画布与主画布对齐
    alignGridCanvas();

    // 重新初始化像素数据 - 使用空字符串表示透明/无像素
    pixelData = Array(size).fill().map(() => Array(size).fill(''));

    // 清空画布
    ctx.clearRect(0, 0, size, size);

    // 更新网格
    updateGrid();


}

// 清空画布
function clearCanvas() {
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

    // 计算主画布在容器中的偏移量
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    // 设置网格画布位置与主画布对齐
    gridCanvas.style.left = `${offsetX}px`;
    gridCanvas.style.top = `${offsetY}px`;
}

// 更新网格显示
function updateGrid() {
    if (!showGrid) {
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        return;
    }

    // 清空网格画布
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // 设置网格样式 - 在半透明背景下更明显
    gridCtx.strokeStyle = '#AAAAAA';
    gridCtx.lineWidth = 1;

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
        return pixelData[y][x];
    }
    return null;
}

// 填充算法（墨水瓶功能）
function floodFill(startX, startY, targetColor, replacementColor) {
    // 如果目标颜色和替换颜色相同，直接返回
    if (targetColor === replacementColor) return;

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

        // 检查当前像素颜色是否匹配目标颜色（处理空字符串的情况）
        if (pixelData[y][x] === targetColor) {
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

// 绘制像素点（支持不同画笔尺寸和透明色）
function drawPixel(x, y, color) {
    const halfSize = Math.floor(currentBrushSize / 2);

    // 根据画笔尺寸绘制多个像素
    for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            // 确保在画布范围内
            if (nx >= 0 && nx < currentSize && ny >= 0 && ny < currentSize) {
                // 更新像素数据
                pixelData[ny][nx] = color;

                // 根据颜色类型进行不同的绘制处理
                if (color === '' || color === 'transparent') {
                    ctx.clearRect(nx, ny, 1, 1);
                } else {
                    ctx.fillStyle = color;
                    ctx.fillRect(nx, ny, 1, 1);
                }
            }
        }
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
            if (color !== 'transparent') { // 跳过透明像素
                svgContent += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
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
    const scale = 4; // 适当的缩放比例

    exportCanvas.width = currentSize * scale;
    exportCanvas.height = currentSize * scale;



    // 绘制放大的像素
    for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
            const color = pixelData[y][x];
            if (color !== 'transparent') {
                exportCtx.fillStyle = color;
                exportCtx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    // 获取Base64数据
    const base64 = exportCanvas.toDataURL('image/png');

    // 更新输出面板
    document.querySelector('#base64-output code').textContent = base64;

    return base64;
}

// 下载画布为图片
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
            if (color !== 'transparent') {
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
        const coords = getPixelCoordinates(e);

        if (currentTool === 'fill') {
            // 填充工具：执行区域填充
            const targetColor = getPixelColor(coords.x, coords.y);
            if (targetColor) {
                floodFill(coords.x, coords.y, targetColor, currentColor);
            }
        } else {
            // 画笔和橡皮擦工具：开始绘制
            isDrawing = true;
            const color = currentTool === 'eraser' ? '' : currentColor;
            drawPixel(coords.x, coords.y, color);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing && currentTool !== 'fill') {
            const coords = getPixelCoordinates(e);
            const color = currentTool === 'eraser' ? '' : currentColor;
            drawPixel(coords.x, coords.y, color);
        }
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // 颜色选择器
    colorPicker.addEventListener('input', () => {
        currentColor = colorPicker.value;

    });

    // 快速颜色选择
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.style.backgroundColor = swatch.dataset.color;

        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.color;
            if (currentColor !== 'transparent') {
                colorPicker.value = currentColor;
            }

            // 更新活动状态
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');


        });
    });

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

            // 更新按钮状态
            toolButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新光标
            if (currentTool === 'eraser') {
                canvas.classList.add('cursor-eraser');
                canvas.classList.remove('cursor-brush');
                canvas.classList.remove('cursor-fill');
                // 移除所有画笔尺寸类
                for (let i = 1; i <= 5; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            } else if (currentTool === 'fill') {
                canvas.classList.remove('cursor-eraser');
                canvas.classList.remove('cursor-brush');
                canvas.classList.add('cursor-fill');
                // 移除所有画笔尺寸类
                for (let i = 1; i <= 5; i++) {
                    canvas.classList.remove(`brush-size-${i}`);
                }
            } else {
                canvas.classList.remove('cursor-eraser');
                canvas.classList.remove('cursor-fill');
                canvas.classList.add('cursor-brush');
                // 更新画笔尺寸光标
                updateBrushSizeCursor();
            }
        });
    });

    // 画笔尺寸选择
    brushSizeSlider.addEventListener('input', () => {
        currentBrushSize = parseInt(brushSizeSlider.value);
        brushSizeValue.textContent = currentBrushSize;
        // 更新光标
        if (currentTool === 'brush') {
            updateBrushSizeCursor();
        }
    });

    // 更新画笔尺寸光标
    function updateBrushSizeCursor() {
        // 移除所有画笔尺寸类
        for (let i = 1; i <= 5; i++) {
            canvas.classList.remove(`brush-size-${i}`);
        }
        // 添加当前尺寸的光标类
        canvas.classList.add(`brush-size-${currentBrushSize}`);
    }

    // 网格线显示开关
    showGridCheckbox.addEventListener('change', () => {
        showGrid = showGridCheckbox.checked;
        updateGrid();
    });

    // 背景按钮已移除，默认使用半透明背景
    canvas.parentElement.classList.add('transparent-bg');
    currentBackgroundColor = 'transparent';



    // 调色板确认按钮
    const paletteConfirmButton = document.getElementById('palette-confirm');
    if (paletteConfirmButton) {
        paletteConfirmButton.addEventListener('click', () => {
            // 应用当前选择的颜色到画笔
            const activeSwatch = document.querySelector('.color-swatch.active');
            if (activeSwatch) {
                currentColor = activeSwatch.dataset.color;
                if (currentColor !== 'transparent') {
                    colorPicker.value = currentColor;
                }
                // 关闭调色板或隐藏调色板区域
                document.querySelector('.palette').style.display = 'none';
            }
        });
    }

    // 调色板取消按钮
    const paletteCancelButton = document.getElementById('palette-cancel');
    if (paletteCancelButton) {
        paletteCancelButton.addEventListener('click', () => {
            // 关闭调色板或隐藏调色板区域
            document.querySelector('.palette').style.display = 'none';
        });
    }

    // 清空画布
    clearButton.addEventListener('click', clearCanvas);

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
            const panelId = index === 0 ? '#svg-output' : '#base64-output';
            const codeElement = document.querySelector(`${panelId} code`);
            const text = codeElement.textContent;

            if (text) {
                copyToClipboard(text, button);
            }
        });
    });

    // 初始化画笔尺寸光标
    updateBrushSizeCursor();
}

// 当页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);