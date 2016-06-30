"use strict";
var _small_spa_conf_1 = require("./_small-spa-conf");
var _loader_1 = require("./_loader");
var Module = (function () {
    function Module(name, path, $container) {
        this.name = name;
        this.path = path;
        this.$container = $container;
    }
    Module.getModule = function (name) {
        return this.modules[name];
    };
    Module.loadModule = function (name) {
        var $d = $.Deferred();
        var module = Module.getModule(name);
        if (module.loaded) {
            $d.resolve(module);
        }
        else {
            module.load().done(function (_) {
                module.loaded = true;
                $d.resolve(module);
            });
        }
        return $d;
    };
    Module.prototype.show = function () {
        var _this = this;
        if (!this.$html) {
            return false;
        }
        var $container = $(this.$container);
        if (!$container.length) {
            return false;
        }
        if (!this.appended) {
            this.appended = true;
            this.$html.appendTo($container);
        }
        if (this.$html.css('display') != 'none') {
            if (!this.isshowOnce) {
                this.isshowOnce = true;
                SSpa.trigger(this.name, 'isshow');
            }
            return false;
        }
        if (this.title) {
            document.title = this.title;
        }
        this.$html.parent().find('div[sspa-mod-id]').each(function (_, div) {
            var $module = $(div);
            var name = $module.attr('sspa-mod-id');
            var isShow = $module.css('display') != 'none';
            if (name == _this.name) {
                $module.show();
                if (!isShow) {
                    if (_this.$depDefer) {
                        _this.$depDefer.done(function (_) {
                            SSpa.trigger(name, 'ready');
                            SSpa.trigger(name, 'show');
                            SSpa.trigger(name, 'isshow');
                            _this.$depDefer = null;
                        });
                    }
                    else {
                        SSpa.trigger(name, 'show');
                        if (!_this.isshowOnce) {
                            _this.isshowOnce = true;
                            SSpa.trigger(name, 'isshow');
                        }
                    }
                }
            }
            else {
                $module.hide();
                if (isShow) {
                    SSpa.trigger(name, 'hide');
                }
            }
        });
    };
    Module.prototype.load = function () {
        var _this = this;
        var $d = $.Deferred();
        var t = +new Date;
        $.get("" + _small_spa_conf_1.BaseURL + this.path + "?_t=" + t).done(function (html) {
            _this.__loadSources(html);
            _this.show();
            $d.resolve();
        });
        return $d;
    };
    Module.prototype.__loadSources = function (html) {
        var $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.name).hide();
        var $ds = [];
        this.title = $html.find('title').text();
        var $links = $html.find('link[href]');
        $links.each(function (_, link) {
            var $link = $(link);
            var href = $link.attr('href');
            _loader_1.Loader.loadCss(href);
        });
        var $scripts = $html.find('script[src]');
        $scripts.each(function (_, script) {
            var $script = $(script);
            var src = $script.attr('src');
            $ds.push(_loader_1.Loader.loadJs(src));
        });
        $links.remove();
        $scripts.remove();
        this.$depDefer = $.when.apply(null, $ds);
    };
    Module.modules = {};
    return Module;
}());
var Page = (function () {
    function Page(url, modules) {
        this.url = url;
        this.modules = modules;
    }
    Page.getPage = function (url) {
        return Page.pages[url];
    };
    Page.showModules = function () {
        if (!this.currPage) {
            return false;
        }
        this.currPage.modules.forEach(function (name) {
            Module.getModule(name).show();
        });
    };
    Page.show = function (url) {
        var _this = this;
        var page = this.currPage = Page.getPage(url);
        if (!page) {
            return false;
        }
        page.modules.forEach(function (name) {
            Module.getModule(name).isshowOnce = false;
            Module.loadModule(name).done(function () {
                _this.showModules();
            });
        });
    };
    Page.pages = {};
    return Page;
}());
for (var name_1 in _small_spa_conf_1.PageMods) {
    var obj = _small_spa_conf_1.PageMods[name_1];
    Module.modules[name_1] = new Module(name_1, obj.modPath, obj.container);
}
_small_spa_conf_1.Pages.forEach(function (page) {
    Page.pages[page.url] = new Page(page.url, page.mods);
});
var SSpa = (function () {
    function SSpa() {
    }
    SSpa.trigger = function (name, type) {
        this.$event.trigger("SSpa_mod_" + name + "." + type);
        this.$event.trigger("SSpa_mod_*." + type, [name]);
    };
    SSpa.onModEvents = function (modName, events) {
        var mEvents = ['ready', 'isShow', 'show', 'hide'];
        for (var eventName in events) {
            if (-1 != mEvents.indexOf(eventName)) {
                this.$event.on("SSpa_mod_" + modName + "." + eventName.toLowerCase(), events[eventName]);
            }
        }
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
        _small_spa_conf_1.UrlRewrite.forEach(function (rule) {
            var _from = rule._from, _to = rule._to;
            var fromType = Object.prototype.toString.call(_from).slice(8, -1);
            if (fromType === 'String') {
                if (_from === url) {
                    url = _to;
                }
            }
            else if (fromType === 'RegExp') {
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
    SSpa.show = function () {
        Page.show(SSpa.getHash().url);
    };
    SSpa.$event = $('<div/>');
    return SSpa;
}());
SSpa.show();
window.onhashchange = function () {
    SSpa.show();
};
this.SSpa = SSpa;
