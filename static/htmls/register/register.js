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
Register.init();
Sspa.$event.on('page-change', function (e, path) {
    if (path == pagePath) {
        Register.init();
    }
});
