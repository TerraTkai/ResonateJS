resonate
    .inModule('Resonate')
    .createAttribute('html')
    .as(function (attribute) {
        var update = function () {
            attribute.element.innerHTML = attribute.html;
        };

        attribute.on('update', update);
        update();
    });