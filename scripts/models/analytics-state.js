import appStorage from './app-storage.js';

// Store the Analytics panel's sort selection independently of Preferences
class AnalyticsState {
  // Start with the default sort while saved state is loading
  constructor() {
    // The selected order for categories shown from top to bottom
    this.categorySortOrder = AnalyticsState.defaultCategorySort;
  }

  // Load the saved sort; use the default if it is missing or unsupported
  async load() {
    // The saved state for the Analytics panel
    const state = await appStorage.get('wtc-analytics');
    this.categorySortOrder = AnalyticsState.categorySortOptions.some(
      (option) => option.value === state?.categorySortOrder
    )
      ? state.categorySortOrder
      : AnalyticsState.defaultCategorySort;
    return this;
  }

  // Save only the sort selection so date filters reset on each opening
  save() {
    return appStorage.set('wtc-analytics', {
      categorySortOrder: this.categorySortOrder
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

export default AnalyticsState;
