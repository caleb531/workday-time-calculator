import m from 'mithril';

class EditorAutocompleterComponent {

  oninit({attrs: {autocompleter}}) {
    this.autocompleter = autocompleter;
  }

  onbeforeupdate(_, {dom}) {
    this.recalculatePosition(dom);
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
    }, this.autocompleter.getCompletionPlaceholder());
  }

}

export default EditorAutocompleterComponent;
