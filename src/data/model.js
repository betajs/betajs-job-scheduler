Scoped.extend("module:AbstractModel", [
    "data:Modelling.Model",
    "base:Objs",
    "base:Promise",
    "base:Time"
], function(Model, Objs, Promise, Time, scoped) {

    /*
        See State Machine

        https://mermaidjs.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggVEQ7XG5DUkVBVEVELS0-Tk9UX1JFQURZO1xuQ1JFQVRFRC0tPlJFQURZO1xuTk9UX1JFQURZLS0-UkVBRFk7XG5SRUFEWS0tPkRJU1BBVENIRUQ7XG5ESVNQQVRDSEVELS0-RVhFQ1VUSU5HO1xuRVhFQ1VUSU5HLS0-Q0xPU0VEO1xuRVhFQ1VUSU5HLS0-Tk9UX1JFQURZO1xuRVhFQ1VUSU5HLS0-SU5WQUxJRDtcbkVYRUNVVElORy0tPkZBSUxVUkVfRVhDRUVESU5HX1JFU09VUkNFUztcbkVYRUNVVElORy0tPkZBSUxVUkVfRVhDRUVESU5HX1RJTUU7XG5FWEVDVVRJTkctLT5GQUlMVVJFX05PX1BST0dSRVNTO1xuRVhFQ1VUSU5HLS0-RkFJTFVSRV9FWEVDVVRJT047XG5GQUlMVVJFX0VYQ0VFRElOR19SRVNPVVJDRVMtLT5GQUlMRUQ7XG5GQUlMVVJFX0VYQ0VFRElOR19SRVNPVVJDRVMtLT5SRUFEWTtcbkZBSUxVUkVfRVhDRUVESU5HX1RJTUUtLT5GQUlMRUQ7XG5GQUlMVVJFX0VYQ0VFRElOR19USU1FLS0-UkVBRFk7XG5GQUlMVVJFX05PX1BST0dSRVNTLS0-RkFJTEVEO1xuRkFJTFVSRV9OT19QUk9HUkVTUy0tPlJFQURZO1xuRkFJTFVSRV9FWEVDVVRJT04tLT5GQUlMRUQ7XG5GQUlMVVJFX0VYRUNVVElPTi0tPlJFQURZO1xuXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ
     */

    var STATES = {
        STATE_CREATED: 1,
        STATE_NOT_READY: 11,
        STATE_READY: 12,
        STATE_DISPATCHED: 20,
        STATE_EXECUTING: 30,
        STATE_CLOSED: 40,
        STATE_INVALID: 41,
        STATE_FAILED: 42,
        STATE_FAILURE_EXCEEDING_RESOURCES: 50,
        STATE_FAILURE_EXCEEDING_TIME: 51,
        STATE_FAILURE_NO_PROGRESS: 52,
        STATE_FAILURE_EXECUTION: 53,
        STATE_FAILURE_DISPATCH: 54
    };

    var STATES_INVERSE = Objs.inverseKeyValue(STATES);

    return Model.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            _readyIn: function() {
                return 0;
            },

            readyIn: function() {
                return Promise.box(this._readyIn, this).timeoutError(this.cls.jobOptions.readyInTimeout, "timeout");
            },

            _stillValid: function() {
                return true;
            },

            stillValid: function() {
                return Promise.box(this._stillValid, this).timeoutError(this.cls.jobOptions.stillValidTimeout, "timeout");
            },

            _resourceEstimates: function() {
                return {};
            },

            resourceEstimates: function() {
                return this._resourceEstimates();
            },

            executionProgress: function() {
                switch (this.get("state")) {
                    case STATES.STATE_EXECUTING:
                        return this.get("execution_progress");
                    case STATES.STATE_CLOSED:
                        return 1;
                    default:
                        return NaN;
                }
            },

            runTime: function() {
                switch (this.get("state")) {
                    case STATES.STATE_EXECUTING:
                        return Time.now() - this.get("execution_start");
                    case STATES.STATE_CLOSED:
                        return this.get("execution_end") - this.get("execution_start");
                    default:
                        return NaN;
                }
            },

            _timePrediction: function() {
                var p = this.executionProgress();
                return p > 0 ? this.runTime() / p : NaN;
            },

            timePrediction: function() {
                return this._timePrediction();
            },

            remainingTime: function() {
                switch (this.get("state")) {
                    case STATES.STATE_EXECUTING:
                        return this.timePrediction() - this.runTime();
                    case STATES.STATE_CLOSED:
                        return 0;
                    default:
                        return NaN;
                }
            },

            logProgress: function(progress) {
                this.set("execution_progress", progress);
            },

            logResourceUsage: function(resourceUsage) {
                this.set("resource_usage", resourceUsage);
                var m = Objs.clone(this.get("max_resource_usage") || {}, 1);
                Objs.iter(resourceUsage, function(value, key) {
                    m[key] = Math.max(value, m[key] || 0);
                });
                this.set("max_resource_usage", m);
            },

            logResourcePrediction: function(resourcePrediction) {
                this.set("resource_prediction", resourcePrediction);
            },

            logLiveness: function() {
                this.set("execution_liveness", Time.now());
            },

            livenessDelta: function() {
                var base = Math.max(this.get("execution_start"), this.get("execution_liveness"));
                return base ? Time.now() - base : 0;
            },



            transitionToReady: function() {
                // TODO: Validation
                return this.update({
                    state: STATES.STATE_READY
                });
            },

            transitionToDispatchError: function() {
                // TODO: Validation
                return this.update({
                    state: STATES.STATE_FAILURE_DISPATCH
                });
            },

            transitionToDispatched: function(receipt) {
                // TODO: Validation
                return this.update({
                    state: STATES.STATE_DISPATCHED,
                    dispatch_receipt: receipt
                });
            },

            transitionToExecuting: function() {
                // TODO: Validation
                return this.update({
                    state: STATES.STATE_EXECUTING,
                    execution_start: Time.now()
                });
            },

            transitionToClosed: function() {
                // TODO: Validation
                return this.update({
                    state: STATES.STATE_CLOSED,
                    execution_end: Time.now()
                });
            },

            stateToString: function() {
                return STATES_INVERSE[this.get('state')];
            }

        };
    }, function(inherited) {
        return {

            STATES: STATES,

            STATES_INVERSE: STATES_INVERSE,

            _initializeScheme: function() {
                return Objs.extend({
                    state: {
                        type: "int",
                        def: STATES.STATE_CREATED
                    },
                    resource_usage: {
                        type: "object"
                    },
                    max_resource_usage: {
                        type: "object"
                    },
                    resource_prediction: {
                        type: "object"
                    },
                    execution_start: {
                        type: "datetime"
                    },
                    execution_end: {
                        type: "datetime"
                    },
                    execution_liveness: {
                        type: "datetime",
                        def: 0
                    },
                    execution_progress: {
                        type: "float",
                        def: 0.0
                    },
                    execution_count: {
                        type: "int",
                        def: 0
                    },
                    ready_in_time: {
                        type: "datetime",
                        def: 0
                    },
                    not_ready_count: {
                        type: "int",
                        def: 0
                    },
                    dispatch_receipt: {

                    },
                    exceeding_resources_failure_count: {
                        type: "int",
                        def: 0
                    },
                    exceeding_time_failure_count: {
                        type: "int",
                        def: 0
                    },
                    no_progress_failure_count: {
                        type: "int",
                        def: 0
                    },
                    job_execution_failure_count: {
                        type: "int",
                        def: 0
                    },
                    failure_string: {
                        type: "string",
                        def: ""
                    }
                }, inherited._initializeScheme.call(this));
            },

            jobOptions: {
                stillValidTimeout: false,
                readyInTimeout: false
            }

        };
    });
});