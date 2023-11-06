class FileReaderMock {
  readAsText(file) {
    if (this.onload) {
      this.onload({
        target: {
          result: FileReaderMock._fileData
        }
      });
    }
  }
}

export default FileReaderMock;
