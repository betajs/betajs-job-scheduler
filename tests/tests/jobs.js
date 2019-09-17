QUnit.test("basic test / naive fibonacci", function (assert) {
    var done = assert.async();

    var jobStore = new BetaJS.Data.Stores.MemoryStore();
    var JobModel = require(__dirname + "/../samples/naive_fib_model.js");
    var jobTable = new BetaJS.Data.Modelling.Table(jobStore, JobModel, {});


    var ExecutionClass = require(__dirname + "/../samples/naive_fib_execution.js");

    var scheduler = new BetaJS.Jobs.Scheduler({
        jobTable: jobTable,
        JobModel: JobModel,
        ExecutionClass: ExecutionClass
    });

    var handler = new BetaJS.Jobs.DirectHandler(scheduler);

    var invocation = new BetaJS.Jobs.DirectInvocation(handler);

    scheduler.setInvocation(invocation);

    var model = jobTable.newModel({
        fib_n: 20,
        fib_mod: 100000
    });

    model.once("change:state", function (value) {
        assert.equal(value, JobModel.STATES.STATE_READY);
        model.once("change:state", function (value) {
            assert.equal(value, JobModel.STATES.STATE_DISPATCHED);
            model.once("change:state", function (value) {
                assert.equal(value, JobModel.STATES.STATE_EXECUTING);
                model.once("change:state", function (value) {
                    assert.equal(value, JobModel.STATES.STATE_CLOSED);
                    done();
                });
            });
        });
    });

    scheduler.dispatchJob(model);

});
