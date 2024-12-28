
// Provide a default path to dwr.engine
if (dwr == null) var dwr = {};
if (dwr.engine == null) dwr.engine = {};
if (DWREngine == null) var DWREngine = dwr.engine;

if (MashupDWRFacade == null) var MashupDWRFacade = {};
MashupDWRFacade._path = '/webapps/assessment/dwr_open';
MashupDWRFacade.verifyMashupData = function(p0, callback) {
  dwr.engine._execute(MashupDWRFacade._path, 'MashupDWRFacade', 'verifyMashupData', p0, callback);
}
MashupDWRFacade.filterMashupData = function(p0, callback) {
  dwr.engine._execute(MashupDWRFacade._path, 'MashupDWRFacade', 'filterMashupData', p0, callback);
}
MashupDWRFacade.initContextFromRequestHeader = function(callback) {
  dwr.engine._execute(MashupDWRFacade._path, 'MashupDWRFacade', 'initContextFromRequestHeader', false, callback);
}
