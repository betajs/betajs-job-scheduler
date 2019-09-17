Scoped.extend("module:AbstractInvocation", [
    "base:Class",
    "base:Promise"
], function(Class, Promise, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            _dispatchJob: function(jobModel) {
                return Promise.error("Abstract Method");
            },

            dispatchJob: function(jobModel) {
                return this._dispatchJob(jobModel);
            }

        };
    });
});