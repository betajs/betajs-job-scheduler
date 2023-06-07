Scoped.extend("module:TimeResourceMonitor", [
    "module:DeltaResourceMonitor",
    "base:Time"
], function(DeltaResourceMonitor, Time, scoped) {
    return DeltaResourceMonitor.extend({ scoped: scoped }, {

        _initialize: function () {
            return Time.now();
        }

    });
});