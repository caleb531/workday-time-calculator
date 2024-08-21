import m from 'mithril';

class LoadingComponent {
  view({ attrs }) {
    return (
      <div className="loading" aria-label="Loading..." {...attrs}>
        <svg viewBox="0 0 24 24">
          <title>Loading...</title>
          <path d="M 3,12 A 6,6 0,0,0 21,12" />
        </svg>
      </div>
    );
  }
}

export default LoadingComponent;
