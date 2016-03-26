declare let $

import {BaseURL, PageMods, Pages} from "./_small-spa-conf"
import {Loader} from "./_loader"


class PageMod{
    static mods = {}
    static getMod(modName){
        var $defer = $.Deferred()
        var mod = PageMod.mods[name]

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

    public title = ''
    public $html = ''
    public loaded = false

    constructor(public modPath, public container){}
    load(){
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
        let $html = this.$html = $('<div/>').html(html).attr('sspa-mod-id', this.modPath)
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

    PageMod.mods[modName] = new PageMod(modObj.modPath, modObj.container)
}

class Page{
    static pages = []


    constructor(public url, public modules){}
    __bindEvents(){

    }
}

//init pages from conf
Pages.forEach((page)=>{
    Page.pages.push(
        new Page(page.url, page.mods)
    )
})

class Sspa{
    static modParams = []
    static __$event = $('<div/>')


    static __modId = 0
    static __getModId(){
        return `sspa-mod-id-${Sspa.__modId++}`
    }
    static __onHashChange(){
        let hash = Sspa.__getRealHash().slice(1)
        Sspa.__handleMods(hash)
    }

    static __triggerEvent(eventName, eventParams?) {
        Sspa.__$event.trigger(eventName, eventParams)
        return Sspa
    }

    static __onEvent(eventName, func){
        Sspa.__$event.on(eventName, func)
        return Sspa
    }

    static __handleMods(hash){
        Sspa.__triggerEvent('start-hash')

        let currMods = []
        let mod = sspaConf.mod
        let hashKeys = hash.split('/')

        //找到hash每一项对应的mod
        for (var i = 0, hashKey; i < hashKeys.length; i++){
            hashKey = hashKeys[i]
            mod = mod[hashKey]

            if (mod){
                currMods.push(mod)
            }
            else {
                break
            }
        }

        //剩余的当做页面的参数
        Sspa.modParams = hashKeys.slice(i)

        //加载未加载的mod
        let defers = []
        currMods.forEach((mod, _) => {
            if (!mod.__loaded){
                mod.__loaded = true

                // 如果没有配置sspa_path，则是个虚mod，起到命名空间作用
                if (mod.sspa_tmpl) {
                    defers.push(Sspa.loadMod(mod))
                }
            }
        })

        //当文件都加载成功，进行mod显示
        $.when.apply(null, defers).done(()=>{
            currMods.forEach((mod)=>{
                let $modContainer = mod.__$container = $(mod.sspa_container)
                $modContainer.append(mod.__$modWrapper)
                Sspa.showMod(mod)
            })

            Sspa.__triggerEvent('end-hash')
        })
    }

    // 加载js,css资源
    static __loadResources(mod) {
        let modId = mod.__modId = Sspa.__getModId()
        let $html = mod.__$modWrapper = $('<div/>').hide()
        let $defers = []

        mod.__title = $html.find('title').text()

        $html.attr('sspa-mod-id', modId)
            .html(mod.__htmlContent)

        let $links = $html.find('link[href]')
        $links.each((_, link) => {
            let $link = $(link)
            let href = $link.attr('href')

            $defers.push(
                Load.loadCss(href)
            )
        })

        let $scripts = $html.find('script[src]')
        $scripts.each((_, script) => {
            let $script = $(script)
            let src = $script.attr('src')

            $defers.push(
                Load.loadJs(src)
            )
        })

        $links.remove()
        $scripts.remove()

        $html.appendTo($(mod.sspa_container))
        return $.when.apply(null, $defers)
    }

    static loadMod(mod) {
        if (mod.sspa_tmpl.slice(-5) === '.html'){
            let $defer = $.Deferred()
            let time = +new Date

            $.get(`${sspaConf.baseURL}${mod.sspa_tmpl}?_t=${time}`).done((html) => {
                mod.__htmlContent = html
                Sspa.__loadResources(mod).done(() => {
                    $defer.resolve()
                })
            })
            return $defer
        }
        else {
            mod.__htmlContent = mod.sspa_tmpl
            return Sspa.__loadResources(mod)
        }
    }

    static showMod(mod) {
        mod.__$container.find('div[sspa-mod-id]').hide()
        mod.__$container.find(`div[sspa-mod-id="${mod.__modId}"]`).show()
        document.title = mod.__title || 'small-spa'
        Sspa.__triggerEvent('mod-show', [mod.sspa_tmpl])
    }

    // events
    static onStartHash(func) {
        return Sspa.__onEvent('start-hash', func)
    }

    static onEndHash(func) {
        return Sspa.__onEvent('end-hash', func)
    }

    static onModShow(modPath, func) {
        return Sspa.__onEvent('mod-show', (e, path) => {
            if (modPath == path) {
                func()
            }
        })
    }

    // url rewrite处理
    static __rewriteTables = []

    static urlRewrite(a, b){
        Sspa.__rewriteTables.push({
            a, b
        })
        return Sspa
    }

    static __getRealHash(){
        let hash = location.hash.slice(1)
        var realHash = hash

        $.each(Sspa.__rewriteTables, (_, ab)=>{
            let {a ,b} = ab

            if (typeof a === 'string'){
                if (hash == a){
                    realHash = b
                    return false
                }
            }
            else {
                if (a.test(hash)){
                    realHash = b
                    return false
                }
            }
        })

        return realHash
    }

    static init() {
        window.onhashchange = () => {
            Sspa.__onHashChange()
        }

        Sspa.__onHashChange()
    }
}

this.Sspa = Sspa
