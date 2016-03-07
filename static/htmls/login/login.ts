declare var $, Sspa

let codePath = '/static/htmls/login/login.html'

class Login {
    static sayHello() {
        console.log('hello, login')
        $('.js-login,.js-name').val('hello, login')
    }
    static init() {
        Login.sayHello()
    }
}

Login.init()

Sspa.$event.on('page-change', (e, path) => {
    if (path == codePath) {
        Login.init()
    }
})