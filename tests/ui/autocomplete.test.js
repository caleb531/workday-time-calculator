import { findByTestId, queryByTestId, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import {
  applyLogContentsToApp,
  clickPreferenceOption,
  getEditorElem,
  openPreferences,
  renderApp,
  setPreferences,
  unmountApp
} from '../utils.js';

const autocompleteElemTestId = 'log-editor-has-autocomplete-active';

// Check if the given typed string (called the "completion query") will
// suggest the match represented by the given placeholder string, and also
// check if, on pressing the TAB key, if the app will apply the completion
async function checkIfCompletable(completionQuery, completionPlaceholder) {
  const editorElem = await getEditorElem();
  await userEvent.clear(editorElem);
  await userEvent.type(editorElem, completionQuery);
  const autocompleteElem = await findByTestId(
    document.body,
    autocompleteElemTestId
  );
  // @testing-library/jest-dom provides a toHaveTextContent() matcher, but it
  // doesn't check for an exact match (only a substring match); therefore,
  // because we require an exact match, we use toBe() with the textContent
  // property instead
  expect(autocompleteElem).toHaveAttribute(
    'data-autocomplete',
    completionPlaceholder
  );
}

// Check if autocomplete is properly disabled within the UI
async function checkIfAutocompleteIsDisabled() {
  expect(await getEditorElem()).toBeInTheDocument();
  try {
    expect(
      await findByTestId(document.body, autocompleteElemTestId)
    ).toBeInTheDocument();
  } catch (error) {
    // If the DOM element does not exist after findByTestId() has hit its retry
    // limit, then we consider that a success because it means the autocomplete
    // worker has had a chance to load but won't run because autocomplete is
    // truly disabled
    return;
  }
  // If element exists (e.g. if autocomplete transitions from an enabled to a
  // disabled state), then wait for the element to be removed from the DOM
  await waitFor(() => {
    expect(
      queryByTestId(document.body, autocompleteElemTestId)
    ).not.toBeInTheDocument();
  });
}

describe('log autocomplete', () => {
  beforeEach(async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true
    });
    await applyLogContentsToApp({
      '-3': realWorldTestCase1.logContents,
      '-2': basicLogTestCase.logContents,
      '-1': realWorldTestCase2.logContents
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await unmountApp();
  });

  it('should suggest previously-entered word', async () => {
    await renderApp();
    await checkIfCompletable('Ge', 'tting');
  });

  it('should suggest previously-entered phrase', async () => {
    await renderApp();
    await checkIfCompletable('Getting sta', 'rted');
  });

  it('should suggest previously-entered (complete) phrase', async () => {
    await renderApp();
    await checkIfCompletable('Getting started with my d', 'ay');
  });

  it('should not suggest anything if word is complete and there is no space following', async () => {
    await renderApp();
    await checkIfCompletable('Getting', '');
  });

  it('should suggest if there is a space following a complete word', async () => {
    await renderApp();
    await checkIfCompletable('Getting ', 'started');
  });

  it('should be case-sensitive', async () => {
    await renderApp();
    await checkIfCompletable('re', 'view');
    await checkIfCompletable('Re', 'sponding');
    await checkIfCompletable('wi', 'th');
    await checkIfCompletable('We', 'ekly');
  });

  it('should allow for greedy matching', async () => {
    await setPreferences({ autocompleteMode: 'greedy' });
    await renderApp();
    await checkIfCompletable('Ge', 'tting started with');
    await checkIfCompletable('Getting started with m', 'y day');
  });

  it('should not render when disabled', async () => {
    await setPreferences({ autocompleteMode: 'off' });
    await renderApp();
    await checkIfAutocompleteIsDisabled();
  });

  it('should not render when user disables preference', async () => {
    await renderApp();
    await openPreferences();
    await clickPreferenceOption('Autocomplete Suggestions', 'Disabled');
    await checkIfAutocompleteIsDisabled();
  });

  it('should activate when user enables preference', async () => {
    await setPreferences({ autocompleteMode: 'off' });
    await renderApp();
    await checkIfAutocompleteIsDisabled();
    await openPreferences();
    await clickPreferenceOption('Autocomplete Suggestions', /Lazy/i);
    await checkIfCompletable('Ge', 'tting');
  });
});
