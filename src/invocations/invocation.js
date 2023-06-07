Scoped.extend("module:AbstractInvocation", [
    "base:Class",
    "base:Promise",
    "base:Objs"
], function(Class, Promise, Objs, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(options) {
                inherited.constructor.call(this);
                options = options || {};
                this.__resourceUpperBounds = options.resourceUpperBounds || {};
            },

            _dispatchJob: function(jobModel) {
                return Promise.error("Abstract Method");
            },

            _resourceUpperBounds: function(jobModel) {
                return {};
            },

            resourceUpperBounds: function(jobModel) {
                return Objs.customMerge(this._resourceUpperBounds(jobModel), this.__resourceUpperBounds, function(key, value1, value2) {
                    return Math.min(value1, value2);
                });
            },

            canHandle: function(jobModel) {
                var bounds = this.resourceUpperBounds(jobModel);
                return Objs.all(jobModel.resourceEstimates(), function(value, key) {
                    return !(key in bounds) || bounds[key] >= value;
                });
            },

            dispatchJob: function(jobModel) {
                return this.canHandle(jobModel) ? this._dispatchJob(jobModel) : Promise.error("Estimates exceed resource bounds");
            }

        };
    });
});