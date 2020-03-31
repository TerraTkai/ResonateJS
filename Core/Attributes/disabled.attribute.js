resonate
    .inModule('Resonate')
    .createAttribute('disabled')
    .forExpressions()
    .as(function (attribute) {
        var element = attribute.element;

        var update = function () {
            if (attribute.disabled) {
                element.setAttribute('disabled', '');
            }
            else {
                element.removeAttribute('disabled');
            }
        };

        attribute.on('update', update);
        update();
    });