function prison(params) {
    var prisoner = 'tbag';
    return {
        prisoner: prisoner,
        getPrisoner:function(){return prisoner;}
        };
}

var prisonA = prison();
console.log(prisonA.prisoner);