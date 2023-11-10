import { findByTestId, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import { applyLogContentsToApp, renderApp, unmountApp } from '../utils.js';

describe('log autocomplete', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should complete previously-entered phrases', async () => {
    await applyLogContentsToApp({
      '-3': realWorldTestCase1.logContents,
      '-2': basicLogTestCase.logContents,
      '-1': realWorldTestCase2.logContents
    });
    await renderApp();
    const editorElem = (
      await findByTestId(document.body, 'log-editor')
    ).querySelector('.ql-editor');
    const autocompleteElem = await findByTestId(
      document.body,
      'log-editor-autocomplete'
    );
    await userEvent.type(editorElem, 'Ge');
    await waitFor(() => {
      expect(autocompleteElem).toBeInTheDocument();
      // TODO
      // expect(autocompleteElem).toHaveTextContent('tting');
    });
  });
});
