importScripts('idb-keyval.min.js', 'lodash.min.js');

// A map of regular expressions for the different autocomplete modes
const regexes = {
  lazy: /\b{{querySubstring}}\S*\b/,
  greedy: /\b{{querySubstring}}\S*( \S+){0,4}\b/
};

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
          .map((op) => op.insert)
          .join('\n');
      })
      .join('\n')
      // Collapse consecutive sequences of spaces
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
  return queryWords.map((queryWord, i) => {
    return queryWords.slice(i).join(' ');
  });
}

// Convert the above array of query substrings to regular expressions that can
// be used to find matching completions within the keyword string
function convertQuerySubstringsToRegexes(querySubstrings, autocompleteMode) {
  return querySubstrings.map((querySubstring) => {
    return new RegExp(
      regexes[autocompleteMode].source
        .replace(/{{querySubstring}}/gi, querySubstring),
      regexes[autocompleteMode].flags
    );
  });
}

// Given a completion, subtract of the start of the completion (which should be
// the same as the given query substring) and return the remaining part of the
// string; the removal should ignore case so that the case of the original
// completion is preserved
function getCompletionPlaceholderFromQuery(completion, query) {
  const substringReplacementRegex = new RegExp(escapeRegExp(query), 'i');
  return completion.replace(substringReplacementRegex, '');
}

// Build list of possible completions given the last few words preceding the
// user's cursor (what we call "the completion query", or simply "the query")
function buildCompletions({keywordStr, completionQuery, autocompleteMode}) {
  const querySubstrings = getQuerySubstrings(completionQuery);
  const substringRegexes = convertQuerySubstringsToRegexes(querySubstrings, autocompleteMode);
  const substringMatchGroups = substringRegexes.map((substringRegex) => {
    return keywordStr.match(substringRegex) || [];
  });
  // We use a 'for' loop so we can short-circuit and return a proper result
  // object as soon as we find a matching completion; we do this as opposed to
  // using something like Array.prototype.find() so we can not only
  // short-circuit, but also transform the value at the same time without
  // having to re-process the matches
  for (let i = 0; i < substringMatchGroups.length; i += 1) {
    const matchGroup = substringMatchGroups[i];
    const querySubstring = querySubstrings[i];
    // Retrieve all phrases in the keyword string that match the given
    // autocomplete query
    const matches = _.chain(matchGroup)
      // Map the number of occurrences of each match
      .countBy()
      .toPairs()
      // Sort matches from most occurrences to least
      /* eslint-disable-next-line no-unused-vars */
      .sortBy(([word, count]) => -count)
      .value()
      .map(([word]) => word);
    if (matches.length) {
      // TODO: remove this when we are ready to bring autocomplete live
      console.log(completionQuery, '=>', matches);
      return {
        matchingCompletion: matches[0],
        completionPlaceholder: getCompletionPlaceholderFromQuery(matches[0], querySubstring)
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
    self.postMessage(buildCompletions({
      keywordStr: keywordStr,
      completionQuery: event.data.completionQuery,
      autocompleteMode: event.data.autocompleteMode
    }));
  });
};

