import m from 'mithril';
import { getByText, getAllByText, waitFor } from '@testing-library/dom';
import basicTestCase from './test-cases/basic.json';
import {
  forEachTestCase,
  renderApp,
  unmountApp,
  applyLogContentsToApp,
  formatDuration,
  formatTime
} from './utils.js';

describe('app UI', () => {
  afterEach(async () => {
    await unmountApp();
    localStorage.clear();
  });

  it('should render app', async () => {
    await renderApp();
    expect(
      getByText(document.body, 'Workday Time Calculator')
    ).toBeInTheDocument();
  });

  describe('log summary', () => {
    forEachTestCase((testCase) => {
      it(testCase.description, async () => {
        await applyLogContentsToApp({ 0: testCase.logContents });
        await renderApp();
        await waitFor(() => {
          const summaryElem = document.querySelector('.log-summary');
          if (testCase.assertions.categories) {
            testCase.assertions.categories.forEach((expectedCategory, c) => {
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
            const errorsElem = document.querySelector('.log-errors');
            testCase.assertions.errors.forEach((expectedError, e) => {
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
            const gapsElem = document.querySelector('.log-gaps');
            testCase.assertions.gaps.forEach((expectedGap, e) => {
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
            testCase.assertions.overlaps.forEach((expectedOverlap, e) => {
              const overlapsElem = document.querySelectorAll('.log-overlap')[e];
              expect(
                getByText(overlapsElem, formatTime(expectedOverlap.startTime))
              ).toBeInTheDocument();
              expect(
                getByText(overlapsElem, formatTime(expectedOverlap.endTime))
              ).toBeInTheDocument();
            });
          }
        });
      });
    });
  });
});
