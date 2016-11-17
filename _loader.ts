declare let $

interface IScriptNode extends HTMLScriptElement {
    onreadystatechange: Function,
    readyState: string
}
interface ILinkNode extends HTMLLinkElement {
    attachEvent: Function
}

export class Loader {
    static cache = {}
    static loadJs(url) {
        if (url in this.cache) {
            return this.cache[url]
        }

        let $defer = $.Deferred()
        this.cache[url] = $defer

        Loader.__loadJs(url, () => {
            $defer.resolve()
        })

        return $defer
    }
    static loadCss(url) {
        if (url in this.cache) {
            return this.cache[url]
        }

        let $defer = $.Deferred()
        this.cache[url] = $defer

        Loader.__loadCss(url, () => {
            $defer.resolve()
        })

        return $defer
    }
    static __loadJs(url, callback) {
        let node = <IScriptNode>document.createElement('script')
        node.setAttribute('src', url)
        document.getElementsByTagName('head')[0].appendChild(node)

        node.onload = node.onreadystatechange = ()=> {
            if (!node.readyState || node.readyState == 'loaded' || node.readyState == 'complete'){
                if (callback){
                    callback()
                }
                node.onload = node.onreadystatechange = null
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
            let isLoadered = false
            let sheet = _elem['sheet']
            let isOldWebKit = parseInt(navigator.userAgent.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536

            if (isOldWebKit) { //webkit 版本小于 536
                if (sheet) {
                    isLoadered = true
                }
            }
            else if (sheet) {
                try {
                    if (sheet.cssRules) {
                        isLoadered = true
                    }
                }
                catch (ex) {
                    if (ex.code === 'NS_ERROR_DOM_SECURITY_ERR') {
                        isLoadered = true
                    }
                }
            }

            if (isLoadered) {
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