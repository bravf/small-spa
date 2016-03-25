"use strict";
var sspaConf = require('./small-spa-conf');
var Load = (function () {
    function Load() {
    }
    Load.loadJs = function (url) {
        var $defer = $.Deferred();
        Load.__loadJs(url, function () {
            $defer.resolve();
        });
        return $defer;
    };
    Load.loadCss = function (url) {
        var $defer = $.Deferred();
        Load.__loadCss(url, function () {
            $defer.resolve();
        });
        return $defer;
    };
    Load.__loadJs = function (url, callback) {
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
    Load.__loadCss = function (url, callback) {
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
            var isLoaded = false;
            var sheet = _elem['sheet'];
            var isOldWebKit = parseInt(navigator.userAgent.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536;
            if (isOldWebKit) {
                if (sheet) {
                    isLoaded = true;
                }
            }
            else if (sheet) {
                try {
                    if (sheet.cssRules) {
                        isLoaded = true;
                    }
                }
                catch (ex) {
                    if (ex.code === 'NS_ERROR_DOM_SECURITY_ERR') {
                        isLoaded = true;
                    }
                }
            }
            if (isLoaded) {
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
    return Load;
}());
var Sspa = (function () {
    function Sspa() {
    }
    Sspa.__getModId = function () {
        return "sspa-mod-id-" + Sspa.__modId++;
    };
    Sspa.__onHashChange = function () {
        var hash = Sspa.__getRealHash().slice(1);
        console.log(hash);
        Sspa.__handleMods(hash);
    };
    Sspa.__triggerEvent = function (eventName, eventParams) {
        Sspa.__$event.trigger(eventName, eventParams);
        return Sspa;
    };
    Sspa.__onEvent = function (eventName, func) {
        Sspa.__$event.on(eventName, func);
        return Sspa;
    };
    Sspa.__handleMods = function (hash) {
        Sspa.__triggerEvent('start-hash');
        var currMods = [];
        var mod = sspaConf.mod;
        var hashKeys = hash.split('/');
        //找到hash每一项对应的mod
        for (var i = 0, hashKey; i < hashKeys.length; i++) {
            hashKey = hashKeys[i];
            mod = mod[hashKey];
            if (mod) {
                currMods.push(mod);
            }
            else {
                break;
            }
        }
        //剩余的当做页面的参数
        Sspa.modParams = hashKeys.slice(i);
        //加载未加载的mod
        var defers = [];
        currMods.forEach(function (mod, _) {
            if (!mod.__loaded) {
                mod.__loaded = true;
                // 如果没有配置sspa_path，则是个虚mod，起到命名空间作用
                if (mod.sspa_tmpl) {
                    defers.push(Sspa.loadMod(mod));
                }
            }
        });
        //当文件都加载成功，进行mod显示
        $.when.apply(null, defers).done(function () {
            currMods.forEach(function (mod) {
                var $modContainer = mod.__$container = $(mod.sspa_container);
                $modContainer.append(mod.__$modWrapper);
                Sspa.showMod(mod);
            });
            Sspa.__triggerEvent('end-hash');
        });
    };
    // 加载js,css资源
    Sspa.__loadResources = function (mod) {
        var modId = mod.__modId = Sspa.__getModId();
        var $html = mod.__$modWrapper = $('<div/>').hide();
        var $defers = [];
        mod.__title = $html.find('title').text();
        $html.attr('sspa-mod-id', modId)
            .html(mod.__htmlContent);
        var $links = $html.find('link[href]');
        $links.each(function (_, link) {
            var $link = $(link);
            var href = $link.attr('href');
            $defers.push(Load.loadCss(href));
        });
        var $scripts = $html.find('script[src]');
        $scripts.each(function (_, script) {
            var $script = $(script);
            var src = $script.attr('src');
            $defers.push(Load.loadJs(src));
        });
        $links.remove();
        $scripts.remove();
        $html.appendTo($(mod.sspa_container));
        return $.when.apply(null, $defers);
    };
    Sspa.loadMod = function (mod) {
        if (mod.sspa_tmpl.slice(-5) === '.html') {
            var $defer_1 = $.Deferred();
            var time = +new Date;
            $.get("" + sspaConf.baseURL + mod.sspa_tmpl + "?_t=" + time).done(function (html) {
                mod.__htmlContent = html;
                Sspa.__loadResources(mod).done(function () {
                    $defer_1.resolve();
                });
            });
            return $defer_1;
        }
        else {
            mod.__htmlContent = mod.sspa_tmpl;
            return Sspa.__loadResources(mod);
        }
    };
    Sspa.showMod = function (mod) {
        mod.__$container.find('div[sspa-mod-id]').hide();
        mod.__$container.find("div[sspa-mod-id=\"" + mod.__modId + "\"]").show();
        document.title = mod.__title || 'small-spa';
        Sspa.__triggerEvent('mod-show', [mod.sspa_tmpl]);
    };
    // events
    Sspa.onStartHash = function (func) {
        return Sspa.__onEvent('start-hash', func);
    };
    Sspa.onEndHash = function (func) {
        return Sspa.__onEvent('end-hash', func);
    };
    Sspa.onModShow = function (modPath, func) {
        return Sspa.__onEvent('mod-show', function (e, path) {
            if (modPath == path) {
                func();
            }
        });
    };
    Sspa.urlRewrite = function (a, b) {
        Sspa.__rewriteTables.push({
            a: a, b: b
        });
        return Sspa;
    };
    Sspa.__getRealHash = function () {
        var hash = location.hash.slice(1);
        var realHash = hash;
        $.each(Sspa.__rewriteTables, function (_, ab) {
            var a = ab.a, b = ab.b;
            if (typeof a === 'string') {
                if (hash == a) {
                    realHash = b;
                    return false;
                }
            }
            else {
                if (a.test(hash)) {
                    realHash = b;
                    return false;
                }
            }
        });
        return realHash;
    };
    Sspa.init = function () {
        window.onhashchange = function () {
            Sspa.__onHashChange();
        };
        Sspa.__onHashChange();
    };
    Sspa.modParams = [];
    Sspa.__$event = $('<div/>');
    Sspa.__modId = 0;
    // url rewrite处理
    Sspa.__rewriteTables = [];
    return Sspa;
}());
this.Sspa = Sspa;
