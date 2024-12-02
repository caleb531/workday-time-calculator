import clsx from 'clsx';

class LoadingComponent {
  view({ attrs }) {
    return (
      <span
        aria-label="Loading..."
        {...attrs}
        className={clsx(['loading', attrs.className])}
      >
        <svg viewBox="0 0 24 24">
          <title>Loading...</title>
          <path d="M 3,12 A 6,6 0,0,0 21,12" />
        </svg>
      </span>
    );
  }
}

export default LoadingComponent;
