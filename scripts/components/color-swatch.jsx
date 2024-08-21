import m from 'mithril';

class ColorSwatchComponent {
  view({ attrs: { preferences, preference, option } }) {
    return (
      <div className="color-swatch">
        <label
          className="color-swatch-swatch"
          htmlFor={`${preference.id}-${option.value}`}
          style={`--color-swatch-swatch-color: var(--color-theme-color-${option.value})`}
        >
          {preferences[preference.id] === option.value ? <div className="color-swatch-swatch-dot" /> : null}
        </label>
      </div>
    );
  }
}

export default ColorSwatchComponent;
