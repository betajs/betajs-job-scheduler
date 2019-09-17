module.exports = BetaJS.Jobs.AbstractExecution.extend(null, function (inherited) {
    return {

        _asyncFib: function (n) {
            var valuePromise = n > 1 ? this._asyncFib(n-1).mapASuccess(function (k) {
                return this._asyncFib(n-2).mapASuccess(function (l) {
                    return (k + l) % this._jobModel.get("fib_mod");
                }, this);
            }, this) : BetaJS.Promise.value(1);
            return valuePromise.success(function (v) {
                if (this._jobModel.get("fib_cur_n") < n) {
                    this._jobModel.set("fib_cur_n", n);
                    this._jobModel.set("fib_value", v);
                }
            }, this);
        },

        _run: function() {
            this._asyncFib(this._jobModel.get("fib_n")).success(function () {
                this._jobSuccess();
            }, this);
        },

        _progress: function() {
            return this._jobModel.get("fib_cur_n") / this._jobModel.get("fib_n");
        }

    };

});