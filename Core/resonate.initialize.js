(function (win) {
    var doc = win.document;
    var originalSetInterval = win.setInterval;
    var originalSetTimeout = win.setTimeout;
    var originalClearInterval = win.clearInterval;
    var originalClearTimeout = win.clearTimeout;
    var parseTarget = doc.createElement('template');
    var trackedElements = {};
    var trackedAttributes = { 'class': { n: 'class', u: true }, 'style': { n: 'style', u: true }, 'id': { n: 'id', u: true } };
    var modules = null;
    var routing = 'hashes';
    var rendering = null;
    var setViewState = null;
    var setViewComponent = null;
    var localizer = null;
    var appPath = '';
    var dynamicModule = null;
