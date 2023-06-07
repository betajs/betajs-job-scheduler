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