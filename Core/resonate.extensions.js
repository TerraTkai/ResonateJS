var addExtensions = function (update) {
    // Extend Array
    (function () {
        var proto = Array.prototype;

        proto.remove = function (value) {
            var index = this.indexOf(value);

            if (index !== -1) {
                this.splice(index, 1);
            }
        };

        proto.removeAll = function () {
            this.splice(0, this.length);
        };

        var ArrayTracking = function (array) {
            if (!array.tracking) {
                array.tracking = [];
            }

            var self = this;
            var tracking = array.tracking;

            self.changed = true;

            var execute = function (func, args, xFunc, xArgs) {
                for (var i = 0; i < tracking.length; i++) {
                    xFunc.apply(this, [tracking[i], xArgs]);
                    tracking[i].changed = true;
                }

                array.suppress = true;
                var result = func.apply(array, args);
                array.suppress = false;
                return result;
            };

            if (tracking.length === 0) {

                var push = function (tracker) {
                    tracker.i.push(-1);
                };

                array.push = function () {
                    return execute(proto.push, arguments, push);
                };

                var pop = function (tracker) {
                    var index = tracker.i.pop();

                    if (index >= 0) {
                        tracker.d.push(index);
                    }
                };

                array.pop = function () {
                    return execute(proto.pop, arguments, pop);
                };

                var shift = function (tracker) {
                    var index = tracker.i.shift();

                    if (index >= 0) {
                        tracker.d.push(index);
                    }
                };

                array.shift = function () {
                    return execute(proto.shift, arguments, shift);
                };

                var unshift = function (tracker) {
                    tracker.i.unshift(-1);
                };

                array.unshift = function () {
                    return execute(proto.unshift, arguments, unshift);
                };

                var copyWithin = function (tracker, args) {
                    proto.copyWithin.apply(tracker.i, args);
                };

                array.copyWithin = function () {
                    return execute(proto.copyWithin, arguments, copyWithin, arguments);
                };

                var reverse = function (tracker) {
                    proto.reverse.apply(tracker.i);
                };

                array.reverse = function () {
                    return execute(proto.reverse, arguments, reverse);
                };

                var splice = function (tracker, args) {
                    var deleted = proto.splice.apply(tracker.i, args);

                    for (var i = 0; i < deleted.length; i++) {
                        tracker.d.push(deleted[i]);
                    }
                };

                array.splice = function () {
                    var indexArgs = proto.slice.apply(arguments, [0]);

                    for (i = 2; i < indexArgs.length; i++) {
                        indexArgs[i] = -1;
                    }

                    return execute(proto.splice, arguments, splice, indexArgs);
                };

                var sort = function (tracker, sortOrder) {
                    var reordered = [];

                    for (var i = 0; i < sortOrder.length; i++) {
                        reordered.push(tracker.i[sortOrder[i].i]);
                    }

                    tracker.i = reordered;
                };

                array.sort = function () {
                    var sortOrder = [];
                    var sortFunc = null;
                    var i = 0;
                    var args = arguments;

                    for (i = 0; i < array.length; i++) {
                        sortOrder.push({ i: i, v: (args.length > 0 || array[i] === undefined || typeof array[i] === 'string') ? array[i] : array[i].toString() });
                    }

                    if (args.length > 0) {
                        sortFunc = function (a, b) {
                            return args[0](a.v, b.v);
                        };
                    }
                    else {
                        sortFunc = function (a, b) {
                            if (a.v === b.v) return 0;
                            if (a.v === undefined) return 1;
                            if (b.v === undefined) return -1;
                            if (a.v < b.v) return -1;
                            if (a.v > b.v) return 1;
                            return 0;
                        };
                    }

                    proto.sort.apply(sortOrder, [sortFunc]);

                    for (i = 0; i < tracking.length; i++) {
                        sort(tracking[i], sortOrder);
                        tracking[i].changed = true;
                    }

                    var mirror = array.slice(0);
                    for (i = 0; i < sortOrder.length; i++) {
                        array[i] = mirror[sortOrder[i].i];
                    }

                    return array;
                };

                array.markChange = function (index) {
                    if (!array.suppress) {
                        for (var i = 0; i < tracking.length; i++) {
                            tracking[i].i[index] = -2;
                            tracking[i].changed = true;
                        }
                    }
                };
            }

            tracking.push(self);

            self.cancel = function () {
                tracking.remove(self);
                if (tracking.length === 0) {
                    delete array.push;
                    delete array.pop;
                    delete array.shift;
                    delete array.unshift;
                    delete array.copyWithin;
                    delete array.reverse;
                    delete array.splice;
                    delete array.sort;
                    delete array.markChange;
                }
            };

            self.changes = function (existing, itemName) {
                var i = 0;
                var itemIndex = 0;

                if (self.i && !array.isBindable) {
                    for (i = 0; i < self.i.length; i++) {
                        itemIndex = self.i[i];
                        if (itemIndex >= 0 && array[i] !== existing[itemIndex].resonate.s[itemName]) {
                            array.markChange(itemIndex);
                        }
                    }
                }

                if (self.changed) {
                    var result = { indexes: self.i, deleted: self.d };
                    self.i = [];
                    self.d = [];

                    for (i = 0; i < array.length; i++) {
                        self.i.push(i);
                    }

                    self.changed = false;
                    return result;
                }
            };

            self.changes();
        };

        proto.track = function () {
            return new ArrayTracking(this);
        };

    })();

    // Add BindingArray
    (function () {
        win.BindingArray = function () { };

        var createFrom = function (array) {
            if (win.Proxy) return new win.BindingArray(createFrom, array);
            return array;
        };

        if (win.Proxy) {
            var descriptor = Object.getOwnPropertyDescriptor(win.BindingArray.prototype, 'constructor');

            var operation = {
                set: function (obj, prop, value) {
                    if (!obj.suppress && !isNaN(prop) && obj.markChange) obj.markChange(parseInt(prop));
                    obj[prop] = value;
                    return true;
                },
                get: function (obj, prop) {
                    if (prop !== "isBindable") {
                        return obj[prop];
                    }
                    return true;
                }
            };

            var construction = {
                construct: function (obj, args) {
                    return new Proxy(args.length === 2 && args[0] === createFrom ? args[1] : [], operation);
                }
            };

            descriptor.value = new Proxy(win.BindingArray, construction);
            win.BindingArray = descriptor.value;
        }
        else {
            win.BindingArray = Array;
        }

        win.BindingArray.createFrom = createFrom;
    })();

    // Extend Window, HTTP, HTML
    (function () {
        var win = window;
        var setTimeout = win.setTimeout;
        var setInterval = win.setInterval;
        var httpRequest = win.XMLHttpRequest.prototype;
        var httpSend = httpRequest.send;
        var html = win.HTMLElement.prototype;
        var text = win.String.prototype;

        win.setTimeout = function (func, timeout, suppressUpdate) {
            return setTimeout.apply(this, [suppressUpdate ? func : function () { func(); update(); }, timeout]); 
        };

        win.setInterval = function (func, interval, suppressUpdate) {
            return setInterval.apply(this, [suppressUpdate ? func : function () { func(); update(); }, interval]);
        };

        win.defer = function (func) {
            setTimeout.apply(this, [func, 0]); 
        };

        win.parseBool = function (value) {
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            }

            return !!value;
        };

        httpRequest.send = function () {
            var self = this;
            var add = 'addEventListener';
            var stateChange = self.onreadystatechange;

            self.onreadystatechange = function () {
                var change = stateChange ? stateChange.apply(self, arguments) : null;
                if (self.readyState === 4) {
                    var complete = function () {
                        if (!self.updated) {
                            win.defer(update);
                            self.updated = true;
                        }
                    };
                    self[add]('load', complete);
                    self[add]('error', complete);
                    self[add]('aborts', complete);
                }

                return change;
            };

            return httpSend.apply(self, arguments);
        };

        html.empty = function () {
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
        };

        html.insertAt = function (child, index) {
            if (index === -1) {
                this.appendChild(child);
            }
            else {
                this.insertBefore(child, this.childNodes[index]);
            }
        };

        html.raiseEvent = function (eventType, eventData) {
            var event = doc.createEvent('CustomEvent');
            event.initCustomEvent(eventType, true, true, eventData);
            this.element.dispatchEvent(event);
        };

        html.getIndex = function () {
            return this.parentElement ? [].slice.apply(this.parentElement.childNodes).indexOf(this) : 0;
        };

        html.on = function () {
            return this.addEventListener.apply(this, arguments);
        };

        html.off = function () {
            return this.removeEventListener.apply(this, arguments);
        };

        text.toJsName = function () {
            var parts = this.toLowerCase().split('-');

            for (var i = 1; i < parts.length; i++) {
                if (parts[i].length > 0) {
                    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
                }
            }

            return parts.join('');
        };

        Comment.prototype.getIndex = html.getIndex;
    })();
};