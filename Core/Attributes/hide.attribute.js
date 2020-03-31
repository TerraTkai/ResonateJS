resonate
    .inModule('Resonate')
    .createAttribute('hide')
    .as(function (attribute) {
        var update = function () {
            attribute.element.style.display = parseBool(attribute.hide) ? 'none' : '';
        };

        attribute.on('update', update);
        update();
    });