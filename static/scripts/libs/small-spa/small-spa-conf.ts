export let baseURL = '//s1.mljr.com/crm-pc'

export let page = {
    default: null,
    hello: {
        sspa_path: '/static/htmls/hello/hello.html',
        sspa_container: 'body'
    },
    frame: {
        sspa_path: '/static/htmls/frame/frame.html',
        sspa_container: 'body',

        login: {
            sspa_path: '/static/htmls/login/login.html',
            sspa_container: 'body .right-container'
        },
        register: {
            sspa_path: '/static/htmls/register/register.html',
            sspa_container: 'body .right-container'
        }
    },

    user: {
        list: {
            sspa_path: '/static/htmls/login/login.html',
            sspa_container: 'body'
        },
        detail: {
            sspa_path: '/static/htmls/register/register.html',
            sspa_container: 'body'
        }
    }
}

page.default = page.hello