resonate
    .inModule('Resonate')
    .createService('Localization')
    .asTransient(function (service) {
        if (!service.module) service.module = resonate.modules['resonate'];

        service.localize = function (key, module) {
            if (module) {
                if (typeof module === 'string') module = resonate.modules[module.toLowerCase()];
            }
            else {
                module = service.module;
            }

            var result = module.localization[key];
            return result ? result : key;
        };

        service.changeLocale = localizer.changeLocale;

        service.getLocale = localizer.getLocale;

        service.onLocaleChange = function (handler) {
            localizer.subscribers.push(handler);
        };

        service.unbindLocaleChange = function (handler) {
            localizer.subscribers.remove(handler);
        };
    });