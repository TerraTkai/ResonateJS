var Rendering = function (resonate) {
    var self = this;
    var rootNode = { c: [], a: [], b: [], t: [], e: { e: [], r: [], d: [] } };
    var events = { update: true, evaluate: true, render: true, dispose: true };
    var serviceEvents = { evaluate: true, dispose: true };

    var convertName = function (keyedName) {
        keyedName.s = keyedName.n.toJsName();
    };
    
    var initializeAsset = function (asset, state, scopeState, updateState) {
        var args = [state];

        if (!scopeState) {
            scopeState = rootNode;
        }

        if (asset.services) {
            for (var i = 0; i < asset.services.length; i++) {
                var serviceName = asset.services[i].toLowerCase();
                var service = resonate.services[serviceName];

                if (!service) {
                    throw new Error('Service \'' + asset.services[i] + '\' injected into \'' + asset.name + '\' could not be resolved.');
                }

                var serviceState = {
                    on: function (eventType, handler) {
                        eventType = eventType.toLowerCase();

                        if (serviceEvents[eventType]) {
                            (service.isSingleton ? rootNode : scopeState).e[eventType.charAt(0)].push(handler);
                        }
                    }
                };

                if (serviceName === 'localization') {
                    serviceState.module = asset.module;
                }

                if (service.isSingleton) {
                    if (!service.i) {
                        initializeAsset(service, serviceState, rootNode);
                        service.i = serviceState;
                    }

                    args.push(service.i);
                }
                else {
                    initializeAsset(service, serviceState, scopeState);
                    args.push(serviceState);
                }
            }
        }

        if (state.element) {
            state.on = function (eventType, handler) {
                eventType = eventType.toLowerCase();

                if (events[eventType]) {
                    var eventShortcut = eventType.charAt(0);

                    if (eventShortcut === 'u') {
                        if(updateState) updateState.u = handler;
                    }
                    else {
                        scopeState.e[eventShortcut].push(handler);
                    }
                }
            };

            state.on.module = asset.module;
            state.raiseEvent = state.element.raiseEvent;
        }

        asset.initialize.apply(resonate, args);
    };

    var applyNormalAttribute = function (attribute, childElement, stateNode) {
        if (!attribute.k.x || (attribute.k.x.expressionsOnly && !attribute.e)) {
            if (attribute.e) {
                var initialValue = attribute.e(stateNode.s);
                var attributeState = { e: childElement, v: initialValue, n: attribute, p: stateNode };

                if (!attribute.e.o) {
                    stateNode.a.push(attributeState);
                }

                childElement.setAttribute(attribute.k.n, initialValue);
            }
            else {
                childElement.setAttribute(attribute.k.n, attribute.v);
            }
        }
    };

    var createHandler = function (action, state) {
        return function (event) { action(state, event); self.update(); };
    };

    var setRendered = function (renderedState) {
        for (var i = 0; i < renderedState.e.r.length; i++) {
            renderedState.e.r[i]();
        }
    };

    var render = function (targetElement, template, stateNode, index) {
        var i = 0;
        var j = 0;
        var textNode = null;
        var attribute = null;
        var attributeState = null;
        var initialValue = null;
        var updateState = null;
        var childState = null;

        for (i = 0; i < template.c.length; i++) {            
            var childNode = template.c[i];
            if (template.c[i].k) {
                if (childNode.a.length > 0 && childNode.a[0].k.x && childNode.a[0].k.x.controlsContent) {
                    attribute = childNode.a[0];
                    var comment = doc.createComment('');
                    var beforeLength = targetElement.childNodes.length;
                    targetElement.insertAt(comment, index);
                    var contentState = { element: targetElement, insertAt: comment, template: childNode.k.x ? childNode.k.x.template : childNode, current: attribute };

                    if (!attribute.k.s) {
                        convertName(attribute.k);
                    }

                    if (attribute.e) {
                        initialValue = attribute.e(stateNode.s);
                        updateState = { s: { s: contentState, p: stateNode }, e: attribute.e, k: attribute.k, v:initialValue };

                        if (!attribute.e.o) {
                            stateNode.b.push(updateState);
                        }

                        contentState[attribute.k.s] = initialValue;
                    }
                    else {
                        contentState[attribute.k.s] = attribute.v;
                    }

                    initializeAsset(attribute.k.x, contentState, stateNode, updateState);
                    index += targetElement.childNodes.length - beforeLength;
                    continue;
                }

                var childElement = doc.createElement(childNode.k.n);
                targetElement.insertAt(childElement, index);

                for (j = 0; j < childNode.e.length; j++) {
                    var eventHandler = childNode.e[j];
                    childElement.addEventListener(eventHandler.k.n, createHandler(eventHandler.e, stateNode.s));
                }

                if (childNode.k.x) {
                    if (!childNode.k.x.template) {
                        childNode.k.x.template = { k: childNode.k, a: [], e: [], c: [] };
                        childNode.k.x.expressions = [];
                    }

                    expressions.parseAll(childNode.k.x.expressions);
                    childState = { c: [], a: [], b: [], t: [], p: stateNode, s: { element: childElement }, e: { e: [], r: [], d: [] } };

                    if (childNode.k.x.at && setViewState) {
                        setViewState(childState.s);
                    }

                    childElement.resonate = childState;

                    for (j = 0; j < childNode.a.length; j++) {
                        attribute = childNode.a[j];

                        if (!attribute.k.s) {
                            convertName(attribute.k);
                        }

                        if (attribute.k.u || (attribute.e && !attribute.e.b)) {
                            applyNormalAttribute(attribute, childElement, stateNode);
                        }
                        else if (attribute.e) {
                            initialValue = attribute.e(stateNode.s);

                            if (!attribute.e.o) {
                                childState.b.push({ e: attribute.e, v: initialValue, k: attribute.k });
                            }

                            childState.s[attribute.k.s] = attribute.e(stateNode.s);
                        }
                        else {
                            childState.s[attribute.k.s] = attribute.v;
                        }
                    }
                }
                else {
                    childElement.resonate = stateNode;

                    for (j = 0; j < childNode.a.length; j++) {
                        applyNormalAttribute(childNode.a[j], childElement, stateNode);
                    }
                }

                for (j = 0; j < childNode.a.length; j++) {
                    attribute = childNode.a[j];

                    if (!attribute.k.s) {
                        convertName(attribute.k);
                    }

                    if (attribute.k.x && !(attribute.k.x.expressionsOnly && !attribute.e)) {
                        attributeState = { element: childElement };

                        if (attribute.e) {
                            initialValue = attribute.e(stateNode.s);
                            updateState = { e: childElement, v: initialValue, n: attribute, p: stateNode, s: attributeState };

                            if (attribute.e.o) {
                                attributeState.once = true;
                            }
                            else {
                                stateNode.a.push(updateState);
                            }

                            attributeState[attribute.k.s] = initialValue;
                        }
                        else {
                            updateState = null;
                            attributeState[attribute.k.s] = attribute.v;
                        }

                        initializeAsset(attribute.k.x, attributeState, stateNode, updateState);
                    }
                }

                if (childNode.k.x) {
                    initializeAsset(childNode.k.x, childState.s, childState, childState);
                    stateNode.c.push(childState);

                    if (childNode.k.x.type === 1 && childNode.c.length > 0) {
                        childState.x = childNode.c;
                    }

                    render(childElement, childNode.k.x.template, childState, 0);
                    setRendered(childState);
                }
                else {
                    render(childElement, childNode, stateNode, 0);
                }
            }
            else {
                if (childNode.e) {
                    initialValue = childNode.e(stateNode.s);
                    textNode = doc.createTextNode(initialValue);
                    var textState = { t: textNode, v: initialValue, n: childNode, p: stateNode };
                    textNode.resonate = textState;

                    if (!childNode.e.o) {
                        stateNode.t.push(textState);
                    }
                }
                else {
                    textNode = doc.createTextNode(childNode.v);
                }

                targetElement.insertAt(textNode, index);
            }

            index++;
        }
    };

    var bindOutward = function (node) {
        var i = 0;
        var boundState = null;

        for (i = 0; i < node.c.length; i++) {
            bindOutward(node.c[i]);
        }

        for (i = 0; i < node.b.length; i++) {
            current = node.b[i];

            if (current.e.i) {
                boundState = current.s ? current.s : node;
                var targetState = current.k.x || !node.p.s ? node.s : node.p.s;

                if (current.v !== boundState.s[current.k.s]) {
                    current.e.i(targetState, boundState.s[current.k.s]);
                    current.v = boundState.s[current.k.s];
                }
            }
        }

        for (i = 0; i < node.a.length; i++) {
            current = node.a[i];
            if (current.s && current.n.e.i) {
                if (current.v !== current.s[current.n.k.s]) {
                    current.n.e.i(node.s, current.s[current.n.k.s]);
                    current.v = current.s[current.n.k.s];
                }
            }
        }
    };

    self.update = function (node) {
        if (!node) {
            node = rootNode;
            bindOutward(node);
        }

        var i = 0;
        var current = null;
        var value = null;
        var updated = false;
        var boundState = null;

        for (i = 0; i < node.b.length; i++) {
            current = node.b[i];
            boundState = current.s ? current.s : node;
            value = current.e(boundState.p.s);

            if (current.v !== value) {
                boundState.s[current.k.s] = value;
                current.v = value;
                updated = true;

                if (current.u) {
                    current.u();
                }
            }
        }

        for (i = 0; i < node.t.length; i++) {
            current = node.t[i];
            value = current.n.e(node.s);

            if (value !== current.v) {
                current.t.nodeValue = value;
                current.v = value;
            }
        }

        for (i = 0; i < node.a.length; i++) {
            current = node.a[i];
            value = current.n.e(node.s);

            if (value !== current.v) {
                current.v = value;

                if (current.s) {
                    current.s[current.n.k.s] = value;
                }
                else {
                    current.e.setAttribute(current.n.k.n, value);
                }

                if (current.u) {
                    current.u();
                }
            }
        }

        for (i = 0; i < node.e.e.length; i++) {
            node.e.e[i]();
        }

        for (i = 0; i < node.c.length; i++) {
            self.update(node.c[i]);
        }

        if (updated && node.u) {
            node.u();
        }
    };

    self.renderInitial = function () {
        var bodyExpressions = [];
        var appTemplate = dynamicModule.parseNode(doc.body, bodyExpressions);

        expressions.parseAll(bodyExpressions);
        doc.body.empty();

        if (resonate.components['@body']) {
            rootNode.s = { element: doc.body };
            initializeAsset(resonate.components['@body'], rootNode.s, rootNode, rootNode);
        }

        render(doc.body, appTemplate, rootNode, 0);
        setRendered(rootNode);
        self.update();
    };

    self.createService = function (serviceName, module) {
        var service = null;
        initializeAsset({ name: 'dynamic:' + serviceName, module: module, services: [serviceName], initialize: function (s, e) { service = e; } }, {});
        return service;
    };

    self.render = render;
    self.setRendered = setRendered;
    resonate.refresh = self.update;
};