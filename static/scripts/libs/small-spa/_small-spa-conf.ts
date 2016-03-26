//export let baseURL = '//s1.mljr.com/crm-pc'
export let BaseURL = '//127.0.0.1/crm-pc'

// let mod2 = {
//     hello: {
//         sspa_tmpl: '/static/htmls/hello/hello.html',
//         sspa_container: 'body',

//         __modId: 'mod-id-0',
//         __loaded: false,
//         __htmlContent: '',
//         __$modWrapper: $('<div/>'),
//         __$container: $(sspa_container),
//         __title: ''
//     }

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
            'frame',
            'register'
        ]
    }
]