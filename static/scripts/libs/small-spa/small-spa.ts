declare let $
import sspaConf = require('./small-spa-conf')

interface IScriptNode extends HTMLScriptElement{
    onreadystatechange: Function,
    readyState: string
}
interface ILinkNode extends HTMLLinkElement{
    attachEvent: Function
}

class Load {
    static loadJs(url) {
        let $defer = $.Deferred()

        Load.__loadJs(url, () => {
            $defer.resolve()
        })

        return $defer
    }
    static loadCss(url) {
        let $defer = $.Deferred()

        Load.__loadCss(url, () => {
            $defer.resolve()
        })

        return $defer
    }
    static __loadJs(url, callback) {
        let node = <IScriptNode>document.createElement('script')
        node.setAttribute('src', url)
        document.getElementsByTagName('head')[0].appendChild(node)

        let isIE = navigator.userAgent.indexOf('MSIE') == -1 ? false : true

        if (isIE) {
            node.onreadystatechange = () => {
                if (node.readyState && node.readyState == 'loading') {
                    return
                }
                if (callback) {
                    callback()
                }
            }
        }
        else {
            node.onload = function() {
                if (callback) {
                    callback()
                }
            }
        }
    }

    // 参考seajs
    static __loadCss(url, callback) {
        let node = <ILinkNode>document.createElement('link')
        node.setAttribute('rel', 'stylesheet')
        node.setAttribute('href', url)
        document.getElementsByTagName('head')[0].appendChild(node)

        if (node.attachEvent) {
            node.attachEvent('onload', callback)
        }
        else {
            setTimeout(() => {
                poll(node, callback)
            }, 0)
        }

        function poll(_elem, callback) {
            let isLoaded = false
            let sheet = _elem['sheet']
            let isOldWebKit = parseInt(navigator.userAgent.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536

            if (isOldWebKit) { //webkit 版本小于 536
                if (sheet) {
                    isLoaded = true
                }
            }
            else if (sheet) {
                try {
                    if (sheet.cssRules) {
                        isLoaded = true
                    }
                }
                catch (ex) {
                    if (ex.code === 'NS_ERROR_DOM_SECURITY_ERR') {
                        isLoaded = true
                    }
                }
            }

            if (isLoaded) {
                setTimeout(() => {
                    callback()
                }, 1)
            }
            else {
                setTimeout(() => {
                    poll(_elem, callback)
                }, 1)
            }
        }
    }
}

class Sspa{
    static modParams = []
    static __$event = $('<div/>')


    static __modId = 0
    static __getModId(){
        return `sspa-mod-id-${Sspa.__modId++}`
    }
    static __onHashChange(){
        let hash = location.hash.slice(2)
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

        if (currMods.length == 0){
            currMods.push(sspaConf.mod.default)
        }

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
                let $modContainer = $(mod.sspa_container)

                $modContainer.append(mod.__$modWrapper)
                mod.__$container = $modContainer

                Sspa.showMod(mod)
            })

            Sspa.__triggerEvent('end-hash')
        })
    }

    // 加载js,css资源
    static __loadResources(mod) {
        let modId = mod.__modId = Sspa.__getModId()
        let $html = mod.__$modWrapper = $('<div/>')
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
        Sspa.__triggerEvent('mod-show', [mod.sspa_path])
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

    static init() {
        window.onhashchange = () => {
            Sspa.__onHashChange()
        }

        Sspa.__onHashChange()
    }
}

this.Sspa = Sspa
