import {
  fireEvent,
  getByRole,
  getByText,
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
      getByRole(document.body, 'button', { name: 'Toggle Calendar' });
    await waitFor(() => {
      expect(getControl()).toBeInTheDocument();
    });
    fireEvent.click(getControl());
    await waitFor(() => {
      expect(
        getByText(document.body, moment().format('MMMM YYYY'))
      ).toBeInTheDocument();
    });
  });
  it('should close by clicking Calendar control again', async () => {
    await renderApp();
    const getControl = () =>
      getByRole(document.body, 'button', { name: 'Toggle Calendar' });
    await waitFor(() => {
      expect(getControl()).toBeInTheDocument();
    });
    fireEvent.click(getControl());
    await waitFor(() => {
      expect(
        getByText(document.body, moment().format('MMMM YYYY'))
      ).toBeInTheDocument();
    });
    fireEvent.click(getControl());
    await waitFor(() => {
      expect(
        queryByText(document.body, moment().format('MMMM YYYY'))
      ).not.toBeInTheDocument();
    });
  });
});
