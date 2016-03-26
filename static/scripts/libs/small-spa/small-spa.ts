declare let $

import {BaseURL, PageMods, Pages} from "./_small-spa-conf"
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
        this.$html.parent().find('div[sspa-mod-id]').hide()
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
        let $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.modName)
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

            $defers.push(
                Loader.loadJs(src)
            )
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
    static pages = []
    static getPage(url){
        for (let i = 0; i < Page.pages.length; i++){
            let page = Page.pages[i]
            if (page.url.test(url)){
                return page
            }
        }
    }
    static show(url) {
        let page = Page.getPage(url)
        let $defers = []

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
    Page.pages.push(
        new Page(page.url, page.mods)
    )
})

Page.show(location.hash.slice(1))
window.onhashchange = ()=>{
    Page.show(location.hash.slice(1))
}