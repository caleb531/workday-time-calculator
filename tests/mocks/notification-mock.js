class NotificationMock {
  static _grantWhenRequested() {
    NotificationMock._pendingPermission = 'granted';
  }
  static _denyWhenRequested() {
    NotificationMock._pendingPermission = 'denied';
  }
  static _resetPermissions() {
    NotificationMock.permission = 'default';
  }
  static requestPermission(callback) {
    this.permission = NotificationMock._pendingPermission;
    callback();
  }
}
NotificationMock.permission = 'default';
// The Notification.permission value to set when notification permissions are
// requested; this allows us to test both granting and denying permission to
// display notifications
NotificationMock._pendingPermission = 'granted';

export default NotificationMock;
