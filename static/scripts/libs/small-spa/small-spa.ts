declare let $

import {BaseURL, PageMods, Pages, UrlRewrite} from "./_small-spa-conf"
import {Loader} from "./_loader"

class PageMod {
    // statics
    static mods = {}
    static getMod(modName) {
        return this.mods[modName]
    }
    static loadMod(modName) {
        var $defer = $.Deferred()
        var mod = PageMod.mods[modName]

        if (mod.loaded) {
            $defer.resolve(mod)
        }
        else {
            mod.load().done(() => {
                mod.loaded = true
                $defer.resolve(mod)
            })
        }

        return $defer
    }

    // prototypes
    public title
    public $html
    public loaded = false
    public appended = false

    //每次hashchange只能执行一次isshow
    public isshowOnce = false

    //这个东西是为了第一次触发mod.show时候依赖js文件，第一次用完之后就销毁
    public jsFilesDefer

    constructor(public modName, public modPath, public container) { }
    public show() {
        //检查自己是否下载完毕
        if (!this.$html) {
            return false
        }

        //检查容器是否ready
        let $container = $(this.container)
        if (!$container.length) {
            return false
        }

        //检查是否已经插入文档
        if (!this.appended) {
            this.appended = true
            this.$html.appendTo($container)
        }

        //如果已经是显示状态
        if (this.$html.css('display') != 'none') {
            if (!this.isshowOnce) {
                this.isshowOnce = true
                //不论之前什么状态，都触发isshow事件
                SSpa.$event.trigger(`SSpa_mod_*.isshow`, [this.modName])
                SSpa.$event.trigger(`SSpa_mod_${this.modName}.isshow`)
            }
            return false
        }

        if (this.title) {
            document.title = this.title
        }

        this.$html.parent().find('div[sspa-mod-id]').each((_, modDiv) => {
            let $mod = $(modDiv)
            let modName = $mod.attr('sspa-mod-id')
            let isShow = $mod.css('display') != 'none'

            //如果是当前要显示的mod
            if (modName == this.modName) {
                $mod.show()

                //如果之前是隐藏状态，则触发mod的show事件
                if (!isShow) {
                    if (this.jsFilesDefer) {
                        this.jsFilesDefer.done(() => {
                            SSpa.$event.trigger(`SSpa_mod_*.ready`, [modName])
                            SSpa.$event.trigger(`SSpa_mod_${modName}.ready`)
                            SSpa.$event.trigger(`SSpa_mod_*.show`, [modName])
                            SSpa.$event.trigger(`SSpa_mod_${modName}.show`)
                            //不论之前什么状态，都触发isshow事件
                            SSpa.$event.trigger(`SSpa_mod_*.isshow`, [modName])
                            SSpa.$event.trigger(`SSpa_mod_${modName}.isshow`)
                            this.jsFilesDefer = null
                        })
                    }
                    else {
                        SSpa.$event.trigger(`SSpa_mod_*.show`, [modName])
                        SSpa.$event.trigger(`SSpa_mod_${modName}.show`)

                        if (!this.isshowOnce) {
                            this.isshowOnce = true
                            //不论之前什么状态，都触发isshow事件
                            SSpa.$event.trigger(`SSpa_mod_*.isshow`, [this.modName])
                            SSpa.$event.trigger(`SSpa_mod_${this.modName}.isshow`)
                        }
                    }
                }
            }
            else {
                $mod.hide()
                //如果之前是显示状态，则触发mod的hide事件
                if (isShow) {
                    SSpa.$event.trigger(`SSpa_mod_*.hide`, [modName])
                    SSpa.$event.trigger(`SSpa_mod_${modName}.hide`)
                }
            }
        })
    }
    public load() {
        let $defer = $.Deferred()
        let time = +new Date

        $.get(`${BaseURL}${this.modPath}?_t=${time}`).done((html) => {
            this.__loadResources(html)
            this.show()
            $defer.resolve()
        })

        return $defer
    }
    __loadResources(html) {
        let $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.modName).hide()
        let $defers = []

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

            $defers.push(
                Loader.loadJs(src)
            )
        })

        $links.remove()
        $scripts.remove()

        this.jsFilesDefer = $.when.apply(null, $defers)
    }
}

// init mods from conf
for (let modName in PageMods) {
    let modObj = PageMods[modName]

    PageMod.mods[modName] = new PageMod(modName, modObj.modPath, modObj.container)
}

class Page {
    // statics
    static currPage: Page
    static pages = {}
    static getPage(url) {
        return Page.pages[url]
    }
    static showMods() {
        if (!this.currPage) {
            return false
        }

        this.currPage.modules.forEach((modName) => {
            PageMod.getMod(modName).show()
        })
    }
    static show(url) {
        let page = this.currPage = Page.getPage(url)

        if (!page) {
            return false
        }

        page.modules.forEach((modName) => {
            //每一次page.show重置isshowOnce
            PageMod.getMod(modName).isshowOnce = false
            PageMod.loadMod(modName).done(() => {
                this.showMods()
            })
        })
    }

    // prototypes
    constructor(public url, public modules) { }
}

//init pages from conf
Pages.forEach((page) => {
    Page.pages[page.url] = new Page(page.url, page.mods)
})

class SSpa {
    static $event = $('<div/>')
    static onModReady(modName, func) {
        this.$event.on(`SSpa_mod_${modName}.ready`, func)
        return this
    }
    static onModIsShow(modName, func) {
        this.$event.on(`SSpa_mod_${modName}.isshow`, func)
        return this
    }
    static onModShow(modName, func) {
        this.$event.on(`SSpa_mod_${modName}.show`, func)
        return this
    }
    static onModHide(modName, func) {
        this.$event.on(`SSpa_mod_${modName}.hide`, func)
        return this
    }
    static onModEvents(modName, events) {
        let modEvents = ['ready', 'isShow', 'show', 'hide']
        for (let eventName in events) {
            if (-1 != modEvents.indexOf(eventName)) {
                let eventCallback = events[eventName]
                let methodName = eventName[0].toUpperCase() + eventName.slice(1)
                this[`onMod${methodName}`](modName, eventCallback)
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
}

SSpa.show()
window.onhashchange = () => {
    SSpa.show()
}

this.SSpa = SSpa
