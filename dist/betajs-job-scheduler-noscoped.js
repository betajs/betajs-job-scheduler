/*!
betajs-job-scheduler - v0.0.5 - 2023-06-07
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
    "version": "0.0.5",
    "datetime": 1686168918296
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
Scoped.extend("module:AbstractExecution", [
    "base:Class",
    "base:Objs",
    "base:Events.EventsMixin",
    "base:Timers.Timer",
    "base:Time",
    "base:Promise"
], function(Class, Objs, EventsMixin, Timer, Time, Promise, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(jobModel, options) {
                inherited.constructor.call(this);
                this._jobModel = jobModel;
                this._state = this.cls.STATES.IDLE;
                this._errorString = "";
                options = Objs.extend({
                    resourceMonitors: {}
                }, options);
                this._resourceMonitors = options.resourceMonitors;
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
                this._initializedResources = {};
                Promise.and(Objs.arrayify(this._resourceMonitors, function(resMon, key) {
                    return resMon.initialize().valueify(this._initializedResources, key);
                }, this)).success(function() {
                    this._run();
                    if (this.cls.executionOptions.timer) {
                        this.__timer = this.auto_destroy(new Timer({
                            context: this,
                            fire: this.__fire,
                            delay: this.cls.executionOptions.timer,
                            start: true
                        }));
                    }
                }, this);
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
Scoped.extend("module:HeapResourceMonitor", [
    "module:DeltaResourceMonitor"
], function(DeltaResourceMonitor, Time, scoped) {
    return Class.extend({ scoped: scoped }, {

        _initialize: function () {
            return process.memoryUsage().heapUsed;
        }

    });
});
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
    "base:Promise",
    "base:Objs"
], function(Class, Promise, Objs, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(options) {
                inherited.constructor.call(this);
                options = options || {};
                this.__resourceUpperBounds = options.resourceUpperBounds || {};
            },

            _dispatchJob: function(jobModel) {
                return Promise.error("Abstract Method");
            },

            _resourceUpperBounds: function(jobModel) {
                return {};
            },

            resourceUpperBounds: function(jobModel) {
                return Objs.customMerge(this._resourceUpperBounds(jobModel), this.__resourceUpperBounds, function(key, value1, value2) {
                    return Math.min(value1, value2);
                });
            },

            canHandle: function(jobModel) {
                var bounds = this.resourceUpperBounds(jobModel);
                return Objs.all(jobModel.resourceEstimates(), function(value, key) {
                    return !(key in bounds) || bounds[key] >= value;
                });
            },

            dispatchJob: function(jobModel) {
                return this.canHandle(jobModel) ? this._dispatchJob(jobModel) : Promise.error("Estimates exceed resource bounds");
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
                this.resourceMonitors = options.resourceMonitors || {};
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
                        var execution = new this.ExecutionClass(jobModel, {
                            resourceMonitors: this.resourceMonitors
                        });
                        return jobModel.transitionToExecuting().mapSuccess(function() {
                            var promise = Promise.create();
                            execution.on("success", function(result) {
                                jobModel.transitionToClosed().callback(function() {
                                    promise.asyncSuccess(result);
                                });
                            }, this).on("progress", function(progress) {
                                jobModel.logProgress(progress);
                                jobModel.logResourceUsage(execution.resourceUsage());
                            }, this).on("liveness", function() {
                                jobModel.logLiveness();
                            }, this).on("failure-exceeding-resources", function(metrics) {
                                jobModel.transitionFailureExceedingResources(metrics).callback(function() {
                                    promise.asyncError("FailureExceedingResources");
                                });
                            }, this).on("failure-exceeding-time", function(time) {
                                jobModel.transitionFailureExceedingTime(time).callback(function() {
                                    promise.asyncError("FailureExceedingTime");
                                });
                            }, this).on("failure-no-progress", function(liveness) {
                                jobModel.transitionFailureNoProgress(liveness).callback(function() {
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