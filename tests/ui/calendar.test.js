import {
  findByRole,
  findByText,
  fireEvent,
  queryByText,
  waitFor
} from '@testing-library/dom';
import moment from 'moment';
import { renderApp, unmountApp } from '../utils.js';

describe('log calendar', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    fireEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
  });
  it('should close by clicking Calendar control again', async () => {
    await renderApp();
    const getControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Calendar' });
    expect(await getControl()).toBeInTheDocument();
    fireEvent.click(await getControl());
    expect(
      await findByText(document.body, moment().format('MMMM YYYY'))
    ).toBeInTheDocument();
    fireEvent.click(await getControl());
    await waitFor(() => {
      expect(
        queryByText(document.body, moment().format('MMMM YYYY'))
      ).not.toBeInTheDocument();
    });
  });
});
