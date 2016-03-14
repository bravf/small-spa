var pagePath = '/static/htmls/login/login.html';
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
Sspa.onModShow(pagePath, function () {
    console.log('page-show');
});
