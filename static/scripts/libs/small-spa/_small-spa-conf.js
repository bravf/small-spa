"use strict";
//export let baseURL = '//s1.mljr.com/crm-pc'
exports.BaseURL = '//127.0.0.1/crm-pc';
exports.PageMods = {
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
};
exports.Pages = [
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
];
exports.UrlRewrite = [
    {
        _from: '',
        _to: 'login'
    },
    {
        _from: /^user\/(\d+)$/,
        _to: 'register?id=$1'
    }
];
