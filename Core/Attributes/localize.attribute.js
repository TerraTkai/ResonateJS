var setupLocalize = function (attribute, update) {
    attribute.on('render', function () {
        try {
            attribute.module = attribute.element.resonate.s.on.module;
        }
        catch (e) {
            // Ignore
        }
        if (!attribute.module) attribute.module = resonate.modules['resonate'];
        update();
    });

    localizer.subscribers.push(update);

    attribute.on('update', update);
    attribute.on('dispose', function () {
        localizer.subscribers.remove(update);
    });
};

resonate
    .inModule('Resonate')
    .createAttribute('localize')
    .as(function (attribute) {
        var node = null;

        setupLocalize(attribute, function () {
            var key = attribute.localize;
            var value = attribute.module.localization[key];

            if (!value) {
                value = key;
            }

            if (node) {
                node.nodeValue = value;
            }
            else {
                node = doc.createTextNode(value);
                attribute.element.appendChild(node);
            }
        });
    });

resonate
    .inModule('Resonate')
    .createAttribute('localize-html')
    .as(function (attribute) {
        setupLocalize(attribute, function () {
            var key = attribute.localizeHtml;
            var value = attribute.module.localization[key];
            attribute.element.innerHTML = value ? value : key;
        });
    });

resonate
    .inModule('Resonate')
    .createAttribute('localize-title')
    .as(function (attribute) {
        setupLocalize(attribute, function () {
            var key = attribute.localizeTitle;
            var value = attribute.module.localization[key];
            attribute.element.title = value ? value : key;
        });
    });

resonate
    .inModule('Resonate')
    .createAttribute('localize-placeholder')
    .as(function (attribute) {
        setupLocalize(attribute, function () {
            var key = attribute.localizePlaceholder;
            var value = attribute.module.localization[key];
            attribute.element.placeholder = value ? value : key;
        });
    });