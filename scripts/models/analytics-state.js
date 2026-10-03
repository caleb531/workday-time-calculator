import moment from 'moment';
import appStorage from './app-storage.js';

// Store the Analytics panel's filters and sort independently of Preferences
class AnalyticsState {
  // Start with the default selections while saved state is loading
  constructor() {
    // The selected order for categories shown from top to bottom
    this.categorySortOrder = AnalyticsState.defaultCategorySort;
    // The selected preset or custom date range
    this.dateFilter = AnalyticsState.defaultDateFilter;
    this.resetCustomDates();
  }

  // Load saved selections; use defaults for missing or unsupported selections
  async load() {
    // The saved state for the Analytics panel
    const state = await appStorage.get('wtc-analytics');
    this.categorySortOrder = AnalyticsState.categorySortOptions.some(
      (option) => option.value === state?.categorySortOrder
    )
      ? state.categorySortOrder
      : AnalyticsState.defaultCategorySort;
    this.dateFilter = AnalyticsState.dateFilterOptions.some(
      (option) => option.value === state?.dateFilter
    )
      ? state.dateFilter
      : AnalyticsState.defaultDateFilter;
    this.startDate = state?.startDate ?? this.startDate;
    this.endDate = state?.endDate ?? this.endDate;
    return this;
  }

  // Reset custom dates to seven days ago through today
  resetCustomDates() {
    // Today's date shared by both bounds
    const today = moment();
    // The saved start of the custom range in YYYY-MM-DD format
    this.startDate = today.clone().subtract(7, 'days').format('YYYY-MM-DD');
    // The saved end of the custom range in YYYY-MM-DD format
    this.endDate = today.format('YYYY-MM-DD');
  }

  // Return custom bounds or resolve the selected preset relative to today
  get dateRange() {
    if (this.dateFilter === 'custom') {
      return { startDate: this.startDate, endDate: this.endDate };
    }
    // The number of preceding days included along with today
    const { days } = AnalyticsState.dateFilterOptions.find(
      (option) => option.value === this.dateFilter
    );
    // Today's date shared by both dynamic bounds
    const today = moment();
    return {
      startDate: today.clone().subtract(days, 'days').format('YYYY-MM-DD'),
      endDate: today.format('YYYY-MM-DD')
    };
  }

  // Save the sort, filter, and custom dates together
  save() {
    return appStorage.set('wtc-analytics', {
      categorySortOrder: this.categorySortOrder,
      dateFilter: this.dateFilter,
      startDate: this.startDate,
      endDate: this.endDate
    });
  }
}

// The available category orders in the order shown in the dropdown
AnalyticsState.categorySortOptions = [
  { label: 'Duration (Desc)', value: 'duration-desc' },
  { label: 'Duration (Asc)', value: 'duration-asc' },
  { label: 'Alphabetical', value: 'alphabetical' }
];

// The initial category order when no supported selection has been saved
AnalyticsState.defaultCategorySort =
  AnalyticsState.categorySortOptions[0].value;

// The available date filters in the order shown in the dropdown
AnalyticsState.dateFilterOptions = [
  { label: 'Last 7 Days', value: 'last-7-days', days: 7 },
  { label: 'Last 14 Days', value: 'last-14-days', days: 14 },
  { label: 'Last 30 Days', value: 'last-30-days', days: 30 },
  { label: 'Custom', value: 'custom' }
];

// The initial date filter when no supported selection has been saved
AnalyticsState.defaultDateFilter = AnalyticsState.dateFilterOptions[0].value;

export default AnalyticsState;
