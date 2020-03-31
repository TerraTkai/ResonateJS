resonate
    .inModule('Resonate')
    .createAttribute('checked')
    .forExpressions()
    .as(function (attribute) {
        var element = attribute.element;
        var elementName = element.tagName.toLowerCase();

        var updateAndRefresh = function () {
            attribute.checked = element.checked;

            if (element.type.toLowerCase() === 'radio' && element.name) {
                var all = doc.getElementsByName(element.name);
                for (var i = 0; i < all.length; i++) {
                    if (all[i].type.toLowerCase() === 'radio' && all[i] !== element) {
                        var otherAttributes = all[i].resonate.a;
                        for (var j = 0; j < otherAttributes.length; j++) {
                            var otherAttribute = otherAttributes[j];
                            if (otherAttribute.e === all[i]) {
                                otherAttribute.s.checked = false;
                            }
                        }
                    }
                }
            }
            resonate.refresh();
        };

        if (elementName === 'input') {
            element.on('change', updateAndRefresh);
        }

        element.checked = attribute.checked;

        attribute.on('update', function () {
            if (element.checked !== attribute.checked) {
                element.checked = attribute.checked;
            }
        });
    });