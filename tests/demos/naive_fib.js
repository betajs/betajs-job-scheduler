require("betajs");
require("betajs-data");
require(__dirname + "/../../dist/betajs-job-scheduler.js");

var JobModel = require(__dirname + "/../samples/naive_fib_model.js");
var ExecutionClass = require(__dirname + "/../samples/naive_fib_execution.js");

var jobStore = new BetaJS.Data.Stores.MemoryStore();
var jobTable = new BetaJS.Data.Modelling.Table(jobStore, JobModel, {});

var scheduler = new BetaJS.Jobs.Scheduler({
    jobTable: jobTable,
    JobModel: JobModel,
    ExecutionClass: ExecutionClass,
    resourceMonitors: {
        diskspace: new BetaJS.Jobs.DiskspaceResourceMonitor("/dev/sdb")
    }
});

var handler = new BetaJS.Jobs.DirectHandler(scheduler);

var invocation = new BetaJS.Jobs.DirectInvocation(handler);

scheduler.setInvocation(invocation);

var model = jobTable.newModel({
    fib_n: 30,
    fib_mod: 100000
});

model.on("change", function (key, value) {
    console.log(key, "=", value);
});

model.on("change:state", function (key, value) {
    console.log("Transition", model.stateToString());
});

setInterval(function () {
    console.log("RunTime", model.runTime(), "TimePrediction", model.timePrediction(), "RemainingTime", model.remainingTime());
}, 1000);

scheduler.dispatchJob(model);
