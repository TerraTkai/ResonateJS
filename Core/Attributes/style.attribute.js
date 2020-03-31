var keyNames = {};

resonate
    .inModule('Resonate')
    .createAttribute('style')
    .forExpressions()
    .as(function (attribute) {
        if (typeof attribute.style === 'string') {
            var updateStyles = function () {
                var styles = attribute.style.split(';');

                for (var i = 0; i < styles.length; i++) {
                    var parts = styles[i].split(':');
                    if (parts.length === 2) {
                        attribute.element.style[parts[0].trim()] = parts[1].trim();
                    }
                }
            };

            attribute.on('update', updateStyles);
            updateStyles();
        }
        else {
            var applied = {};

            var applyStyles = function () {
                var i = 0;
                var key = null;
                var style = attribute.element.style;
                var defaults = attribute.style.defaults;

                if (defaults) {
                    var styles = defaults.split(';');

                    for (i = 0; i < styles.length; i++) {
                        var parts = styles[i].split(':');
                        if (parts.length === 2 && !attribute.style[parts[0]]) {
                            attribute.style[parts[0]] = parts[1];
                        }
                    }

                    delete attribute.style.defaults;
                }

                var keys = Object.keys(applied);
                for (i = 0; i < keys.length; i++) {
                    key = keys[i];

                    if (!attribute.style.hasOwnProperty(key)) {
                        style[keyNames[key]] = '';
                        delete applied[key];
                    }
                }

                keys = Object.keys(attribute.style);
                for (i = 0; i < keys.length; i++) {
                    key = keys[i];
                    value = attribute.style[key];

                    if (applied[key] !== value) {
                        if (!keyNames[key]) {
                            keyNames[key] = key.toJsName();
                        }

                        style[keyNames[key]] = value;
                        applied[key] = value;
                    }
                }
            };

            if (!attribute.once) {
                attribute.on('evaluate', applyStyles);
            }

            applyStyles();
        }
    });
