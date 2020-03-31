resonate
    .inModule('Resonate')
    .createService('Expressions')
    .asSingleton(function () {
    });

resonate.expressions = rendering.createService('Expressions', resonate.modules['resonate']);
