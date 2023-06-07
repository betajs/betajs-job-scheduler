Scoped.extend("module:DeltaResourceMonitor", [
    "module:AbstractResourceMonitor"
], function(AbstractResourceMonitor, scoped) {
    return AbstractResourceMonitor.extend({ scoped: scoped }, {

        _current: function (initialized) {
            return this.initialize().mapSuccess(function (result) {
                return result - initialized;
            });
        },

        _predict: function (initialized, current, progress) {
            return 0 < progress && progress < 1 ? current / progress : current;
        }

    });
});