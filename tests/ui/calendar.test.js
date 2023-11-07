import {
  findByRole,
  findByTestId,
  findByText,
  queryByText,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import { applyLogContentsToApp, renderApp, unmountApp } from '../utils.js';

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
    userEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
    userEvent.click(await getControl());
    await waitFor(() => {
      expect(
        queryByText(document.body, moment().format('MMMM YYYY'))
      ).not.toBeInTheDocument();
    });
  });

  it('should close by clicking overlay', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    userEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
    userEvent.click(
      await findByRole(document.body, 'button', { name: 'Close Calendar' })
    );
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

  it('should select new date', async () => {
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
      (await findByTestId(document.body, 'log-calendar-selected-date'))
        .nextElementSibling
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
  });
});
