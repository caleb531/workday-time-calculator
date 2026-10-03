import { BarChart, FixedScaleAxis } from 'chartist';
import clsx from 'clsx';
import { orderBy } from 'es-toolkit';
import m from 'mithril';
import moment from 'moment';
import AnalyticsWorker from '../analytics-worker.js?worker';
import { collectAnalytics } from '../models/analytics-collector.js';
import AnalyticsState from '../models/analytics-state.js';
import { formatDuration } from '../models/duration-formatter.js';
import CloseButtonComponent from './close-button.jsx';
import DateInputComponent from './date-input.jsx';
import DismissableOverlayComponent from './dismissable-overlay.jsx';
import LoadingComponent from './loading.jsx';

class AnalyticsComponent {
  oninit({ attrs: { preferences, onCloseAnalytics } }) {
    this.preferences = preferences;
    this.onCloseAnalytics = onCloseAnalytics;
    this.worker = typeof Worker !== 'undefined' ? new AnalyticsWorker() : null;
    this.workerRequestId = 0;
    this.categories = [];
    this.isLoading = true;
    this.chart = null;
    this.chartRenderKey = null;
    this.chartBarPositions = [];
    this.chartYAxisLabelsElement = null;
    // The Analytics panel's saved filters and sort selection
    this.analyticsState = new AnalyticsState();
    // Disable controls until loading finishes so saved state can't overwrite an edit
    this.isStateLoading = true;
    this.analyticsState.load().then(() => {
      this.isStateLoading = false;
      this.fetchAnalytics();
      m.redraw();
    });

    if (this.worker) {
      this.worker.onmessage = (event) => {
        if (event.data.requestId !== this.workerRequestId) {
          return;
        }
        this.categories = event.data.categories;
        this.isLoading = false;
        m.redraw();
      };
      this.worker.onerror = () => {
        // If the analytics worker fails to load or crashes, keep the panel
        // usable by falling back to the same main-thread analytics path used
        // in browsers without Worker support.
        this.worker?.terminate();
        this.worker = null;
        this.fetchAnalytics();
      };
    }
  }

  onremove() {
    this.destroyChart();
    if (this.worker) {
      this.worker.terminate();
    }
  }

  destroyChart() {
    if (this.chart) {
      this.chart.detach();
      this.chart = null;
    }
    this.chartRenderKey = null;
    this.chartBarPositions = [];
    this.renderYAxisLabels([]);
  }

  // Check if the selected date range has valid bounds in chronological order
  get isDateRangeValid() {
    // The bounds resolved from the selected filter
    const range = this.analyticsState.dateRange;
    // The parsed start of the selected range
    const startDate = moment(range.startDate, 'YYYY-MM-DD', true);
    // The parsed end of the selected range
    const endDate = moment(range.endDate, 'YYYY-MM-DD', true);
    return (
      startDate.isValid() &&
      endDate.isValid() &&
      startDate.isSameOrBefore(endDate, 'day')
    );
  }

  // Return categories in the selected top-to-bottom order; break duration ties by name
  get sortedCategories() {
    // The selected presentation order for the aggregated categories
    const sort = this.analyticsState.categorySortOrder;
    return orderBy(
      this.categories,
      sort === 'alphabetical' ? ['name'] : ['totalMinutes', 'name'],
      sort === 'duration-desc' ? ['desc', 'asc'] : ['asc', 'asc']
    ).map((category) => {
      return {
        ...category,
        formattedDuration: formatDuration(category.totalMinutes)
      };
    });
  }

  // Reverse the visual order because Chartist draws horizontal bars from bottom to top
  get chartCategories() {
    return this.sortedCategories.reverse();
  }

  get chartSummaryLabel() {
    if (!this.chartCategories.length) {
      return 'No analytics are available for this date range.';
    }
    return this.sortedCategories
      .map((category) => {
        return `${category.name}: ${category.formattedDuration}`;
      })
      .join('; ');
  }

  get chartHeight() {
    return Math.max(240, this.chartCategories.length * 56);
  }

  get chartWidth() {
    return Math.max(320, 620 - this.yAxisOffset);
  }

  get chartMaxMinutes() {
    const maxMinutes = Math.max(
      0,
      ...this.chartCategories.map((category) => category.totalMinutes)
    );
    const tickSize = this.getXAxisTickSize(maxMinutes);
    return Math.max(tickSize, Math.ceil(maxMinutes / tickSize) * tickSize);
  }

  get yAxisOffset() {
    const longestLabelLength = Math.max(
      0,
      ...this.chartCategories.map((category) => category.name.length)
    );
    return Math.min(200, Math.max(110, longestLabelLength * 7));
  }

  getXAxisTickSize(maxMinutes) {
    if (maxMinutes <= 90) {
      return 15;
    } else if (maxMinutes <= 180) {
      return 30;
    } else if (maxMinutes <= 480) {
      return 60;
    } else if (maxMinutes <= 960) {
      return 120;
    }
    return 240;
  }

  getXAxisTicks() {
    const tickSize = this.getXAxisTickSize(this.chartMaxMinutes);
    const ticks = [];
    for (
      let minutes = 0;
      minutes <= this.chartMaxMinutes;
      minutes += tickSize
    ) {
      ticks.push(minutes);
    }
    return ticks;
  }

  // Fetch logs within the saved custom range or the preset's current bounds
  fetchAnalytics() {
    if (this.isStateLoading) {
      return;
    }
    // The date bounds shared by the worker and main-thread collector
    const { startDate, endDate } = this.analyticsState.dateRange;
    this.destroyChart();
    if (!this.isDateRangeValid) {
      this.categories = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    // Capture the time system needed to parse logs in both worker and fallback calls
    const preferences = {
      timeSystem: this.preferences.timeSystem
    };

    if (!this.worker) {
      collectAnalytics({
        startDate: startDate,
        endDate: endDate,
        preferences: preferences
      }).then((categories) => {
        this.categories = categories;
        this.isLoading = false;
        m.redraw();
      });
      return;
    }

    this.workerRequestId += 1;
    this.worker.postMessage({
      requestId: this.workerRequestId,
      startDate: startDate,
      endDate: endDate,
      preferences: preferences
    });
  }

  // Save the selected order; Mithril redraws the existing categories without fetching logs
  handleCategorySort(value) {
    this.analyticsState.categorySortOrder = value;
    this.analyticsState.save();
  }

  // Save a new filter; entering Custom starts a fresh seven-day range
  handleDateFilter(value) {
    if (this.analyticsState.dateFilter === value) {
      return;
    }
    this.analyticsState.dateFilter = value;
    if (value === 'custom') {
      this.analyticsState.resetCustomDates();
    }
    this.analyticsState.save();
    this.fetchAnalytics();
  }

  // Save a changed custom date and refresh the chart
  handleDateInput(name, value) {
    if (this.analyticsState[name] === value) {
      return;
    }

    this.analyticsState[name] = value;
    this.analyticsState.save();
    this.fetchAnalytics();
  }

  setYAxisLabelsElement(dom) {
    if (this.chartYAxisLabelsElement === dom) {
      return;
    }

    this.chartYAxisLabelsElement = dom;
    this.renderYAxisLabels(this.chartBarPositions);
  }

  renderYAxisLabels(barPositions) {
    if (!this.chartYAxisLabelsElement) {
      return;
    }

    this.chartYAxisLabelsElement.replaceChildren();
    barPositions.forEach((barPosition) => {
      const labelElement = document.createElement('div');
      labelElement.className = 'analytics-chart-y-label';
      labelElement.style.top = `${barPosition.y}px`;
      labelElement.textContent = barPosition.name;
      this.chartYAxisLabelsElement.appendChild(labelElement);
    });
  }

  renderChart(dom) {
    this.chartElement = dom;

    const shouldRenderChart =
      this.chartCategories.length && !this.isLoading && this.isDateRangeValid;
    if (!shouldRenderChart) {
      if (this.chart) {
        this.destroyChart();
      }
      return;
    }

    const nextChartRenderKey = JSON.stringify({
      categories: this.chartCategories.map((category) => {
        return [
          category.name,
          category.totalMinutes,
          category.formattedDuration
        ];
      }),
      chartWidth: this.chartWidth,
      chartHeight: this.chartHeight,
      chartMaxMinutes: this.chartMaxMinutes,
      yAxisOffset: this.yAxisOffset,
      xAxisTicks: this.getXAxisTicks()
    });

    if (this.chart && this.chartRenderKey === nextChartRenderKey) {
      return;
    }

    this.destroyChart();
    this.chartRenderKey = nextChartRenderKey;

    const barPositions = [];

    this.chart = new BarChart(
      dom,
      {
        labels: this.chartCategories.map((category) => category.name),
        series: this.chartCategories.map((category) => category.totalMinutes)
      },
      {
        distributeSeries: true,
        horizontalBars: true,
        width: `${this.chartWidth}px`,
        height: `${this.chartHeight}px`,
        low: 0,
        high: this.chartMaxMinutes,
        chartPadding: {
          top: 10,
          right: 56,
          bottom: 20,
          left: 0
        },
        axisX: {
          type: FixedScaleAxis,
          offset: 30,
          ticks: this.getXAxisTicks(),
          labelInterpolationFnc: (value) => formatDuration(value)
        },
        axisY: {
          offset: 0,
          showLabel: false,
          showGrid: false
        }
      }
    );

    this.chart.on('draw', (event) => {
      if (event.type !== 'bar') {
        return;
      }

      const categoryIndex =
        typeof event.seriesIndex === 'number' ? event.seriesIndex : event.index;
      const category = this.chartCategories[categoryIndex];
      barPositions[categoryIndex] = {
        name: category.name,
        y: event.y1
      };
      event.group
        .elem(
          'text',
          {
            x: Math.max(event.x1, event.x2) + 6,
            y: event.y1,
            dy: '0.35em',
            'text-anchor': 'start'
          },
          'analytics-chart-bar-label'
        )
        .text(category.formattedDuration);
    });

    this.chart.on('created', () => {
      this.chartBarPositions = barPositions.filter(Boolean);
      this.renderYAxisLabels(this.chartBarPositions);
    });
  }

  view() {
    return (
      <div className={clsx('app-analytics', { 'app-analytics-open': true })}>
        <DismissableOverlayComponent
          aria-labelledby="app-analytics-close-control"
          onDismiss={() => this.onCloseAnalytics()}
        />

        <div
          className="panel app-analytics-panel"
          data-testid="analytics-panel"
        >
          <CloseButtonComponent
            id="app-analytics-close-control"
            aria-label="Close Analytics"
            onClose={() => this.onCloseAnalytics()}
          />

          <h2 className="app-analytics-heading">Analytics</h2>

          <div className="analytics-range-controls">
            <div className="analytics-filter-control">
              <label htmlFor="analytics-date-filter">Date Filter</label>
              <select
                id="analytics-date-filter"
                value={this.analyticsState.dateFilter}
                disabled={this.isStateLoading}
                onchange={(event) => this.handleDateFilter(event.target.value)}
              >
                {AnalyticsState.dateFilterOptions.map((option) => (
                  <option value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {!this.isStateLoading &&
            this.analyticsState.dateFilter === 'custom' ? (
              <>
                <DateInputComponent
                  aria-label="Start Date"
                  value={this.analyticsState.startDate}
                  onChange={(value) => this.handleDateInput('startDate', value)}
                />
                <span className="analytics-range-separator">thru</span>
                <DateInputComponent
                  aria-label="End Date"
                  value={this.analyticsState.endDate}
                  onChange={(value) => this.handleDateInput('endDate', value)}
                />
              </>
            ) : null}
            <div className="analytics-sort-control">
              <label htmlFor="analytics-category-sort">Category Sort</label>
              <select
                id="analytics-category-sort"
                value={this.analyticsState.categorySortOrder}
                disabled={this.isStateLoading}
                onchange={(event) =>
                  this.handleCategorySort(event.target.value)
                }
              >
                {AnalyticsState.categorySortOptions.map((option) => (
                  <option value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="analytics-chart-area">
            <div className="analytics-chart-axis-title">Total Time</div>
            {this.isLoading ? (
              <LoadingComponent className="analytics-loading" />
            ) : null}
            {!this.isDateRangeValid ? (
              <p className="analytics-empty-state">
                Start date must be on or before end date.
              </p>
            ) : null}
            {this.isDateRangeValid &&
            !this.isLoading &&
            !this.chartCategories.length ? (
              <p className="analytics-empty-state">
                No analytics are available for this date range.
              </p>
            ) : null}
            <div
              className={clsx('analytics-chart-layout', {
                'analytics-chart-hidden':
                  this.isLoading ||
                  !this.isDateRangeValid ||
                  !this.chartCategories.length
              })}
            >
              <div
                className="analytics-chart-y-labels"
                style={`width: ${this.yAxisOffset}px; height: ${this.chartHeight}px;`}
                oncreate={({ dom }) => this.setYAxisLabelsElement(dom)}
                onupdate={({ dom }) => this.setYAxisLabelsElement(dom)}
              />
              <div
                className="analytics-chart-canvas"
                aria-label={this.chartSummaryLabel}
                data-testid="analytics-chart"
                oncreate={({ dom }) => this.renderChart(dom)}
                onupdate={({ dom }) => this.renderChart(dom)}
              />
            </div>
            <ul
              className="analytics-chart-summary"
              data-testid="analytics-chart-summary"
            >
              {this.sortedCategories.map((category) => {
                return (
                  <li>
                    {category.name}: {category.formattedDuration}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default AnalyticsComponent;
