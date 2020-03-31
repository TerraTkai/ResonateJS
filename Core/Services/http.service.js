resonate
    .inModule('Resonate')
    .createService('HTTP')
    .asSingleton(function (service) {

        var getResult = function (request) {
            var result = { request: request, status: request.status, headers: {} };

            try {
                result.response = JSON.parse(request.responseText);
            }
            catch (e) {
                result.response = request.responseText;
            }

            var allHeaders = request.getAllResponseHeaders().trim().split(/[\r\n]+/);

            for (var i = 0; i < allHeaders.length; i++) {
                var parts = allHeaders[i].split(': ');
                var header = parts.shift();
                result.headers[header] = parts.join(': ');
            }

            return result;
        };

        var send = function (method, url, headers, data) {
            return new Promise(function (resolve, reject) {
                var request = new XMLHttpRequest();
                var add = 'addEventListener';

                var success = function () {
                    (request.status < 400 ? resolve : reject)(getResult(request));
                };

                var fail = function () {
                    reject(getResult(request));
                };

                request[add]('load', success);
                request[add]('error', fail);
                request[add]('aborts', fail);
                request.open(method, url);

                if (method === 'POST') request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

                if (headers) {
                    var keys = Object.keys(headers);
                    for (var i = 0; i < keys.length; i++) {
                        request.setRequestHeader(keys[i], headers[keys[i]]);
                    }
                }

                request.send(data ? JSON.stringify(data) : null);
            });
        };

        service.get = function (url, headers) {
            return send('GET', url, headers);
        };

        service.post = function (url, data, headers) {
            return send('POST', url, headers, data);
        };
    });