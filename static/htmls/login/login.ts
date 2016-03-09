declare var $, Sspa

let pagePath = '/static/htmls/login/login.html'

class Login {
    static sayHello() {
        console.log('hello, login')
        $('.js-login,.js-name').val('hello, login')
    }
    static init() {
        Login.sayHello()
    }
}


Sspa.onPageShow(pagePath, () => {
    console.log('page-show')
})