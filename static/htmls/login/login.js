var codePath = '/static/htmls/login/login.html';
var Login = (function () {
    function Login() {
    }
    Login.sayHello = function () {
        console.log('hello, login');
        $('.js-login,.js-name').val('hello, login');
    };
    Login.init = function () {
        Login.sayHello();
    };
    return Login;
}());
Login.init();
Sspa.$event.on('page-change', function (e, path) {
    if (path == codePath) {
        Login.init();
    }
});
