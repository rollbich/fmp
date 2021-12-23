/* -----------------------------------------------------------------------
        MIXIN class
    usage : 
    let Mixin1 = (superclass) => class extends superclass {
        nouvelle_methode () {}
    }
    let Mixin2 = (superclass) => class extends superclass {
        nouvelle_methode () {}
    }
    class BaseClass {}
    class myClass extends mixing(BaseClass).with(Mixin1, Mixin2) {

    }
   ---------------------------------------------------------------------- */
let mixin = (superclass) => new Mixinbuilder(superclass);

class Mixinbuilder {
    constructor(superclass) {
        this.superclass = superclass;
    }

    with(...mixins) {
        return mixins.reduce((c, mixin) => mixin(c), this.superclass || class {});
    }
}