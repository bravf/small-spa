var pagePath = '/static/htmls/register/register.html';
var Register = (function () {
    function Register() {
    }
    Register.sayHello = function () {
        console.log('hello, register');
        $('.js-register,.js-name').val('hello, register');
    };
    Register.init = function () {
        Register.sayHello();
    };
    return Register;
}());
Sspa.onModShow(pagePath, function () {
    console.log('page-show');
});
