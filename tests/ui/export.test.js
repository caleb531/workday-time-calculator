import {
  findByRole,
  findByText,
  fireEvent,
  waitFor
} from '@testing-library/dom';
import { fromPairs } from 'lodash-es';
import moment from 'moment';
import Preferences from '../../scripts/models/preferences.js';
import {
  applyLogContentsToApp,
  mapTestCases,
  renderApp,
  unmountApp
} from '../utils.js';

describe('export functionality', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should export', async () => {
    await applyLogContentsToApp(
      // Build an object where the value is a log contents object and the key is
      // a relative date as an integer (representing how many dates from the
      // current date this log entry is)
      fromPairs(
        mapTestCases((testCase, i, testCases) => {
          return [i - Math.floor(testCases.length / 2), testCase.logContents];
        })
      )
    );
    await renderApp();
    const getToolsControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
    const getExportMenuItem = () => findByText(document.body, 'Export All');
    expect(await getToolsControl()).toBeInTheDocument();
    fireEvent.click(await getToolsControl());
    expect(await getExportMenuItem()).toBeInTheDocument();
    let exportedBlob;
    vi.spyOn(URL, 'createObjectURL').mockImplementationOnce((blob) => {
      exportedBlob = blob;
      // Doesn't matter what this value is
      return '';
    });
    fireEvent.click(await getExportMenuItem());
    await waitFor(() => {
      expect(exportedBlob).toBeDefined();
    });
    expect(JSON.parse(await exportedBlob.text())).toEqual({
      logs: fromPairs(
        mapTestCases((testCase, i, testCases) => {
          const daysDiff = i - Math.floor(testCases.length / 2);
          return [
            moment().add(daysDiff, 'days').format('l'),
            testCase.logContents
          ];
        })
      ),
      preferences: Preferences.getDefaultValueMap()
    });
  });
});
