import * as idbKeyval from 'idb-keyval';
import { countBy, sortBy } from 'lodash-es';

// A map representing the various algorithms for the autocomplete; each key
// name is the ID of a specific autocomplete mode, and each value is a function
// which returns a dynamically-constructed regular expression for that mode;
// each callback receives the (regex-escaped) current query substring as a
// parameter
const modeRegexes = {
  lazy: (q) => new RegExp('\\b' + q + '\\S*\\b', 'g'),
  greedy: (q) => new RegExp('\\b' + q + '\\S*( \\S+){0,2}\\b', 'g')
};

// Escape all characters that have special meaning in regular expressions
function escapeRegExp(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Retrieve the current date in YYYY-M-D format (e.g. 2022-3-4)
function getCurrentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Process all entered log entries and store the keywords into a string, where
// each line of text is separated by a newline
async function processLogEntries() {
  const entries = await idbKeyval.entries();
  return (
    entries
      .filter(([key]) => /^wtc-date-/.test(key))
      .map(([, value]) => {
        return value.ops
          .filter((op) => op.insert.trim())
          .map((op) => op.insert)
          .join('\n');
      })
      .join('\n')
      // Collapse consecutive sequences of spaces
      .replace(/ +/gi, ' ')
  );
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
    return modeRegexes[autocompleteMode](escapeRegExp(querySubstring));
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
function buildCompletions({ keywordStr, completionQuery, autocompleteMode }) {
  const querySubstrings = getQuerySubstrings(completionQuery);
  const substringRegexes = convertQuerySubstringsToRegexes(
    querySubstrings,
    autocompleteMode
  );
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
    // autocomplete query; we first map the number of occurrences of each match
    const countPairs = Object.entries(countBy(matchGroup));
    // Then we sort matches from most occurrences to least
    const sortedCountPairs = sortBy(countPairs, ([, count]) => -count);
    // Finally, we discard the count information and just return a list of
    // matching words
    const matches = sortedCountPairs.map(([word]) => word);
    if (matches.length) {
      return {
        matchingCompletion: matches[0],
        completionPlaceholder: getCompletionPlaceholderFromQuery(
          matches[0],
          querySubstring
        )
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
// Keep track of when we last ran an autocomplete search so we can update the
// available autocomplete data as needed (see comment below)
let lastAutocompleteDate = getCurrentDate();
// Wait for all log entries to be processed before handling messages from the
// main thread
self.onmessage = async (event) => {
  // If the user never closes Workday Time Calculator, make sure the available
  // autocomplete data still refreshes itself when the current date changes
  const currentDate = getCurrentDate();
  if (currentDate !== lastAutocompleteDate) {
    lastAutocompleteDate = currentDate;
    entriesPromise = processLogEntries();
  }
  const keywordStr = await entriesPromise;
  self.postMessage(
    buildCompletions({
      keywordStr: keywordStr,
      completionQuery: event.data.completionQuery,
      autocompleteMode: event.data.autocompleteMode
    })
  );
};
