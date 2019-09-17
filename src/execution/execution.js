Scoped.extend("module:AbstractExecution", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Timers.Timer"
], function(Class, EventsMixin, Timer, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(jobModel, config) {
                inherited.constructor.call(this);
                this._jobModel = jobModel;
                this._state = this.cls.STATES.IDLE;
                this._errorString = "";
            },

            _run: function() {
                // This needs to be asynchronous by all means.
                throw "not implemented";
            },

            _progress: function() {
                return NaN;
            },

            _resourceUsage: function() {
                return {};
            },

            jobModel: function() {
                return this._jobModel;
            },

            state: function() {
                return this._state;
            },

            run: function() {
                if (this._state !== this.cls.STATES.IDLE)
                    throw "wrong state";
                this._state = this.cls.STATES.RUNNING;
                this._run();
                if (this.cls.executionOptions.timer) {
                    this.__timer = this.auto_destroy(new Timer({
                        context: this,
                        fire: this.__fire,
                        delay: this.cls.executionOptions.timer,
                        start: true
                    }));
                }
            },

            __fire: function() {
                this.trigger("progress", this.progress());
                // TODO; checks.
            },

            _jobSuccess: function() {
                this._state = this.cls.STATES.SUCCESS;
                this.trigger("success");
            },

            _jobFailed: function(errorString) {
                this._state = this.cls.STATES.FAILED;
                this._errorString = errorString;
                this.trigger("failed", errorString);
            },

            progress: function() {
                return this._progress();
            },

            resourceUsage: function() {
                return this._resourceUsage();
            }

        };
    }], {

        STATES: {
            IDLE: 1,
            RUNNING: 2,
            SUCCESS: 3,
            FAILED: 4
        },

        executionOptions: {
            timer: 1000,
            liveness_interval: false
        }

    });
});