Scoped.extend("module:MemoryResourceMonitor", [
    "module:DeltaResourceMonitor"
], function(DeltaResourceMonitor, Time, scoped) {

    return DeltaResourceMonitor.extend({ scoped: scoped }, {

        _initialize: function () {
            var OS = require("os");
            return OS.totalmem() - OS.freemem();
        }

    });
});