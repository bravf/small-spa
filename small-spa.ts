declare let $
import {Loader} from "./_loader"

//全局变量
let BaseURL
let PageMods
let Pages
let UrlRewrite

class Module{
    static modules = {}

    static getModule(name){
        return this.modules[name]
    }

    static loadModule(name){
        let $d = $.Deferred()
        let module = Module.getModule(name)

        if (module.loaded){
            $d.resolve(module)
        }
        else {
            module.load().done(_=>{
                module.loaded = true
                $d.resolve(module)
            })
        }

        return $d
    }

    public title
    public $html
    public loaded
    public appended

    private isshowOnce  //每次hashchange只执行一次
    private $depDefer   //这个东西是为了第一次触发mod.show时候依赖js文件，第一次用完之后就销毁

    constructor(public name, public path, public $container){}

    public show(){
        //检查自己是否下载完毕
        if (!this.$html){
            return false
        }

        //检查容器是否准备完毕
        let $container = $(this.$container)
        if (!$container.length){
            return false
        }

        //检查是否已经插入文档
        if (!this.appended){
            this.appended = true
            this.$html.appendTo($container)
        }

        //如果已经是显示状态
        if (this.$html.css('display') != 'none'){
            if (!this.isshowOnce){
                this.isshowOnce = true
                SSpa.trigger(this.name, 'isshow')
            }
            return false
        }

        if (this.title){
            document.title = this.title
        }

        $container.find('div[sspa-mod-id]').each((_, div) => {
            let $module = $(div)
            let name = $module.attr('sspa-mod-id')
            let isShow = $module.css('display') != 'none'

            //如果是当前要显示的module
            if (name == this.name){
                $module.show()

                //如果之前是隐藏状态
                if (!isShow){
                    if (this.$depDefer){
                        this.$depDefer.done(_ => {
                            SSpa.trigger(name, 'ready')
                            SSpa.trigger(name, 'show')
                            SSpa.trigger(name, 'isshow')
                            this.$depDefer = null
                        })
                    }
                    else {
                        SSpa.trigger(name, 'show')
                        if (!this.isshowOnce){
                            this.isshowOnce = true
                            SSpa.trigger(name, 'isshow')
                        }
                    }
                }
            }
            else {
                $module.hide()

                //如果之前是显示状态
                if (isShow){
                    SSpa.trigger(name, 'hide')
                }
            }
        })
    }

    public load(){
        let $d = $.Deferred()

        $.get(`${BaseURL}${this.path}`).done((html) => {
            this.__loadSources(html)
            $d.resolve()
        })

        return $d
    }

    __loadSources(html){
        let $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.name).hide()
        let $ds = []

        this.title = $html.find('title').text()
        let $links = $html.find('link[href]')
        $links.each((_, link) => {
            let $link = $(link)
            let href = $link.attr('href')

            Loader.loadCss(href)
        })

        let $scripts = $html.find('script[src]')
        $scripts.each((_, script) => {
            let $script = $(script)
            let src = $script.attr('src')

            $ds.push(
                Loader.loadJs(src)
            )
        })

        $links.remove()
        $scripts.remove()

        this.$depDefer = $.when.apply(null, $ds)
    }

}

class Page{
    static currPage
    static pages = {}

    static getPage(url){
        return Page.pages[url]
    }

    static showModules(){
        if (!this.currPage) {
            return false
        }

        this.currPage.modules.forEach((name) => {
            Module.getModule(name).show()
        })
    }

    static show(url){
        let page = this.currPage = Page.getPage(url)

        if (!page) {
            return false
        }

        page.modules.forEach((name) => {
            //每一次page.show重置isshowOnce
            Module.getModule(name).isshowOnce = false
            Module.loadModule(name).done(() => {
                this.showModules()
            })
        })
    }

    constructor(public url, public modules) { }
}

class SSpa{
    static $event = $('<div/>')

    static trigger(name, type){
        this.$event.trigger(`SSpa_mod_${name}.${type}`)
        this.$event.trigger(`SSpa_mod_*.${type}`, [name])
    }

    static onModEvents(modName, events) {
        let mEvents = ['ready', 'isShow', 'show', 'hide']

        for (let eventName in events) {
            if (-1 != mEvents.indexOf(eventName)) {
                this.$event.on(`SSpa_mod_${modName}.${eventName.toLowerCase()}`, events[eventName])
            }
        }

        return this
    }

    static getQuerysring(qstr) {
        let params = {}

        if (qstr) {
            qstr.split('&').forEach((a) => {
                let xy = a.split('=')
                params[xy[0]] = xy[1]
            })
        }

        return params
    }

    static getHash() {
        let hashInfo = location.hash.match(/^#([^\?]*)?\??(.*)?$/) || []

        var url = hashInfo[1] || ''
        var qstr = hashInfo[2] || ''

        if (url[0] == '/') {
            url = url.slice(1)
        }
        if (url.slice(-1) == '/') {
            url = url.slice(0, -1)
        }

        // 检查是否有url rewrite
        UrlRewrite.forEach((rule) => {
            let {_from, _to} = rule
            let fromType = Object.prototype.toString.call(_from).slice(8, -1)

            if (fromType === 'String') {
                if (_from === url) {
                    url = _to
                }
            }
            else if (fromType === 'RegExp') {
                let matchObj = url.match(_from)
                if (matchObj) {
                    let toUrl = _to.replace(/\$(\d+)/g, function(a, b) {
                        return matchObj[b]
                    })

                    let i = toUrl.indexOf('?')
                    if (i != -1) {
                        url = toUrl.slice(0, i)

                        if (qstr) {
                            qstr += '&'
                        }
                        qstr += toUrl.slice(i + 1)
                    }
                }
            }

        })

        let params = this.getQuerysring(qstr)

        return { url, params }
    }

    static show() {
        Page.show(SSpa.getHash().url)
    }

    static init(_BaseURL, _PageMods, _Pages, _UrlRewrite) {
        BaseURL = _BaseURL
        PageMods = _PageMods
        Pages = _Pages
        UrlRewrite = _UrlRewrite

        //根据配置生成模块对象
        for (let name in PageMods){
            let obj = PageMods[name]

            Module.modules[name] = new Module(name, obj.modPath, obj.container)
        }

        //根据配置生成页面对象
        Pages.forEach((page) => {
            Page.pages[page.url] = new Page(page.url, page.mods)
        })

        SSpa.show()
        registerHashChange(_=>{
            SSpa.show()
        })
    }
}

this.SSpa = SSpa

// 修正hashchang事件
function registerHashChange(hashChange) {
    if (!('onhashchange' in window)) {
        var oldHref = location.href;
        setInterval(function() {
            var newHref = location.href;
            if (oldHref !== newHref) {
                var _oldHref = oldHref;
                oldHref = newHref;
                hashChange.call(window, {
                    'type': 'hashchange',
                    'newURL': newHref,
                    'oldURL': _oldHref
                });
            }
        }, 100);
    } else if (window.addEventListener) {
        window.addEventListener("hashchange", hashChange, false);
    }
    else if (window['attachEvent']) {
        window['attachEvent']("onhashchange", hashChange);
    }
}

