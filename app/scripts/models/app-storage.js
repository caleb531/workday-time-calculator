class AppStorage {

  get(key) {
    return new Promise((resolve) => {
      resolve(JSON.parse(localStorage.getItem(key)));
    });
  }

  set(key, value) {
    return new Promise((resolve) => {
      resolve(localStorage.setItem(key, JSON.stringify(value)));
    });
  }

  keys() {
    return new Promise((resolve) => {
      resolve(Object.keys(localStorage));
    });
  }

  remove(key) {
    return new Promise((resolve) => {
      resolve(localStorage.removeItem(key));
    });
  }

}

export default new AppStorage();
