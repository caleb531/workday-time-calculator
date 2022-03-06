import m from 'mithril';
import appStorage from './app-storage.js';

class EditorAutocompleter {

  constructor() {
    this.cancel();
    // Use a web worker to perform the computationally-heavy work of processing
    // terms, which may involve processing thousands of words within the user's
    // log entries
    if (appStorage.usingIDB()) {
      this.worker = new Worker('scripts/web-worker.js');
      this.worker.onmessage = (event) => {
        this.receiveCompletionData(event);
      };
    }
  }

  // If the autocompletions have been recently cancelled, allow completions to
  // appear again once the user starts typing again
  enable() {
    this.isActive = true;
  }

  // Dismiss the current completion suggestion
  cancel() {
    this.isActive = false;
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

  fetchCompletions() {
    if (!this.isActive) {
      return;
    }
    const completionQuery = this.getCompletionQuery();
    if (!completionQuery) {
      // Reset the current completion placeholder if we are at the start of the
      // line, or if a space precedes the text cursor
      this.cancel();
      return;
    }
    if (this.worker) {
      this.worker.postMessage({completionQuery});
    }
  }

  recalculatePosition() {
    const selection = window.getSelection();
    if (selection.type.toLowerCase() === 'none') {
      return;
    }
    const selectionBounds = selection.getRangeAt(0).getBoundingClientRect();
    this.position = {
      top: selectionBounds.top + window.scrollY,
      left: selectionBounds.left + window.scrollX
    };
  }

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

  getCompletionPlaceholder() {
    return this.shouldAutocomplete() ? this.completionPlaceholder : '';
  }

}

export default EditorAutocompleter;
