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
import moment from 'moment';
import {
  applyLogContentsToApp,
  renderApp,
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

describe('analytics panel', () => {
  afterEach(async () => {
    await unmountApp();
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

  it('should refresh the chart when start date is typed manually', async () => {
    await applyLogContentsToApp({
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

    fireEvent.input(startDateSegments.day, {
      target: { value: moment().subtract(1, 'days').format('DD') }
    });
    fireEvent.blur(startDateSegments.day);

    const analyticsSummary = await findByTestId(
      analyticsPanel,
      'analytics-chart-summary'
    );

    await waitFor(() => {
      expect(analyticsSummary).toHaveTextContent('Internal: 5:00');
      expect(analyticsSummary).not.toHaveTextContent('Internal: 8:45');
    });
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
