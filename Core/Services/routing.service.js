resonate
    .inModule('Resonate')
    .createService('Routing')
    .with('Content')
    .asSingleton(function (service, content) {
        var viewElement = null;
        var routes = resonate.routes;
        var current = { route: '', data: {}, view: {} };
        var ignoreData = {};
        var useHashes = !history.pushState || routing === 'hashes';
        var location = doc.location;
        var lastData = {};
        var currentUpdate = null;

        setViewState = function (view) {
            view.routeData = current.data;
            view.location = current.route;
        };

        var overrideHref = function (path) {
            if (history.replaceState) {
                history.replaceState({}, '', path);
            }
            else {
                location.href = path;
            }
        };

        if (useHashes && !location.hash) {
            if (appPath) {
                overrideHref('/' + appPath + '/#' + location.pathname.replace('/' + appPath, '') + location.search);
            }
            else {
                overrideHref('/#' + location.pathname + location.search);
            }
        }

        if (doc.t) {
            history.replaceState({ route: doc.t, data: {} }, '', doc.t);
        }

        var checkRouteLevel = function (levelRoutes, routeParts, result, level) {
            var isLastLevel = routeParts.length === level + 1;
            var routePart = routeParts[level];
            var match = levelRoutes[routePart.toLowerCase()];

            if (match) {
                if (isLastLevel) {
                    result.view = match['@@'];
                    return;
                }
                else {
                    checkRouteLevel(match, routeParts, result, level + 1);
                }
            }
            else {
                for (var i = 0; i < levelRoutes['!!'].length; i++) {
                    var routeCheck = levelRoutes['!!'][i];

                    if (isLastLevel && routeCheck.routes['@@']) {
                        result.view = routeCheck.routes['@@'];
                    }
                    else {
                        checkRouteLevel(routeCheck.routes, routeParts, result, level + 1);
                    }

                    if (result.view) {
                        var name = routeCheck.name.toJsName();
                        ignoreData[name] = true;
                        result.data[name] = routePart;
                        break;
                    }
                }
            }
        };

        var identifyView = function (routing) {
            ignoreData = {};
            var result = { data: routing.data };
            checkRouteLevel(routes, routing.route.split('/'), result, 1);
            return result.view;
        };

        var extractSearch = function (search) {
            var data = {};

            if (search) {
                if (search.charAt(0) === '?') {
                    search = search.substring(1);
                }

                var searchParts = search.split('&');

                for (var i = 0; i < searchParts.length; i++) {
                    var searchItem = searchParts[i].split('=');

                    if (searchItem.length === 2) {
                        data[searchItem[0]] = searchItem[1];
                    }
                }
            }

            return data;
        };

        var extractCurrentUrl = function () {
            var search = decodeURI(location.search);
            var path = decodeURI(location.pathname);
            var hash = decodeURI(location.hash);

            if (hash) {
                var parts = hash.split('?');
                path = parts[0].replace('#', '');
                search = parts.length > 0 ? parts[1] : '';
            }

            if (appPath) {
                path = path.replace('/' + appPath, '');
            }

            if (path === '') {
                path = '/';
            }

            return { data: extractSearch(search), route: path };
        };

        var buildContainsRoute = function (area) {
            var i = 0;
            var tests = [];

            for (i = 0; i < area.routes.length; i++) {
                tests.push(new RegExp('^' + area.routes[i].replace(/\*/g, '.*') + '$'));
            }

            area.containsRoute = function (route) {
                for (i = 0; i < tests.length; i++) {
                    if (tests[i].test(route)) {
                        return true;
                    }
                }

                return false;
            };
        };

        var loadExternalView = function (routing) {
            for (var i = 0; i < resonate.areas.length; i++) {
                var area = resonate.areas[i];

                if (!area.containsRoute) {
                    buildContainsRoute(area);
                }

                if (area.containsRoute(routing.route)) {
                    modules.loadModules(area.modules).then(function () {
                        applyView(identifyView(routing), routing);
                    });

                    return true;
                }
            }

            return false;
        };

        var applyView = function (view, routing) {
            if (!view) {
                view = routes['@routing-error'];
            }

            if (view) {
                current.route = routing.route;
                current.data = routing.data;
                current.view = view;

                setLastData(Object.keys(current.data));
                doc.body.scrollTop = doc.documentElement.scrollTop = 0;

                if (viewElement.children.length > 0) {
                    content.replace(viewElement.children[0], current.view.template, 0);
                }
                else {
                    content.insert(viewElement, current.view.template, 0);
                }

                currentUpdate = viewElement.children[0].resonate.u;
                resonate.refresh();
            }
            else {
                throw new Error('The route \'' + routing.route + '\' could not be resolved to a view.');
            }
        };

        var loadView = function (routing) {
            if (routing.route !== current.route) {
                var view = identifyView(routing);

                if (!view && loadExternalView(routing)) {
                    return;
                }

                applyView(view, routing);
            }
            else if (currentUpdate) {
                currentUpdate();
            }
        };

        var loadCurrent = function () {
            loadView(extractCurrentUrl());
        };

        var updateRoute = function (route, data) {
            var search = '';
            var keys = Object.keys(data);

            if (keys.length > 0) {
                search = '';
                for (var i = 0; i < keys.length; i++) {
                    if (!ignoreData[keys[i]]) {
                        search += '' + keys[i] + '=' + data[keys[i]] + '&';
                    }
                }

                if (search.length > 0) {
                    search = '?' + search.substring(0, search.length - 1);
                }
            }

            var path = (appPath ? '/' + appPath : '') + (useHashes ? '/#' : '') + route + search;

            if (useHashes) {
                location.href = path;
            }
            else {
                var routing = { route: route, data: data };
                loadView(routing);
                history.pushState(routing, '', path);
            }
        };

        var setLastData = function (keys) {
            lastData = {};

            for (var i = 0; i < keys.length; i++) {
                lastData[keys[i]] = current.data[keys[i]];
            }
        };

        setViewComponent = function (viewComponent) {
            if (viewElement) {
                throw new Error('Only one view element is permitted');
            }

            viewElement = viewComponent.element;
            var currentRouting = extractCurrentUrl();
            loadView(currentRouting);

            if (useHashes) {
                win.addEventListener('hashchange', loadCurrent);
            }
            else {
                history.replaceState(currentRouting, '');
                win.addEventListener('popstate', function (event) {
                    loadView(event.state);
                });
            }
        };

        service.getCurrentData = function () {
            return current.data;
        };

        service.getCurrentView = function () {
            return current.view.name;
        };

        service.getCurrentRoute = function () {
            return current.route;
        };

        service.changeRoute = function (route, data) {
            route = decodeURI(route);

            if (!data) {
                var parts = route.split('?');
                route = parts[0];
                data = extractSearch(parts[1]);
            }

            updateRoute(route, data);
        };

        service.on('evaluate', function () {
            var keys = Object.keys(current.data);

            for (var i = 0; i < keys.length; i++) {
                if (!ignoreData[keys[i]]) {
                    if (current.data[keys[i]] !== lastData[keys[i]]) {
                        setLastData(keys);
                        updateRoute(current.route, current.data);
                        break;
                    }
                }
            }
        });
    });