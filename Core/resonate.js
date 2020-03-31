var Resonate = function () {
    var self = this;

    self.start = function () {
        doc.write('<style id="rsld">body {visibility:hidden !important;}</style>');
        modules = new Modules(self);
        rendering = new Rendering(self);

        var isReady = function () {
            return new Promise(function (resolve) {
                var loadingCheck = originalSetInterval(function () {
                    if (document.readyState !== 'loading') {
                        if (!win.defer) {
                            addExtensions(rendering.update);
                        }

                        originalClearInterval(loadingCheck);
                        resolve();
                    }
                }, 1);
            });
        };

        var executeInitialize = function () {
            rendering.renderInitial();
            var style = doc.getElementById('rsld');
            style.disabled = true;
            style.parentNode.removeChild(style);
        };

        modules.loadInitial().then(function () {
            isReady().then(function () {
                if (modules.autoMode) {
                    executeInitialize();
                }
            });
        });

        self.initialize = function () {
            isReady().then(executeInitialize);
        };
    };
};

win.resonate = new Resonate();
win.resonate.start();
