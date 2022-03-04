import m from 'mithril';

class EditorAutocomplete {

  oninit({attrs: {editor}}) {
    this.editor = editor;
    this.completions = [
      'internal',
      'training',
      'brown bag',
      'email correspondence'
    ];
  }

  onbeforeupdate(_, {dom}) {
    this.recalculatePosition(dom);
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
    const partialTerm = this.getPartialTerm().toLowerCase();
    const matchingCompletion = this.completions.find((completion) => {
      return completion.indexOf(partialTerm) === 0;
    });
    console.log(matchingCompletion);
    if (matchingCompletion) {
      return matchingCompletion.replace(partialTerm, '');
    } else {
      return '';
    }
  }

  recalculatePosition() {
    const selection = window.getSelection();
    if (selection.type.toLowerCase() === 'none') {
      return;
    }
    const selectionBounds = selection.getRangeAt(0).getBoundingClientRect();
    this.position = {
      top: selectionBounds.top,
      left: selectionBounds.left
    };
  }

  shouldShow() {
    return (
      this.position
      &&
      this.position.top
      &&
      this.position.left
      &&
      document.activeElement !== document.body
    );
  }

  view() {
    return m('div.log-editor-autocomplete', {
      class: this.shouldShow() ? 'is-visible' : '',
      style: this.shouldShow() ? {
        top: `${this.position.top}px`,
        left: `${this.position.left}px`
      } : null
    }, [
      m('div', this.getCompletionPlaceholder())
    ]);
  }

}

export default EditorAutocomplete;
