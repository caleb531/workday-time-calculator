import idbKeyval from 'idb-keyval';

class AppStorage {

  // Only use IndexedDB if the browser supports it and if the user has opted to
  // upgrade the data store to IndexedDB
  usingIDB() {
    return typeof indexedDB !== 'undefined' && localStorage.getItem('wtc-idb-enabled') === 'true';
  }

  get(key) {
    if (this.usingIDB()) {
      return idbKeyval.get(key);
    } else {
      return new Promise((resolve) => {
        resolve(JSON.parse(localStorage.getItem(key)));
      });
    }
  }

  set(key, value) {
    if (this.usingIDB()) {
      return idbKeyval.set(key, value);
    } else {
      return new Promise((resolve) => {
        resolve(localStorage.setItem(key, JSON.stringify(value)));
      });
    }
  }

  remove(key) {
    if (this.usingIDB()) {
      return idbKeyval.del(key);
    } else {
      return new Promise((resolve) => {
        resolve(localStorage.removeItem(key));
      });
    }
  }

  keys() {
    if (this.usingIDB()) {
      return idbKeyval.keys();
    } else {
      return new Promise((resolve) => {
        resolve(Object.keys(localStorage));
      });
    }
  }

}

export default new AppStorage();
