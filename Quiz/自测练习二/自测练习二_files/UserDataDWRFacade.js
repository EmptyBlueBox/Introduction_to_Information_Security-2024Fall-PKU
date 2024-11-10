
// Provide a default path to dwr.engine
if (dwr == null) var dwr = {};
if (dwr.engine == null) dwr.engine = {};
if (DWREngine == null) var DWREngine = dwr.engine;

if (UserDataDWRFacade == null) var UserDataDWRFacade = {};
UserDataDWRFacade._path = '/webapps/assessment/dwr_open';
UserDataDWRFacade.getStringTempScope = function(p0, callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'getStringTempScope', p0, callback);
}
UserDataDWRFacade.setStringTempScope = function(p0, p1, callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'setStringTempScope', p0, p1, callback);
}
UserDataDWRFacade.removeStringTempScope = function(p0, callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'removeStringTempScope', p0, callback);
}
UserDataDWRFacade.getStringPermScope = function(p0, callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'getStringPermScope', p0, callback);
}
UserDataDWRFacade.setStringPermScope = function(p0, p1, callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'setStringPermScope', p0, p1, callback);
}
UserDataDWRFacade.removeStringPermScope = function(p0, callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'removeStringPermScope', p0, callback);
}
UserDataDWRFacade.initContextFromRequestHeader = function(callback) {
  dwr.engine._execute(UserDataDWRFacade._path, 'UserDataDWRFacade', 'initContextFromRequestHeader', false, callback);
}
