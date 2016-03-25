//export let baseURL = '//s1.mljr.com/crm-pc'
export let baseURL = '//127.0.0.1/crm-pc'

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
// }

export let mod = {
    hello: {
        sspa_tmpl: '/static/htmls/hello/hello.html',
        sspa_container: 'body'
    },
    frame: {
        sspa_tmpl: '/static/htmls/frame/frame.html',
        sspa_container: 'body',

        login: {
            sspa_tmpl: '/static/htmls/login/login.html',
            sspa_container: 'body .right-container'
        },
        register: {
            sspa_tmpl: '/static/htmls/register/register.html',
            sspa_container: 'body .right-container'
        }
    },

    user: {
        list: {
            sspa_tmpl: '/static/htmls/login/login.html',
            sspa_container: 'body'
        },
        detail: {
            sspa_tmpl: '/static/htmls/register/register.html',
            sspa_container: 'body'
        }
    }
}