"use strict";
var Loader = (function () {
    function Loader() {
    }
    Loader.loadJs = function (url) {
        if (url in this.cache) {
            return this.cache[url];
        }
        var $defer = $.Deferred();
        this.cache[url] = $defer;
        Loader.__loadJs(url, function () {
            $defer.resolve();
        });
        return $defer;
    };
    Loader.loadCss = function (url) {
        if (url in this.cache) {
            return this.cache[url];
        }
        var $defer = $.Deferred();
        this.cache[url] = $defer;
        Loader.__loadCss(url, function () {
            $defer.resolve();
        });
        return $defer;
    };
    Loader.__loadJs = function (url, callback) {
        var node = document.createElement('script');
        node.setAttribute('src', url);
        document.getElementsByTagName('head')[0].appendChild(node);
        var isIE = navigator.userAgent.indexOf('MSIE') == -1 ? false : true;
        if (isIE) {
            node.onreadystatechange = function () {
                if (node.readyState && node.readyState == 'loading') {
                    return;
                }
                if (callback) {
                    callback();
                }
            };
        }
        else {
            node.onload = function () {
                if (callback) {
                    callback();
                }
            };
        }
    };
    // 参考seajs
    Loader.__loadCss = function (url, callback) {
        var node = document.createElement('link');
        node.setAttribute('rel', 'stylesheet');
        node.setAttribute('href', url);
        document.getElementsByTagName('head')[0].appendChild(node);
        if (node.attachEvent) {
            node.attachEvent('onload', callback);
        }
        else {
            setTimeout(function () {
                poll(node, callback);
            }, 0);
        }
        function poll(_elem, callback) {
            var isLoadered = false;
            var sheet = _elem['sheet'];
            var isOldWebKit = parseInt(navigator.userAgent.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536;
            if (isOldWebKit) {
                if (sheet) {
                    isLoadered = true;
                }
            }
            else if (sheet) {
                try {
                    if (sheet.cssRules) {
                        isLoadered = true;
                    }
                }
                catch (ex) {
                    if (ex.code === 'NS_ERROR_DOM_SECURITY_ERR') {
                        isLoadered = true;
                    }
                }
            }
            if (isLoadered) {
                setTimeout(function () {
                    callback();
                }, 1);
            }
            else {
                setTimeout(function () {
                    poll(_elem, callback);
                }, 1);
            }
        }
    };
    Loader.cache = {};
    return Loader;
}());
exports.Loader = Loader;
