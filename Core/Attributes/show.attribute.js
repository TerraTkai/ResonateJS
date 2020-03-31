resonate
    .inModule('Resonate')
    .createAttribute('show')
    .as(function (attribute) {
        var update = function () {
            attribute.element.style.display = parseBool(attribute.show) ? '' : 'none';
        };

        attribute.on('update', update);
        update();
    });