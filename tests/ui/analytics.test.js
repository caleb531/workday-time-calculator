import {
  findByLabelText,
  findByRole,
  findByTestId,
  fireEvent,
  queryByLabelText,
  queryByTestId,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import m from 'mithril';
import moment from 'moment';
import AnalyticsComponent from '../../scripts/components/analytics.jsx';
import appStorage from '../../scripts/models/app-storage.js';
import {
  applyLogContentsToApp,
  renderApp,
  saveToIndexedDB,
  setPreferences,
  testCases,
  unmountApp
} from '../utils.js';

const basicTestCase = testCases.find(({ description }) => {
  return description === 'should instantiate a basic log';
});
const realWorldTestCase = testCases.find(({ description }) => {
  return (
    description ===
    'should instantiate real-world log with multiple categories, descriptions, and a gap'
  );
});
const twentyFourHourTestCase = testCases.find(({ description }) => {
  return (
    description === 'should instantiate a log using the 24-hour time system'
  );
});

async function openAnalytics() {
  // Wait for the previous panel to unmount before reopening it
  await waitFor(() =>
    expect(queryByTestId(document.body, 'analytics-panel')).toBeNull()
  );
  const analyticsToggle = await findByRole(document.body, 'button', {
    name: 'Toggle Analytics'
  });
  await userEvent.click(analyticsToggle);
  return findByTestId(document.body, 'analytics-panel');
}

// Select Custom explicitly before exercising date inputs
async function selectCustom(analyticsPanel) {
  // The date filter dropdown becomes editable after saved state loads
  const filter = await findByRole(analyticsPanel, 'combobox', {
    name: 'Date Filter'
  });
  await waitFor(() => expect(filter).toBeEnabled());
  await userEvent.selectOptions(filter, 'custom');
}

async function getDateSegments(analyticsPanel, labelPrefix) {
  await selectCustom(analyticsPanel);
  return {
    month: await findByLabelText(analyticsPanel, `${labelPrefix} Month`),
    day: await findByLabelText(analyticsPanel, `${labelPrefix} Day`),
    year: await findByLabelText(analyticsPanel, `${labelPrefix} Year`)
  };
}

function setDateSegments(dateSegments, date) {
  // Mirror entering a complete date through the independently editable fields.
  fireEvent.input(dateSegments.month, {
    target: { value: date.format('MM') }
  });
  fireEvent.input(dateSegments.day, { target: { value: date.format('DD') } });
  fireEvent.input(dateSegments.year, {
    target: { value: date.format('YYYY') }
  });
  fireEvent.blur(dateSegments.year);
}

describe('analytics panel', () => {
  afterEach(async () => {
    // Prevent a fixed-clock test from leaking its mocked time into later scenarios.
    vi.useRealTimers();
    vi.unstubAllGlobals();
    await unmountApp();
  });

  it('should close Analytics with Escape while focus remains on its opening toggle', async () => {
    await renderApp();
    await openAnalytics();
    expect(
      await findByRole(document.body, 'button', { name: 'Toggle Analytics' })
    ).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(queryByTestId(document.body, 'analytics-panel')).toBeNull()
    );
  });

  it('should dismiss the date picker before Analytics when pressing Escape', async () => {
    await renderApp();
    // A calendar inside Analytics handles its own Escape before the overlay
    const panel = await openAnalytics();
    await selectCustom(panel);
    const toggle = await findByRole(panel, 'button', {
      name: 'Open Start Date Calendar'
    });
    await userEvent.click(toggle);
    await findByTestId(panel, 'log-calendar-selected-date');
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(queryByTestId(panel, 'log-calendar-dates')).toBeNull()
    );
    expect(panel).toBeInTheDocument();
    expect(toggle).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(queryByTestId(document.body, 'analytics-panel')).toBeNull()
    );
  });

  it.each([true, false])(
    'should sort loaded categories from top to bottom with alphabetical duration ties (Worker: %s)',
    async (useWorker) => {
      if (!useWorker) {
        vi.stubGlobal('Worker', undefined);
      }
      await setPreferences({ categorySortOrder: 'title' });
      await applyLogContentsToApp({
        0: {
          ops: [
            { insert: 'Zulu' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '9 to 10' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
            { insert: 'Alpha' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '10 to 11' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
            { insert: 'Beta' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '11 to 1' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } }
          ]
        }
      });
      await renderApp();

      // The panel and native dropdown used to change the chart order
      const panel = await openAnalytics();
      const sortControl = await findByRole(panel, 'combobox', {
        name: 'Category Sort'
      });
      // Return the labels in their actual vertical order in the rendered chart
      const getVisibleOrder = () =>
        Array.from(panel.querySelectorAll('.analytics-chart-y-label'))
          .sort(
            (left, right) =>
              parseFloat(left.style.top) - parseFloat(right.style.top)
          )
          .map((label) => label.textContent);
      await waitFor(() => {
        expect(sortControl).toBeEnabled();
        expect(getVisibleOrder()).toEqual(['Beta', 'Alpha', 'Zulu']);
      });
      expect(
        Array.from(sortControl.options).map((option) => option.text)
      ).toEqual(['Duration (Desc)', 'Duration (Asc)', 'Alphabetical']);
      // Summary continues to use its own alphabetical preference
      const summaryOrder = Array.from(
        document.querySelectorAll('.log-category-name')
      ).map((label) => label.textContent);
      expect(summaryOrder).toEqual(['Alpha:', 'Beta:', 'Zulu:']);
      // Count analytics fetches and worker requests after the initial chart has loaded
      const analyticsFetches = vi.spyOn(
        AnalyticsComponent.prototype,
        'fetchAnalytics'
      );
      const workerRequests = useWorker
        ? vi.spyOn(Worker.prototype, 'postMessage')
        : null;
      // Check both ascending and alphabetical order, then restore the default
      const orders = [
        ['duration-asc', ['Alpha', 'Zulu', 'Beta']],
        ['alphabetical', ['Alpha', 'Beta', 'Zulu']],
        ['duration-desc', ['Beta', 'Alpha', 'Zulu']]
      ];
      for (const [value, expectedOrder] of orders) {
        await userEvent.selectOptions(sortControl, value);
        await waitFor(() => expect(getVisibleOrder()).toEqual(expectedOrder));
        expect(await appStorage.get('wtc-analytics')).toEqual({
          categorySortOrder: value,
          dateFilter: 'last-7-days',
          startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD')
        });
      }
      expect(analyticsFetches).not.toHaveBeenCalled();
      expect(workerRequests?.mock.calls ?? []).toHaveLength(0);
      expect(
        Array.from(document.querySelectorAll('.log-category-name')).map(
          (label) => label.textContent
        )
      ).toEqual(summaryOrder);
    }
  );

  it('should restore sorting, Custom, and edited dates after reopening and remounting', async () => {
    await renderApp();
    // The initial panel and its sort selection
    const panel = await openAnalytics();
    const sortControl = await findByRole(panel, 'combobox', {
      name: 'Category Sort'
    });
    await waitFor(() => expect(sortControl).toBeEnabled());
    await userEvent.selectOptions(sortControl, 'alphabetical');
    setDateSegments(
      await getDateSegments(panel, 'Start Date'),
      moment().subtract(20, 'days')
    );
    setDateSegments(
      await getDateSegments(panel, 'End Date'),
      moment().subtract(2, 'days')
    );
    await userEvent.click(
      await findByRole(panel, 'button', { name: 'Close Analytics' })
    );
    // The reopened panel should retain sorting and the saved custom range
    const reopenedPanel = await openAnalytics();
    await waitFor(async () => {
      expect(
        await findByRole(reopenedPanel, 'combobox', { name: 'Category Sort' })
      ).toHaveValue('alphabetical');
    });
    expect(
      (await getDateSegments(reopenedPanel, 'Start Date')).day
    ).toHaveValue(moment().subtract(20, 'days').format('DD'));
    expect((await getDateSegments(reopenedPanel, 'End Date')).day).toHaveValue(
      moment().subtract(2, 'days').format('DD')
    );
    expect(await appStorage.get('wtc-analytics')).toEqual({
      categorySortOrder: 'alphabetical',
      dateFilter: 'custom',
      startDate: moment().subtract(20, 'days').format('YYYY-MM-DD'),
      endDate: moment().subtract(2, 'days').format('YYYY-MM-DD')
    });
    // Remove the app without clearing storage to simulate a fresh page load
    const main = document.querySelector('main');
    m.mount(main, null);
    main.remove();
    await waitFor(() => expect(navigator.locks.owner).toBeNull());
    await renderApp();
    // The fresh app reads the same persisted selection
    const reloadedPanel = await openAnalytics();
    await waitFor(async () => {
      expect(
        await findByRole(reloadedPanel, 'combobox', { name: 'Category Sort' })
      ).toHaveValue('alphabetical');
      expect(
        await findByRole(reloadedPanel, 'combobox', { name: 'Date Filter' })
      ).toHaveValue('custom');
    });
    expect(
      (await getDateSegments(reloadedPanel, 'Start Date')).day
    ).toHaveValue(moment().subtract(20, 'days').format('DD'));
    expect((await getDateSegments(reloadedPanel, 'End Date')).day).toHaveValue(
      moment().subtract(2, 'days').format('DD')
    );
  });

  it.each([
    undefined,
    {},
    { categorySortOrder: 'unsupported', dateFilter: 'unsupported' },
    { categorySortOrder: 'duration-desc' }
  ])(
    'should default missing or unsupported saved state to descending duration (%j)',
    async (savedState) => {
      if (savedState !== undefined) {
        await saveToIndexedDB('wtc-analytics', savedState);
      }
      await setPreferences({ categorySortOrder: 'title' });
      await renderApp();
      // The dropdown must default independently of the Summary preference
      const panel = await openAnalytics();
      const sortControl = await findByRole(panel, 'combobox', {
        name: 'Category Sort'
      });
      await waitFor(() => {
        expect(sortControl).toBeEnabled();
        expect(sortControl).toHaveValue('duration-desc');
        expect(panel.querySelector('#analytics-date-filter')).toHaveValue(
          'last-7-days'
        );
        expect(queryByLabelText(panel, 'Start Date Month')).toBeNull();
      });
    }
  );

  it('should disable sorting until saved state loads and allow keyboard focus afterward', async () => {
    await renderApp();
    // Resolve the delayed state read after checking the disabled dropdown
    let resolveState;
    // Preserve normal reads for the rest of the application
    const originalGet = appStorage.get.bind(appStorage);
    vi.spyOn(appStorage, 'get').mockImplementation((key) => {
      return key === 'wtc-analytics'
        ? new Promise((resolve) => {
            resolveState = resolve;
          })
        : originalGet(key);
    });
    // The dropdown remains disabled during the pending storage read
    const panel = await openAnalytics();
    const sortControl = await findByRole(panel, 'combobox', {
      name: 'Category Sort'
    });
    // No analytics request may run before the persisted range is known
    const fetches = vi.spyOn(AnalyticsComponent.prototype, 'fetchAnalytics');
    const filter = await findByRole(panel, 'combobox', { name: 'Date Filter' });
    expect(filter).toBeDisabled();
    expect(sortControl).toBeDisabled();
    expect(fetches).not.toHaveBeenCalled();
    resolveState({
      categorySortOrder: 'duration-asc',
      dateFilter: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-02'
    });
    await waitFor(() => {
      expect(sortControl).toBeEnabled();
      expect(sortControl).toHaveValue('duration-asc');
      expect(filter).toBeEnabled();
      expect(filter).toHaveValue('custom');
      expect(fetches).toHaveBeenCalledTimes(1);
    });
    expect((await getDateSegments(panel, 'Start Date')).day).toHaveValue('01');
    // Tab from the end-date year through its calendar button to Category Sort
    await userEvent.click((await getDateSegments(panel, 'End Date')).year);
    await userEvent.tab();
    await userEvent.tab();
    expect(sortControl).toHaveFocus();
  });

  it.each([true, false])(
    'should combine category names case-insensitively within and across days (Worker: %s)',
    async (useWorker) => {
      if (!useWorker) {
        vi.stubGlobal('Worker', undefined);
      }
      await applyLogContentsToApp({
        [-1]: {
          ops: [
            { insert: 'RSCS Display Items By Role' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '9 to 10' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
            { insert: 'RSCS Display Items by Role' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '10 to 10:30' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } }
          ]
        },
        0: {
          ops: [
            { insert: 'rscs display items by role' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '9 to 9:15' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
            { insert: 'Other category' },
            { insert: '\n', attributes: { list: 'ordered' } },
            { insert: '10 to 10:30' },
            { insert: '\n', attributes: { list: 'ordered', indent: 1 } }
          ]
        }
      });
      await renderApp();
      // The chart and text summary must use the same combined totals
      const panel = await openAnalytics();
      // The accessible list of category names and their durations
      const summary = await findByTestId(panel, 'analytics-chart-summary');
      await waitFor(() => {
        expect(
          Array.from(panel.querySelectorAll('.analytics-chart-y-label'))
            .map((label) => label.textContent.toLowerCase())
            .sort()
        ).toEqual(['other category', 'rscs display items by role']);
        expect(summary.children).toHaveLength(2);
        expect(summary).toHaveTextContent(/rscs display items by role: 1:45/i);
        expect(summary).toHaveTextContent('Other category: 0:30');
      });
    }
  );

  it('should default to the last seven days and aggregate matching categories', async () => {
    await applyLogContentsToApp({
      [-8]: basicTestCase.logContents,
      [-7]: basicTestCase.logContents,
      [-1]: realWorldTestCase.logContents,
      0: basicTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
    // Presets hide both segmented date controls and the separator
    const filter = await findByRole(analyticsPanel, 'combobox', {
      name: 'Date Filter'
    });
    await waitFor(() => expect(filter).toBeEnabled());
    expect(filter).toHaveValue('last-7-days');
    expect(Array.from(filter.options).map((option) => option.text)).toEqual([
      'Last 7 Days',
      'Last 14 Days',
      'Last 30 Days',
      'Last 60 Days',
      'Last 90 Days',
      'Custom'
    ]);
    expect(queryByLabelText(analyticsPanel, 'Start Date Month')).toBeNull();
    expect(queryByLabelText(analyticsPanel, 'End Date Month')).toBeNull();
    expect(
      analyticsPanel.querySelector('.analytics-range-separator')
    ).toBeNull();

    const analyticsSummary = await findByTestId(
      analyticsPanel,
      'analytics-chart-summary'
    );

    await waitFor(() => {
      expect(analyticsSummary).toHaveTextContent('Internal: 8:45');
      expect(analyticsSummary).toHaveTextContent('Client A: 2:30');
      expect(analyticsSummary).toHaveTextContent('Client B: 1:15');
    });
  });

  it.each([
    [true, 7],
    [true, 14],
    [true, 30],
    [true, 60],
    [true, 90],
    [false, 7],
    [false, 14],
    [false, 30],
    [false, 60],
    [false, 90]
  ])(
    'should include both preset boundaries and exclude older and future logs (Worker: %s; days: %s)',
    async (useWorker, days) => {
      if (!useWorker) {
        vi.stubGlobal('Worker', undefined);
      }
      await applyLogContentsToApp({
        [-days - 1]: realWorldTestCase.logContents,
        [-days]: basicTestCase.logContents,
        0: basicTestCase.logContents,
        1: realWorldTestCase.logContents
      });
      await renderApp();
      // The panel and dropdown used to fetch the selected preset
      const panel = await openAnalytics();
      const filter = await findByRole(panel, 'combobox', {
        name: 'Date Filter'
      });
      await waitFor(() => expect(filter).toBeEnabled());
      await userEvent.selectOptions(filter, `last-${days}-days`);
      await waitFor(() => {
        expect(
          panel.querySelector('[data-testid="analytics-chart-summary"]')
        ).toHaveTextContent('Internal: 7:30');
        expect(
          panel.querySelector('[data-testid="analytics-chart-summary"]')
        ).not.toHaveTextContent('Client A');
      });
      expect(queryByLabelText(panel, 'Start Date Month')).toBeNull();
    }
  );

  it('should reset custom dates each time Custom is explicitly selected', async () => {
    await renderApp();
    // The panel and dropdown used to leave and reenter Custom
    const panel = await openAnalytics();
    const filter = await findByRole(panel, 'combobox', { name: 'Date Filter' });
    // The edited custom bounds before selecting another preset
    const start = await getDateSegments(panel, 'Start Date');
    const end = await getDateSegments(panel, 'End Date');
    setDateSegments(start, moment().subtract(20, 'days'));
    setDateSegments(end, moment().subtract(2, 'days'));
    await userEvent.selectOptions(filter, 'last-30-days');
    await waitFor(() =>
      expect(queryByLabelText(panel, 'Start Date Month')).toBeNull()
    );
    await userEvent.selectOptions(filter, 'custom');
    await waitFor(async () => {
      expect(await appStorage.get('wtc-analytics')).toEqual({
        categorySortOrder: 'duration-desc',
        dateFilter: 'custom',
        startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD')
      });
    });
    expect((await getDateSegments(panel, 'Start Date')).day).toHaveValue(
      moment().subtract(7, 'days').format('DD')
    );
    expect((await getDateSegments(panel, 'End Date')).day).toHaveValue(
      moment().format('DD')
    );
    expect(panel.querySelector('.analytics-range-separator')).toHaveTextContent(
      'thru'
    );
  });

  it.each(['Start', 'End'])(
    'should persist a %s Date calendar selection',
    async (bound) => {
      await renderApp();
      // The panel and custom controls used for calendar edits
      const panel = await openAnalytics();
      await selectCustom(panel);
      // Yesterday is visible in both default calendars
      const selected = moment().subtract(1, 'days');
      await userEvent.click(
        await findByRole(panel, 'button', {
          name: `Open ${bound} Date Calendar`
        })
      );
      // The calendar grid containing yesterday's date
      const calendar = await findByTestId(document.body, 'log-calendar-dates');
      fireEvent.click(
        calendar.querySelector(`[data-date="${selected.format('l')}"]`)
      );
      await waitFor(async () => {
        expect(await appStorage.get('wtc-analytics')).toMatchObject({
          dateFilter: 'custom',
          [bound === 'Start' ? 'startDate' : 'endDate']:
            selected.format('YYYY-MM-DD')
        });
      });
      await userEvent.click(
        await findByRole(panel, 'button', { name: 'Close Analytics' })
      );
      // The reopened input must display the stored calendar selection
      const reopened = await openAnalytics();
      expect(
        (await getDateSegments(reopened, `${bound} Date`)).day
      ).toHaveValue(selected.format('DD'));
    }
  );

  it.each([7, 14, 30])(
    'should recalculate saved Last %s Days bounds on reopening',
    async (days) => {
      vi.setSystemTime(new Date(2026, 5, 15, 10));
      await saveToIndexedDB('wtc-analytics', {
        dateFilter: `last-${days}-days`,
        startDate: '2000-01-01',
        endDate: '2000-01-02'
      });
      await applyLogContentsToApp({
        [-days]: basicTestCase.logContents,
        0: basicTestCase.logContents,
        1: realWorldTestCase.logContents
      });
      await renderApp();
      // The first range includes its oldest boundary and today
      const panel = await openAnalytics();
      await waitFor(() =>
        expect(
          panel.querySelector('[data-testid="analytics-chart-summary"]')
        ).toHaveTextContent('Internal: 7:30')
      );
      await userEvent.click(
        await findByRole(panel, 'button', { name: 'Close Analytics' })
      );
      vi.setSystemTime(new Date(2026, 5, 16, 10));
      // Tomorrow's log becomes today's while the former oldest log leaves the range
      const reopened = await openAnalytics();
      await waitFor(() => {
        expect(reopened.querySelector('#analytics-date-filter')).toHaveValue(
          `last-${days}-days`
        );
        expect(
          reopened.querySelector('[data-testid="analytics-chart-summary"]')
        ).toHaveTextContent('Internal: 5:00');
        expect(
          reopened.querySelector('[data-testid="analytics-chart-summary"]')
        ).toHaveTextContent('Client A: 2:30');
      });
      expect(await appStorage.get('wtc-analytics')).toMatchObject({
        startDate: '2000-01-01',
        endDate: '2000-01-02'
      });
    }
  );

  it('should refresh the chart when the date range changes', async () => {
    await applyLogContentsToApp({
      [-7]: basicTestCase.logContents,
      [-1]: realWorldTestCase.logContents,
      0: basicTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
    await selectCustom(analyticsPanel);
    await userEvent.click(
      await findByRole(analyticsPanel, 'button', {
        name: 'Open Start Date Calendar'
      })
    );

    const dateToSelect = moment().subtract(1, 'days').format('l');
    const calendarDates = await findByTestId(
      document.body,
      'log-calendar-dates'
    );
    fireEvent.click(
      calendarDates.querySelector(`[data-date="${dateToSelect}"]`)
    );

    const analyticsSummary = await findByTestId(
      analyticsPanel,
      'analytics-chart-summary'
    );

    await waitFor(() => {
      expect(analyticsSummary).toHaveTextContent('Internal: 5:00');
      expect(analyticsSummary).not.toHaveTextContent('Internal: 8:45');
    });
  });

  it('should refresh the chart when a complete start date is typed manually across a year boundary', async () => {
    // January 5 makes the default seven-day range start in the previous year.
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0));

    try {
      await applyLogContentsToApp({
        [-7]: basicTestCase.logContents,
        [-1]: realWorldTestCase.logContents,
        0: basicTestCase.logContents
      });
      await renderApp();

      const analyticsToggle = await findByRole(document.body, 'button', {
        name: 'Toggle Analytics'
      });
      fireEvent.click(analyticsToggle);
      const analyticsPanel = await findByTestId(
        document.body,
        'analytics-panel'
      );
      const startDateSegments = await getDateSegments(
        analyticsPanel,
        'Start Date'
      );
      // Use yesterday as a complete date so every segment is exercised.
      const targetStartDate = moment().subtract(1, 'days');
      setDateSegments(startDateSegments, targetStartDate);

      const analyticsSummary = await findByTestId(
        analyticsPanel,
        'analytics-chart-summary'
      );

      await waitFor(() => {
        expect(startDateSegments.month).toHaveValue('01');
        expect(startDateSegments.day).toHaveValue('04');
        expect(startDateSegments.year).toHaveValue('2026');
        expect(analyticsSummary).toHaveTextContent('Internal: 5:00');
        expect(analyticsSummary).not.toHaveTextContent('Internal: 8:45');
      });
    } finally {
      // Restore the real system clock before suite-level unmounting and later tests.
      vi.useRealTimers();
    }
  });

  it('should preserve the month and year when only the start-date day is edited', async () => {
    // Reuse the cross-year default range to prove a day edit changes only its segment.
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0));

    try {
      await renderApp();

      const analyticsToggle = await findByRole(document.body, 'button', {
        name: 'Toggle Analytics'
      });
      fireEvent.click(analyticsToggle);
      const analyticsPanel = await findByTestId(
        document.body,
        'analytics-panel'
      );
      const startDateSegments = await getDateSegments(
        analyticsPanel,
        'Start Date'
      );

      fireEvent.input(startDateSegments.day, { target: { value: '04' } });
      fireEvent.blur(startDateSegments.day);

      await waitFor(() => {
        expect(startDateSegments.month).toHaveValue('12');
        expect(startDateSegments.day).toHaveValue('04');
        expect(startDateSegments.year).toHaveValue('2025');
      });
    } finally {
      // Restore the real system clock before suite-level unmounting and later tests.
      vi.useRealTimers();
    }
  });

  it('should commit a padded segment value when Enter is pressed', async () => {
    await applyLogContentsToApp({
      [-7]: basicTestCase.logContents,
      [-1]: realWorldTestCase.logContents,
      0: basicTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const endDateSegments = await getDateSegments(analyticsPanel, 'End Date');

    await userEvent.click(endDateSegments.month);
    await userEvent.keyboard('1');

    await waitFor(() => {
      expect(endDateSegments.month).toHaveValue('01');
      expect(analyticsPanel).not.toHaveTextContent(
        'Start date must be on or before end date.'
      );
    });

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(endDateSegments.month).toHaveValue('01');
      expect(analyticsPanel).toHaveTextContent(
        'Start date must be on or before end date.'
      );
    });
  });

  it('should commit a padded segment value when the input change event fires', async () => {
    await applyLogContentsToApp({
      [-7]: basicTestCase.logContents,
      [-1]: realWorldTestCase.logContents,
      0: basicTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const endDateSegments = await getDateSegments(analyticsPanel, 'End Date');

    await userEvent.click(endDateSegments.month);
    await userEvent.keyboard('1');

    await waitFor(() => {
      expect(endDateSegments.month).toHaveValue('01');
      expect(analyticsPanel).not.toHaveTextContent(
        'Start date must be on or before end date.'
      );
    });

    fireEvent.change(endDateSegments.month, { target: { value: '01' } });

    await waitFor(() => {
      expect(endDateSegments.month).toHaveValue('01');
      expect(analyticsPanel).toHaveTextContent(
        'Start date must be on or before end date.'
      );
    });
  });

  it('should not open calendar when date input receives focus', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.month);

    expect(queryByTestId(document.body, 'log-calendar-dates')).toBeNull();
  });

  it('should focus the clicked segment when the date control is unfocused', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.year);

    expect(startDateSegments.year).toHaveFocus();
  });

  it('should support keyboard month navigation in date input', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.month);
    fireEvent.keyDown(startDateSegments.month, { key: 'ArrowUp' });

    await waitFor(() => {
      expect(startDateSegments.month).toHaveValue(
        moment().subtract(7, 'days').add(1, 'month').format('MM')
      );
    });
  });

  it('should pad single-digit month entry and then accept a second digit', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.month);
    await userEvent.keyboard('1');

    await waitFor(() => {
      expect(startDateSegments.month).toHaveValue('01');
      expect(startDateSegments.month).toHaveFocus();
    });

    await userEvent.keyboard('2');

    await waitFor(() => {
      expect(startDateSegments.month).toHaveValue('12');
      expect(startDateSegments.day).toHaveFocus();
    });
  });

  it('should pad year entry with leading zeroes while digits are being typed', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.year);
    await userEvent.keyboard('1');

    await waitFor(() => {
      expect(startDateSegments.year).toHaveValue('0001');
      expect(startDateSegments.year).toHaveFocus();
    });

    await userEvent.keyboard('2');

    await waitFor(() => {
      expect(startDateSegments.year).toHaveValue('0012');
      expect(startDateSegments.year).toHaveFocus();
    });
  });

  it('should use Tab to move between date segments before leaving the field', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.month);
    await userEvent.tab();
    expect(startDateSegments.day).toHaveFocus();

    await userEvent.tab();
    expect(startDateSegments.year).toHaveFocus();
  });

  it('should not reload analytics when tabbing through unchanged date segments', async () => {
    await applyLogContentsToApp({
      [-8]: basicTestCase.logContents,
      [-7]: basicTestCase.logContents,
      [-1]: realWorldTestCase.logContents,
      0: basicTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );
    const analyticsChart = await findByTestId(
      analyticsPanel,
      'analytics-chart'
    );
    const analyticsSummary = await findByTestId(
      analyticsPanel,
      'analytics-chart-summary'
    );

    await waitFor(() => {
      expect(analyticsSummary).toHaveTextContent('Internal: 8:45');
    });
    await waitFor(() => {
      expect(queryByLabelText(analyticsPanel, 'Loading...')).toBeNull();
      expect(analyticsChart.innerHTML).not.toBe('');
    });

    const chartMarkupBeforeTabbing = analyticsChart.innerHTML;

    await userEvent.click(startDateSegments.month);
    await userEvent.tab();
    await userEvent.tab();

    await waitFor(() => {
      expect(startDateSegments.year).toHaveFocus();
      expect(queryByLabelText(analyticsPanel, 'Loading...')).toBeNull();
      expect(analyticsSummary).toHaveTextContent('Internal: 8:45');
      expect(analyticsChart.innerHTML).toBe(chartMarkupBeforeTabbing);
    });
  });

  it('should use Shift+Tab to move backward between date segments', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );

    await userEvent.click(startDateSegments.year);
    await userEvent.tab({ shift: true });
    expect(startDateSegments.day).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(startDateSegments.month).toHaveFocus();
  });

  it('should allow Tab to leave the date input after the last segment', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );
    const startDateCalendarToggle = await findByRole(analyticsPanel, 'button', {
      name: 'Open Start Date Calendar'
    });
    const endDateSegments = await getDateSegments(analyticsPanel, 'End Date');

    await userEvent.click(startDateSegments.year);

    await userEvent.tab();

    expect(startDateCalendarToggle).toHaveFocus();

    await userEvent.tab();

    expect(endDateSegments.month).toHaveFocus();
  });

  it('should allow Shift+Tab to leave the date input before the first segment', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateSegments = await getDateSegments(
      analyticsPanel,
      'Start Date'
    );
    // The date filter precedes custom date inputs in keyboard order
    const dateFilter = await findByRole(analyticsPanel, 'combobox', {
      name: 'Date Filter'
    });

    await userEvent.click(startDateSegments.month);

    await userEvent.tab({ shift: true });

    expect(dateFilter).toHaveFocus();
  });

  it('should parse logs using the preferred time system', async () => {
    await setPreferences({ timeSystem: '24-hour' });
    await applyLogContentsToApp({
      0: twentyFourHourTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const analyticsSummary = await findByTestId(
      analyticsPanel,
      'analytics-chart-summary'
    );

    await waitFor(() => {
      expect(analyticsSummary).toHaveTextContent('Internal: 1:00');
    });
  });
  it.each(['Start', 'End'])(
    'should focus and dismiss the %s calendar without trapping Tab',
    async (bound) => {
      await applyLogContentsToApp({
        0: basicTestCase.logContents,
        [-7]: basicTestCase.logContents
      });
      await renderApp();
      // The custom range exposes both calendar toggles
      const panel = await openAnalytics();
      await selectCustom(panel);
      const toggle = await findByRole(panel, 'button', {
        name: `Open ${bound} Date Calendar`
      });
      await userEvent.click(toggle);
      const selected = await findByTestId(panel, 'log-calendar-selected-date');
      await waitFor(() => expect(selected).toHaveFocus());
      await waitFor(() => expect(selected).toHaveAccessibleName(/, has log$/));
      expect(toggle).toHaveAttribute(
        'aria-controls',
        selected.closest('[role="dialog"]').id
      );
      // Native Tab reaches adjacent empty dates rather than skipping to another saved log
      await userEvent.tab();
      expect(document.activeElement).toHaveAttribute(
        'data-date',
        moment(selected.getAttribute('data-date'), 'l')
          .add(1, 'day')
          .format('l')
      );
      expect(document.activeElement).not.toHaveClass('has-log');
      await userEvent.tab({ shift: true });
      expect(selected).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toHaveAttribute(
        'data-date',
        moment(selected.getAttribute('data-date'), 'l')
          .subtract(1, 'day')
          .format('l')
      );
      // The last visible date allows Tab to leave the nonmodal popup
      Array.from(panel.querySelectorAll('.log-calendar-date')).at(-1).focus();
      await userEvent.tab();
      expect(selected.closest('[role="dialog"]')).not.toContainElement(
        document.activeElement
      );
      selected.focus();
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(queryByTestId(panel, 'log-calendar-dates')).toBeNull()
      );
      expect(toggle).toHaveFocus();
    }
  );

  it.each([true, false])(
    'should return focus after delayed selection only if it remains in the calendar (%s)',
    async (stayInside) => {
      await renderApp();
      // Analytics selection closes after 250 ms
      const panel = await openAnalytics();
      await selectCustom(panel);
      const toggle = await findByRole(panel, 'button', {
        name: 'Open End Date Calendar'
      });
      await userEvent.click(toggle);
      await findByTestId(panel, 'log-calendar-selected-date');
      await userEvent.keyboard('{ArrowLeft}{Enter}');
      // Moving out before the timer finishes must not cause focus to jump back
      const outside = await findByRole(panel, 'button', {
        name: 'Open Start Date Calendar'
      });
      if (!stayInside) {
        outside.focus();
      }
      await waitFor(() =>
        expect(queryByTestId(panel, 'log-calendar-dates')).toBeNull()
      );
      expect(stayInside ? toggle : outside).toHaveFocus();
    }
  );
});
