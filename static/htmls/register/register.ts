declare var $, Sspa

let pagePath = '/static/htmls/register/register.html'

class Register {
    static sayHello() {
        console.log('hello, register')
        $('.js-register,.js-name').val('hello, register')
    }
    static init() {
        Register.sayHello()
    }
}

Sspa.onModShow(pagePath, () => {
    console.log('page-show')
})