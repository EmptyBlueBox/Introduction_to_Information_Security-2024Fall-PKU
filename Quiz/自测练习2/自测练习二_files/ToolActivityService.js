
// Provide a default path to dwr.engine
if (dwr == null) var dwr = {};
if (dwr.engine == null) dwr.engine = {};
if (DWREngine == null) var DWREngine = dwr.engine;

if (ToolActivityService == null) var ToolActivityService = {};
ToolActivityService._path = '/webapps/assessment/dwr_open';
ToolActivityService.getActivityForAllTools = function(p0, callback) {
  dwr.engine._execute(ToolActivityService._path, 'ToolActivityService', 'getActivityForAllTools', p0, callback);
}
ToolActivityService.getActivityForTool = function(p0, callback) {
  dwr.engine._execute(ToolActivityService._path, 'ToolActivityService', 'getActivityForTool', p0, callback);
}
