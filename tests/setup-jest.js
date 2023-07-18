import '@testing-library/jest-dom';
import m from 'mithril';
import moment from 'moment';
import quill from 'quill';
import idbKeyval from 'idb-keyval';
import _ from 'lodash';
import clipboard from 'clipboard';
import SWUpdateManager from 'sw-update-manager';
import AppComponent from '../scripts/components/app';
import {waitFor} from '@testing-library/dom';

// Dependencies
global.m = m;
global.moment = moment;
global.Quill = quill;
global.idbKeyval = idbKeyval;
global._ = _;
global.clipboard = clipboard;
global.SWUpdateManager = SWUpdateManager;

// Browser APIs that must be mocked, either because jsdom doesn't support them,
// or for some other reason
global.document.execCommand = jest.fn();


// Test fixtures
beforeEach(async () => {
  localStorage.clear();
  document.body.appendChild(document.createElement('main'));
  m.mount(document.querySelector('main'), AppComponent);
  await waitFor(() => {
    expect(document.querySelector('.ql-container')).toBeInTheDocument();
  });
});
afterEach(() => {
  m.mount(document.querySelector('main'), null);
  localStorage.clear();
  jest.resetAllMocks();
});
