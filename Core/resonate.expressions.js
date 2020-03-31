var Expressions = function () {
    var self = this;
    var keywords = ['true', 'false', 'null', 'undefined', 'new', 'event', 'typeof', 'Math', 'NaN', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'window', 'console', 'JSON'];
    var operators = ['=', '!', '>', '<', '&', '|', '?', ':', '(', ')', '[', ']', '{', '}', ',', ';', ' ', '+', '-', '*', '/', '\\', '%', '^', '\'', '"', '.'];
    var keywordLookup = {};
    var operatorLookup = {};
    var i = 0;
    var blockStart = { '{': true, '(': true, '[': true };
    var blockEnd = { '}': true, ')': true, ']': true };

    for (i = 0; i < keywords.length; i++) {
        keywordLookup[keywords[i]] = true;
    }

    for (i = 0; i < operators.length; i++) {
        operatorLookup[operators[i]] = true;
    }

    window.addEventListener('error', function (errorEvent) {
        var error = errorEvent.error;

        if (error) {
            if (error.message) error.message = error.message.replace('__scope.', '').replace('__value', '');
            console.error(error);
        }

        errorEvent.preventDefault();
        errorEvent.stopImmediatePropagation();
    });

    var parseTerms = function (statementNode) {
        var expression = '';
        var position = 0;
        var current = '';
        var inQuotes = false;
        var isEnd = false;
        var isOperator = false;
        var blockDepth = 0;
        var statement = statementNode.e.trim();

        if (statement.charAt(0) === '{') {
            statementNode.p['in-only'] = true;
        }

        for (var i = 0; i <= statement.length; i++) {
            current = statement.charAt(i);
            isOperator = operatorLookup[current];
            isEnd = !isOperator && i === statement.length - 1;

            if ((isOperator && !inQuotes) || isEnd) {

                if (blockStart[current]) {
                    blockDepth++;
                }

                if ((blockDepth === 0 && isOperator && current !== '.') || (i === statement.length - 1 && current === ')')) {
                    statementNode.p['in-only'] = true;
                }

                if (blockEnd[current]) {
                    blockDepth--;
                }

                if (position < i || isEnd) {
                    var term = statement.substring(position, isEnd ? i + 1 : i);
                    var isKeyword = keywordLookup[term];
                    var isExpression = term.charAt(0) === '@';

                    if (blockDepth === 0 && (isKeyword || isExpression || !isNaN(term))) {
                        statementNode.p['in-only'] = true;
                    }

                    if (isExpression) {
                        expression += 'resonate.expressions.' + term.substring(1);

                        if (term === '@localize') {
                            expression += '(__scope, ';

                            while (statement.charAt(i) !== '(' && i <= statement.length) {
                                i++;
                            }

                            i++;
                            current = statement.charAt(i);
                            isOperator = operatorLookup[current];
                        }
                    }
                    else {
                        expression += (position !== 0 && statement.charAt(position - 1) === '.') || !isNaN(term) || isKeyword ? term : '__scope.' + term;
                    }
                    position = i;
                }

                if (current === '"' || current === '\'') {
                    inQuotes = true;
                }

                if (isOperator) {
                    expression += current;
                    position++;
                }
            }
            else if (inQuotes) {
                if ((current === '"' || current === '\'') && (i === 0 || statement.charAt(i - 1) !== '\\')) {
                    inQuotes = false;
                }

                position++;
                expression += current;
            }
        }

        return expression;
    };

    var extractStatement = function (value) {
        value = value.trim();

        if (value.charAt(0) === '[') {
            var startIndex = value.indexOf(']');

            if (startIndex !== -1) {
                var extract = { e: value.substring(startIndex + 1), p: {} };
                var instructions = value.substring(1, startIndex).toLowerCase().split(',');

                for (var i = 0; i < instructions.length; i++) {
                    extract.p[instructions[i].trim()] = true;
                }

                return extract;
            }
        }
        return { e: value, p: {} };
    };

    var splitExpression = function (value) {
        var statements = [];
        var nesting = 0;
        var lastStart = 0;
        var readPosition = 0;
        var bracketPosition = 0;
        var nextOpening = 0;
        var nextClosing = 0;

        while (true) {
            nextOpening = value.indexOf('{', bracketPosition);
            nextClosing = value.indexOf('}', bracketPosition);

            if (nextOpening > nextClosing || nextOpening === -1) {
                nesting--;

                if (nesting === 0) {
                    if (readPosition < lastStart) {
                        statements.push({ v: value.substring(readPosition, lastStart) });
                    }

                    statements.push(extractStatement(value.substring(lastStart + 1, nextClosing)));
                    readPosition = nextClosing + 1;
                }

                bracketPosition = nextClosing + 1;
            }
            else {
                if (nesting === 0) {
                    lastStart = nextOpening;
                }

                bracketPosition = nextOpening + 1;
                nesting++;
            }

            if (nextOpening === -1 && nextClosing === -1) {
                break;
            }
        }

        if (readPosition < value.length) {
            statements.push({ v: value.substring(readPosition) });
        }

        return statements;
    };

    var parseStatement = function (statement, allowsIn) {
        var noErrors = statement.p['no-errors'];
        var expression = {};

        if (allowsIn) {
            var inIndex = statement.e.toLowerCase().indexOf(' in ');
            var variable = null;

            if (inIndex !== -1) {
                variable = statement.e.substring(0, inIndex).trim();
                statement.e = statement.e.substring(inIndex + 4);
            }
        }

        var textExpression = parseTerms(statement);
        var once = !!statement.p['once'];

        try {
            expression = win.eval('((function() { return function(__scope, event) { ' + (noErrors ? 'try { ' : '') + ' return ' + textExpression + ';' + (noErrors ? ' } catch (e) { return \'\'; }' : '') + ' }; })())');

            if (!once && !statement.p['in-only']) {
                expression.i = eval('(function(__scope, __value) {' + (noErrors ? 'try { ' : ' ') + textExpression + ' = __value; ' + (noErrors ? '} catch (e) {}' : '') + ' })');
            }
        }
        catch (e) {
            console.error(new Error('The expression {' + statement.e + '} could not be parsed. ' + e.message));

            expression = function () {
                return '[error]';
            };
        }
        expression.o = once;
        expression.b = !statement.p['no-bind'];

        if (variable) {
            expression.v = variable;
        }

        return expression;
    };

    var combineStatements = function (statements) {
        var combined = { e: '', p: {} };
        var statement = null;
        var add = null;

        for (var i = 0; i < statements.length; i++) {
            statement = statements[i];
            add = i === statements.length - 1 ? '' : ' + ';

            if (statement.v) {
                combined.e += '\'' + statement.v + '\'' + add;
            }
            else if (statement.e) {
                combined.e += statement.e + add;
            }
            else if (i === 0) {
                combined.p = statement.p;
            }
        }

        combined.p['in-only'] = true;
        return combined;
    };

    var createTextNode = function (sibling, offset) {
        var node = {};
        sibling.p.c.splice(sibling.p.c.indexOf(sibling) + offset, 0, node);
        return node;
    };

    self.parse = function (node) {
        var i = 0;
        var statement = null;
        var current = null;
        var statements = splitExpression(node.v);

        if (node.k) {
            node.e = parseStatement(statements.length === 1 ? statements[0] : combineStatements(statements), node.k.n === 'foreach');
        }
        else {
            for (i = 0; i < statements.length; i++) {
                current = i === 0 ? node : createTextNode(node, i);
                statement = statements[i];

                if (statement.e) {
                    current.e = parseStatement(statement);
                }
                else {
                    current.v = statement.v;
                }
            }
        }

        if (node.e) {
            node.v = '';
        }
    };

    self.parseAll = function (expressionNodes) {
        if (expressionNodes.length > 0) {
            for (var i = 0; i < expressionNodes.length; i++) {
                self.parse(expressionNodes[i]);
            }

            expressionNodes.removeAll();
        }
    };

    self.isExpression = function (value) {
        return !!value && value.indexOf('{') !== -1 && value.indexOf('}') !== -1;
    };
};

expressions = new Expressions();