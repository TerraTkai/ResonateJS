resonate
    .inModule('Resonate')
    .createAttribute('class')
    .forExpressions()
    .as(function (attribute) {

        var updateClasses = function (value) {
            attribute.element.className = value;
        };

        if (typeof attribute.class === 'string') {
            attribute.on('update', function () {
                updateClasses(attribute.class);
            });
            updateClasses(attribute.class);
        }
        else {
            var applied = {};
            var count = 0;

            var applyChanges = function (keys) {
                applied = {};
                var classes = '';
                var key = null;
                var value = false;

                for (var i = 0; i < keys.length; i++) {
                    key = keys[i];
                    value = attribute.class[key];
                    if (key.toLowerCase() === 'defaults') {
                        classes += value.replace(/,/g, ' ') +  ' ' + classes;
                    }
                    else {
                        if (value) classes += key + ' ';
                    }
                    applied[key] = value;
                }

                updateClasses(classes);
            };

            var checkForChanges = function () {
                var keys = Object.keys(attribute.class);
                var key = null;

                if (count === keys.length) {
                    for (var i = 0; i < keys.length; i++) {
                        key = keys[i];
                        if (applied[key] !== attribute.class[key]) {
                            applyChanges(keys);
                            break;
                        }
                    }
                }
                else {
                    applyChanges(keys);
                }

                count = keys.length;
            };

            if (!attribute.once) {
                attribute.on('evaluate', checkForChanges);
            }

            checkForChanges();
        }
    });
