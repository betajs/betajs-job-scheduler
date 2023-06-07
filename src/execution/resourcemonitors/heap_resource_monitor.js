Scoped.extend("module:HeapResourceMonitor", [
    "module:DeltaResourceMonitor"
], function(DeltaResourceMonitor, Time, scoped) {
    return Class.extend({ scoped: scoped }, {

        _initialize: function () {
            return process.memoryUsage().heapUsed;
        }

    });
});