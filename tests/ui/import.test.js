import {
  findByLabelText,
  findByRole,
  fireEvent,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import * as idbKeyval from 'idb-keyval';
import { fromPairs } from 'lodash-es';
import moment from 'moment';
import { mapTestCases, renderApp, unmountApp } from '../utils.js';

import FileReaderMock from '../mocks/file-reader-mock.js';

describe('import functionality', () => {
  afterEach(async () => {
    await unmountApp();
  });

  const exportedData = {
    logs: fromPairs(
      mapTestCases((testCase, i, testCases) => {
        const daysDiff = i - Math.floor(testCases.length / 2);
        return [
          moment().add(daysDiff, 'days').format('l'),
          testCase.logContents
        ];
      })
    ),
    preferences: {
      colorTheme: 'green',
      reminderInterval: 15,
      autocompleteMode: 'greedy',
      timeSystem: '24-hour',
      categorySortOrder: 'title'
    }
  };

  it('should import', async () => {
    await renderApp();
    expect(await idbKeyval.keys()).toHaveLength(0);
    const getToolsControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
    expect(await getToolsControl()).toBeInTheDocument();
    userEvent.click(await getToolsControl());
    const fileContents = JSON.stringify(exportedData);
    FileReaderMock._fileData = fileContents;
    fireEvent.change(await findByLabelText(document.body, 'Import'), {
      target: { files: [new File([fileContents], 'wtc-logs.json')] }
    });
    await waitFor(async () => {
      expect(window.location.reload).toHaveBeenCalled();
      Object.values(exportedData.logs).forEach(async (logContents, i, logs) => {
        const daysDiff = i - Math.floor(logs.length / 2);
        const dateStr = moment().add(daysDiff, 'days').format('l');
        expect(await idbKeyval.get(`wtc-date-${dateStr}`)).toEqual(logContents);
      });
      expect(await idbKeyval.get('wtc-prefs')).toEqual(
        exportedData.preferences
      );
    });
  });
});
