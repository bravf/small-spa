//export let baseURL = '//s1.mljr.com/crm-pc'
//export let BaseURL = '//127.0.0.1/crm-pc'

export let BaseURL = '/small-spa'

export let PageMods = {
    frame: {
        modPath: '/static/htmls/frame/frame.html',
        container: 'body'
    },
    login: {
        modPath: '/static/htmls/login/login.html',
        container: 'body .right-container'
    },
    register: {
        modPath: '/static/htmls/register/register.html',
        container: 'body .right-container'
    }
}

export let Pages = [
    {
        url: 'login',
        mods: [

            'frame',
            'login'
        ]
    },
    {
        url: 'register',
        mods: [
            'register',
            'frame',
            //'register'
        ]
    }
]

export let UrlRewrite = [
    {
        _from: '',
        _to: 'login'
    },
    {
        _from: /^user\/(\d+)$/,
        _to: 'register?id=$1'
    }
]
