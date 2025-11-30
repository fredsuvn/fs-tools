// JMH Benchmark Visualizer - Main JavaScript
class JMHVisualizer {
  constructor() {
    this.benchmarkData = [];
    this.groups = new Map();
    this.charts = new Map();
    // 添加状态跟踪：记录最后修改的设置来源
    this.lastChangedSource = new Map(); // 'global' 或 'local'
    this.lastChangedType = new Map(); // 'chart-type', 'renderer', 'sort-metric', 'sort-order'
    this.init();

    // 显示作者信息
    $(document).ready(() => {
      this.displayAuthorInfo();
    });
  }

  init() {
    this.setupEventListeners();
    this.loadDefaultData();
  }

  setupEventListeners() {
    // 折叠/展开所有分组按钮事件
    $('#toggle-groups-btn').on('click', () => this.toggleGroups());

    // Global controls event listeners with proper binding
    $('#global-chart-type, #global-renderer, #global-sort-metric, #global-sort-order')
      .on('change', function() {
        const controlType = $(this).attr('id').replace('global-', '');
        this.setLastChanged('global', controlType);
        this.updateAllCharts();
      }.bind(this));

    // File upload
    $('#toggle-file-upload').on('click', () => {
      $('#file-upload-area').toggleClass('collapsed');
    });

    $('#file-input').on('change', (e) => this.handleFileUpload(e.target.files[0]));

    // Drag and drop
    const dropZone = $('#drop-zone')[0];
    dropZone.addEventListener('click', () => $('#file-input').click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  async loadDefaultData() {
    try {
      $('#loading').removeClass('hidden');
      const response = await fetch('results.json');
      if (!response.ok) throw new Error('Failed to load results.json');

      this.benchmarkData = await response.json();
      this.processData();
      this.renderTOC();
      this.renderGroups();
      $('#loading').addClass('hidden');
    } catch (error) {
      this.showToast('Error loading default results.json: ' + error.message, 'error');
      $('#loading').addClass('hidden');
    }
  }

  async handleFileUpload(file) {
    if (!file || !file.name.endsWith('.json')) {
      this.showToast('Please select a valid JSON file', 'error');
      return;
    }

    try {
      $('#loading').removeClass('hidden');
      const text = await this.readFileAsText(file);
      this.benchmarkData = JSON.parse(text);
      this.processData();
      this.renderTOC();
      this.renderGroups();
      $('#loading').addClass('hidden');
      this.showToast('File loaded successfully', 'info');
    } catch (error) {
      this.showToast('Error loading file: ' + error.message, 'error');
      $('#loading').addClass('hidden');
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  processData() {
    this.groups.clear();

    this.benchmarkData.forEach(benchmark => {
      const className = this.getSimpleClassName(benchmark.benchmark);
      const methodName = this.getMethodName(benchmark.benchmark);

      if (!this.groups.has(className)) {
        this.groups.set(className, {
          className: className,
          benchmarks: [],
          environment: this.extractEnvironmentInfo(benchmark)
        });
      }

      const group = this.groups.get(className);
      group.benchmarks.push({
        ...benchmark,
        methodName: methodName,
        paramsDisplay: this.getParamsDisplay(benchmark.params)
      });
    });
  }

  getSimpleClassName(fullName) {
    const parts = fullName.split('.');
    return parts[parts.length - 2]; // Class name is second last part
  }

  getMethodName(fullName) {
    const parts = fullName.split('.');
    return parts[parts.length - 1]; // Method name is last part
  }

  getParamsDisplay(params) {
    if (!params || Object.keys(params).length === 0) return '';
    return Object.entries(params).map(([key, value]) => `${key}=${value}`).join(', ');
  }

  getParamsValuesOnly(params) {
    if (!params || Object.keys(params).length === 0) return '';
    return Object.values(params).join(', ');
  }

  extractEnvironmentInfo(benchmark) {
    return {
      jmhVersion: benchmark.jmhVersion,
      benchmark: benchmark.benchmark,
      mode: benchmark.mode,
      threads: benchmark.threads,
      forks: benchmark.forks,
      jvm: benchmark.jvm,
      jvmArgs: benchmark.jvmArgs ? benchmark.jvmArgs.join(' ') : '',
      jdkVersion: benchmark.jdkVersion,
      vmName: benchmark.vmName,
      vmVersion: benchmark.vmVersion,
      warmupIterations: benchmark.warmupIterations,
      warmupTime: benchmark.warmupTime,
      warmupBatchSize: benchmark.warmupBatchSize,
      measurementIterations: benchmark.measurementIterations,
      measurementTime: benchmark.measurementTime,
      measurementBatchSize: benchmark.measurementBatchSize
    };
  }

  renderTOC() {
    const tocList = $('#toc-list');
    tocList.empty();

    this.groups.forEach((group, className) => {
      const li = $('<li>');
      const a = $('<a>').attr('href', `#group-${className}`).text(className);
      a.on('click', (e) => {
        e.preventDefault();
        this.scrollToGroup(className);
      });
      li.append(a);
      tocList.append(li);
    });
  }

  renderGroups() {
    const container = $('#benchmark-groups');
    container.empty();
    this.charts.clear();

    this.groups.forEach((group, className) => {
      const groupElement = this.createGroupElement(group, className);
      container.append(groupElement);
    });

    // Initialize charts after DOM is ready
    setTimeout(() => this.initializeCharts(), 100);
  }

  createGroupElement(group, className) {
    const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
    const groupDiv = $('<div>').addClass('benchmark-group').attr('id', `group_${safeClassName}`);

    // Group header
    const header = $('<div>').addClass('group-header');
    header.append($('<h3>').text(className));

    const controls = $('<div>').addClass('group-controls');
    controls.append($('<button>').addClass('back-to-toc').text('Back to TOC').on('click', (e) => {
      e.stopPropagation();
      $('html, body').animate({ scrollTop: 0 }, 500);
    }));

    const toggleBtn = $('<button>').addClass('group-toggle').html('▼');
    toggleBtn.on('click', (e) => {
      e.stopPropagation();
      this.toggleGroupContent(groupDiv, toggleBtn);
    });

    // 点击分组头也可以折叠/展开
    header.on('click', () => {
      this.toggleGroupContent(groupDiv, toggleBtn);
    });

    controls.append(toggleBtn);
    header.append(controls);
    groupDiv.append(header);

    // Group content
    const content = $('<div>').addClass('group-content');

    // Environment info
    const envSection = this.createEnvironmentSection(group.environment);
    content.append(envSection);

    // Single chart for the entire group - pass className as second parameter and methodName as third
    // For group chart, we'll use className as both since it's a group-level chart
    const chartSection = this.createChartSection(group.benchmarks, className, '');
    content.append(chartSection);

    groupDiv.append(content);
    return groupDiv;
  }

  createEnvironmentSection(environment) {
    const envDiv = $('<div>').addClass('environment-section');

    const toggleBtn = $('<button>').addClass('environment-toggle').text('Show Environment Info');
    const envInfo = $('<div>').addClass('environment-info collapsed');

    const envContent = $('<pre>').text(JSON.stringify(environment, null, 2));
    envInfo.append(envContent);

    toggleBtn.on('click', () => {
      envInfo.toggleClass('collapsed');
      toggleBtn.text(envInfo.hasClass('collapsed') ? 'Show Environment Info' : 'Hide Environment Info');
    });

    envDiv.append(toggleBtn);
    envDiv.append(envInfo);
    return envDiv;
  }

  groupByMethod(benchmarks) {
    const methods = new Map();
    benchmarks.forEach(benchmark => {
      const key = benchmark.methodName + '|' + benchmark.paramsDisplay;
      if (!methods.has(key)) {
        methods.set(key, []);
      }
      methods.get(key).push(benchmark);
    });
    return methods;
  }

  createChartSection(benchmarks, methodName, className) {
    // 清理ID中的所有特殊字符，确保jQuery选择器有效
    const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
    const safeMethodName = methodName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeParams = benchmarks[0].paramsDisplay.replace(/[^a-zA-Z0-9]/g, '_');
    const chartId = `chart_${safeClassName}_${safeMethodName}_${safeParams}_${Date.now()}`;
    const chartDiv = $('<div>').addClass('chart-container').attr('id', chartId);

    // Chart header with controls only (no title)
    const header = $('<div>').addClass('chart-header');

    const controls = $('<div>').addClass('chart-controls');

    // Chart type with event listener - default to horizontalBar
    const chartTypeSelect = $('<select>').addClass('chart-type').append(
      $('<option>').val('bar').text('Vertical'),
      $('<option>').val('horizontalBar').text('Horizontal').prop('selected', true)
    ).on('change', () => {
      this.setLastChanged('local', 'chart-type');
      this.updateChart(chartId);
    });
    controls.append(chartTypeSelect);

    // Renderer with event listener
    const rendererSelect = $('<select>').addClass('chart-renderer').append(
      $('<option>').val('canvas').text('Canvas'),
      $('<option>').val('svg').text('SVG')
    ).on('change', () => {
      this.setLastChanged('local', 'renderer');
      this.updateChart(chartId);
    });
    controls.append(rendererSelect);

    // Sort metric with event listener
    const sortMetricSelect = $('<select>').addClass('sort-metric').append(
      $('<option>').val('score').text('Score'),
      $('<option>').val('throughput').text('Throughput')
    ).on('change', () => {
      this.setLastChanged('local', 'sort-metric');
      this.updateChart(chartId);
    });
    controls.append(sortMetricSelect);

    // Sort order with event listener
    const sortOrderSelect = $('<select>').addClass('sort-order').append(
      $('<option>').val('original').text('Original'),
      $('<option>').val('asc').text('Ascending'),
      $('<option>').val('desc').text('Descending')
    ).on('change', () => {
      this.setLastChanged('local', 'sort-order');
      this.updateChart(chartId);
    });
    controls.append(sortOrderSelect);

    // Copy SVG button
    controls.append($('<button>').addClass('copy-svg-btn').text('Copy SVG')
      .on('click', () => this.copyChartSVG(chartId)));

    header.append(controls);
    chartDiv.append(header);

    // Chart container
    const chartElement = $('<div>').addClass('chart').attr('id', `${chartId}_chart`);
    chartDiv.append(chartElement);

    // Detailed data
    const detailedData = $('<div>').addClass('detailed-data');
    const dataTable = this.createDetailedDataTable(benchmarks);
    detailedData.append(dataTable);
    chartDiv.append(detailedData);

    // Store chart configuration
    this.charts.set(chartId, {
      benchmarks: benchmarks,
      methodName: methodName,
      className: className
    });

    // Set up control event listeners
    chartDiv.find('.chart-type, .chart-renderer, .sort-metric, .sort-order')
      .on('change', () => this.updateChart(chartId));

    return chartDiv;
  }

  initializeCharts() {
    this.charts.forEach((config, chartId) => {
      this.updateChart(chartId);
    });
  }

  // 新增方法：设置最后修改的来源和类型
  setLastChanged(source, type) {
    this.lastChangedSource.set(type, source);
    this.lastChangedType.set(source, type);
    console.log(`Last changed by ${source} for ${type}`);
  }

  // 新增方法：获取设置，考虑最后修改的来源
  getSettingWithPriority(chartId, type) {
    const lastSource = this.lastChangedSource.get(type);
    const globalValue = this.getGlobalSetting(type);
    const localElement = $(`#${chartId} .${type}`);
    const localValue = localElement && localElement.length > 0 ? localElement.val() : null;

    // 为chart-type设置默认值为horizontalBar
    if (type === 'chart-type') {
      const defaultValue = 'horizontalBar';
      if (lastSource === 'global' && globalValue) {
        return globalValue;
      } else if (lastSource === 'local' && localValue) {
        return localValue;
      }
      // 如果没有明确的设置，返回默认值
      return localValue || globalValue || defaultValue;
    }

    // 其他类型的设置逻辑
    if (lastSource === 'global' || (!localValue)) {
      return globalValue;
    } else if (lastSource === 'local' && localValue) {
      return localValue;
    }
    return localValue || globalValue;
  }

  // 新增方法：获取全局设置
  getGlobalSetting(type) {
    switch(type) {
      case 'chart-type': return $('#global-chart-type').val();
      case 'renderer': return $('#global-renderer').val();
      case 'sort-metric': return $('#global-sort-metric').val();
      case 'sort-order': return $('#global-sort-order').val();
      default: return null;
    }
  }

  updateChart(chartId) {
    const config = this.charts.get(chartId);
    if (!config) return;

    const chartElement = $(`#${chartId}_chart`)[0];
    if (!chartElement) return;

    // 先销毁之前的图表实例
    if (config.chartInstance) {
      config.chartInstance.dispose();
    }

    // 使用新的优先级机制获取设置
    const renderer = this.getSettingWithPriority(chartId, 'renderer');
    const chartType = this.getSettingWithPriority(chartId, 'chart-type');
    const sortMetric = this.getSettingWithPriority(chartId, 'sort-metric');
    const sortOrder = this.getSettingWithPriority(chartId, 'sort-order');

    console.log(`Updating chart ${chartId} with settings:`, {
      renderer,
      chartType,
      sortMetric,
      sortOrder
    });

    const chart = echarts.init(chartElement, null, {
      renderer: renderer,
      useDirtyRect: true
    });

    // 创建新的图表选项，确保使用最新设置
    const option = this.createChartOption(config.benchmarks, chartId);

    // 强制设置选项，确保完全更新
    chart.setOption(option, true);

    // 更新配置对象中的当前设置
    config.chartInstance = chart;
    config.currentRenderer = renderer;
    config.currentChartType = chartType;
    config.currentSortMetric = sortMetric;
    config.currentSortOrder = sortOrder;
  }

  updateAllCharts() {
    this.charts.forEach((config, chartId) => {
      this.updateChart(chartId);
    });
  }

  getRenderer(chartId) {
    return this.getSettingWithPriority(chartId, 'renderer') || 'canvas';
  }

  createChartOption(benchmarks, chartId) {
    const sortedData = this.sortBenchmarks(benchmarks, chartId);
    const isHorizontal = this.isHorizontalChart(chartId);

    const xAxisData = sortedData.map(b => {
      const paramsValues = this.getParamsValuesOnly(b.params);
      return paramsValues ? `${b.methodName} (${paramsValues})` : b.methodName;
    });

    const seriesData = sortedData.map(b => ({
      value: b.primaryMetric.score,
      itemStyle: {
        color: this.getColorForScore(b.primaryMetric.score, sortedData)
      }
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const data = params[0];
          const benchmark = sortedData[data.dataIndex];
          return `
            <div style="margin: 0">
              <strong>${data.name}</strong><br/>
              Score: <strong>${benchmark.primaryMetric.score.toLocaleString()}</strong> ${benchmark.primaryMetric.scoreUnit}<br/>
              Mode: ${benchmark.mode}<br/>
              Threads: ${benchmark.threads}<br/>
              ${benchmark.primaryMetric.scoreError && benchmark.primaryMetric.scoreError !== 'NaN' ?
                `Error: ±${benchmark.primaryMetric.scoreError}` : ''
              }
            </div>
          `;
        }
      },
      grid: {
        left: isHorizontal ? '20%' : '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: isHorizontal ? 'value' : 'category',
        data: isHorizontal ? null : xAxisData,
        axisLabel: {
          interval: 0,
          rotate: isHorizontal ? 0 : 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: isHorizontal ? 'category' : 'value',
        data: isHorizontal ? xAxisData : null,
        axisLabel: {
          fontSize: 10
        }
      },
      series: [{
        name: 'Score',
        type: 'bar',
        data: seriesData,
        label: {
          show: true,
          position: isHorizontal ? 'right' : 'top',
          formatter: (params) => params.value.toLocaleString()
        }
      }]
    };
  }

  sortBenchmarks(benchmarks, chartId) {
    const sortMetric = this.getSortMetric(chartId);
    const sortOrder = this.getSortOrder(chartId);

    if (sortOrder === 'original') return benchmarks;

    const sorted = [...benchmarks].sort((a, b) => {
      let valueA, valueB;

      if (sortMetric === 'throughput') {
        // 对于吞吐量，只处理thrpt模式的数据
        valueA = a.mode === 'thrpt' ? a.primaryMetric.score : 0;
        valueB = b.mode === 'thrpt' ? b.primaryMetric.score : 0;
      } else {
        // 对于分数，处理所有模式的数据
        valueA = a.primaryMetric.score;
        valueB = b.primaryMetric.score;
      }

      return valueA - valueB;
    });

    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }

  getChartType(chartId) {
    const result = this.getSettingWithPriority(chartId, 'chart-type') || 'horizontalBar';
    console.log(`Chart type for ${chartId}:`, result);
    return result;
  }

  isHorizontalChart(chartId) {
    const chartType = this.getChartType(chartId);
    return chartType === 'horizontalBar';
  }

  getSortMetric(chartId) {
    const result = this.getSettingWithPriority(chartId, 'sort-metric') || 'score';
    console.log(`Sort metric for ${chartId}:`, result);
    return result;
  }

  getSortOrder(chartId) {
    const result = this.getSettingWithPriority(chartId, 'sort-order') || 'original';
    console.log(`Sort order for ${chartId}:`, result);
    return result;
  }

  getColorForScore(score, benchmarks) {
    const scores = benchmarks.map(b => b.primaryMetric.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    if (maxScore === minScore) return '#3498db';

    const ratio = (score - minScore) / (maxScore - minScore);
    const hue = ratio * 120; // Green (120) to Red (0)
    return `hsl(${120 - hue}, 70%, 50%)`;
  }

  createDetailedDataTable(benchmarks) {
    const table = $('<table>').css({
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '12px',
      fontFamily: 'Courier New, monospace'
    });

    // Table header
    const thead = $('<thead>');
    const headerRow = $('<tr>');
    const headers = ['Method', 'Params', 'Score', 'Score Error', 'Score Unit', 'Mode', 'Threads'];

    headers.forEach(header => {
      headerRow.append($('<th>').text(header).css({
        border: '1px solid #ddd',
        padding: '8px',
        backgroundColor: '#f2f2f2',
        textAlign: 'left'
      }));
    });
    thead.append(headerRow);
    table.append(thead);

    // Table body
    const tbody = $('<tbody>');

    benchmarks.forEach(benchmark => {
      const row = $('<tr>');
      const cells = [
        benchmark.methodName,
        benchmark.paramsDisplay || '-',
        benchmark.primaryMetric.score.toLocaleString(),
        benchmark.primaryMetric.scoreError !== 'NaN' ? benchmark.primaryMetric.scoreError : '-',
        benchmark.primaryMetric.scoreUnit,
        benchmark.mode,
        benchmark.threads.toString()
      ];

      cells.forEach(cell => {
        row.append($('<td>').text(cell).css({
          border: '1px solid #ddd',
          padding: '8px'
        }));
      });

      tbody.append(row);
    });

    table.append(tbody);
    return table;
  }

  async copyChartSVG(chartId) {
    const config = this.charts.get(chartId);
    if (!config || !config.chartInstance) {
      this.showToast('Chart not ready for SVG export', 'error');
      return;
    }

    try {
      // 检查当前是否使用SVG渲染器
      if (config.currentRenderer !== 'svg') {
        this.showToast('Please switch to SVG renderer first', 'error');
        return;
      }

      // 获取图表的SVG元素
      const chartElement = $(`#${chartId}_chart`)[0];
      const svgElement = chartElement.querySelector('svg');

      if (!svgElement) {
        this.showToast('No SVG element found. Please ensure SVG renderer is selected.', 'error');
        return;
      }

      // 克隆SVG元素
      const clonedSvg = svgElement.cloneNode(true);

      // 清理SVG代码
      clonedSvg.setAttribute('width', '800');
      clonedSvg.setAttribute('height', '400');
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // 移除可能的问题属性
      clonedSvg.removeAttribute('data-zr-dom-id');
      clonedSvg.removeAttribute('class');

      // 获取SVG代码
      const serializer = new XMLSerializer();
      let svgCode = serializer.serializeToString(clonedSvg);

      // 添加XML声明
      svgCode = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgCode;

      await navigator.clipboard.writeText(svgCode);
      this.showToast('SVG code copied to clipboard', 'info');
    } catch (error) {
      this.showToast('Failed to copy SVG: ' + error.message, 'error');
    }
  }

  toggleGroupContent(groupDiv, toggleBtn) {
    const content = groupDiv.find('.group-content');
    content.slideToggle(300);
    const isVisible = content.is(':visible');
    toggleBtn.html(isVisible ? '▼' : '▶');
  }

  // 折叠/展开所有分组的切换方法
  toggleGroups() {
    // 检查当前是否有展开的分组
    const hasExpanded = $('.benchmark-group .group-content:visible').length > 0;
    const toggleBtn = $('#toggle-groups-btn');

    // 更新按钮文本
    toggleBtn.text(hasExpanded ? 'Expand All Groups' : 'Collapse All Groups');

    // 遍历所有分组
    $('.benchmark-group').each((index, groupDiv) => {
      const $groupDiv = $(groupDiv);
      const groupToggleBtn = $groupDiv.find('.group-toggle');
      const content = $groupDiv.find('.group-content');

      if (hasExpanded) {
        // 折叠所有
        if (content.is(':visible')) {
          content.slideUp(300);
          groupToggleBtn.html('▶');
        }
      } else {
        // 展开所有
        if (!content.is(':visible')) {
          content.slideDown(300);
          groupToggleBtn.html('▼');
        }
      }
    });
  }

  scrollToGroup(className) {
    const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
    const element = $(`#group_${safeClassName}`);
    if (element.length) {
      $('html, body').animate({
        scrollTop: element.offset().top - 20
      }, 500);
    }
  }

  showToast(message, type = 'info') {
    const toast = $('<div>').addClass(`toast ${type}`).text(message);
    $('body').append(toast);

    setTimeout(() => {
      toast.fadeOut(300, () => toast.remove());
    }, 3000);
  }

  // 显示作者信息
  displayAuthorInfo() {
    const authorInfo = fsTools.getToolAuthor('jmh-visualizer');
    $('#author-info').text(`Author: ${authorInfo}`);
  }
}

// Initialize the visualizer when DOM is ready
$(document).ready(() => {
  new JMHVisualizer();
});