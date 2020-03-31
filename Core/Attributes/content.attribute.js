resonate
    .inModule('Resonate')
    .createAttribute('content')
    .toControlContent()
    .with('Content')
    .as(function (attribute, content) {
        var parent = attribute.element.resonate;

        if (parent.x) {
            var modifiedTemplate = content.createContentTemplate(attribute.template);
            modifiedTemplate.c = parent.x;
            content.insert(attribute.element, modifiedTemplate, attribute.insertAt.getIndex() + 1, parent.p.s);
        }
    });