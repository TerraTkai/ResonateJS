resonate
    .inModule('Resonate')
    .createComponent('content')
    .with('Content')
    .as(function (component, content) {
        var parent = component.element.resonate.p;
        var children = parent.x;

        if (children) {
            content.insert(component.element, children, 0, parent.p.s);
        }
    });