resonate
    .inModule('Resonate')
    .createExpression('localize')
    .with('Localization')
    .as(function (localization) {
        return function (scope, key) {
            return localization.localize(key, scope.on.module);
        };
    });
