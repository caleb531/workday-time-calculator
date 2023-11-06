// The blob-polyfill package's .text() method on Blob objects hangs forever if
// you try to await it, even though this works fine in the browser; therefore,
// we implement our own minimal Blob polyfill
class BlobMock {
  constructor(blobParts, options = { type: '' }) {
    this._blobParts = blobParts;
    this.options = options;
  }
  async text() {
    return this._blobParts.join('');
  }
}
export default BlobMock;
