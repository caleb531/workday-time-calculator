import * as idbKeyval from 'idb-keyval';

class StorageUpgrader {
  // Only upgrade the data store format under certain conditions
  shouldUpgrade() {
    return Boolean(
      // The browser must support IndexedDB
      typeof indexedDB !== 'undefined' &&
        // The user has at least one time log saved in the app
        Object.keys(localStorage).find((key) => /^wtc-/.test(key))
    );
  }

  upgrade() {
    // Only process localStorage keys that start with wtc-*
    const appKeys = Object.keys(localStorage).filter((key) =>
      /^wtc-/.test(key)
    );
    return Promise.all(
      appKeys.map((key) => {
        return idbKeyval.set(key, JSON.parse(localStorage.getItem(key)));
      })
    ).then(function (setStatus) {
      if (setStatus.length === appKeys.length) {
        // Delete WTC localStorage keys if indexedDB migration was successful
        appKeys.forEach((key) => localStorage.removeItem(key));
        window.location.reload();
      } else {
        console.log('error while upgrading storage');
      }
    });
  }
}

export default StorageUpgrader;
