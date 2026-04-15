import { collectAnalytics } from './models/analytics-collector.js';

self.onmessage = async (event) => {
  const { requestId, startDate, endDate, preferences } = event.data;
  const categories = await collectAnalytics({
    startDate: startDate,
    endDate: endDate,
    preferences: preferences
  });
  self.postMessage({ requestId: requestId, categories: categories });
};
