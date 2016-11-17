## 前端单页框架

---
### 作者
`
dongdong.zhang
`

---
### 简介
`
前端单页框架
`

---
### 依赖

`
jquery
`

---
### 使用方法

1. 在html中全局引用small-spa.js, script(src="/biglib/small-spa/smll-spa.js")
2. 在app.js中执行init

    
        //初始化路由
        void function (){
            let BaseURL = '/biglib-test'

            let PageMods = {
                list: {
                    modPath: '/static/htmls/list/list.html',
                    container: 'body'
                },
                detail: {
                    modPath: '/static/htmls/detail/detail.html',
                    container: 'body'
                }
            }

            let Pages = [
                {
                    url: 'list',
                    mods: [
                        'list'
                    ]
                },
                {
                    url: 'detail',
                    mods: [
                        'detail'            
                    ]
                }
            ]

            let UrlRewrite = [
                {
                    _from: '',
                    _to: 'list'
                }
            ]

            SSpa.init(BaseURL, PageMods, Pages, UrlRewrite)
        }()