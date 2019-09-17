Scoped.extend("module:Handler", [
    "base:Class"
], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(scheduler) {
                inherited.constructor.call(this);
                this._scheduler = scheduler;
            },

            _handleJob: function(jobModel) {
                return this._scheduler.handleJob(jobModel);
            }

        };
    });
});