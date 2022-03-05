class StorageUpgrader {

  // Only upgrade the data store format under certain conditions
  shouldUpgrade() {
    return Boolean(
      // The browser must support IndexedDB
      typeof indexedDB !== 'undefined'
      &&
      // The user has not already migrated from localStorage to IndexedDB
      !localStorage.getItem('wtc-idb-enabled')
      &&
      // The user has at least one time log saved in the app
      Object.keys(localStorage).find((key) => /^wtc-/.test(key))
    );
  }

}

export default StorageUpgrader;
