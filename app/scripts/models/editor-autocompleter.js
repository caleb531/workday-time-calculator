import m from 'mithril';
import appStorage from './app-storage.js';

class EditorAutocompleter {

  constructor({isEnabled} = {}) {
    this.cancel();
    // Use a web worker to perform the computationally-heavy work of processing
    // terms, which may involve processing thousands of words within the user's
    // log entries
    this.setIsEnabled(isEnabled);
  }

  // Evaluates whether or not the autocomplete functionality should be enabled
  setIsEnabled(isEnabled) {
    if (appStorage.usingIDB() && isEnabled) {
      this.isEnabled = true;
      this.worker = new Worker('scripts/autocompletion-worker.js');
      this.worker.onmessage = (event) => {
        this.receiveCompletionData(event);
      };
    } else {
      this.isEnabled = false;
      delete this.worker;
    }
  }

  // Dismiss the current completion suggestion
  cancel() {
    this.isReady = false;
    this.matchingCompletion = '';
    this.completionPlaceholder = '';
  }

  // Since the Quill editor is loaded asynchronously apart from this
  // autocomplete engine, we have a dedicated function to set the editor as
  // soon as it is ready
  setEditor(editor) {
    this.editor = editor;
  }

  // Compute the currently-typed term (can be more than one word) for which to
  // show suggestions of what the user may be typing
  getCompletionQuery() {
    if (!this.editor) {
      return '';
    }
    const editorSelection = this.editor.getSelection();
    // Do not autocomplete anything if multiple characters of text are actually
    // selected
    if (!editorSelection || editorSelection.length > 0) {
      return '';
    }
    const editorText = this.editor.getText();
    // Do not attempt to autocomplete when text cursor is between letters
    if (editorText[editorSelection.index] !== '\n') {
      return '';
    }
    const characters = [];
    for (let i = editorSelection.index - 1; i >= 0; i -= 1) {
      const character = editorText[i];
      // Only search back to the beginning of the line (and let the worker
      // decide which terms on that line are relevant for the autocompletion)
      if (character === '\n') {
        break;
      }
      characters.unshift(character);
    }
    return characters.join('');
  }

  // Receive the top suggestion of the autocompletion that best matches what
  // the user is currently typing, and any other data that may be relevant for
  // that purpose
  receiveCompletionData(event) {
    this.matchingCompletion = event.data.matchingCompletion;
    this.completionPlaceholder = event.data.completionPlaceholder;
    m.redraw();
  }

  // Fetch autocompletion matches for the currently-typed line of text (the
  // query)
  fetchCompletions() {
    const completionQuery = this.getCompletionQuery();
    if (!completionQuery) {
      // Reset the current completion placeholder if we are at the start of the
      // line, or if a space precedes the text cursor
      this.cancel();
      return;
    }
    if (this.worker && this.isEnabled) {
      this.isReady = true;
      this.worker.postMessage({completionQuery});
    }
  }

  // Recalculate the coordinates of the completion placeholder on-screen
  recalculatePosition() {
    const selection = window.getSelection();
    // Do not calculate anything if the text cursor is not active inside the
    // editor
    if (selection.type.toLowerCase() === 'none') {
      return;
    }
    const selectionBounds = selection.getRangeAt(0).getBoundingClientRect();
    this.position = {
      top: selectionBounds.top + window.scrollY,
      left: selectionBounds.left + window.scrollX
    };
  }

  // Return true if the user should be able to autocomplete when pressing the
  // TAB key; this also controls whether or not the completion placeholder will
  // show
  shouldAutocomplete() {
    return Boolean(
      this.position
      &&
      this.position.top
      &&
      this.position.left
      &&
      document.activeElement !== document.body
    );
  }

  // If the user can currently autocomplete something, return the last-fetched
  // placeholder text to indicate that the current text can be autocompleted
  getCompletionPlaceholder() {
    return this.shouldAutocomplete() ? this.completionPlaceholder : '';
  }

}

export default EditorAutocompleter;
