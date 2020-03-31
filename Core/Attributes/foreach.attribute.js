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

        var createItem = function (item, index, position) {
            var state = Object.create(element.resonate.s);
            state[itemName] = item;
            state['$index'] = index;
            content.insert(element, itemTemplate, position + 1, state);
            itemElements.push(element.childNodes[position + 1]);
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

            itemElements = [];
            tracking = items.track();

            for (i = 0; i < items.length; i++) {
                createItem(items[i], i, i + indexOffset);
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

                    var offset = 0;
                    for (i = 0; i < indexes.length; i++) {
                        var position = offset + i;

                        if (indexes[i] === -2) {
                            item = existing[i];
                            content.remove(item, true);
                            cleanup.push(item);
                            offset++;
                        }

                        if (indexes[i] < 0) {
                            createItem(items[i], i, position + indexOffset);
                            offset--;
                        }
                        else if (indexes[i] >= position) {
                            for (var j = position; j < indexes[i]; j++) {
                                var parent = existing[j].parentElement;
                                if (parent) parent.removeChild(existing[j]);
                                offset++;
                            }

                            item = existing[indexes[i]];
                            item.resonate.s['$index'] = i;
                            itemElements.push(item);
                        }
                        else {
                            item = existing[indexes[i]];
                            item.resonate.s['$index'] = i;
                            element.insertAt(item, i + indexOffset + 1);
                            itemElements.push(item);
                            offset--;
                        }
                    }

                    cleanup = [];
                    for (i = 0; i < deleted.length; i++) {
                        item = existing[deleted[i]];
                        content.remove(item, true);
                        cleanup.push(item);
                    }

                    content.cleanup(cleanup);
                }
            }
        };

        if (!attribute.once) {
            attribute.on('evaluate', evaluate);
        }

        attribute.on('update', update);
        update();
    });