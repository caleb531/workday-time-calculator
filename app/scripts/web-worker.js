importScripts('idb-keyval.min.js');

const logTerms = [];
// TODO: this is just temporary hardcoded data for testing
const completions = [
  'internal',
  'training',
  'brown bag',
  'email correspondence',
];
let entriesPromise;

// Process all entered log entries and store the keywords into an array
function processLogEntries() {
  return idbKeyval.entries().then((entries) => {
    return entries
      .filter(([key]) => /^wtc-date-/.test(key))
      /* eslint-disable-next-line no-unused-vars */
      .reduce((terms, [key, value]) => {
        terms.push(...value.ops
          .filter((op) => op.insert.trim())
          .map((op) => op.insert));
        return terms;
      });
  }).then((terms) => {
    logTerms.push(...terms);
  });
}

// Build list of possible completions given the last few terms preceding the
// user's cursor
function buildCompletions(event) {
  const partialTerm = event.data.partialTerm.trim().toLowerCase();
  const matchingCompletion = completions.find((completion) => {
    return completion.indexOf(partialTerm) === 0;
  });
  if (matchingCompletion) {
    return {
      matchingCompletion: matchingCompletion,
      completionPlaceholder: matchingCompletion.replace(partialTerm, '')
    };
  } else {
    return '';
  }
}

// Process log entries as soon as the web worker is initially loaded (before
// any messages are sent/received)
entriesPromise = processLogEntries();
// Wait for all log entries to be processed before handling messages from the
// main thread
self.onmessage = (event) => {
  return entriesPromise.then(() => {
    self.postMessage(buildCompletions(event));
  });
};

