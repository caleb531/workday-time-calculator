import {
  findByLabelText,
  findByRole,
  findByTestId,
  fireEvent,
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

    const startDateControl = await findByRole(analyticsPanel, 'textbox', {
      name: 'Start Date'
    });
    const endDateControl = await findByRole(analyticsPanel, 'textbox', {
      name: 'End Date'
    });

    expect(startDateControl).toHaveValue(
      moment().subtract(7, 'days').format('MM/DD/YYYY')
    );
    expect(endDateControl).toHaveValue(moment().format('MM/DD/YYYY'));

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
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');

    fireEvent.input(startDateInput, {
      target: { value: moment().subtract(1, 'days').format('MM/DD/YYYY') }
    });

    const analyticsSummary = await findByTestId(
      analyticsPanel,
      'analytics-chart-summary'
    );

    await waitFor(() => {
      expect(analyticsSummary).toHaveTextContent('Internal: 5:00');
      expect(analyticsSummary).not.toHaveTextContent('Internal: 8:45');
    });
  });

  it('should not open calendar when date input receives focus', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');

    await userEvent.click(startDateInput);

    expect(queryByTestId(document.body, 'log-calendar-dates')).toBeNull();
  });

  it('should support keyboard month navigation in date input', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');

    await userEvent.click(startDateInput);
    fireEvent.keyDown(startDateInput, { key: 'Home' });
    fireEvent.keyDown(startDateInput, { key: 'ArrowUp' });

    await waitFor(() => {
      expect(startDateInput).toHaveValue(
        moment().subtract(7, 'days').add(1, 'month').format('MM/DD/YYYY')
      );
    });
  });

  it('should use Tab to move between date segments before leaving the field', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');

    await userEvent.click(startDateInput);
    fireEvent.keyDown(startDateInput, { key: 'Home' });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(0);
      expect(startDateInput.selectionEnd).toBe(2);
    });

    fireEvent.keyDown(startDateInput, { key: 'Tab' });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(3);
      expect(startDateInput.selectionEnd).toBe(5);
    });

    fireEvent.keyDown(startDateInput, { key: 'Tab' });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(6);
      expect(startDateInput.selectionEnd).toBe(10);
    });
  });

  it('should use Shift+Tab to move backward between date segments', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');

    await userEvent.click(startDateInput);
    fireEvent.keyDown(startDateInput, { key: 'End' });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(6);
      expect(startDateInput.selectionEnd).toBe(10);
    });

    fireEvent.keyDown(startDateInput, { key: 'Tab', shiftKey: true });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(3);
      expect(startDateInput.selectionEnd).toBe(5);
    });

    fireEvent.keyDown(startDateInput, { key: 'Tab', shiftKey: true });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(0);
      expect(startDateInput.selectionEnd).toBe(2);
    });
  });

  it('should allow Tab to leave the date input after the last segment', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');
    const startDateCalendarToggle = await findByRole(analyticsPanel, 'button', {
      name: 'Open Start Date Calendar'
    });
    const endDateInput = await findByLabelText(analyticsPanel, 'End Date');

    await userEvent.click(startDateInput);
    fireEvent.keyDown(startDateInput, { key: 'End' });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(6);
      expect(startDateInput.selectionEnd).toBe(10);
    });

    await userEvent.tab();

    expect(startDateCalendarToggle).toHaveFocus();

    await userEvent.tab();

    expect(endDateInput).toHaveFocus();
  });

  it('should allow Shift+Tab to leave the date input before the first segment', async () => {
    await renderApp();

    const analyticsPanel = await openAnalytics();
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');
    const closeAnalyticsButton = await findByRole(analyticsPanel, 'button', {
      name: 'Close Analytics'
    });

    await userEvent.click(startDateInput);
    fireEvent.keyDown(startDateInput, { key: 'Home' });
    await waitFor(() => {
      expect(startDateInput.selectionStart).toBe(0);
      expect(startDateInput.selectionEnd).toBe(2);
    });

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
