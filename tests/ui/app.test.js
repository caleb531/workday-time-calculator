import { getByText } from '@testing-library/dom';
import { renderApp, unmountApp } from '../utils.js';

describe('app UI', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should render app', async () => {
    await renderApp();
    expect(
      getByText(document.body, 'Workday Time Calculator')
    ).toBeInTheDocument();
  });
});
