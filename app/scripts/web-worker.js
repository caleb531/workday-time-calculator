importScripts('idb-keyval.min.js');

const logTerms = [];
let termsPromise;

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

function log(event) {
  if (event.data.trigger) {
    termsPromise.then(() => {
      self.postMessage({
        completions: logTerms
      });
    });
  } else {
    self.postMessage(false);
  }
}

termsPromise = processLogEntries();
self.onmessage = log;

