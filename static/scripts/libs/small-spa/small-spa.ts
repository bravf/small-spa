declare let $
import spaConf = require('./small-spa-conf')

class Sspa {
    static $event = $('<div/>')

    static onHashChange(){
        let hash = location.hash.slice(1)
        Sspa.handlePages(hash)
    }

    static handlePages(hash){
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

                Sspa.showPage(page)
            })
        })
    }

    static showPage(page) {
        page.__$container.find('div[sspa-page-id]').hide()
        page.__$container.find(`div[sspa-page-id="${page.sspa_path}"]`).show()
    }

    static loadPage(page) {
        let $pageWrapper = $('<div/>').attr('sspa-page-id', page.sspa_path).hide()
        page.__$pageWrapper = $pageWrapper

        let timeTag = +new Date
        return $.get(`${spaConf.baseURL}${page.sspa_path}?_t=${timeTag}`).done((html) => {
            let lines = html.split('\n')
            let cssNodePath = lines[0]

            if (cssNodePath.indexOf('.css') != -1) {
                lines.shift()
                Sspa.loadCss(cssNodePath)
            }

            let jsNodePath = lines[lines.length - 1]
            if (jsNodePath.indexOf('.js') != -1) {
                lines.pop()
                Sspa.loadJs(jsNodePath)
            }

            $pageWrapper.append(lines.join('\n'))
            Sspa.$event.trigger('page-change', [page.path])
        })
    }

    static loadCss(nodePath) {
        let path = $(nodePath).prop('href')

        let node = document.createElement('link')
        node.rel = 'stylesheet'
        node.href = path

        document.getElementsByTagName('head')[0].appendChild(node)
    }

    static loadJs(path) {
        let node = document.createElement('script')
        node.src = $(path).prop('src')
        document.getElementsByTagName('head')[0].appendChild(node)
    }

    static init() {
        $('body').addClass('body')
        window.onhashchange = () => {
            Sspa.onHashChange()
        }

        Sspa.onHashChange()
    }
}

Sspa.init()
this.Sspa = Sspa
