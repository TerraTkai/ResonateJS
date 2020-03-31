var ModuleAsset = function (name, type) {
    var self = this;
    self.name = name;
    self.type = type;

    var setInitialize = function (initialize, isSingleton) {
        self.isSingleton = isSingleton;
        self.initialize = initialize;
    };

    self.with = function () {
        self.services = arguments;
        return self;
    };

    if (type === 2) {
        self.routes = [];

        self.at = function () {
            self.routes = arguments;
            return self;
        };

        self.forRoutingErrors = function () {
            self.isRoutingErrorView = true;
            return self;
        };
    }

    if (type === 3) {
        self.forExpressions = function () {
            self.expressionsOnly = true;
            return self;
        };

        self.toControlContent = function () {
            self.controlsContent = true;
            return self;
        };
    }

    if (type === 4) {
        self.asSingleton = function (initialize) {
            setInitialize(initialize, true);
        };

        self.asTransient = function (initialize) {
            setInitialize(initialize, false);
        };
    }
    else {
        self.as = function (initialize) {
            setInitialize(initialize);
        };
    }
};

var ExpressionAsset = function (name, module) {
    var self = this;
    self.services = [];

    self.with = function () {
        self.services = arguments;
        return self;
    };

    self.as = function (expression) {
        var args = [];

        for (var i = 0; i < self.services.length; i++) {
            args.push(rendering.createService(self.services[i], module));
        }

        resonate.expressions[name.charAt(0).toLowerCase() + name.substring(1)] = expression.apply(this, args);
    };
};

var AreaAsset = function (name) {
    var self = this;
    self.name = name;

    self.forRoutes = function () {
        self.routes = arguments;
        return self;
    };

    self.withModules = function () {
        self.modules = arguments;
    };
};

var LocalizationAsset = function () {
    var self = this;
    self.files = [];
    self.loaded = {};
    self.locales = {};

    self.forLocales = function () {
        self.locales.default = arguments[0];

        for (var i = 0; i < arguments.length; i++) {
            self.locales[arguments[i]] = true;
        }

        return self;
    };

    self.withDefault = function (locale) {
        self.default = locale;
        return self;
    };

    self.from = function (file) {
        self.files.push(file.toLowerCase());
        return { and: self.from };
    };

    self.providedBy = function (provider) {
        self.provider = provider;
    };
};

var Localizer = function () {
    var self = this;
    var nav = navigator;
    var locale = '';
    self.subscribers = [];

    if (nav.languages && nav.languages.length) {
        locale = nav.languages[0];
    } else {
        locale = nav.userLanguage || nav.language || nav.browserLanguage || 'en-gb';
    }

    self.locale = locale.toLowerCase();

    self.refresh = function () {
        for (i = 0; i < self.subscribers.length; i++) {
            self.subscribers[i]();
            resonate.refresh();
        }
    };

    self.changeLocale = function (locale) {
        self.locale = locale;
        var i = 0;
        var loaders = [];
        var moduleNames = Object.keys(resonate.modules);

        for (i = 0; i < moduleNames.length; i++) {
            loaders.push(resonate.modules[moduleNames[i]].loadLocalization(locale));
        }

        Promise.all(loaders).then(self.refresh);
    };

    self.getLocale = function () {
        return self.locale;
    };
};

var Module = function (name, resonate, isDynamic) {
    var self = this;
    self.name = name;
    self.components = { id: 1 };
    self.views = { id: 2 };
    self.attributes = { id: 3 };
    self.services = { id: 4 };
    self.localization = { };

    var localizationAssets = [];

    var create = function (name, assetTypeName) {
        var assetType = self[assetTypeName];
        var asset = new ModuleAsset(name, assetType.id, resonate);
        asset.module = self;
        name = name.toLowerCase();
        assetType[name] = asset;
        resonate[assetTypeName][name] = asset;
        return asset;
    };

    var createRoute = function (route, view) {
        if (route.charAt(0) !== '/') {
            route = '/' + route;
        }

        var routeParts = route.split('/');
        var level = resonate.routes;
        var matched = false;
        var routePart = null;

        for (var i = 1; i < routeParts.length; i++) {
            routePart = routeParts[i];

            if (routePart.indexOf('{') === 0) {
                matched = false;

                for (var j = 0; j < level['!!'].length; j++) {
                    if (level['!!'][j].value === routePart) {
                        level = level['!!'][j].routes;
                        matched = true;
                    }
                }

                if (!matched) {
                    var match = {
                        routes: { '!!': [] },
                        name: routePart.substring(1, routePart.indexOf('}'))
                    };
                    level['!!'].push(match);
                    level = match.routes;
                }
            }
            else {
                routePart = routePart.toLowerCase();

                if (!level[routePart]) {
                    level[routePart] = { '!!': [] };
                }

                level = level[routePart];
            }
        }

        level['@@'] = view;
    };

    var createTemplatedAsset = function (name, type) {
        var asset = create(name, type);
        var trackedName = name.toLowerCase();
        var trackedElement = trackedElements[trackedName];

        if (!trackedElement) {
            trackedElement = { n: trackedName };
            trackedElements[trackedName] = trackedElement;
        }

        trackedElement.x = asset;
        return asset;
    };

    self.parseNode = function (node, templateExpressions) {
        var parsed = null;

        switch (node.nodeType) {
            case 1:
                var i = 0;
                var elementName = node.localName.toLowerCase();

                if (elementName === 'stet') {
                    return { v: node.innerHTML };
                }

                var trackedElement = trackedElements[elementName];
                if (!trackedElement) {
                    trackedElement = { n: elementName };
                    trackedElements[elementName] = trackedElement;
                }

                parsed = { k: trackedElement, a: [], e: [], c: [] };
                for (i = 0; i < node.attributes.length; i++) {
                    var attributeName = node.attributes[i].localName.toLowerCase();
                    var isEventHandler = attributeName.substring(0, 2) === 'on';
                    var trackedAttribute = trackedAttributes[attributeName];

                    if (!trackedAttribute) {
                        trackedAttribute = { n: isEventHandler ? attributeName.substring(2) : attributeName };
                        trackedAttributes[attributeName] = trackedAttribute;
                    }

                    var attributeValue = node.attributes[i].nodeValue;
                    var isExpression = expressions.isExpression(attributeValue);
                    var attributeNode = { k: trackedAttribute, v: attributeValue, p: parsed };
                    var array = isEventHandler && isExpression ? parsed.e : parsed.a;

                    if (trackedAttribute.x && trackedAttribute.x.controlsContent) {
                        array.unshift(attributeNode);
                    }
                    else {
                        array.push(attributeNode);
                    }

                    if (isExpression) {
                        templateExpressions.push(attributeNode);
                    }
                }

                var isComponent = trackedElement.x && trackedElement.x.type === 1;
                var hasContent = false;

                for (i = 0; i < node.childNodes.length; i++) {
                    var childNode = self.parseNode(node.childNodes[i], templateExpressions);

                    if (childNode) {
                        childNode.p = parsed;
                        parsed.c.push(childNode);

                        if (isComponent && (childNode.k || childNode.v && childNode.v.trim() !== '')) {
                            hasContent = true;
                        }
                    }
                }

                if (isComponent && !hasContent) {
                    parsed.c = [];
                }

                break;
            case 3:
                parsed = { v: node.nodeValue };

                if (expressions.isExpression(node.nodeValue)) {
                    templateExpressions.push(parsed);
                }

                break;
        }
        return parsed;
    };

    self.createComponent = function (componentName) {
        return createTemplatedAsset(componentName, 'components');
    };

    self.createView = function (viewName) {
        return createTemplatedAsset(viewName, 'views');
    };

    self.createAttribute = function (attributeName) {
        var asset = create(attributeName, 'attributes');
        var trackedName = attributeName.toLowerCase();
        var trackedAttribute = trackedAttributes[trackedName];

        if (!trackedAttribute) {
            trackedAttribute = { n: trackedName };
            trackedAttributes[trackedName] = trackedAttribute;
        }

        trackedAttribute.x = asset;
        return asset;
    };

    self.createService = function (serviceName) {
        return create(serviceName, 'services');
    };

    self.createExpression = function (expressionName) {
        return new ExpressionAsset(expressionName, self);
    };

    self.setLocalization = function () {
        var asset = new LocalizationAsset(self);
        localizationAssets.push(asset);

        if (isDynamic) {
            win.setTimeout(function () {
                self.loadLocalization(localizer.locale);
            }, 0);
        }

        return asset;
    };

    self.applyTemplates = function (templateData) {
        parseTarget.innerHTML = templateData;
        var templateNodes = parseTarget.content ? parseTarget.content.children : parseTarget.children;

        for (var i = 0; i < templateNodes.length; i++) {
            var name = templateNodes[i].tagName.toLowerCase();
            var asset = self.components[name];
            var expressions = [];

            if (!asset) {
                asset = self.views[name];
            }

            if (asset) {
                asset.template = self.parseNode(templateNodes[i], expressions);
                asset.expressions = expressions;
            }
        }

        parseTarget.innerHTML = '';

        var views = Object.keys(self.views);
        for (var j = 0; j < views.length; j++) {
            if (views[j] !== 'id') {
                var view = resonate.views[views[j]];

                if (view.isRoutingErrorView) {
                    resonate.routes['@routing-error'] = view;
                }

                for (var k = 0; k < view.routes.length; k++) {
                    createRoute(view.routes[k], view);
                }
            }
        }
    };

    var applyLocalization = function (values) {
        var keys = Object.keys(values);
        for (var i = 0; i < keys.length; i++) {
            self.localization[keys[i]] = values[keys[i]];
        }
    };

    var loadLocalizationFile = function (resourceName, asset) {
        return new Promise(function (resolve) {
            modules.loadDirect(resourceName).then(function (response) {
                try {
                    var json = JSON.parse(response);
                    asset.loaded[resourceName] = json;
                    applyLocalization(json);
                }
                catch (e) {
                    // Ignore load errors
                }
                resolve();
            });
        });
    };

    self.loadLocalization = function (locale) {
        var loaders = []; 
        self.localization = {};

        for (var i = 0; i < localizationAssets.length; i++) {
            var asset = localizationAssets[i];
            var appliedLocale = locale;

            if (!asset.locales[appliedLocale]) {
                appliedLocale = asset.locales.default;
            }

            var provider = asset.provider;

            if (provider) {
                var result = provider(appliedLocale);

                if (result && result.then && typeof result.then === 'function') {
                    result.then(function (result) {
                        applyLocalization(result);
                        localizer.refresh();
                    });
                }
                else {
                    applyLocalization(result);
                }
            }
            else {
                for (var j = 0; j < asset.files.length; j++) {
                    var resourceName = asset.files[j].replace('{locale}', appliedLocale);
                    var loadedValues = asset.loaded[resourceName];

                    if (loadedValues) {
                        applyLocalization(loadedValues);
                    } else {
                        loaders.push(loadLocalizationFile(resourceName, asset));
                    }
                }
            }
        }

        return Promise.all(loaders);
    };
};

var Modules = function (resonate) {
    var self = this;
    var modulePath = '';
    var events = ['load', 'error', 'abort'];

    resonate.modules = {};
    resonate.components = {};
    resonate.views = {};
    resonate.routes = { '!!': [] };
    resonate.areas = [];
    resonate.attributes = {};
    resonate.services = {};
    resonate.modules['resonate'] = new Module('Resonate', resonate, true);

    dynamicModule = new Module();

    resonate.createBodyComponent = function () {
        return resonate.inModule('resonate').createComponent('@body');
    };

    resonate.setLocalization = function () {
        return resonate.modules['resonate'].setLocalization();
    };

    resonate.createModule = function (moduleName) {
        moduleName = moduleName.toLowerCase();
        var module = new Module(moduleName, resonate, true);
        resonate.modules[moduleName] = module;
        return module;
    };
    
    resonate.createArea = function (areaName) {
        var asset = new AreaAsset(areaName);
        win.setTimeout(function () {
            resonate.areas.push(asset);
        }, 0);
        return asset;
    };

    resonate.inModule = function (moduleName) {
        var module = resonate.modules[moduleName.toLowerCase()];

        if (!module) {
            throw new Error('The module \'' + moduleName + '\' was not found.');
        }

        return module;
    };

    var loadDirect = function (location) {
        return new Promise(function (resolve) {
            var request = new XMLHttpRequest();

            var handleResponse = function () {
                resolve(request.responseText);
            };

            for (var i = 0; i < events.length; i++) {
                request.addEventListener(events[i], handleResponse);
            }

            request.open('GET', location);
            request.send();
        });
    };

    var loadInDocument = function (elementName, location) {
        return new Promise(function (resolve) {
            var node = doc.createElement(elementName);
            node.addEventListener('load', resolve); // ToDo: IE causes issues with timing...
            node.addEventListener('error', resolve);

            if (elementName === 'link') {
                node.rel = 'stylesheet';
                node.type = 'text/css';
                node.href = location;
            }
            else {
                node.src = location;
            }

            doc.head.appendChild(node);
        });
    };

    var loadScript = function (location, module) {
        return new Promise(function (resolve) {
            loadInDocument('script', location).then(function () {
                module.loadLocalization(localizer.locale).then(resolve);
            });
        });
    };

    var loadModule = function (moduleName) {
        return new Promise(function (resolve) {
            moduleName = moduleName.toLowerCase().trim();

            var path = modulePath + '/' + moduleName;
            var resourceLoaders = [];
            var templates = {};
            var module = new Module(moduleName, resonate);

            resonate.modules[moduleName] = module;
            resourceLoaders.push(loadScript(path + '.min.js', module));
            resourceLoaders.push(loadInDocument('link', path + '.min.css'));
            resourceLoaders.push(loadDirect(path + '.html', templates));

            Promise.all(resourceLoaders).then(function (results) {
                module.applyTemplates(results[2]);
                resolve();
            });
        });
    };

    var getAttributeValue = function (attributeName, owner, defaultValue) {
        var attribute = owner.attributes[attributeName];

        if (attribute) {
            return attribute.nodeValue.trim().toLowerCase();
        }

        return defaultValue;
    };

    self.loadModules = function (moduleNames) {
        var moduleLoaders = [];
        for (var i = 0; i < moduleNames.length; i++) {
            if (!resonate[moduleNames[i]]) {
                moduleLoaders.push(loadModule(moduleNames[i]));
            }
        }

        return Promise.all(moduleLoaders);
    };

    self.loadInitial = function () {
        localizer = new Localizer(loadDirect);
        var modules = [];
        var scripts = doc.getElementsByTagName('script');

        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            var modulesAttribute = script.attributes['resonate-modules'];

            if (modulesAttribute) {
                var moduleNames = modulesAttribute.nodeValue.split(',');
                for (var j = 0; j < moduleNames.length; j++) {
                    var moduleName = moduleNames[j].trim();

                    if (moduleName) {
                        modules.push(moduleName);
                    }
                }
            }

            modulePath = '/' + getAttributeValue('resonate-modules-path', script, modulePath);
            routing = getAttributeValue('resonate-routing', script, routing);
            appPath = getAttributeValue('resonate-path', script, appPath);
        }

        if (modules.length === 0) {
            self.autoMode = false;
        }

        return self.loadModules(modules);
    };

    resonate.loadModule = loadModule;
    self.autoMode = true;
    self.loadDirect = loadDirect;
};