Scoped.extend("module:DirectInvocation", [
    "module:AbstractInvocation",
    "base:Promise",
    "base:Async"
], function(Invocation, Promise, Async, scoped) {
    return Invocation.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(directHandler) {
                inherited.constructor.call(this);
                this._directHandler = directHandler;
            },

            _dispatchJob: function(jobModel) {
                Async.eventually(function() {
                    this._directHandler.handleJob(jobModel);
                }, this);
                return Promise.value({
                    receipt: "direct"
                });
            }

        };
    });
});