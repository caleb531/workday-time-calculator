const NotificationMock = vi.fn();
Object.assign(NotificationMock, {
  _grantWhenRequested() {
    this._pendingPermission = 'granted';
  },
  _denyWhenRequested() {
    this._pendingPermission = 'denied';
  },
  _resetPermissions() {
    this.permission = 'default';
  },
  _resetConstructorCalls() {
    this._constructorSpy.mockClear();
  },
  requestPermission(callback) {
    this.permission = this._pendingPermission;
    callback();
  },
  permission: 'default',
  // The Notification.permission value to set when notification permissions are
  // requested; this allows us to test both granting and denying permission to
  // display notifications
  _pendingPermission: 'granted'
});

export default NotificationMock;
