import {
  getAllByText,
  getByText,
  queryByTestId,
  waitFor
} from '@testing-library/dom';
import {
  applyLogContentsToApp,
  formatDuration,
  formatTime,
  renderApp,
  setPreferences,
  testCases,
  unmountApp
} from '../utils.js';

describe('log summary', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it.each(testCases)('var(--description)', async (testCase) => {
    if (testCase.preferences) {
      await setPreferences(testCase.preferences);
    }
    await applyLogContentsToApp({ 0: testCase.logContents });
    await renderApp();
    await waitFor(() => {
      const summaryElem = queryByTestId(document.body, 'log-summary');
      if (testCase.assertions.categories) {
        testCase.assertions.categories.forEach((expectedCategory) => {
          if (expectedCategory.name) {
            expect(
              getByText(summaryElem, `${expectedCategory.name}:`)
            ).toBeInTheDocument();
          }
          if (expectedCategory.descriptions) {
            expectedCategory.descriptions.forEach((description) => {
              expect(
                getByText(summaryElem, `- ${description}`)
              ).toBeInTheDocument();
            });
          }
          if (expectedCategory.totalDuration && expectedCategory.name) {
            expect(
              getByText(
                getByText(summaryElem, `${expectedCategory.name}:`)
                  .parentElement,
                formatDuration(expectedCategory.totalDuration)
              )
            ).toBeInTheDocument();
          }
        });
      }

      if (testCase.assertions.errors) {
        const errorsElem = queryByTestId(document.body, 'log-errors');
        testCase.assertions.errors.forEach((expectedError) => {
          if (expectedError.startTime === expectedError.endTime) {
            expect(
              getAllByText(errorsElem, formatTime(expectedError.startTime))
            ).toHaveLength(2);
          } else {
            expect(
              getByText(errorsElem, formatTime(expectedError.startTime))
            ).toBeInTheDocument();
            expect(
              getByText(errorsElem, formatTime(expectedError.endTime))
            ).toBeInTheDocument();
          }
        });
      }

      if (testCase.assertions.gaps) {
        const gapsElem = queryByTestId(document.body, 'log-gaps');
        testCase.assertions.gaps.forEach((expectedGap) => {
          if (expectedGap.startTime === expectedGap.endTime) {
            expect(
              getAllByText(gapsElem, formatTime(expectedGap.startTime))
            ).toHaveLength(2);
          } else {
            expect(
              getByText(gapsElem, formatTime(expectedGap.startTime))
            ).toBeInTheDocument();
            expect(
              getByText(gapsElem, formatTime(expectedGap.endTime))
            ).toBeInTheDocument();
          }
        });
      }
      if (testCase.assertions.overlaps) {
        const overlapsElem = queryByTestId(document.body, 'log-overlap-times');
        testCase.assertions.overlaps.forEach((expectedOverlap, e) => {
          const overlapElem = overlapsElem.children[e];
          expect(
            getByText(overlapElem, formatTime(expectedOverlap.startTime))
          ).toBeInTheDocument();
          expect(
            getByText(overlapElem, formatTime(expectedOverlap.endTime))
          ).toBeInTheDocument();
        });
      }
    });
  });
});
