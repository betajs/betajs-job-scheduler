/*!
betajs-job-scheduler - v0.0.2 - 2019-02-20
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
    "version": "0.0.2",
    "datetime": 1550685730199
};
});
Scoped.assumeVersion('base:version', '~1.0.141');
Scoped.assumeVersion('data:version', '');
}).call(Scoped);