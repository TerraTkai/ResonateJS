resonate
    .inModule('Resonate')
    .createAttribute('exclude')
    .toControlContent()
    .with('Content')
    .as(function (attribute, content) {
        var modifiedTemplate = content.createContentTemplate(attribute.template);
        var isExcluded = true;

        var update = function () {
            if (parseBool(attribute.exclude)) {
                if (!isExcluded) {
                    content.remove(attribute.element.childNodes[attribute.insertAt.getIndex() + 1]);
                    isExcluded = true;
                }
            }
            else {
                if (isExcluded) {
                    content.insert(attribute.element, modifiedTemplate, attribute.insertAt.getIndex() + 1);
                    isExcluded = false;
                }
            }
        };

        attribute.on('update', update);
        update();
    });