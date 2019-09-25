Scoped.extend("module:AbstractExecution", [
    "base:Class",
    "base:Objs",
    "base:Events.EventsMixin",
    "base:Timers.Timer",
    "base:Time"
], function(Class, Objs, EventsMixin, Timer, Time, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(jobModel, options) {
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
                return {
                    memory: process.memoryUsage().heapUsed,
                    time: Time.now() - this.jobModel().get("execution_start")
                };
            },

            _resourceUpperBounds: function() {
                return {
                    memory: Infinity,
                    time: Infinity
                };
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

            abort: function() {
                // TODO
            },

            __fire: function() {
                var currentProgress = this.progress();
                // Liveness Check
                if (this.cls.executionOptions.livenessInterval) {
                    var livenessDelta = this.jobModel().livenessDelta();
                    var lastProgress = this.jobModel().get("execution_progress");
                    if (lastProgress < currentProgress) {
                        this.trigger("liveness", this.jobModel().livenessDelta());
                    } else {
                        this.trigger("unliveness", this.jobModel().livenessDelta());
                        if (livenessDelta > this.cls.executionOptions.livenessInterval) {
                            this.trigger("failure-no-progress", livenessDelta);
                            this.abort();
                        }
                    }
                }
                // TODO: Resource Check
                // TODO: Time Check
                // TODO: Failure Execution

                /*
                                            }, this).on("failure-exceeding-resources", function(metrics) {
                                jobModel.transitionFailureExceedingResources(metrics).callback(function() {
                                    promise.asyncError("FailureExceedingResources");
                                });
                            }, this).on("failure-exceeding-time", function(time) {
                                jobModel.transitionFailureExceedingTime(time).callback(function() {
                                    promise.asyncError("FailureExceedingTime");
                                });
                            }, this).on("failure-no-progress", function(metrics) {
                                jobModel.transitionFailureNoProgress(metrics).callback(function() {
                                    promise.asyncError("FailureNoProgress");
                                });
                            }, this).on("failure-execution", function(error) {
                                jobModel.transitionFailureExecution(error).callback(function() {
                                    promise.asyncError("FailureExecution");
                                });
                            }, this);
*/
                // TODO: Resource Check
                this.trigger("progress", currentProgress);
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
            livenessInterval: false
        }

    });
});