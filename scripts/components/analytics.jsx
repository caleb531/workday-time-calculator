import { BarChart, FixedScaleAxis } from 'chartist';
import clsx from 'clsx';
import m from 'mithril';
import moment from 'moment';
import AnalyticsWorker from '../analytics-worker.js?worker';
import { collectAnalytics } from '../models/analytics-collector.js';
import { formatDuration } from '../models/duration-formatter.js';
import CloseButtonComponent from './close-button.jsx';
import DatePickerComponent from './date-picker.jsx';
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
    this.chartYAxisLabelsElement = null;
    this.setDefaultDates();

    if (this.worker) {
      this.worker.onmessage = (event) => {
        if (event.data.requestId !== this.workerRequestId) {
          return;
        }
        this.categories = event.data.categories;
        this.isLoading = false;
        m.redraw();
      };
    }

    this.fetchAnalytics();
  }

  onremove() {
    this.destroyChart();
    if (this.worker) {
      this.worker.terminate();
    }
  }

  setDefaultDates() {
    this.startDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
    this.endDate = moment().format('YYYY-MM-DD');
  }

  destroyChart() {
    if (this.chart) {
      this.chart.detach();
      this.chart = null;
    }
    this.renderYAxisLabels([]);
  }

  get isDateRangeValid() {
    const startDate = moment(this.startDate, 'YYYY-MM-DD', true);
    const endDate = moment(this.endDate, 'YYYY-MM-DD', true);
    return (
      startDate.isValid() &&
      endDate.isValid() &&
      startDate.isSameOrBefore(endDate, 'day')
    );
  }

  get chartCategories() {
    return this.categories
      .slice()
      .reverse()
      .map((category) => {
        return {
          ...category,
          formattedDuration: formatDuration(category.totalMinutes)
        };
      });
  }

  get chartSummaryLabel() {
    if (!this.chartCategories.length) {
      return 'No analytics are available for this date range.';
    }
    return this.chartCategories
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

  fetchAnalytics() {
    this.destroyChart();
    if (!this.isDateRangeValid) {
      this.categories = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const preferences = {
      timeSystem: this.preferences.timeSystem,
      categorySortOrder: this.preferences.categorySortOrder
    };

    if (!this.worker) {
      collectAnalytics({
        startDate: this.startDate,
        endDate: this.endDate,
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
      startDate: this.startDate,
      endDate: this.endDate,
      preferences: preferences
    });
  }

  handleDateInput(name, value) {
    this[name] = value;
    this.fetchAnalytics();
  }

  setYAxisLabelsElement(dom) {
    this.chartYAxisLabelsElement = dom;
    this.renderYAxisLabels([]);
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
    this.destroyChart();

    if (
      !this.chartCategories.length ||
      this.isLoading ||
      !this.isDateRangeValid
    ) {
      return;
    }

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
      this.renderYAxisLabels(barPositions.filter(Boolean));
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
            <DatePickerComponent
              aria-label="Start Date"
              className="analytics-date-picker"
              inputClassName="analytics-date-input"
              value={this.startDate}
              onChange={(value) => this.handleDateInput('startDate', value)}
            />
            <span className="analytics-range-separator">thru</span>
            <DatePickerComponent
              aria-label="End Date"
              className="analytics-date-picker"
              inputClassName="analytics-date-input"
              value={this.endDate}
              onChange={(value) => this.handleDateInput('endDate', value)}
            />
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
              {this.chartCategories.map((category) => {
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
