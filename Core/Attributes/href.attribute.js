resonate
    .inModule('Resonate')
    .createAttribute('href')
    .with('Routing')
    .as(function (attribute, routing) {
        var element = attribute.element;
        var location = attribute.href.replace(/~/g, '');

        if (attribute.href.indexOf('~') === 0) {
            attribute.element.on('click', function (event) {
                event.stopPropagation();
                event.preventDefault();
                routing.changeRoute(location);
                return false;
            });
        }

        element.setAttribute('href', location);
    });