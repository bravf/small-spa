"use strict";
var spaConf = require('./small-spa-conf');
var Sspa = (function () {
    function Sspa() {
    }
    Sspa.onHashChange = function () {
        var hash = location.hash.slice(1);
        Sspa.handlePages(hash);
    };
    Sspa.handlePages = function (hash) {
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
        });
    };
    Sspa.showPage = function (page) {
        page.__$container.find('div[sspa-page-id]').hide();
        page.__$container.find("div[sspa-page-id=\"" + page.sspa_path + "\"]").show();
    };
    Sspa.loadPage = function (page) {
        var $pageWrapper = $('<div/>').attr('sspa-page-id', page.sspa_path).hide();
        page.__$pageWrapper = $pageWrapper;
        var timeTag = +new Date;
        return $.get("" + spaConf.baseURL + page.sspa_path + "?_t=" + timeTag).done(function (html) {
            var lines = html.split('\n');
            var cssNodePath = lines[0];
            if (cssNodePath.indexOf('.css') != -1) {
                lines.shift();
                Sspa.loadCss(cssNodePath);
            }
            var jsNodePath = lines[lines.length - 1];
            if (jsNodePath.indexOf('.js') != -1) {
                lines.pop();
                Sspa.loadJs(jsNodePath);
            }
            $pageWrapper.append(lines.join('\n'));
        });
    };
    Sspa.loadCss = function (nodePath) {
        var path = $(nodePath).prop('href');
        var node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = path;
        document.getElementsByTagName('head')[0].appendChild(node);
    };
    Sspa.loadJs = function (path) {
        var node = document.createElement('script');
        node.src = $(path).prop('src');
        document.getElementsByTagName('head')[0].appendChild(node);
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
Sspa.init();
this.Sspa = Sspa;
