import m from 'mithril';
import { getByText, waitFor } from '@testing-library/dom';
import basicTestCase from './test-cases/basic.json';
import { renderApp, unmountApp, applyLogContentsToApp } from './utils.js';
import preview from 'jest-preview';

describe('app UI', () => {
  afterEach(async () => {
    await unmountApp();
    localStorage.clear();
  });

  it('should render app', async () => {
    await renderApp();
    expect(
      getByText(document.body, 'Workday Time Calculator')
    ).toBeInTheDocument();
  });

  it('should render log contents into app', async () => {
    await applyLogContentsToApp({ 0: basicTestCase.logContents });
    await renderApp();
    await waitFor(() => {
      expect(getByText(document.body, 'Internal')).toBeInTheDocument();
    });
  });
});
