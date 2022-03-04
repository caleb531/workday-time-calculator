class appStorage {

  static get(key) {
    return new Promise((resolve) => {
      resolve(JSON.parse(localStorage.getItem(key)));
    });
  }

  static set(key, value) {
    return new Promise((resolve) => {
      resolve(localStorage.setItem(key, JSON.stringify(value)));
    });
  }

  static keys() {
    return new Promise((resolve) => {
      resolve(Object.keys(localStorage));
    });
  }

  static remove(key) {
    return new Promise((resolve) => {
      resolve(localStorage.removeItem(key));
    });
  }

}

export default appStorage;
