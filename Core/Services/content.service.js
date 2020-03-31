resonate
    .inModule('Resonate')
    .createService('Content')
    .asSingleton(function (service) {

        var cleanElement = function (element) {
            delete element.resonate;

            while (element.childNodes.length > 0) {
                var childElement = element.childNodes[0];
                cleanElement(childElement);
                element.removeChild(childElement);
            }
        };

        var cleanObject = function (obj) {
            var keys = Object.keys(obj);

            for (var i = 0; i < keys.length; i++) {
                obj[keys[i]] = null;
                delete obj[keys[i]];
            }
        };

        var cleanState = function (state, containerState) {
            var i = 0;

            for (i = 0; i < state.e.d.length; i++) {
                state.e.d[i]();
            }

            for (i = 0; i < state.c.length; i++) {
                cleanState(state.c[i], containerState);
            }

            var arrays = [state.c, state.a, state.b, state.t, state.e.e, state.e.r, state.e.d];

            for (i = 0; i < arrays.length; i++) {
                arrays[i].removeAll();
            }

            if (state.s !== containerState.s) {
                cleanObject(state.s);
            }

            delete state.p;
            delete state.u;
            delete state.s;
        };

        service.cleanup = function (elements) {
            win.defer(function () {
                for (var i = 0; i < elements.length; i++) {
                    var state = elements[i].resonate;
                    cleanElement(elements[i]);
                    if(state) cleanState(state, state.p);
                }

                elements.splice(0, elements.length);
            });
        };

        service.replace = function (element, template) {
            var parent = element.parentElement;
            var index = element.getIndex();
            service.remove(element);
            service.insert(parent, template, index);
        };

        service.remove = function (element, withoutCleanup) {
            var state = element.resonate;
            var parent = element.parentElement;

            if (!state.d && state.p && state.p.d) {
                state = state.p;
            }

            if (state.d) {
                state.p.c.remove(state);

                if (parent) {
                    parent.removeChild(element);
                }

                if (!withoutCleanup) {
                    cleanElement(element);
                    cleanState(state, state.p);
                }
            }
            else {
                throw new Error('Only content added dynamically can be removed.');
            }
        };

        service.insert = function (containerElement, template, index, overrideState) {
            if (typeof template === 'string') {
                var templateExpressions = [];
                parseTarget.innerHTML = '<div>' + template + '</div>';
                var templateRoot = parseTarget.content ? parseTarget.content : parseTarget;
                template = dynamicModule.parseNode(templateRoot.children[0], templateExpressions).c;
                expressions.parseAll(templateExpressions);
                parseTarget.innerHTML = '';
            }

            var containerState = containerElement.resonate;
            var dynamicState = { c: [], a: [], b: [], t: [], d: true, p: containerState, s: overrideState ? overrideState : containerState.s, e: { e: [], r: [], d: [] } };
            containerState.c.push(dynamicState);
            rendering.render(containerElement, { c: template.push ? template : [template] }, dynamicState, index);
            rendering.setRendered(dynamicState);
        };

        service.createContentTemplate = function (template) {
            var modifiedAttributes = [];
            var originalAttribute = null;

            for (var i = 0; i < template.a.length; i++) {
                originalAttribute = template.a[i];

                if (!originalAttribute.k.x || !originalAttribute.k.x.controlsContent) {
                    modifiedAttributes.push(originalAttribute);
                }
            }

            return { k: template.k, a: modifiedAttributes, e: template.e, c: template.c };
        };
    });
