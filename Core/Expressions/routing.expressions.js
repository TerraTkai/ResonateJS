resonate
    .inModule('Resonate')
    .createExpression('currentView')
    .with('Routing')
    .as(function (routing) {
        return routing.getCurrentView;
    }); 

resonate
    .inModule('Resonate')
    .createExpression('currentRoute')
    .with('Routing')
    .as(function (routing) {
        return routing.getCurrentRoute;
    });

resonate
    .inModule('Resonate')
    .createExpression('currentRouteData')
    .with('Routing')
    .as(function (routing) {
        return routing.getCurrentData;
    });

resonate
    .inModule('Resonate')
    .createExpression('changeRoute')
    .with('Routing')
    .as(function (routing) {
        return routing.changeRoute;
    });