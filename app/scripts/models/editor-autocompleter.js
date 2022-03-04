class EditorAutocompleter {

  constructor() {
    this.isActive = false;
    this.completions = [
      'internal',
      'training',
      'brown bag',
      'email correspondence'
    ];
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
      if (character === '\n') {
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
