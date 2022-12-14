import m from 'mithril';

class ColorSwatchComponent {
  view({ attrs: { preferences, preference, option } }) {
    return m('div.color-swatch', [
      m(
        `label.color-swatch-swatch.color-theme-${option.value}`,
        {
          for: `${preference.id}-${option.value}`
        },
        preferences[preference.id] === option.value
          ? m('div.color-swatch-swatch-dot')
          : null
      )
    ]);
  }
}

export default ColorSwatchComponent;
