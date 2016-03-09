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
console.log(Sspa.pageParams);
Sspa.onPageShow(pagePath, function () {
    console.log('page-show');
});
// Sspa.onEndPage(pagePath, (params) => {
//     console.log(params)
//     console.log('page-end')
// })
