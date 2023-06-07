module.exports = BetaJS.Jobs.AbstractModel.extend(null, function (inherited) {
    return {

        _resourcePredictions: function() {
            return {

            };
        }

    };
}, function (inherited) {
    return {

        _initializeScheme: function() {
            return BetaJS.Objs.extend({
                fib_n: {
                    type: "int"
                },
                fib_mod: {
                    type: "int",
                    def: 0
                },
                fib_cur_n: {
                    type: "int",
                    def: 0
                },
                fib_value: {
                    type: "int",
                    def: 0
                }
            }, inherited._initializeScheme.call(this));
        }

    };
});