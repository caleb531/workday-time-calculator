import { findByRole, findByText } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import { applyLogContentsToApp, renderApp, unmountApp } from '../utils.js';

describe('log date selector', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should switch to previous date', async () => {
    await applyLogContentsToApp({
      '-1': realWorldTestCase1.logContents,
      0: basicLogTestCase.logContents,
      1: realWorldTestCase2.logContents
    });
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Go To Previous Day' });
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
      await findByText(
        document.body,
        moment().subtract(1, 'day').format('dddd, MMMM D, YYYY')
      )
    ).toBeInTheDocument();
    // Check if real world log contents #1 are populated into editor
    expect(
      await findByText(
        document.body,
        realWorldTestCase1.assertions.categories[1].descriptions[0]
      )
    ).toBeInTheDocument();
  });

  it('should switch to next date', async () => {
    await applyLogContentsToApp({
      '-1': realWorldTestCase1.logContents,
      0: basicLogTestCase.logContents,
      1: realWorldTestCase2.logContents
    });
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Go To Next Day' });
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
