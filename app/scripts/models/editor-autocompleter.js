class EditorAutocompleter {

  constructor() {
    this.cancel();
    // TODO: replace the following (hardcoded) completions list with an
    // instantiation of a Worker; the worker should automatically compute the
    // list of available completions before the user tries to autocomplete
    // anything
    this.completions = [
      'internal',
      'training',
      'brown bag',
      'email correspondence'
    ];
  }

  enable() {
    this.isActive = true;
  }

  cancel() {
    this.isActive = false;
  }

  setEditor(editor) {
    this.editor = editor;
  }

  getPartialTerm() {
    const editorSelection = this.editor.getSelection();
    if (!editorSelection || editorSelection.length > 0) {
      return '';
    }
    const editorText = this.editor.getText();
    const characters = [];
    for (let i = editorSelection.index - 1; i >= 0; i -= 1) {
      const character = editorText[i];
      if (character === ' ' || character === '\n') {
        break;
      }
      characters.unshift(editorText[i]);
    }
    return characters.join('');
  }

  getCompletionPlaceholder() {
    if (!this.isActive) {
      return '';
    }
    const partialTerm = this.getPartialTerm().toLowerCase();
    if (!partialTerm) {
      return '';
    }
    // TODO: the following code should be moved to a Worker, and a postMessage
    // call should replace the following code
    const matchingCompletion = this.completions.find((completion) => {
      return completion.indexOf(partialTerm) === 0;
    });
    if (matchingCompletion) {
      return matchingCompletion.replace(partialTerm, '');
    } else {
      return '';
    }
  }

}

export default EditorAutocompleter;
