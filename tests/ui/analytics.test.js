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
  const analyticsToggle = await findByRole(document.body, 'button', {
    name: 'Toggle Analytics'
  });
  await userEvent.click(analyticsToggle);
  return findByTestId(document.body, 'analytics-panel');
}

async function getDateSegments(analyticsPanel, labelPrefix) {
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
          categorySortOrder: value
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

  it('should restore the sort after reopening and remounting while resetting dates', async () => {
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
    await userEvent.click(
      await findByRole(panel, 'button', { name: 'Close Analytics' })
    );
    // The reopened panel should retain sorting but use the default date range
    const reopenedPanel = await openAnalytics();
    await waitFor(async () => {
      expect(
        await findByRole(reopenedPanel, 'combobox', { name: 'Category Sort' })
      ).toHaveValue('alphabetical');
    });
    expect(
      (await getDateSegments(reopenedPanel, 'Start Date')).day
    ).toHaveValue(moment().subtract(7, 'days').format('DD'));
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
    });
  });

  it.each([undefined, {}, { categorySortOrder: 'unsupported' }])(
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
    expect(sortControl).toBeDisabled();
    resolveState({ categorySortOrder: 'duration-asc' });
    await waitFor(() => {
      expect(sortControl).toBeEnabled();
      expect(sortControl).toHaveValue('duration-asc');
    });
    await userEvent.click(
      await findByRole(panel, 'button', { name: 'Open End Date Calendar' })
    );
    await userEvent.tab();
    expect(sortControl).toHaveFocus();
  });

  it('should default to the last seven days and aggregate matching categories', async () => {
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
    const endDateSegments = await getDateSegments(analyticsPanel, 'End Date');

    expect(startDateSegments.month).toHaveValue(
      moment().subtract(7, 'days').format('MM')
    );
    expect(startDateSegments.day).toHaveValue(
      moment().subtract(7, 'days').format('DD')
    );
    expect(startDateSegments.year).toHaveValue(
      moment().subtract(7, 'days').format('YYYY')
    );
    expect(endDateSegments.month).toHaveValue(moment().format('MM'));
    expect(endDateSegments.day).toHaveValue(moment().format('DD'));
    expect(endDateSegments.year).toHaveValue(moment().format('YYYY'));

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

  it('should refresh the chart when the date range changes', async () => {
    await applyLogContentsToApp({
      [-7]: basicTestCase.logContents,
      [-1]: realWorldTestCase.logContents,
      0: basicTestCase.logContents
    });
    await renderApp();

    const analyticsPanel = await openAnalytics();
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
    fireEvent.mouseDown(
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
    const closeAnalyticsButton = await findByRole(analyticsPanel, 'button', {
      name: 'Close Analytics'
    });

    await userEvent.click(startDateSegments.month);

    await userEvent.tab({ shift: true });

    expect(closeAnalyticsButton).toHaveFocus();
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
});
