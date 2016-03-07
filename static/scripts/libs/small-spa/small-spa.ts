declare let $
import spaConf = require('./small-spa-conf')


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
        node.src = url
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
        node.rel = 'stylesheet'
        node.href = url
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
    static $event = $('<div/>')

    static onHashChange(){
        let hash = location.hash.slice(1)
        Sspa.handlePages(hash)
    }

    static beforeHandle(func){
        Sspa.$event.on('before-handle', func)
        return Sspa
    }
    static afterHandle(func){
        Sspa.$event.on('after-handle', func)
        return Sspa
    }

    static handlePages(hash){
        Sspa.$event.trigger('before-handle')

        let currPages = [], page = spaConf.page
        let hashKeys = hash.split('/')

        //找到hash每一项对应的page
        for (let i = 0, hashKey; i < hashKeys.length; i++){
            hashKey = hashKeys[i]
            page = page[hashKey]

            if (page){
                currPages.push(page)
            }
            else {
                break
            }
        }

        if (currPages.length == 0){
            currPages.push(spaConf.page.default)
        }

        //加载未加载的page
        let defers = []
        currPages.forEach((page, _) => {
            if (!page.__loaded){
                page.__loaded = true
                defers.push(Sspa.loadPage(page))
            }
        })

        //当文件都加载成功，进行page显示
        $.when.apply(null, defers).done(()=>{
            currPages.forEach((page)=>{
                let $pageContainer = $(page.sspa_container)

                $pageContainer.append(page.__$pageWrapper)
                page.__$container = $pageContainer

                Sspa.$event.trigger('page-change', [page.sspa_path])
                Sspa.showPage(page)
            })

            Sspa.$event.trigger('after-handle')
        })
    }

    static showPage(page) {
        page.__$container.find('div[sspa-page-id]').hide()
        page.__$container.find(`div[sspa-page-id="${page.sspa_path}"]`).show()
        document.title = page.__title || 'small-spa'
    }

    static loadPage(page) {
        let retDefer = $.Deferred()
        let $pageWrapper = $('<div/>').attr('sspa-page-id', page.sspa_path).hide()
        page.__$pageWrapper = $pageWrapper

        let timeTag = +new Date
        $.get(`${spaConf.baseURL}${page.sspa_path}?_t=${timeTag}`).done((html) => {
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
        $('body').addClass('body')
        window.onhashchange = () => {
            Sspa.onHashChange()
        }

        Sspa.onHashChange()
    }
}

this.Sspa = Sspa
