resonate
    .inModule('Resonate')
    .createAttribute('foreach')
    .toControlContent()
    .with('Content')
    .as(function (attribute, content) {
        var itemName = attribute.current.e.v;
        if (!itemName) throw new Error('The foreach expression was invalid. It should be structured like foreach="{itemName in itemsArray}".');

        var itemTemplate = content.createContentTemplate(attribute.template);
        var tracking = null;
        var element = attribute.element;
        var existing = null;
        var cleanup = null;
        var indexes = null;
        var deleted = null;
        var item = null;
        var items = [];
        var itemElements = [];
        var indexOffset = 0;
        var i = 0;
        var insertAt = attribute.insertAt;

        var evaluateValues = function () {
            var values = [];
            for (i = 0; i < itemElements.length; i++) {
                values.push(itemElements[i].resonate.s[itemName]);
            }

            return values;
        };

        var createItem = function (item, index, position) {
            var state = Object.create(element.resonate.s);
            state[itemName] = item;
            state['$index'] = index;
            content.insert(element, itemTemplate, position, state);
            item = element.childNodes[position];
            itemElements.push(item);
            return item;
        };

        var update = function () {
            existing = itemElements;
            indexOffset = insertAt.getIndex();
            items = attribute.foreach;
            cleanup = [];

            if (tracking) {
                tracking.cancel();
            }

            for (i = 0; i < existing.length; i++) {
                content.remove(existing[i], true);
                cleanup.push(existing[i]);
            }

            existing = null;
            itemElements = [];
            tracking = items.track(evaluateValues);

            for (i = 0; i < items.length; i++) {
                createItem(items[i], i, i + indexOffset + 1);
            }

            content.cleanup(cleanup);
        };

        var evaluate = function () {
            if (tracking) {
                var changes = tracking.changes(itemElements, itemName);

                if (changes) {
                    indexOffset = insertAt.getIndex();
                    indexes = changes.indexes;
                    deleted = changes.deleted;
                    existing = itemElements;
                    itemElements = [];
                    cleanup = [];

                    var offset = 0;
                    var existingIndex = 0;
                    var lastAdded = insertAt;

                    for (i = 0; i < deleted.length; i++) {
                        item = existing[deleted[i]];
                        content.remove(item, true);
                        cleanup.push(item);
                    }

                    for (i = 0; i < indexes.length; i++) {
                        existingIndex = indexes[i];

                        item = existing[existingIndex];

                        if (existingIndex < 0 || !item) {
                            lastAdded = createItem(items[i], i, indexOffset + i + 1);
                            offset--;
                        }
                        else {
                            if (existingIndex - i - offset !== 0 && item !== lastAdded.nextSibling) {
                                lastAdded = element.insertBefore(item, lastAdded.nextSibling);
                            }
                            else {
                                var find = lastAdded.nextSibling;
                                while (find && find !== item) {
                                    var temp = find.nextSibling;
                                    element.removeChild(find);
                                    find = temp;
                                }

                                lastAdded = item;
                            }

                            item.resonate.s['$index'] = i;
                            existing[existingIndex] = null;
                            itemElements.push(item);
                        }
                    }

                    content.cleanup(cleanup);
                    existing = null;
                    deleted = null;
                    indexes = null;
                    item = null;
                }
            }
        };

        if (!attribute.once) {
            attribute.on('evaluate', evaluate);
        }

        attribute.on('update', update);
        update();
    });