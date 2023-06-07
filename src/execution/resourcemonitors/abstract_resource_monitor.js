Scoped.extend("module:AbstractResourceMonitor", [
    "base:Class",
    "base:Promise"
], function(Class, Promise, scoped) {
    return Class.extend({ scoped: scoped }, {

        _initialize: Class.abstractFunction,
        _current: Class.abstractFunction,
        _predict: Class.abstractFunction,

        initialize: function () {
            return Promise.box(this._initialize, this);
        },

        current: function () {
            return Promise.box(this._current, this);
        },

        exceeding: function (current, threshold) {
            return threshold && current > threshold;
        },

        predict: function (initialized, current, progress) {
            return Promise.box(this._predict, this, arguments);
        }

    });
});