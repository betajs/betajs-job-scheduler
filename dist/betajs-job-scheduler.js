/*!
betajs-job-scheduler - v0.0.5 - 2023-06-07
Copyright (c) Oliver Friedmann,Ziggeo
Apache-2.0 Software License.
*/
/** @flow **//*!
betajs-scoped - v0.0.19 - 2018-04-07
Copyright (c) Oliver Friedmann
Apache-2.0 Software License.
*/
var Scoped = (function () {
var Globals = (function () {  
/** 
 * This helper module provides functions for reading and writing globally accessible namespaces, both in the browser and in NodeJS.
 * 
 * @module Globals
 * @access private
 */
return {
		
	/**
	 * Returns the value of a global variable.
	 * 
	 * @param {string} key identifier of a global variable
	 * @return value of global variable or undefined if not existing
	 */
	get : function(key/* : string */) {
		if (typeof window !== "undefined")
			return key ? window[key] : window;
		if (typeof global !== "undefined")
			return key ? global[key] : global;
		if (typeof self !== "undefined")
			return key ? self[key] : self;
		return undefined;
	},

	
	/**
	 * Sets a global variable.
	 * 
	 * @param {string} key identifier of a global variable
	 * @param value value to be set
	 * @return value that has been set
	 */
	set : function(key/* : string */, value) {
		if (typeof window !== "undefined")
			window[key] = value;
		if (typeof global !== "undefined")
			global[key] = value;
		if (typeof self !== "undefined")
			self[key] = value;
		return value;
	},
	
	
	/**
	 * Returns the value of a global variable under a namespaced path.
	 * 
	 * @param {string} path namespaced path identifier of variable
	 * @return value of global variable or undefined if not existing
	 * 
	 * @example
	 * // returns window.foo.bar / global.foo.bar 
	 * Globals.getPath("foo.bar")
	 */
	getPath: function (path/* : string */) {
		if (!path)
			return this.get();
		var args = path.split(".");
		if (args.length == 1)
			return this.get(path);		
		var current = this.get(args[0]);
		for (var i = 1; i < args.length; ++i) {
			if (!current)
				return current;
			current = current[args[i]];
		}
		return current;
	},


	/**
	 * Sets a global variable under a namespaced path.
	 * 
	 * @param {string} path namespaced path identifier of variable
	 * @param value value to be set
	 * @return value that has been set
	 * 
	 * @example
	 * // sets window.foo.bar / global.foo.bar 
	 * Globals.setPath("foo.bar", 42);
	 */
	setPath: function (path/* : string */, value) {
		var args = path.split(".");
		if (args.length == 1)
			return this.set(path, value);		
		var current = this.get(args[0]) || this.set(args[0], {});
		for (var i = 1; i < args.length - 1; ++i) {
			if (!(args[i] in current))
				current[args[i]] = {};
			current = current[args[i]];
		}
		current[args[args.length - 1]] = value;
		return value;
	}
	
};}).call(this);
/*::
declare module Helper {
	declare function extend<A, B>(a: A, b: B): A & B;
}
*/

var Helper = (function () {  
/** 
 * This helper module provides auxiliary functions for the Scoped system.
 * 
 * @module Helper
 * @access private
 */
return { 
		
	/**
	 * Attached a context to a function.
	 * 
	 * @param {object} obj context for the function
	 * @param {function} func function
	 * 
	 * @return function with attached context
	 */
	method: function (obj, func) {
		return function () {
			return func.apply(obj, arguments);
		};
	},

	
	/**
	 * Extend a base object with all attributes of a second object.
	 * 
	 * @param {object} base base object
	 * @param {object} overwrite second object
	 * 
	 * @return {object} extended base object
	 */
	extend: function (base, overwrite) {
		base = base || {};
		overwrite = overwrite || {};
		for (var key in overwrite)
			base[key] = overwrite[key];
		return base;
	},
	
	
	/**
	 * Returns the type of an object, particulary returning 'array' for arrays.
	 * 
	 * @param obj object in question
	 * 
	 * @return {string} type of object
	 */
	typeOf: function (obj) {
		return Object.prototype.toString.call(obj) === '[object Array]' ? "array" : typeof obj;
	},
	
	
	/**
	 * Returns whether an object is null, undefined, an empty array or an empty object.
	 * 
	 * @param obj object in question
	 * 
	 * @return true if object is empty
	 */
	isEmpty: function (obj) {
		if (obj === null || typeof obj === "undefined")
			return true;
		if (this.typeOf(obj) == "array")
			return obj.length === 0;
		if (typeof obj !== "object")
			return false;
		for (var key in obj)
			return false;
		return true;
	},
	
	
    /**
     * Matches function arguments against some pattern.
     * 
     * @param {array} args function arguments
     * @param {object} pattern typed pattern
     * 
     * @return {object} matched arguments as associative array 
     */	
	matchArgs: function (args, pattern) {
		var i = 0;
		var result = {};
		for (var key in pattern) {
			if (pattern[key] === true || this.typeOf(args[i]) == pattern[key]) {
				result[key] = args[i];
				i++;
			} else if (this.typeOf(args[i]) == "undefined")
				i++;
		}
		return result;
	},
	
	
	/**
	 * Stringifies a value as JSON and functions to string representations.
	 * 
	 * @param value value to be stringified
	 * 
	 * @return stringified value
	 */
	stringify: function (value) {
		if (this.typeOf(value) == "function")
			return "" + value;
		return JSON.stringify(value);
	}	

	
};}).call(this);
var Attach = (function () {  
/** 
 * This module provides functionality to attach the Scoped system to the environment.
 * 
 * @module Attach
 * @access private
 */
return { 
		
	__namespace: "Scoped",
	__revert: null,
	
	
	/**
	 * Upgrades a pre-existing Scoped system to the newest version present. 
	 * 
	 * @param {string} namespace Optional namespace (default is 'Scoped')
	 * @return {object} the attached Scoped system
	 */
	upgrade: function (namespace/* : ?string */) {
		var current = Globals.get(namespace || Attach.__namespace);
		if (current && Helper.typeOf(current) == "object" && current.guid == this.guid && Helper.typeOf(current.version) == "string") {
			var my_version = this.version.split(".");
			var current_version = current.version.split(".");
			var newer = false;
			for (var i = 0; i < Math.min(my_version.length, current_version.length); ++i) {
				newer = parseInt(my_version[i], 10) > parseInt(current_version[i], 10);
				if (my_version[i] != current_version[i]) 
					break;
			}
			return newer ? this.attach(namespace) : current;				
		} else
			return this.attach(namespace);		
	},


	/**
	 * Attaches the Scoped system to the environment. 
	 * 
	 * @param {string} namespace Optional namespace (default is 'Scoped')
	 * @return {object} the attached Scoped system
	 */
	attach : function(namespace/* : ?string */) {
		if (namespace)
			Attach.__namespace = namespace;
		var current = Globals.get(Attach.__namespace);
		if (current == this)
			return this;
		Attach.__revert = current;
		if (current) {
			try {
				var exported = current.__exportScoped();
				this.__exportBackup = this.__exportScoped();
				this.__importScoped(exported);
			} catch (e) {
				// We cannot upgrade the old version.
			}
		}
		Globals.set(Attach.__namespace, this);
		return this;
	},
	

	/**
	 * Detaches the Scoped system from the environment. 
	 * 
	 * @param {boolean} forceDetach Overwrite any attached scoped system by null.
	 * @return {object} the detached Scoped system
	 */
	detach: function (forceDetach/* : ?boolean */) {
		if (forceDetach)
			Globals.set(Attach.__namespace, null);
		if (typeof Attach.__revert != "undefined")
			Globals.set(Attach.__namespace, Attach.__revert);
		delete Attach.__revert;
		if (Attach.__exportBackup)
			this.__importScoped(Attach.__exportBackup);
		return this;
	},
	

	/**
	 * Exports an object as a module if possible. 
	 * 
	 * @param {object} mod a module object (optional, default is 'module')
	 * @param {object} object the object to be exported
	 * @param {boolean} forceExport overwrite potentially pre-existing exports
	 * @return {object} the Scoped system
	 */
	exports: function (mod, object, forceExport) {
		mod = mod || (typeof module != "undefined" ? module : null);
		if (typeof mod == "object" && mod && "exports" in mod && (forceExport || mod.exports == this || !mod.exports || Helper.isEmpty(mod.exports)))
			mod.exports = object || this;
		return this;
	}	

};}).call(this);

function newNamespace (opts/* : {tree ?: boolean, global ?: boolean, root ?: Object} */) {

	var options/* : {
		tree: boolean,
	    global: boolean,
	    root: Object
	} */ = {
		tree: typeof opts.tree === "boolean" ? opts.tree : false,
		global: typeof opts.global === "boolean" ? opts.global : false,
		root: typeof opts.root === "object" ? opts.root : {}
	};

	/*::
	type Node = {
		route: ?string,
		parent: ?Node,
		children: any,
		watchers: any,
		data: any,
		ready: boolean,
		lazy: any
	};
	*/

	function initNode(options)/* : Node */ {
		return {
			route: typeof options.route === "string" ? options.route : null,
			parent: typeof options.parent === "object" ? options.parent : null,
			ready: typeof options.ready === "boolean" ? options.ready : false,
			children: {},
			watchers: [],
			data: {},
			lazy: []
		};
	}
	
	var nsRoot = initNode({ready: true});
	
	if (options.tree) {
		if (options.global) {
			try {
				if (window)
					nsRoot.data = window;
			} catch (e) { }
			try {
				if (global)
					nsRoot.data = global;
			} catch (e) { }
			try {
				if (self)
					nsRoot.data = self;
			} catch (e) { }
		} else
			nsRoot.data = options.root;
	}
	
	function nodeDigest(node/* : Node */) {
		if (node.ready)
			return;
		if (node.parent && !node.parent.ready) {
			nodeDigest(node.parent);
			return;
		}
		if (node.route && node.parent && (node.route in node.parent.data)) {
			node.data = node.parent.data[node.route];
			node.ready = true;
			for (var i = 0; i < node.watchers.length; ++i)
				node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
			node.watchers = [];
			for (var key in node.children)
				nodeDigest(node.children[key]);
		}
	}
	
	function nodeEnforce(node/* : Node */) {
		if (node.ready)
			return;
		if (node.parent && !node.parent.ready)
			nodeEnforce(node.parent);
		node.ready = true;
		if (node.parent) {
			if (options.tree && typeof node.parent.data == "object")
				node.parent.data[node.route] = node.data;
		}
		for (var i = 0; i < node.watchers.length; ++i)
			node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
		node.watchers = [];
	}
	
	function nodeSetData(node/* : Node */, value) {
		if (typeof value == "object" && node.ready) {
			for (var key in value)
				node.data[key] = value[key];
		} else
			node.data = value;
		if (typeof value == "object") {
			for (var ckey in value) {
				if (node.children[ckey])
					node.children[ckey].data = value[ckey];
			}
		}
		nodeEnforce(node);
		for (var k in node.children)
			nodeDigest(node.children[k]);
	}
	
	function nodeClearData(node/* : Node */) {
		if (node.ready && node.data) {
			for (var key in node.data)
				delete node.data[key];
		}
	}
	
	function nodeNavigate(path/* : ?String */) {
		if (!path)
			return nsRoot;
		var routes = path.split(".");
		var current = nsRoot;
		for (var i = 0; i < routes.length; ++i) {
			if (routes[i] in current.children)
				current = current.children[routes[i]];
			else {
				current.children[routes[i]] = initNode({
					parent: current,
					route: routes[i]
				});
				current = current.children[routes[i]];
				nodeDigest(current);
			}
		}
		return current;
	}
	
	function nodeAddWatcher(node/* : Node */, callback, context) {
		if (node.ready)
			callback.call(context || this, node.data);
		else {
			node.watchers.push({
				callback: callback,
				context: context
			});
			if (node.lazy.length > 0) {
				var f = function (node) {
					if (node.lazy.length > 0) {
						var lazy = node.lazy.shift();
						lazy.callback.call(lazy.context || this, node.data);
						f(node);
					}
				};
				f(node);
			}
		}
	}
	
	function nodeUnresolvedWatchers(node/* : Node */, base, result) {
		node = node || nsRoot;
		result = result || [];
		if (!node.ready && node.lazy.length === 0 && node.watchers.length > 0)
			result.push(base);
		for (var k in node.children) {
			var c = node.children[k];
			var r = (base ? base + "." : "") + c.route;
			result = nodeUnresolvedWatchers(c, r, result);
		}
		return result;
	}

	/** 
	 * The namespace module manages a namespace in the Scoped system.
	 * 
	 * @module Namespace
	 * @access public
	 */
	return {
		
		/**
		 * Extend a node in the namespace by an object.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @param {object} value object that should be used for extend the namespace node
		 */
		extend: function (path, value) {
			nodeSetData(nodeNavigate(path), value);
		},
		
		/**
		 * Set the object value of a node in the namespace.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @param {object} value object that should be used as value for the namespace node
		 */
		set: function (path, value) {
			var node = nodeNavigate(path);
			if (node.data)
				nodeClearData(node);
			nodeSetData(node, value);
		},
		
		/**
		 * Read the object value of a node in the namespace.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @return {object} object value of the node or null if undefined
		 */
		get: function (path) {
			var node = nodeNavigate(path);
			return node.ready ? node.data : null;
		},
		
		/**
		 * Lazily navigate to a node in the namespace.
		 * Will asynchronously call the callback as soon as the node is being touched.
		 *
		 * @param {string} path path to the node in the namespace
		 * @param {function} callback callback function accepting the node's object value
		 * @param {context} context optional callback context
		 */
		lazy: function (path, callback, context) {
			var node = nodeNavigate(path);
			if (node.ready)
				callback(context || this, node.data);
			else {
				node.lazy.push({
					callback: callback,
					context: context
				});
			}
		},
		
		/**
		 * Digest a node path, checking whether it has been defined by an external system.
		 * 
		 * @param {string} path path to the node in the namespace
		 */
		digest: function (path) {
			nodeDigest(nodeNavigate(path));
		},
		
		/**
		 * Asynchronously access a node in the namespace.
		 * Will asynchronously call the callback as soon as the node is being defined.
		 *
		 * @param {string} path path to the node in the namespace
		 * @param {function} callback callback function accepting the node's object value
		 * @param {context} context optional callback context
		 */
		obtain: function (path, callback, context) {
			nodeAddWatcher(nodeNavigate(path), callback, context);
		},
		
		/**
		 * Returns all unresolved watchers under a certain path.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @return {array} list of all unresolved watchers 
		 */
		unresolvedWatchers: function (path) {
			return nodeUnresolvedWatchers(nodeNavigate(path), path);
		},
		
		__export: function () {
			return {
				options: options,
				nsRoot: nsRoot
			};
		},
		
		__import: function (data) {
			options = data.options;
			nsRoot = data.nsRoot;
		}
		
	};
	
}
function newScope (parent, parentNS, rootNS, globalNS) {
	
	var self = this;
	var nextScope = null;
	var childScopes = [];
	var parentNamespace = parentNS;
	var rootNamespace = rootNS;
	var globalNamespace = globalNS;
	var localNamespace = newNamespace({tree: true});
	var privateNamespace = newNamespace({tree: false});
	
	var bindings = {
		"global": {
			namespace: globalNamespace
		}, "root": {
			namespace: rootNamespace
		}, "local": {
			namespace: localNamespace
		}, "default": {
			namespace: privateNamespace
		}, "parent": {
			namespace: parentNamespace
		}, "scope": {
			namespace: localNamespace,
			readonly: false
		}
	};
	
	var custom = function (argmts, name, callback) {
		var args = Helper.matchArgs(argmts, {
			options: "object",
			namespaceLocator: true,
			dependencies: "array",
			hiddenDependencies: "array",
			callback: true,
			context: "object"
		});
		
		var options = Helper.extend({
			lazy: this.options.lazy
		}, args.options || {});
		
		var ns = this.resolve(args.namespaceLocator);
		
		var execute = function () {
			this.require(args.dependencies, args.hiddenDependencies, function () {
                var _arguments = [];
                for (var a = 0; a < arguments.length; ++a)
                    _arguments.push(arguments[a]);
                _arguments[_arguments.length - 1].ns = ns;
				if (this.options.compile) {
					var params = [];
					for (var i = 0; i < argmts.length; ++i)
						params.push(Helper.stringify(argmts[i]));
					this.compiled += this.options.ident + "." + name + "(" + params.join(", ") + ");\n\n";
				}
				if (this.options.dependencies) {
					this.dependencies[ns.path] = this.dependencies[ns.path] || {};
					if (args.dependencies) {
						args.dependencies.forEach(function (dep) {
							this.dependencies[ns.path][this.resolve(dep).path] = true;
						}, this);
					}
					if (args.hiddenDependencies) {
						args.hiddenDependencies.forEach(function (dep) {
							this.dependencies[ns.path][this.resolve(dep).path] = true;
						}, this);
					}
				}
				var result = this.options.compile ? {} : args.callback.apply(args.context || this, _arguments);
				callback.call(this, ns, result);
			}, this);
		};
		
		if (options.lazy)
			ns.namespace.lazy(ns.path, execute, this);
		else
			execute.apply(this);

		return this;
	};
	
	/** 
	 * This module provides all functionality in a scope.
	 * 
	 * @module Scoped
	 * @access public
	 */
	return {
		
		getGlobal: Helper.method(Globals, Globals.getPath),
		setGlobal: Helper.method(Globals, Globals.setPath),
		
		options: {
			lazy: false,
			ident: "Scoped",
			compile: false,
			dependencies: false
		},
		
		compiled: "",
		
		dependencies: {},
		
		
		/**
		 * Returns a reference to the next scope that will be obtained by a subScope call.
		 * 
		 * @return {object} next scope
		 */
		nextScope: function () {
			if (!nextScope)
				nextScope = newScope(this, localNamespace, rootNamespace, globalNamespace);
			return nextScope;
		},
		
		/**
		 * Creates a sub scope of the current scope and returns it.
		 * 
		 * @return {object} sub scope
		 */
		subScope: function () {
			var sub = this.nextScope();
			childScopes.push(sub);
			nextScope = null;
			return sub;
		},
		
		/**
		 * Creates a binding within in the scope. 
		 * 
		 * @param {string} alias identifier of the new binding
		 * @param {string} namespaceLocator identifier of an existing namespace path
		 * @param {object} options options for the binding
		 * 
		 */
		binding: function (alias, namespaceLocator, options) {
			if (!bindings[alias] || !bindings[alias].readonly) {
				var ns;
				if (Helper.typeOf(namespaceLocator) != "string") {
					ns = {
						namespace: newNamespace({
							tree: true,
							root: namespaceLocator
						}),
						path: null	
					};
				} else
					ns = this.resolve(namespaceLocator);
				bindings[alias] = Helper.extend(options, ns);
			}
			return this;
		},
		
		
		/**
		 * Resolves a name space locator to a name space.
		 * 
		 * @param {string} namespaceLocator name space locator
		 * @return {object} resolved name space
		 * 
		 */
		resolve: function (namespaceLocator) {
			var parts = namespaceLocator.split(":");
			if (parts.length == 1) {
                throw ("The locator '" + parts[0] + "' requires a namespace.");
			} else {
				var binding = bindings[parts[0]];
				if (!binding)
					throw ("The namespace '" + parts[0] + "' has not been defined (yet).");
				return {
					namespace: binding.namespace,
					path : binding.path && parts[1] ? binding.path + "." + parts[1] : (binding.path || parts[1])
				};
			}
		},

		
		/**
		 * Defines a new name space once a list of name space locators is available.
		 * 
		 * @param {string} namespaceLocator the name space that is to be defined
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments and returning the new definition
		 * @param {object} context a callback context (optional)
		 * 
		 */
		define: function () {
			return custom.call(this, arguments, "define", function (ns, result) {
				if (ns.namespace.get(ns.path))
					throw ("Scoped namespace " + ns.path + " has already been defined. Use extend to extend an existing namespace instead");
				ns.namespace.set(ns.path, result);
			});
		},
		
		
		/**
		 * Assume a specific version of a module and fail if it is not met.
		 * 
		 * @param {string} assumption name space locator
		 * @param {string} version assumed version
		 * 
		 */
		assumeVersion: function () {
			var args = Helper.matchArgs(arguments, {
				assumption: true,
				dependencies: "array",
				callback: true,
				context: "object",
				error: "string"
			});
			var dependencies = args.dependencies || [];
			dependencies.unshift(args.assumption);
			this.require(dependencies, function () {
				var argv = arguments;
				var assumptionValue = argv[0].replace(/[^\d\.]/g, "");
				argv[0] = assumptionValue.split(".");
				for (var i = 0; i < argv[0].length; ++i)
					argv[0][i] = parseInt(argv[0][i], 10);
				if (Helper.typeOf(args.callback) === "function") {
					if (!args.callback.apply(args.context || this, args))
						throw ("Scoped Assumption '" + args.assumption + "' failed, value is " + assumptionValue + (args.error ? ", but assuming " + args.error : ""));
				} else {
					var version = (args.callback + "").replace(/[^\d\.]/g, "").split(".");
					for (var j = 0; j < Math.min(argv[0].length, version.length); ++j)
						if (parseInt(version[j], 10) > argv[0][j])
							throw ("Scoped Version Assumption '" + args.assumption + "' failed, value is " + assumptionValue + ", but assuming at least " + args.callback);
				}
			});
		},
		
		
		/**
		 * Extends a potentiall existing name space once a list of name space locators is available.
		 * 
		 * @param {string} namespaceLocator the name space that is to be defined
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments and returning the new additional definitions.
		 * @param {object} context a callback context (optional)
		 * 
		 */
		extend: function () {
			return custom.call(this, arguments, "extend", function (ns, result) {
				ns.namespace.extend(ns.path, result);
			});
		},
				
		
		/**
		 * Requires a list of name space locators and calls a function once they are present.
		 * 
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments
		 * @param {object} context a callback context (optional)
		 * 
		 */
		require: function () {
			var args = Helper.matchArgs(arguments, {
				dependencies: "array",
				hiddenDependencies: "array",
				callback: "function",
				context: "object"
			});
			args.callback = args.callback || function () {};
			var dependencies = args.dependencies || [];
			var allDependencies = dependencies.concat(args.hiddenDependencies || []);
			var count = allDependencies.length;
			var deps = [];
			var environment = {};
			if (count) {
				var f = function (value) {
					if (this.i < deps.length)
						deps[this.i] = value;
					count--;
					if (count === 0) {
						deps.push(environment);
						args.callback.apply(args.context || this.ctx, deps);
					}
				};
				for (var i = 0; i < allDependencies.length; ++i) {
					var ns = this.resolve(allDependencies[i]);
					if (i < dependencies.length)
						deps.push(null);
					ns.namespace.obtain(ns.path, f, {
						ctx: this,
						i: i
					});
				}
			} else {
				deps.push(environment);
				args.callback.apply(args.context || this, deps);
			}
			return this;
		},

		
		/**
		 * Digest a name space locator, checking whether it has been defined by an external system.
		 * 
		 * @param {string} namespaceLocator name space locator
		 */
		digest: function (namespaceLocator) {
			var ns = this.resolve(namespaceLocator);
			ns.namespace.digest(ns.path);
			return this;
		},
		
		
		/**
		 * Returns all unresolved definitions under a namespace locator
		 * 
		 * @param {string} namespaceLocator name space locator, e.g. "global:"
		 * @return {array} list of all unresolved definitions 
		 */
		unresolved: function (namespaceLocator) {
			var ns = this.resolve(namespaceLocator);
			return ns.namespace.unresolvedWatchers(ns.path);
		},
		
		/**
		 * Exports the scope.
		 * 
		 * @return {object} exported scope
		 */
		__export: function () {
			return {
				parentNamespace: parentNamespace.__export(),
				rootNamespace: rootNamespace.__export(),
				globalNamespace: globalNamespace.__export(),
				localNamespace: localNamespace.__export(),
				privateNamespace: privateNamespace.__export()
			};
		},
		
		/**
		 * Imports a scope from an exported scope.
		 * 
		 * @param {object} data exported scope to be imported
		 * 
		 */
		__import: function (data) {
			parentNamespace.__import(data.parentNamespace);
			rootNamespace.__import(data.rootNamespace);
			globalNamespace.__import(data.globalNamespace);
			localNamespace.__import(data.localNamespace);
			privateNamespace.__import(data.privateNamespace);
		}
		
	};
	
}
var globalNamespace = newNamespace({tree: true, global: true});
var rootNamespace = newNamespace({tree: true});
var rootScope = newScope(null, rootNamespace, rootNamespace, globalNamespace);

var Public = Helper.extend(rootScope, (function () {  
/** 
 * This module includes all public functions of the Scoped system.
 * 
 * It includes all methods of the root scope and the Attach module.
 * 
 * @module Public
 * @access public
 */
return {
		
	guid: "4b6878ee-cb6a-46b3-94ac-27d91f58d666",
	version: '0.0.19',
		
	upgrade: Attach.upgrade,
	attach: Attach.attach,
	detach: Attach.detach,
	exports: Attach.exports,
	
	/**
	 * Exports all data contained in the Scoped system.
	 * 
	 * @return data of the Scoped system.
	 * @access private
	 */
	__exportScoped: function () {
		return {
			globalNamespace: globalNamespace.__export(),
			rootNamespace: rootNamespace.__export(),
			rootScope: rootScope.__export()
		};
	},
	
	/**
	 * Import data into the Scoped system.
	 * 
	 * @param data of the Scoped system.
	 * @access private
	 */
	__importScoped: function (data) {
		globalNamespace.__import(data.globalNamespace);
		rootNamespace.__import(data.rootNamespace);
		rootScope.__import(data.rootScope);
	}
	
};

}).call(this));

Public = Public.upgrade();
Public.exports();
	return Public;
}).call(this);
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