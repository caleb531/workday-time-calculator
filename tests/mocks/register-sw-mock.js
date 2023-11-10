// An mock singleton of the function returned by registerSW() which finishes the
// updating of the service worker
export const updateSWMock = vi.fn();

export default function registerSW(options) {
  options.onNeedRefresh();
  return updateSWMock;
}
