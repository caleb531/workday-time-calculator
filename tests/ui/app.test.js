import m from 'mithril';
import { getByText, getAllByText, waitFor } from '@testing-library/dom';
import {
  forEachTestCase,
  renderApp,
  unmountApp,
  applyLogContentsToApp,
  formatDuration,
  formatTime
} from '../utils.js';

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
});
