declare let $

import {BaseURL, PageMods, Pages, UrlRewrite} from "./_small-spa-conf"
import {Loader} from "./_loader"

class PageMod{
    // statics
    static mods = {}

    static getMod(modName){
        return this.mods[modName]
    }

    static loadMod(modName){
        var $defer = $.Deferred()
        var mod = PageMod.mods[modName]

        if (mod.loaded){
            $defer.resolve(mod)
        }
        else {
            mod.load().done(()=>{
                mod.loaded = true
                $defer.resolve(mod)
            })
        }

        return $defer
    }

    // prototypes
    public title = ''
    public $html = $('<div/>')
    public loaded = false
    public appended = false

    constructor(public modName, public modPath, public container){}
    public show(){
        if (!this.appended) {
            this.$html.appendTo($(this.container))
        }

        this.$html.parent().find('div[sspa-mod-id]').each((_, modDiv)=>{
            let $mod = $(modDiv)
            let modName = $mod.attr('sspa-mod-id')
            let isShow = $mod.css('display') != 'none'

            //如果是当前要显示的mod
            if (modName == this.modName){
                $mod.show()
                //如果之前是隐藏状态，则触发mod的show事件
                if (!isShow){
                    SSpa.$event.trigger(`SSpa_mod_${modName}.show`)
                }
            }
            else {
                $mod.hide()
                //如果之前是显示状态，则触发mod的hide事件
                if (isShow){
                    SSpa.$event.trigger(`SSpa_mod_${modName}.hide`)
                }
            }
        })

        this.$html.show()
    }
    public load(){
        let $defer = $.Deferred()
        let time = +new Date

        $.get(`${BaseURL}${this.modPath}?_t=${time}`).done((html) => {
            this.__loadResources(html).done(() => {
                $defer.resolve()
            })
        })
        return $defer
    }
    __loadResources(html){
        let $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.modName).hide()
        let $defers = []

        this.title = $html.find('title').text()

        let $links = $html.find('link[href]')
        $links.each((_, link) => {
            let $link = $(link)
            let href = $link.attr('href')

            $defers.push(
                Loader.loadCss(href)
            )
        })

        let $scripts = $html.find('script[src]')
        $scripts.each((_, script) => {
            let $script = $(script)
            let src = $script.attr('src')

            Loader.loadJs(src)
            // $defers.push(
            //     Loader.loadJs(src)
            // )
        })

        $links.remove()
        $scripts.remove()

        return $.when.apply(null, $defers)
    }
}

// init mods from conf
for (let modName in PageMods){
    let modObj = PageMods[modName]

    PageMod.mods[modName] = new PageMod(modName, modObj.modPath, modObj.container)
}

class Page{
    // statics
    static pages = {}
    static getPage(url){
        return Page.pages[url]
    }
    static show(url) {
        let page = Page.getPage(url)
        let $defers = []

        if (!page){
            return false
        }

        page.modules.forEach((modName) => {
            $defers.push(
                PageMod.loadMod(modName)
            )
        })

        $.when.apply(null, $defers).done(()=>{
            page.modules.forEach((modName)=>{
                PageMod.getMod(modName).show()
            })
        })
    }

    // prototypes
    constructor(public url, public modules){}
}

//init pages from conf
Pages.forEach((page)=>{
    Page.pages[page.url] = new Page(page.url, page.mods)
})

class SSpa{
    static $event = $('<div/>')

    static onModShow(modName, func){
        this.$event.on(`SSpa_mod_${modName}.show`, func)
        return this
    }

    static onModHide(modName, func){
        this.$event.on(`SSpa_mod_${modName}.hide`, func)
        return this
    }

    static getQuerysring(qstr){
        let params = {}

        if (qstr) {
            qstr.split('&').forEach((a) => {
                let xy = a.split('=')
                params[xy[0]] = xy[1]
            })
        }

        return params
    }

    static getHash(){
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
        UrlRewrite.forEach((rule)=>{
            let {_from, _to} = rule
            let _fromType = Object.prototype.toString.call(_from).slice(8, -1)

            if (_fromType === 'String'){
                if (_from === url){
                    url = _to
                }
            }
            else if (_fromType === 'RegExp'){
                let matchObj = url.match(_from)
                if (matchObj){
                    let toUrl = _to.replace(/\$(\d+)/g, function (a, b){
                        return matchObj[b]
                    })

                    let i = toUrl.indexOf('?')
                    if (i != -1){
                        url = toUrl.slice(0, i)

                        if (qstr){
                            qstr += '&'
                        }
                        qstr += toUrl.slice(i+1)
                    }
                }
            }

        })

        let params = this.getQuerysring(qstr)

        return {url, params}
    }
}

this.SSpa = SSpa

Page.show(SSpa.getHash().url)
window.onhashchange = ()=>{
    Page.show(SSpa.getHash().url)
}