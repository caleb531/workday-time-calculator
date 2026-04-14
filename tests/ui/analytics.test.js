import {
  findByDisplayValue,
  findByLabelText,
  findByRole,
  findByTestId,
  waitFor,
  fireEvent
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
  return description === 'should instantiate a log using the 24-hour time system';
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

    expect(
      await findByDisplayValue(
        analyticsPanel,
        moment().subtract(7, 'days').format('YYYY-MM-DD')
      )
    ).toBeInTheDocument();
    expect(
      await findByDisplayValue(analyticsPanel, moment().format('YYYY-MM-DD'))
    ).toBeInTheDocument();

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
    const startDateInput = await findByLabelText(analyticsPanel, 'Start Date');

    fireEvent.input(startDateInput, {
      target: { value: moment().subtract(1, 'days').format('YYYY-MM-DD') }
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