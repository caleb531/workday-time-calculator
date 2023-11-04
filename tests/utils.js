const testCases = import.meta.glob('./test-cases/*.json', {
  as: 'json',
  eager: true
});

// Expose a helper function that allows for any series of assertions to be run
// against each and every test case file
export function forEachTestCase(...args) {
  return Object.values(testCases).forEach(...args);
}
