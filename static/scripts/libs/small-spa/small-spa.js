"use strict";
var _small_spa_conf_1 = require("./_small-spa-conf");
var _loader_1 = require("./_loader");
var PageMod = (function () {
    function PageMod(modName, modPath, container) {
        this.modName = modName;
        this.modPath = modPath;
        this.container = container;
        // prototypes
        this.title = '';
        this.$html = $('<div/>');
        this.loaded = false;
        this.appended = false;
    }
    PageMod.getMod = function (modName) {
        return this.mods[modName];
    };
    PageMod.loadMod = function (modName) {
        var $defer = $.Deferred();
        var mod = PageMod.mods[modName];
        if (mod.loaded) {
            $defer.resolve(mod);
        }
        else {
            mod.load().done(function () {
                mod.loaded = true;
                $defer.resolve(mod);
            });
        }
        return $defer;
    };
    PageMod.prototype.show = function () {
        var _this = this;
        if (!this.appended) {
            this.$html.appendTo($(this.container));
        }
        this.$html.parent().find('div[sspa-mod-id]').each(function (_, modDiv) {
            var $mod = $(modDiv);
            var modName = $mod.attr('sspa-mod-id');
            var isShow = $mod.css('display') != 'none';
            //如果是当前要显示的mod
            if (modName == _this.modName) {
                $mod.show();
                //如果之前是隐藏状态，则触发mod的show事件
                if (!isShow) {
                    SSpa.$event.trigger("SSpa_mod_" + modName + ".show");
                }
            }
            else {
                $mod.hide();
                //如果之前是显示状态，则触发mod的hide事件
                if (isShow) {
                    SSpa.$event.trigger("SSpa_mod_" + modName + ".hide");
                }
            }
        });
        this.$html.show();
    };
    PageMod.prototype.load = function () {
        var _this = this;
        var $defer = $.Deferred();
        var time = +new Date;
        $.get("" + _small_spa_conf_1.BaseURL + this.modPath + "?_t=" + time).done(function (html) {
            _this.__loadResources(html).done(function () {
                $defer.resolve();
            });
        });
        return $defer;
    };
    PageMod.prototype.__loadResources = function (html) {
        var $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.modName).hide();
        var $defers = [];
        this.title = $html.find('title').text();
        var $links = $html.find('link[href]');
        $links.each(function (_, link) {
            var $link = $(link);
            var href = $link.attr('href');
            $defers.push(_loader_1.Loader.loadCss(href));
        });
        var $scripts = $html.find('script[src]');
        $scripts.each(function (_, script) {
            var $script = $(script);
            var src = $script.attr('src');
            _loader_1.Loader.loadJs(src);
            // $defers.push(
            //     Loader.loadJs(src)
            // )
        });
        $links.remove();
        $scripts.remove();
        return $.when.apply(null, $defers);
    };
    // statics
    PageMod.mods = {};
    return PageMod;
}());
// init mods from conf
for (var modName in _small_spa_conf_1.PageMods) {
    var modObj = _small_spa_conf_1.PageMods[modName];
    PageMod.mods[modName] = new PageMod(modName, modObj.modPath, modObj.container);
}
var Page = (function () {
    // prototypes
    function Page(url, modules) {
        this.url = url;
        this.modules = modules;
    }
    Page.getPage = function (url) {
        return Page.pages[url];
    };
    Page.show = function (url) {
        var page = Page.getPage(url);
        var $defers = [];
        if (!page) {
            return false;
        }
        page.modules.forEach(function (modName) {
            $defers.push(PageMod.loadMod(modName));
        });
        $.when.apply(null, $defers).done(function () {
            page.modules.forEach(function (modName) {
                PageMod.getMod(modName).show();
            });
        });
    };
    // statics
    Page.pages = {};
    return Page;
}());
//init pages from conf
_small_spa_conf_1.Pages.forEach(function (page) {
    Page.pages[page.url] = new Page(page.url, page.mods);
});
var SSpa = (function () {
    function SSpa() {
    }
    SSpa.onModShow = function (modName, func) {
        this.$event.on("SSpa_mod_" + modName + ".show", func);
        return this;
    };
    SSpa.onModHide = function (modName, func) {
        this.$event.on("SSpa_mod_" + modName + ".hide", func);
        return this;
    };
    SSpa.getQuerysring = function (qstr) {
        var params = {};
        if (qstr) {
            qstr.split('&').forEach(function (a) {
                var xy = a.split('=');
                params[xy[0]] = xy[1];
            });
        }
        return params;
    };
    SSpa.getHash = function () {
        var hashInfo = location.hash.match(/^#([^\?]*)?\??(.*)?$/) || [];
        var url = hashInfo[1] || '';
        var qstr = hashInfo[2] || '';
        if (url[0] == '/') {
            url = url.slice(1);
        }
        if (url.slice(-1) == '/') {
            url = url.slice(0, -1);
        }
        // 检查是否有url rewrite
        _small_spa_conf_1.UrlRewrite.forEach(function (rule) {
            var _from = rule._from, _to = rule._to;
            var _fromType = Object.prototype.toString.call(_from).slice(8, -1);
            if (_fromType === 'String') {
                if (_from === url) {
                    url = _to;
                }
            }
            else if (_fromType === 'RegExp') {
                var matchObj_1 = url.match(_from);
                if (matchObj_1) {
                    var toUrl = _to.replace(/\$(\d+)/g, function (a, b) {
                        return matchObj_1[b];
                    });
                    var i = toUrl.indexOf('?');
                    if (i != -1) {
                        url = toUrl.slice(0, i);
                        if (qstr) {
                            qstr += '&';
                        }
                        qstr += toUrl.slice(i + 1);
                    }
                }
            }
        });
        var params = this.getQuerysring(qstr);
        return { url: url, params: params };
    };
    SSpa.$event = $('<div/>');
    return SSpa;
}());
this.SSpa = SSpa;
Page.show(SSpa.getHash().url);
window.onhashchange = function () {
    Page.show(SSpa.getHash().url);
};
