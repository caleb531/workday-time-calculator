import {
  findByRole,
  findByTestId,
  findByText,
  queryByTestId,
  queryByText,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import appStorage from '../../scripts/models/app-storage.js';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import {
  applyLogContentsToApp,
  describeWithIndexedDBDisabled,
  getEditorElem,
  renderApp,
  unmountApp
} from '../utils.js';

describe('log calendar', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    userEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
  });

  it('should close by clicking Calendar control again', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    await userEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
    await userEvent.click(await getControl());
    await waitFor(() => {
      expect(
        queryByText(document.body, moment().format('MMMM YYYY'))
      ).not.toBeInTheDocument();
    });
    expect(await getEditorElem()).toHaveFocus();
  });

  it('should close by clicking outside calendar', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    userEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
    userEvent.click(await findByText(document.body, 'Workday Time Calculator'));
    await waitFor(() => {
      expect(
        queryByText(document.body, moment().format('MMMM YYYY'))
      ).not.toBeInTheDocument();
    });
  });

  it('should view previous month', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    userEvent.click(await getControl());
    userEvent.click(
      await findByRole(document.body, 'button', { name: 'Previous Month' })
    );
    expect(
      await findByText(
        document.body,
        moment().startOf('month').subtract(1, 'month').format('MMMM YYYY')
      )
    ).toBeInTheDocument();
  });

  it('should view next month', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    userEvent.click(await getControl());
    userEvent.click(
      await findByRole(document.body, 'button', { name: 'Next Month' })
    );
    expect(
      await findByText(
        document.body,
        moment().startOf('month').add(1, 'month').format('MMMM YYYY')
      )
    ).toBeInTheDocument();
  });

  it('should select new date on single-click (without closing calendar)', async () => {
    await applyLogContentsToApp({
      '-1': realWorldTestCase1.logContents,
      0: basicLogTestCase.logContents,
      1: realWorldTestCase2.logContents
    });
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    // Check if basic log contents are populated into editor
    expect(
      await findByText(
        document.body,
        basicLogTestCase.assertions.categories[0].descriptions[1]
      )
    ).toBeInTheDocument();
    userEvent.click(await getControl());
    expect(
      await findByTestId(document.body, 'log-calendar-dates')
    ).toBeInTheDocument();
    userEvent.click(
      document.querySelector(
        `[data-date="${moment().add(1, 'day').format('l')}"]`
      )
    );
    expect(
      await findByText(
        document.body,
        moment().add(1, 'day').format('dddd, MMMM D, YYYY')
      )
    ).toBeInTheDocument();
    // Check if real world log contents #2 are populated into editor
    expect(
      await findByText(
        document.body,
        realWorldTestCase2.assertions.categories[1].descriptions[0]
      )
    ).toBeInTheDocument();
    expect(
      await findByTestId(document.body, 'log-calendar-dates')
    ).toBeInTheDocument();
  });

  it('should select new date (and close calendar) on double-click', async () => {
    await applyLogContentsToApp({
      '-1': realWorldTestCase1.logContents,
      0: basicLogTestCase.logContents,
      1: realWorldTestCase2.logContents
    });
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    // Check if basic log contents are populated into editor
    expect(
      await findByText(
        document.body,
        basicLogTestCase.assertions.categories[0].descriptions[1]
      )
    ).toBeInTheDocument();
    userEvent.click(await getControl());
    expect(
      await findByTestId(document.body, 'log-calendar-dates')
    ).toBeInTheDocument();
    userEvent.dblClick(
      document.querySelector(
        `[data-date="${moment().add(1, 'day').format('l')}"]`
      )
    );
    expect(
      await findByText(
        document.body,
        moment().add(1, 'day').format('dddd, MMMM D, YYYY')
      )
    ).toBeInTheDocument();
    // Check if real world log contents #2 are populated into editor
    expect(
      await findByText(
        document.body,
        realWorldTestCase2.assertions.categories[1].descriptions[0]
      )
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        queryByTestId(document.body, 'log-calendar-dates')
      ).not.toBeInTheDocument();
    });
    expect(await getEditorElem()).toHaveFocus();
  });
  // Two full Tab traversals repeat DOM and computed-style checks for every date;
  // allow slower CI runners time to finish without raising other tests' timeouts
  it('should tab through every date in both directions and focus the editor on Escape', async () => {
    await applyLogContentsToApp({ 0: basicLogTestCase.logContents });
    await renderApp();
    // The toggle owns the nonmodal popup
    const toggle = await findByRole(document.body, 'button', {
      name: 'Toggle Calendar'
    });
    await userEvent.click(toggle);
    // Opening still focuses the selected date before native Tab navigation
    const selected = await findByTestId(
      document.body,
      'log-calendar-selected-date'
    );
    await waitFor(() => expect(selected).toHaveFocus());
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(selected.closest('[role="dialog"]')).toHaveAttribute(
      'id',
      toggle.getAttribute('aria-controls')
    );
    // Every visible date participates in native Tab order, including empty dates
    const dates = Array.from(document.querySelectorAll('.log-calendar-date'));
    dates[0].focus();
    for (const date of dates.slice(1)) {
      await userEvent.tab();
      expect(date).toHaveFocus();
    }
    await userEvent.tab();
    expect(selected.closest('[role="dialog"]')).not.toContainElement(
      document.activeElement
    );
    await userEvent.tab({ shift: true });
    expect(dates.at(-1)).toHaveFocus();
    for (const date of dates.slice(0, -1).reverse()) {
      await userEvent.tab({ shift: true });
      expect(date).toHaveFocus();
    }
    await userEvent.tab({ shift: true });
    expect(
      await findByRole(document.body, 'button', { name: 'Next Month' })
    ).toHaveFocus();
    expect(selected).toHaveAttribute(
      'data-testid',
      'log-calendar-selected-date'
    );
    selected.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(queryByTestId(document.body, 'log-calendar-dates')).toBeNull()
    );
    expect(await getEditorElem()).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }, 15000);

  it.each(['{Enter}', ' '])(
    'should navigate without loading and select with %s without losing focus',
    async (key) => {
      await applyLogContentsToApp({
        0: basicLogTestCase.logContents,
        1: realWorldTestCase2.logContents
      });
      await renderApp();
      // The populated editor establishes that initial loading is complete
      const editor = await getEditorElem();
      await waitFor(() =>
        expect(editor).toHaveTextContent(
          basicLogTestCase.assertions.categories[0].descriptions[1]
        )
      );
      await userEvent.click(
        await findByRole(document.body, 'button', { name: 'Toggle Calendar' })
      );
      await findByTestId(document.body, 'log-calendar-selected-date');
      await userEvent.keyboard('{ArrowRight}');
      // Navigation changes focus but leaves the selected log intact
      const tomorrow = await findByRole(document.body, 'button', {
        name: `${moment().add(1, 'day').format('dddd, MMMM D, YYYY')}, has log`
      });
      await waitFor(() => expect(tomorrow).toHaveFocus());
      expect(editor).toHaveTextContent(
        basicLogTestCase.assertions.categories[0].descriptions[1]
      );
      expect(
        await findByTestId(document.body, 'log-calendar-selected-date')
      ).not.toBe(tomorrow);
      await userEvent.keyboard(key);
      await waitFor(() =>
        expect(editor).toHaveTextContent(
          realWorldTestCase2.assertions.categories[1].descriptions[0]
        )
      );
      expect(tomorrow).toHaveFocus();
      expect(tomorrow).toHaveAttribute(
        'data-testid',
        'log-calendar-selected-date'
      );
    }
  );

  it.each([
    ['2024-01-31', '{PageDown}', '2024-02-29'],
    ['2025-01-31', '{PageDown}', '2025-02-28'],
    ['2024-03-31', '{PageUp}', '2024-02-29'],
    ['2024-02-29', '{Shift>}{PageDown}{/Shift}', '2025-02-28'],
    ['2026-01-01', '{ArrowLeft}', '2025-12-31'],
    ['2025-12-31', '{ArrowRight}', '2026-01-01'],
    ['2026-01-01', '{ArrowUp}', '2025-12-25'],
    ['2025-12-31', '{ArrowDown}', '2026-01-07'],
    ['2026-01-01', '{Home}', '2025-12-28'],
    ['2025-12-31', '{End}', '2026-01-03']
  ])(
    'should move from %s with %s to %s without selecting',
    async (start, key, end) => {
      vi.setSystemTime(new Date(`${start}T10:00:00`));
      try {
        await renderApp();
        await userEvent.click(
          await findByRole(document.body, 'button', { name: 'Toggle Calendar' })
        );
        await findByTestId(document.body, 'log-calendar-selected-date');
        await userEvent.keyboard(key);
        await waitFor(() =>
          expect(document.activeElement).toHaveAttribute(
            'data-date',
            moment(end).format('l')
          )
        );
        expect(
          document.querySelector('.log-selected-date-absolute')
        ).toHaveTextContent(moment(start).format('dddd, MMMM D, YYYY'));
      } finally {
        vi.useRealTimers();
      }
    }
  );

  it('should keep month controls focused and tab to the first visible date', async () => {
    await renderApp();
    await userEvent.click(
      await findByRole(document.body, 'button', { name: 'Toggle Calendar' })
    );
    // The next-month control must remain focused after changing the view
    const next = await findByRole(document.body, 'button', {
      name: 'Next Month'
    });
    await userEvent.click(next);
    await waitFor(() =>
      expect(document.querySelector('[role="grid"]')).toHaveAttribute(
        'aria-label',
        moment().add(1, 'month').format('MMMM YYYY')
      )
    );
    expect(next).toHaveFocus();
    await userEvent.tab();
    expect(document.querySelector('.log-calendar-date')).toHaveFocus();
  });

  it('should keep the selected trailing date focused when its month becomes visible', async () => {
    await renderApp();
    await userEvent.click(
      await findByRole(document.body, 'button', { name: 'Toggle Calendar' })
    );
    await findByTestId(document.body, 'log-calendar-selected-date');
    // The first day of next month always appears in the trailing week
    const nextMonth = moment().add(1, 'month').startOf('month');
    await userEvent.click(
      document.querySelector(`[data-date="${nextMonth.format('l')}"]`)
    );
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute(
        'data-date',
        nextMonth.format('l')
      )
    );
    expect(document.activeElement).toHaveAttribute(
      'data-testid',
      'log-calendar-selected-date'
    );
  });

  it('should preserve the focus of an outside control when dismissing', async () => {
    await renderApp();
    await userEvent.click(
      await findByRole(document.body, 'button', { name: 'Toggle Calendar' })
    );
    await findByTestId(document.body, 'log-calendar-dates');
    // Opening another control dismisses the popup without moving focus to the editor
    const tools = await findByRole(document.body, 'button', {
      name: 'Toggle Tools Menu'
    });
    await userEvent.click(tools);
    await waitFor(() =>
      expect(queryByTestId(document.body, 'log-calendar-dates')).toBeNull()
    );
    await waitFor(() => expect(tools).toHaveFocus());
  });

  // Exercise the same saved-key contract through both supported storage backends
  function testIndicators() {
    it('should read keys once per opening and refresh indicators after saving and deleting', async () => {
      await renderApp();
      await getEditorElem();
      // Only calendar reads are counted after startup finishes
      const keys = vi.spyOn(appStorage, 'keys');
      const get = vi.spyOn(appStorage, 'get');
      const toggle = await findByRole(document.body, 'button', {
        name: 'Toggle Calendar'
      });
      await userEvent.click(toggle);
      await findByTestId(document.body, 'log-calendar-selected-date');
      expect(keys).toHaveBeenCalledTimes(1);
      // Membership depends only on keys, even if contents are empty
      await appStorage.set(`wtc-date-${moment().format('l')}`, { ops: [] });
      await userEvent.keyboard('{ArrowRight}{ArrowLeft}');
      expect(keys).toHaveBeenCalledTimes(1);
      expect(get).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(queryByTestId(document.body, 'log-calendar-dates')).toBeNull()
      );
      await userEvent.click(toggle);
      await waitFor(() =>
        expect(
          document.querySelector('.log-calendar-date.is-selected')
        ).toHaveAccessibleName(
          `${moment().format('dddd, MMMM D, YYYY')}, has log`
        )
      );
      expect(keys).toHaveBeenCalledTimes(2);
      await appStorage.remove(`wtc-date-${moment().format('l')}`);
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(queryByTestId(document.body, 'log-calendar-dates')).toBeNull()
      );
      await userEvent.click(toggle);
      await waitFor(() =>
        expect(
          document.querySelector('.log-calendar-date.is-selected')
        ).toHaveAccessibleName(moment().format('dddd, MMMM D, YYYY'))
      );
      expect(keys).toHaveBeenCalledTimes(3);
      expect(get).not.toHaveBeenCalled();
    });
  }
  testIndicators();
  describeWithIndexedDBDisabled('localStorage indicators', testIndicators);

  it('should allow keyboard navigation while keys are pending or fail', async () => {
    await renderApp();
    // A failed key-list request must not prevent the popup from receiving focus
    vi.spyOn(appStorage, 'keys').mockRejectedValue(
      new Error('Storage unavailable')
    );
    await userEvent.click(
      await findByRole(document.body, 'button', { name: 'Toggle Calendar' })
    );
    await findByTestId(document.body, 'log-calendar-selected-date');
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute(
        'data-date',
        moment().add(1, 'day').format('l')
      )
    );
  });
});
