// JMH Benchmark Visualizer - Main JavaScript
class JMHVisualizer {
  constructor() {
    this.benchmarkData = [];
    this.groups = new Map();
    this.charts = new Map();
    this.chartSettings = new Map(); // 为每个图表记录设置状态
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
     $('#global-chart-type, #global-renderer, #global-sort-metric, #global-sort-order, #global-show-errors')
       .on('change', (e) => {
        const $target = $(e.target);
        const id = $target.attr('id');
        if (!id) return;

        const controlType = id.replace('global-', '');

        // 为所有图表设置全局为最后修改来源
        this.charts.forEach((config, chartId) => {
          this.setLastChanged(chartId, 'global', controlType);
        });

        // 同步更新所有图表的本地控制值，确保UI一致
        const globalValue = $target.val();
        $(`.${controlType}`).val(globalValue);

        // 更新所有图表
        this.updateAllCharts();
      });

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
      fsLogger.error('Error loading default results.json:', error.message);
      fsLogger.showToast('Error loading default results.json: ' + error.message, 'error');
      $('#loading').addClass('hidden');
    }
  }

  async handleFileUpload(file) {
    if (!file || !file.name.endsWith('.json')) {
      fsLogger.warn('Invalid file selected:', file ? file.name : 'no file');
      fsLogger.showToast('Please select a valid JSON file', 'error');
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
      fsLogger.info('File loaded successfully:', file.name);
      fsLogger.showToast('File loaded successfully', 'info');
    } catch (error) {
      fsLogger.error('Error loading file:', error.message);
      fsLogger.showToast('Error loading file: ' + error.message, 'error');
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
      // 跳转到目录而不是页面顶部
      const tocPosition = $('#toc').offset().top;
      $('html, body').animate({ scrollTop: tocPosition }, 500);
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

    // 检查环境信息是否为空
    let envContent;
    if (!environment || Object.keys(environment).length === 0) {
      envContent = $('<p>').text('No environment information available.');
    } else {
      envContent = $('<pre>').text(JSON.stringify(environment, null, 2));
    }
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
    const header = $('<div>').addClass('chart-header').css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'nowrap',  // 不换行
      width: '100%',
      overflow: 'hidden'  // 防止内容溢出
    });

    // 左侧控制按钮组 - 包含所有图表控制按钮和copy svg
    const leftControls = $('<div>').addClass('chart-controls').css({
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'nowrap',  // 不换行
      flex: '1',  // 占据剩余空间
      overflow: 'hidden'  // 防止内容溢出
    });

    // 隐藏Chart Type选择框，但保留代码
    /*
    const chartTypeSelect = $('<select>').addClass('chart-type').css({flexShrink: 0}).append(
      $('<option>').val('bar').text('Vertical'),
      $('<option>').val('horizontalBar').text('Horizontal').prop('selected', true)
    ).on('change', () => {
      this.setLastChanged(chartId, 'local', 'chart-type');
      this.updateChart(chartId);
    });
    leftControls.append(chartTypeSelect);
    */

    // Renderer with event listener
    const rendererSelect = $('<select>').addClass('chart-renderer').css({flexShrink: 0}).append(
      $('<option>').val('canvas').text('Canvas'),
      $('<option>').val('svg').text('SVG')
    ).on('change', () => {
      this.setLastChanged(chartId, 'local', 'renderer');
      this.updateChart(chartId);
    });
    leftControls.append(rendererSelect);

    // Sort metric with event listener
    const sortMetricSelect = $('<select>').addClass('sort-metric').css({flexShrink: 0}).append(
      $('<option>').val('score').text('Score'),
      $('<option>').val('throughput').text('Throughput')
    ).on('change', () => {
      this.setLastChanged(chartId, 'local', 'sort-metric');
      this.updateChart(chartId);
    });
    leftControls.append(sortMetricSelect);

    // Sort order with event listener
    const sortOrderSelect = $('<select>').addClass('sort-order').css({flexShrink: 0}).append(
      $('<option>').val('original').text('Original'),
      $('<option>').val('asc').text('Ascending'),
      $('<option>').val('desc').text('Descending')
    ).on('change', () => {
      this.setLastChanged(chartId, 'local', 'sort-order');
      this.updateChart(chartId);
    });
    leftControls.append(sortOrderSelect);

    // Show errors with event listener
    const showErrorsSelect = $('<select>').addClass('show-errors').css({flexShrink: 0}).append(
      $('<option>').val('true').text('Show Errors'),
      $('<option>').val('false').text('Hide Errors')
    ).on('change', () => {
      this.setLastChanged(chartId, 'local', 'show-errors');
      this.updateChart(chartId);
    });
    leftControls.append(showErrorsSelect);

    // Copy SVG button
    leftControls.append($('<button>').addClass('copy-svg-btn').text('Copy SVG').css({flexShrink: 0})
      .on('click', () => this.copyChartSVG(chartId)));

    // 右侧环境信息按钮 - 单独右对齐，不换行
    const envToggleBtn = $('<button>').addClass('environment-toggle').text('Show Environment Info').css({flexShrink: 0});

    header.append(leftControls);
    header.append(envToggleBtn);
    chartDiv.append(header);

    // Environment info section - 放在header下方
    const envInfo = $('<div>').addClass('environment-info collapsed');

    // 检查环境信息是否为空
    const envData = benchmarks.length > 0 ? this.extractEnvironmentInfo(benchmarks[0]) : null;
    const hasEnvInfo = envData && Object.keys(envData).length > 0;
    const preElement = $('<pre>').text(hasEnvInfo ? JSON.stringify(envData, null, 2) : 'No environment information available.');
    envInfo.append(preElement);

    // 添加环境信息切换事件
    envToggleBtn.on('click', () => {
      envInfo.toggleClass('collapsed');
      envToggleBtn.text(envInfo.hasClass('collapsed') ? 'Show Environment Info' : 'Hide Environment Info');
    });

    chartDiv.append(envInfo);

    // Chart container
    const chartElement = $('<div>').addClass('chart').attr('id', `${chartId}_chart`);
    chartDiv.append(chartElement);

    // Detailed data section with toggle
    const detailedDataContainer = $('<div>').addClass('detailed-data-container');

    // 创建单独的按钮容器
    const toggleContainer = $('<div>').addClass('detailed-data-toggle-container');
    const detailedDataToggle = $('<button>').addClass('detailed-data-toggle').text('Hide Detailed Data');

    // 创建详细数据区域
    const detailedData = $('<div>').addClass('detailed-data');

    // 添加切换事件
    detailedDataToggle.on('click', () => {
      detailedData.toggleClass('collapsed');
      detailedDataToggle.text(detailedData.hasClass('collapsed') ? 'Show Detailed Data' : 'Hide Detailed Data');
    });

    // 创建数据表格
    const dataTable = this.createDetailedDataTable(benchmarks);
    detailedData.append(dataTable);

    // 组装布局
    toggleContainer.append(detailedDataToggle);
    detailedDataContainer.append(toggleContainer);
    detailedDataContainer.append(detailedData);
    chartDiv.append(detailedDataContainer);

    // Store chart configuration
    this.charts.set(chartId, {
      benchmarks: benchmarks,
      methodName: methodName,
      className: className
    });

    // Set up control event listeners
    chartDiv.find('.chart-type, .chart-renderer, .sort-metric, .sort-order, .show-errors')
      .on('change', () => this.updateChart(chartId));

    return chartDiv;
  }

  initializeCharts() {
    this.charts.forEach((config, chartId) => {
      this.updateChart(chartId);
    });
  }

  // 设置最后修改的来源和类型
  setLastChanged(chartId, source, type) {
    if (!this.chartSettings.has(chartId)) {
      this.chartSettings.set(chartId, {
        lastChangedSource: new Map(),
        lastChangedTimestamp: new Map()
      });
    }

    const chartSetting = this.chartSettings.get(chartId);
    chartSetting.lastChangedSource.set(type, source);
    chartSetting.lastChangedTimestamp.set(type, Date.now());

    fsLogger.debug(`Chart ${chartId}: Last changed by ${source} for ${type} at ${chartSetting.lastChangedTimestamp.get(type)}`);
  }

  // 获取设置，考虑最后修改的来源和时间戳
  getSettingWithPriority(chartId, type) {
    const globalValue = this.getGlobalSetting(type);

    // 将类型映射到对应的class名称
    const classMapping = {
      'chart-type': 'chart-type',
      'renderer': 'chart-renderer',
      'sort-metric': 'sort-metric',
      'sort-order': 'sort-order',
      'show-errors': 'show-errors'
    };

    const className = classMapping[type] || type;
    const localElement = $(`#${chartId} .${className}`);
    const localValue = localElement && localElement.length > 0 ? localElement.val() : null;

    // 获取该图表的设置状态
    let lastSource = null;
    if (this.chartSettings.has(chartId)) {
      const chartSetting = this.chartSettings.get(chartId);
      lastSource = chartSetting.lastChangedSource.get(type);
    }

    // 为chart-type设置默认值为horizontalBar
    if (type === 'chart-type') {
      const defaultValue = 'horizontalBar';

      // 如果有明确的最后修改来源，优先使用
      if (lastSource === 'global' && globalValue) {
        return globalValue;
      } else if (lastSource === 'local' && localValue) {
        return localValue;
      }
      // 如果没有明确的设置，返回默认值
      return localValue || globalValue || defaultValue;
    }

    // 其他类型的设置逻辑 - 优先使用最后设置的值
    if (lastSource === 'global') {
      return globalValue;
    } else if (lastSource === 'local' && localValue) {
      return localValue;
    }
    // 如果没有明确的最后修改来源，优先使用局部设置，否则使用全局设置
    return localValue || globalValue;
  }

  // 新增方法：获取全局设置
  getGlobalSetting(type) {
    switch(type) {
      case 'chart-type': return $('#global-chart-type').val();
      case 'renderer': return $('#global-renderer').val();
      case 'sort-metric': return $('#global-sort-metric').val();
      case 'sort-order': return $('#global-sort-order').val();
      case 'show-errors': return $('#global-show-errors').val();
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

    // 动态调整图表高度，根据横条数量等比增加
    const barCount = config.benchmarks.length;
    const baseHeight = 300; // 基础高度
    const barHeight = 40; // 每个横条的大致高度
    const newHeight = Math.max(baseHeight, barCount * barHeight);
    $(chartElement).css('height', `${newHeight}px`);

    fsLogger.debug(`Updating chart ${chartId} with settings:`, {
      renderer,
      chartType,
      sortMetric,
      sortOrder,
      barCount,
      height: newHeight
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
      // 首先更新图表局部按钮的UI显示，使其与全局按钮保持一致
      this.syncLocalButtonsWithGlobal(chartId);
      // 然后更新图表渲染
      this.updateChart(chartId);
    });
  }

  // 同步图表局部按钮与全局按钮
  syncLocalButtonsWithGlobal(chartId) {
    const settingTypes = ['chart-type', 'renderer', 'sort-metric', 'sort-order', 'show-errors'];

    settingTypes.forEach(type => {
      // 获取全局设置值
      const globalValue = this.getGlobalSetting(type);
      // 获取对应的局部按钮class名称
      const classMapping = {
        'chart-type': 'chart-type',
        'renderer': 'chart-renderer',
        'sort-metric': 'sort-metric',
        'sort-order': 'sort-order',
        'show-errors': 'show-errors'
      };

      const className = classMapping[type];
      const localElement = $(`#${chartId} .${className}`);

      if (localElement && localElement.length > 0) {
        // 更新局部按钮的值，但不触发change事件，避免循环更新
        localElement.val(globalValue);

        // 记录这次更新的来源为global
        this.setLastChanged(chartId, 'global', type);
      }
    });
  }

  getRenderer(chartId) {
    return this.getSettingWithPriority(chartId, 'renderer') || 'canvas';
  }

  createChartOption(benchmarks, chartId) {
    const sortedData = this.sortBenchmarks(benchmarks, chartId);
    const isHorizontal = this.isHorizontalChart(chartId);
    const showErrors = this.getSettingWithPriority(chartId, 'show-errors') === 'true';

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

    // 准备误差线数据
    const hasErrors = sortedData.some(b => b.primaryMetric.scoreError && b.primaryMetric.scoreError !== 'NaN');

    // 设置横条宽度，根据是否为水平图表调整
    const barWidth = isHorizontal ? '70%' : '70%';

    const series = [{
      name: 'Score',
      type: 'bar',
      data: seriesData,
      barWidth: barWidth,
      label: {
        show: true,
        position: isHorizontal ? 'right' : 'top',
        formatter: (params) => params.value.toLocaleString(),
        fontSize: 13,
        fontWeight: 'normal',
        offset: [isHorizontal ? 15 : 0, 0]
      }
    }];

    // 如果有误差数据且显示误差线，添加误差线
    if (hasErrors && showErrors) {
      // 使用markLine为每个数据点创建独立的误差线
      const errorLinesData = sortedData.map((b, index) => {
        if (b.primaryMetric.scoreError && b.primaryMetric.scoreError !== 'NaN') {
          const error = b.primaryMetric.scoreError;
          const score = b.primaryMetric.score;

          if (isHorizontal) {
            // 水平图表：垂直误差线
            return [
              {
                yAxis: index,
                xAxis: score - error,
                symbol: 'none'
              },
              {
                yAxis: index,
                xAxis: score + error,
                symbol: 'none'
              }
            ];
          } else {
            // 垂直图表：水平误差线
            return [
              {
                xAxis: index,
                yAxis: score - error,
                symbol: 'none'
              },
              {
                xAxis: index,
                yAxis: score + error,
                symbol: 'none'
              }
            ];
          }
        }
        return null;
      }).filter(item => item !== null).flat();

      // 添加误差线系列
      const errorLinesSeries = {
        name: 'Error Lines',
        type: 'line',
        symbol: 'none',
        lineStyle: {
          color: '#ff6b6b',
          width: 0.8,
          type: 'dashed'
        },
        data: errorLinesData,
        markLine: {
          silent: true,
          symbol: ['bar', 'bar'],
          symbolSize: [isHorizontal ? 0 : 5, isHorizontal ? 5 : 0],
          lineStyle: {
            color: '#ff6b6b',
            width: 0.8,
            type: 'dashed'
          },
          data: errorLinesData.map((point, index) => {
            // 每两个点组成一条误差线
            if (index % 2 === 0 && index + 1 < errorLinesData.length) {
              return [errorLinesData[index], errorLinesData[index + 1]];
            }
            return null;
          }).filter(item => item !== null)
        }
      };

      series.push(errorLinesSeries);
    }

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
        left: isHorizontal ? '5%' : '3%',
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
          fontSize: 13,
          fontWeight: 'normal'
        }
      },
      yAxis: {
        type: isHorizontal ? 'category' : 'value',
        data: isHorizontal ? xAxisData : null,
        axisLabel: {
          fontSize: 13,
          fontWeight: 'normal'
        }
      },
      series: series
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
    fsLogger.debug(`Chart type for ${chartId}:`, result);
    return result;
  }

  isHorizontalChart(chartId) {
    // 强制始终使用水平图表
    return true;
  }

  getSortMetric(chartId) {
    const result = this.getSettingWithPriority(chartId, 'sort-metric') || 'score';
    fsLogger.debug(`Sort metric for ${chartId}:`, result);
    return result;
  }

  getSortOrder(chartId) {
    const result = this.getSettingWithPriority(chartId, 'sort-order') || 'original';
    fsLogger.debug(`Sort order for ${chartId}:`, result);
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
      fsLogger.warn('Chart not ready for SVG export:', chartId);
      fsLogger.showToast('Chart not ready for SVG export', 'error');
      return;
    }

    try {
      // 获取图表的SVG元素
      const chartElement = $(`#${chartId}_chart`)[0];
      const svgElement = chartElement.querySelector('svg');

      if (!svgElement) {
          fsLogger.warn('No SVG element found for SVG export. Please switch to SVG renderer first.');
          fsLogger.showToast('No SVG element found. Please switch to SVG renderer first.', 'error');
          return;
        }

      // 直接获取页面上显示的SVG代码，不进行修改
      const serializer = new XMLSerializer();
      let svgCode = serializer.serializeToString(svgElement);

      // 添加XML声明以确保SVG可以正确使用
      svgCode = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgCode;

      await navigator.clipboard.writeText(svgCode);
      fsLogger.info('SVG code copied to clipboard for chart:', chartId);
      fsLogger.showToast('SVG code copied to clipboard', 'info');
    } catch (error) {
      fsLogger.error('Failed to copy SVG:', error.message);
      fsLogger.showToast('Failed to copy SVG: ' + error.message, 'error');
    }
  }

  toggleGroupContent(groupDiv, toggleBtn) {
    const content = groupDiv.find('.group-content');
    content.slideToggle(300);
    const isVisible = content.is(':visible');
    toggleBtn.html(isVisible ? '▼' : '▶');
  }

  toggleAllGroups() {
    const allGroupContents = $('.benchmark-group .group-content');
    const allToggleButtons = $('.benchmark-group .group-toggle');

    if (allGroupContents.length === 0) return;

    // Check if all groups are collapsed or all are expanded
    const allCollapsed = allGroupContents.toArray().every(content => $(content).hasClass('collapsed'));
    const allExpanded = allGroupContents.toArray().every(content => !$(content).hasClass('collapsed'));

    // Determine the target state
    const shouldCollapse = !allCollapsed;

    // Toggle all groups
    allGroupContents.toggleClass('collapsed', shouldCollapse);
    allToggleButtons.html(shouldCollapse ? '▶' : '▼');

    // Update the button text
    $('#toggle-groups-btn').text(shouldCollapse ? 'Expand All Groups' : 'Collapse All Groups');
  }

  // 折叠/展开所有分组的切换方法
  toggleGroups() {
    // 检查当前是否有展开的分组
    const hasExpanded = $('.benchmark-group .group-content:visible').length > 0;
    const toggleBtn = $('#toggle-groups-btn');

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

    // 更新按钮文本 - 放在操作执行后，确保状态正确
    toggleBtn.text(hasExpanded ? 'Expand All Groups' : 'Collapse All Groups');
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
    // 默认作者信息（降级方案）
    const defaultAuthor = 'sunqian, DeepSeek-V3.1, Doubal-Seed-Code';

    // 使用异步版本获取作者信息
    fsTools.getToolAuthorAsync('jmh-visualizer', (authorInfo) => {
      // 处理可能的空作者信息，为空时使用默认作者
      const finalAuthor = authorInfo || defaultAuthor;
      $('#author-info').text('Author: ' + finalAuthor);
    });
  }
}

// Initialize the visualizer when DOM is ready
$(document).ready(() => {
  new JMHVisualizer();
});