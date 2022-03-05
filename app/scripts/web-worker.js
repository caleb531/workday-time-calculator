importScripts('idb-keyval.min.js', 'lodash.min.js');

// Escape all characters that have special meaning in regular expressions
function escapeRegExp(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Process all entered log entries and store the keywords into a string, where
// each line of text is separated by a newline
function processLogEntries() {
  return idbKeyval.entries().then((entries) => {
    return entries
      .filter(([key]) => /^wtc-date-/.test(key))
      /* eslint-disable-next-line no-unused-vars */
      .map(([key, value]) => {
        return value.ops
          .filter((op) => op.insert.trim())
          .map((op) => {
            return op.insert.toLowerCase();
          }).join('\n');
      })
      .join('')
      // Remove certain extraneous special characters from keyword string
      .replace(/[^a-z0-9\-\s\/]/gi, ' ')
      .replace(/ +/gi, ' ');
  });
}

// When the app needs to autocomplete, it sends the web worker a list of all
// words on the current line, up to (but not including) the character
// immediately following the text cursor (e.g. "send email corre"); all of
// these words may not be relevant, but we know that a match based on more
// words is more relevant than a match based on fewer; therefore, we retrieve a
// list of all substring sequences of words in the given query string (e.g. if
// the query is "send email correspondence to", then the resulting array would
// be ["send email correspondence to", "email correspondence to",
// "correspondence to", "correspondence"])
function getQuerySubstrings(query) {
  const queryWords = query.split(' ');
  const substrings = [];
  for (let i = 0; i < queryWords.length; i += 1) {
    substrings.push(queryWords.slice(i).join(' '));
  }
  return substrings;
}

// Convert the above array of query substrings to regular expressions that can
// be used to find matching completions within the keyword string
function convertQuerySubstringsToRegexes(querySubstrings) {
  return querySubstrings.map((querySubstring) => {
    return new RegExp('\\b' + escapeRegExp(querySubstring) + '\\S*\\b', 'gi');
  });
}

// Build list of possible completions given the last few words preceding the
// user's cursor (what we call "the completion query", or simply "the query")
function buildCompletions(keywordStr, query) {
  query = query.toLowerCase();
  const querySubstrings = getQuerySubstrings(query);
  const substringRegexes = convertQuerySubstringsToRegexes(querySubstrings);
  const substringMatchGroups = substringRegexes.map((substringRegex) => {
    return keywordStr.match(substringRegex) || [];
  });
  for (const matchGroup of substringMatchGroups) {
    // Retrieve all phrases in the keyword string that match the given
    // autocomplete query
    const matches = _.chain(matchGroup)
      .countBy()
      .toPairs()
      /* eslint-disable-next-line no-unused-vars */
      .sortBy(([word, count]) => -count)
      .value()
      .map(([word]) => word);
    if (matches.length) {
      console.log(query, '=>', matches);
      return {
        matchingCompletion: matches[0],
        completionPlaceholder: matches[0].replace(query, '')
      };
    }
  }
  return {
    matchingCompletion: '',
    completionPlaceholder: ''
  };
}

// Process log entries as soon as the web worker is initially loaded (before
// any messages are sent/received)
let entriesPromise = processLogEntries();
// Wait for all log entries to be processed before handling messages from the
// main thread
self.onmessage = (event) => {
  return entriesPromise.then((keywordStr) => {
    self.postMessage(buildCompletions(keywordStr, event.data.completionQuery));
  });
};

