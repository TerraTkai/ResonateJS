resonate
    .inModule('Resonate')
    .createAttribute('include')
    .toControlContent()
    .with('Content')
    .as(function (attribute, content) {
        var modifiedTemplate = content.createContentTemplate(attribute.template);
        var isIncluded = false;

        var update = function () {
            if (parseBool(attribute.include)) {
                if (!isIncluded) {
                    content.insert(attribute.element, modifiedTemplate, attribute.insertAt.getIndex() + 1);
                    isIncluded = true;
                }
            }
            else {
                if (isIncluded) {
                    content.remove(attribute.element.childNodes[attribute.insertAt.getIndex() + 1]);
                    isIncluded = false;
                }
            }
        };

        attribute.on('update', update);
        update();
    });