resonate
    .inModule('Resonate')
    .createAttribute('value')
    .forExpressions()
    .as(function (attribute) {
        var element = attribute.element;
        var elementName = element.tagName.toLowerCase();

        var updateAndRefresh = function () {
            attribute.value = element.value;
            resonate.refresh();
        };

        if (elementName === 'select') {
            attribute.on('render', function () {
                element.value = attribute.value;
                element.on('change', updateAndRefresh);
            });
        }
        else {
            element.value = attribute.value;
            if (elementName === 'textarea' || elementName === 'input') {
                element.on('input', updateAndRefresh);
            }
        }

        attribute.on('update', function () {
            if (element.value !== attribute.value) {
                element.value = attribute.value;
            }
        });
    });