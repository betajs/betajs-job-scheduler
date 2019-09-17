Scoped.extend("module:DirectHandler", [
    "module:Handler"
], function(Handler, scoped) {
    return Handler.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            handleJob: function(jobModel) {
                return this._handleJob(jobModel);
            }

        };
    });
});