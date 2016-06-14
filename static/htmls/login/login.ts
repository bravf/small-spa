declare var $, Sspa

SSpa.onModEvents('login', {
    isShow : _ => {
        console.log('login isShow')
    },
    show: _=>{
        console.log('login show')
    }
})
