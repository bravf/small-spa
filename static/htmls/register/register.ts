declare var $, SSpa

SSpa.onModEvents('register', {
    isShow : _ => {
        console.log('register isShow')
    },
    show: _=>{
        console.log('register show')
    }
})
