import '@testing-library/jest-dom';
import m from 'mithril';
import { getByText } from '@testing-library/dom';
import AppComponent from '../scripts/components/app.js';

describe('app UI', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.appendChild(document.createElement('main'));
    m.mount(document.querySelector('main'), AppComponent);
  });

  afterEach(() => {
    m.mount(document.querySelector('main'), null);
    localStorage.clear();
  });

  it('should render app', () => {
    expect(
      getByText(document.body, 'Workday Time Calculator')
    ).toBeInTheDocument();
  });
});
