"use strict";
var spaConf = require('./small-spa-conf');
var Load = (function () {
    function Load() {
    }
    Load.loadJs = function (url, callback) {
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
    Load.loadCss = function (url, callback) {
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
    Sspa.onHashChange = function () {
        var hash = location.hash.slice(1);
        Sspa.handlePages(hash);
    };
    Sspa.beforeHandle = function (func) {
        Sspa.$event.on('before-handle', func);
        return Sspa;
    };
    Sspa.afterHandle = function (func) {
        Sspa.$event.on('after-handle', func);
        return Sspa;
    };
    Sspa.handlePages = function (hash) {
        Sspa.$event.trigger('before-handle');
        var currPages = [], page = spaConf.page;
        var hashKeys = hash.split('/');
        //找到hash每一项对应的page
        for (var i = 0, hashKey = void 0; i < hashKeys.length; i++) {
            hashKey = hashKeys[i];
            page = page[hashKey];
            if (page) {
                currPages.push(page);
            }
            else {
                break;
            }
        }
        if (currPages.length == 0) {
            currPages.push(spaConf.page.default);
        }
        //加载未加载的page
        var defers = [];
        currPages.forEach(function (page, _) {
            if (!page.__loaded) {
                page.__loaded = true;
                defers.push(Sspa.loadPage(page));
            }
        });
        //当文件都加载成功，进行page显示
        $.when.apply(null, defers).done(function () {
            currPages.forEach(function (page) {
                var $pageContainer = $(page.sspa_container);
                $pageContainer.append(page.__$pageWrapper);
                page.__$container = $pageContainer;
                Sspa.$event.trigger('page-change', [page.sspa_path]);
                Sspa.showPage(page);
            });
            Sspa.$event.trigger('after-handle');
        });
    };
    Sspa.showPage = function (page) {
        page.__$container.find('div[sspa-page-id]').hide();
        page.__$container.find("div[sspa-page-id=\"" + page.sspa_path + "\"]").show();
        document.title = page.__title || 'small-spa';
    };
    Sspa.loadPage = function (page) {
        var retDefer = $.Deferred();
        var $pageWrapper = $('<div/>').attr('sspa-page-id', page.sspa_path).hide();
        page.__$pageWrapper = $pageWrapper;
        var timeTag = +new Date;
        $.get("" + spaConf.baseURL + page.sspa_path + "?_t=" + timeTag).done(function (html) {
            $pageWrapper.append(html);
            var defers = [];
            var $css = $pageWrapper.find('link');
            if ($css.length) {
                defers.push(Sspa.loadCss($css.eq(0).attr('href')));
            }
            var $js = $pageWrapper.find('script');
            if ($js.length) {
                defers.push(Sspa.loadJs($js.eq(0).attr('src')));
            }
            var $title = $pageWrapper.find('title');
            if ($title.length) {
                page.__title = $title.html();
            }
            $css.remove();
            $js.remove();
            $.when.apply(null, defers).done(function () {
                retDefer.resolve();
            });
        });
        return retDefer;
    };
    Sspa.loadCss = function (path) {
        var defer = $.Deferred();
        Load.loadCss(path, function () {
            defer.resolve();
        });
        return defer;
    };
    Sspa.loadJs = function (path) {
        var defer = $.Deferred();
        Load.loadJs(path, function () {
            defer.resolve();
        });
        return defer;
    };
    Sspa.init = function () {
        $('body').addClass('body');
        window.onhashchange = function () {
            Sspa.onHashChange();
        };
        Sspa.onHashChange();
    };
    Sspa.$event = $('<div/>');
    return Sspa;
}());
this.Sspa = Sspa;
