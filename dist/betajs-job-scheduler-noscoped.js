/*!
betajs-job-scheduler - v0.0.3 - 2019-09-17
Copyright (c) Oliver Friedmann,Ziggeo
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS.Jobs');
Scoped.binding('base', 'global:BetaJS');
Scoped.binding('data', 'global:BetaJS.Data');
Scoped.define("module:", function () {
	return {
    "guid": "70ed7146-bb6d-4da4-97dc-5a8e2d23a23f",
    "version": "0.0.3",
    "datetime": 1568735559573
};
});
Scoped.assumeVersion('base:version', '~1.0.141');
Scoped.assumeVersion('data:version', '');
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

            _resourcePredictions: function() {
                return {};
            },

            _timePrediction: function() {
                var p = this.executionProgress();
                return p > 0 ? this.runTime() / p : NaN;
            },

            _stillValid: function() {
                return true;
            },

            readyIn: function() {
                return Promise.box(this._readyIn, this).timeoutError(this.cls.jobOptions.readyInTimeout, "timeout");
            },

            stillValid: function() {
                return Promise.box(this._stillValid, this).timeoutError(this.cls.jobOptions.stillValidTimeout, "timeout");
            },

            resourcePredictions: function() {
                return this._resourcePredictions();
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

            logProgress: function(progress) {
                this.set("execution_progress", progress);
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
Scoped.extend("module:DirectHandler", [
    "module:Handler"
], function(Handler, scoped) {
    return Handler.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            handleJob: function(jobModel) {
                return this._handleJob(jobModel);
            }

        };
    });
});
Scoped.extend("module:Handler", [
    "base:Class"
], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(scheduler) {
                inherited.constructor.call(this);
                this._scheduler = scheduler;
            },

            _handleJob: function(jobModel) {
                return this._scheduler.handleJob(jobModel);
            }

        };
    });
});
Scoped.extend("module:DirectInvocation", [
    "module:AbstractInvocation",
    "base:Promise",
    "base:Async"
], function(Invocation, Promise, Async, scoped) {
    return Invocation.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(directHandler) {
                inherited.constructor.call(this);
                this._directHandler = directHandler;
            },

            _dispatchJob: function(jobModel) {
                Async.eventually(function() {
                    this._directHandler.handleJob(jobModel);
                }, this);
                return Promise.value({
                    receipt: "direct"
                });
            }

        };
    });
});
Scoped.extend("module:AbstractInvocation", [
    "base:Class",
    "base:Promise"
], function(Class, Promise, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            _dispatchJob: function(jobModel) {
                return Promise.error("Abstract Method");
            },

            dispatchJob: function(jobModel) {
                return this._dispatchJob(jobModel);
            }

        };
    });
});
Scoped.extend("module:Scheduler", [
    "base:Class",
    "base:Promise"
], function(Class, Promise, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(options) {
                inherited.constructor.call(this);
                this.jobTable = options.jobTable;
                this.JobModel = options.JobModel;
                this.ExecutionClass = options.ExecutionClass;
            },

            setInvocation: function(invocation) {
                this.invocation = invocation;
            },

            dispatchJob: function(jobModel) {
                if (jobModel.get("state") !== jobModel.cls.STATES.STATE_CREATED)
                    return Promise.error("Expected job model state to be CREATED");
                return jobModel.save().mapSuccess(function() {
                    return jobModel.stillValid().mapError(function() {
                        return jobModel.transitionToNotReady();
                    }, this).mapSuccess(function(valid) {
                        if (!valid)
                            return jobModel.transitionToInvalid();
                        return jobModel.readyIn().mapError(function() {
                            return jobModel.transitionToNotReady();
                        }, this).mapSuccess(function(readyIn) {
                            if (readyIn > 0)
                                return jobModel.transitionToNotReady(readyIn);
                            return jobModel.transitionToReady().mapSuccess(function() {
                                return this.invocation.dispatchJob(jobModel).mapCallback(function(error, receipt) {
                                    return error ? jobModel.transitionToDispatchError() : jobModel.transitionToDispatched(receipt);
                                }, this);
                            }, this);
                        }, this);
                    }, this);
                }, this);
            },

            handleJob: function(jobModel) {
                if (jobModel.get("state") !== jobModel.cls.STATES.STATE_DISPATCHED)
                    return Promise.error("Expected job model state to be DISPATCHED");
                return jobModel.stillValid().mapError(function() {
                    return jobModel.transitionToNotReady();
                }, this).mapSuccess(function(valid) {
                    if (!valid)
                        return jobModel.transitionToInvalid();
                    return jobModel.readyIn().mapError(function() {
                        return jobModel.transitionToNotReady();
                    }, this).mapSuccess(function(readyIn) {
                        if (readyIn > 0)
                            return jobModel.transitionToNotReady(readyIn);
                        var execution = new this.ExecutionClass(jobModel);
                        return jobModel.transitionToExecuting().mapSuccess(function() {
                            var promise = Promise.create();
                            execution.on("success", function(result) {
                                jobModel.transitionToClosed().callback(function() {
                                    promise.asyncSuccess(result);
                                });
                            }, this).on("progress", function(progress) {
                                jobModel.logProgress(progress);
                            }, this).on("failure-exceeding-resources", function(record) {
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
                            execution.run();
                            promise.callback(execution.weakDestroy, execution);
                            return promise;
                        }, this);
                    }, this);
                }, this);
            }

            // TODO: Maintenance

        };
    });
});
}).call(Scoped);