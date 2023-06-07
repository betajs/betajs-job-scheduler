Scoped.extend("module:DiskspaceResourceMonitor", [
    "module:DeltaResourceMonitor",
    "base:Promise"
], function(DeltaResourceMonitor, Promise, scoped) {

    return DeltaResourceMonitor.extend({ scoped: scoped }, function (inherited) {
        return {

            constructor: function (filter) {
                inherited.constructor.call(this);
                this._filter = filter;
            },

            _initialize: function () {
                var promise = Promise.create();
                (require("node-df"))(promise.asyncCallbackFunc());
                return promise.mapSuccess(function (result) {
                    var acc = 0;
                    result.forEach(function (item) {
                        var use = true;
                        switch (typeof this._filter) {
                            case "function":
                                use = this._filter(item);
                                break;
                            case "string":
                                use = item.mount === this._filter;
                                break;
                        }
                        if (use)
                            acc += item.used;
                    }, this);
                    return acc;
                });
            }

        };
    });
});