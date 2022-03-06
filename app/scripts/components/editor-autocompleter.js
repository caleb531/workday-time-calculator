import m from 'mithril';

class EditorAutocompleterComponent {

  oninit({attrs: {autocompleter}}) {
    this.autocompleter = autocompleter;
  }

  onbeforeupdate(_, {dom}) {
    this.autocompleter.recalculatePosition(dom);
  }

  view() {
    return m('div.log-editor-autocomplete', {
      class: this.autocompleter.shouldAutocomplete() ? 'is-visible' : '',
      style: this.autocompleter.shouldAutocomplete() ? {
        top: `${this.autocompleter.position.top}px`,
        left: `${this.autocompleter.position.left}px`
      } : null
    }, this.autocompleter.getCompletionPlaceholder());
  }

}

export default EditorAutocompleterComponent;
