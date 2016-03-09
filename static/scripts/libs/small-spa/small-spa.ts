declare let $
import sspaConf = require('./small-spa-conf')

interface IScriptNode extends HTMLScriptElement{
    onreadystatechange: Function,
    readyState: string
}
interface ILinkNode extends HTMLLinkElement{
    attachEvent: Function
}

class Load{
    static loadJs(url, callback){
        let node = <IScriptNode>document.createElement('script')
        node.setAttribute('src', url)
        document.getElementsByTagName('head')[0].appendChild(node)

        let isIE = navigator.userAgent.indexOf('MSIE') == -1 ? false : true

        if (isIE) {
            node.onreadystatechange = () => {
                if (node.readyState && node.readyState == 'loading'){
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
    static loadCss(url, callback){
        let node = <ILinkNode>document.createElement('link')
        node.setAttribute('rel', 'stylesheet')
        node.setAttribute('href', url)
        document.getElementsByTagName('head')[0].appendChild(node)

        if (node.attachEvent){
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
    static pageParams = []
    static $event = $('<div/>')

    static onHashChange(){
        let hash = location.hash.slice(2)
        Sspa.handlePages(hash)
    }

    static triggerEvent(eventName, eventParams?) {
        Sspa.$event.trigger(eventName, eventParams)
        return Sspa
    }

    static onEvent(eventName, func){
        Sspa.$event.on(eventName, func)
        return Sspa
    }

    static onStartHash(func){
        return Sspa.onEvent('start-hash', func)
    }
    static onEndHash(func){
        return Sspa.onEvent('end-hash', func)
    }

    static onPageShow(pagePath, func){
        return Sspa.onEvent('page-show', (e, path) => {
            if (pagePath == path) {
                func()
            }
        })
    }

    static handlePages(hash){
        Sspa.triggerEvent('start-hash')

        let currPages = []
        let page = sspaConf.page
        let hashKeys = hash.split('/')

        //找到hash每一项对应的page
        for (var i = 0, hashKey; i < hashKeys.length; i++){
            hashKey = hashKeys[i]
            page = page[hashKey]

            if (page){
                currPages.push(page)
            }
            else {
                break
            }
        }

        //剩余的当做页面的参数
        Sspa.pageParams = hashKeys.slice(i)

        if (currPages.length == 0){
            currPages.push(sspaConf.page.default)
        }

        //加载未加载的page
        let defers = []
        currPages.forEach((page, _) => {
            if (!page.__loaded){
                page.__loaded = true

                // 如果没有配置sspa_path，则是个虚page，起到命名空间作用
                if (page.sspa_path){
                    defers.push(Sspa.loadPage(page))
                }
            }
        })

        //当文件都加载成功，进行page显示
        $.when.apply(null, defers).done(()=>{
            currPages.forEach((page)=>{
                let $pageContainer = $(page.sspa_container)

                $pageContainer.append(page.__$pageWrapper)
                page.__$container = $pageContainer

                Sspa.showPage(page)
            })

            Sspa.triggerEvent('end-hash')
        })
    }

    static showPage(page) {
        page.__$container.find('div[sspa-page-id]').hide()
        page.__$container.find(`div[sspa-page-id="${page.sspa_path}"]`).show()
        document.title = page.__title || 'small-spa'
        Sspa.triggerEvent('page-show', [page.sspa_path])
    }

    static loadPage(page) {
        let retDefer = $.Deferred()
        let $pageWrapper = $('<div/>').attr('sspa-page-id', page.sspa_path).hide()
        page.__$pageWrapper = $pageWrapper

        let timeTag = +new Date
        $.get(`${sspaConf.baseURL}${page.sspa_path}?_t=${timeTag}`).done((html) => {
            $pageWrapper.append(html)

            let defers = []

            let $css = $pageWrapper.find('link')
            if ($css.length){
                defers.push(
                    Sspa.loadCss($css.eq(0).attr('href'))
                )
            }

            let $js = $pageWrapper.find('script')
            if ($js.length){
                defers.push(
                    Sspa.loadJs($js.eq(0).attr('src'))
                )
            }

            let $title = $pageWrapper.find('title')
            if ($title.length){
                page.__title = $title.html()
            }

            $css.remove()
            $js.remove()

            $.when.apply(null, defers).done(() => {
                retDefer.resolve()
            })
        })

        return retDefer
    }

    static loadCss(path) {
        let defer = $.Deferred()
        Load.loadCss(path, () => {
            defer.resolve()
        })
        return defer
    }

    static loadJs(path) {
        let defer = $.Deferred()
        Load.loadJs(path, () => {
            defer.resolve()
        })
        return defer
    }

    static init() {
        window.onhashchange = () => {
            Sspa.onHashChange()
        }

        Sspa.onHashChange()
    }
}

this.Sspa = Sspa
