import idbKeyval from 'idb-keyval';

class AppStorage {

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

  keys() {
    if (this.usingIDB()) {
      return idbKeyval.keys();
    } else {
      return new Promise((resolve) => {
        resolve(Object.keys(localStorage));
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

}

export default new AppStorage();
