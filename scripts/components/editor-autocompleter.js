import m from 'mithril';

class EditorAutocompleterComponent {
  oninit({ attrs: { editorContainer, autocompleter } }) {
    this.editorContainer = editorContainer;
    this.autocompleter = autocompleter;
  }

  // The view() method relies on the calculated position of the placeholder, so
  // so need to calculate/recalculate these coordinates *before* rendering
  onbeforeupdate() {
    this.recalculatePosition();
  }

  // Return true if the user should be able to autocomplete when pressing the
  // TAB key
  shouldAutocomplete() {
    return document.activeElement !== document.body && this.position;
  }

  // Recalculate the coordinates of the completion placeholder on-screen
  recalculatePosition() {
    const selection = window.getSelection();
    // Do not calculate anything if the text cursor is not active inside the
    // editor, or if the parent element has not been set yet
    if (selection.type.toLowerCase() === 'none' || !this.editorContainer) {
      return;
    }
    const selectionBounds = selection.getRangeAt(0).getBoundingClientRect();
    this.position = {
      top:
        selectionBounds.top + window.scrollY - this.editorContainer.offsetTop,
      left:
        selectionBounds.left + window.scrollX - this.editorContainer.offsetLeft
    };
  }

  view() {
    return m(
      'div.log-editor-autocomplete-placeholder[data-testid="log-editor-autocomplete-placeholder"]',
      {
        class: this.shouldAutocomplete() ? 'is-visible' : '',
        style: this.shouldAutocomplete()
          ? {
              top: `${this.position.top}px`,
              left: `${this.position.left}px`
            }
          : null
      },
      this.autocompleter.getCompletionPlaceholder()
    );
  }
}

export default EditorAutocompleterComponent;
