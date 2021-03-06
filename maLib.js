/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded for free.
 * GIT repository: ssh://git@jii.chobits.ch:17222/~/maLib (send your public key to git@chobits.ch to gain free access).
 *
 * Author does not guarantee any support and takes no resposibility for any damage.
 * You use this code at your own risk. You can modify it as long as this header is present and unchaged!
 *
 * This library may contain whole, parts or modifications of third party files,
 * libraries, frameworks or other code, which are published under one of 'free'
 * licences. See head of main file or file LICENCE.* .
 */

/**
 * Required parts:
 *   ma.console
 * Optional parts:
 *   NONE
 */

/**
 * MA library's main scope
 * @class
 */
ma = {
	/**
	 * @class ma
	 */

	/**
	 * load all framework files
	 *
	 * @param  path [String] (optional, default: '') relative path of framework files on server
	 * @return [void] note that after this method framework may not be fully loaded, see ma.registerInitFunction()
	 *
	 * @note start path with '/' to use absolute path (e.g. http://server/path) or w/o '/' for relative (e.g. http://server/project/path)
	 */
	_loadFiles: function(path){
		var write = 'write';

		path = path || '';
		ma._filePath = path;
		//load CSS files for jQuery UI
		ma.loadCSS('external/jQuery/jquery-ui' + (ma._isDebug ? '' : '.min')); //jQuery UI theme
		//load external files and frameworks
		ma.loadJS('external/printf');
		ma.loadJS('external/jQuery/jquery' + (ma._isDebug ? '' : '.min')); //jQuery
		ma.loadJS('external/jQuery/jquery-ui' + (ma._isDebug ? '' : '.min')); //jQuery UI
		ma.loadJS('external/jQuery/jquery-ui-i18n' + (ma._isDebug ? '' : '.min')); //jQuery
		ma.loadJS('external/jQuery/jquery-timing' + (ma._isDebug ? '' : '.min')); //jQuery
		ma.loadJS('external/ExtJs3core/ext-jquery-adapter' + (ma._isDebug ? '-debug' : '')); //jQuery-to-Ext convertor
//		ma.loadJS('external/ExtJs3core/ext-core' + (ma._isDebug ? '-debug' : '')); //Ext 3.1.0 (kept here for debugging - Ext 3.4.x is not tested for Core mode and may contain references to full Ext)
		ma.loadJS('external/ExtJs3core/ext-core-update' + (ma._isDebug ? '-debug' : '')); //Ext 3.4.1.1 (requires Ext-Base or Ext-Adapter to base on)
		document[write]('<script type="text/javascript">ma._onInitFramework();</script>'); //prevents JSlint from saying that document.write is evil ;)
		//load internal CSS files
		ma.loadCSS('style/framework');
		//load internal files
		ma.loadJS('framework/javascript');
		ma.loadJS('framework/console');
		ma.loadJS('framework/util');
		ma.loadJS('framework/events');
		ma.loadJS('framework/Base');
		ma.loadJS('framework/browser');
		ma.loadJS('external/browserDetect');
		ma.loadJS('framework/Element');
		ma.loadJS('framework/html/Form');
		ma.loadJS('framework/html/Button');
		ma.loadJS('framework/cookies');
		ma.loadJS('framework/storage');
		ma.loadJS('framework/ajax');
		ma.loadJS('framework/ajaxCache');
		ma.loadJS('external/spin/spin' + (ma._isDebug ? '' : '.min'));
		ma.loadJS('external/spin/jquery.spin');
	},

	/**
	 * @private
	 * Initializes framework
	 *
	 * @param  [void]
	 * @return [void]
	 */
	_init: function(){
		//ma can init only when Ext is ready and the document body exists
		if (ma.isDefined('window.Ext')) {
			if (ma.isDefined('window.document.body', true)) {
				ma.registerInitFunction(ma.onReady, '', 'onReady'); //put onReady as last method to be executed
				ma._onInitExecuter();
				ma._isReady = true; //tells that page is initialized and ready for developer interaction
			}
			else {
				window.setTimeout(ma._init, 10);
			}
		}
		else {
			ma._waitForExt();
		}
	},

	/**
	 * @private
	 * List of methods to be executed after initialization if completed
	 */
	_onInit: [],

	/**
	 * Override this method to create method that is called after library is ready
	 * This should be the method to use to create or alter your page instead of body.onload
	 *
	 * @param  [void]
	 * @return [void]
	 */
	onReady: function(){
		ma.console.warn('It is recommended to create your own ma.onReady handler!');
	},

	/**
	 * Performs actions that initializes maLib but required Ext to be already initialized
	 */
	_onInitFramework: function() {
		ma.Namespace = ma.extend(ma.Namespace._class, ma.Array, ma.Namespace); //object used by ma.getNamespace()
	},

	/**
	 * @private
	 * runs onInit functions
	 */
	_onInitExecuter: function(){
		var i, cnt, initFunction;
		for (i = 0, cnt = ma._onInit.length; i < cnt; i++) {
			initFunction = ma._onInit[i];
			ma._runInitFunction(initFunction, i);
		} //for each init method
		//after all init methods are executed...
		//disable interval if nothing is left to init
		if (ma._onInit.waiting) {
			window.clearInterval(ma._onInit.waiting);
		}
	},

	/**
	 * return true when library is initialized
	 *
	 * @param  {void}
	 * @return {Boolean}
	 */
	isReady: function() {
		return (true === ma._isReady) && (true === Ext.isReady);
	},

	Namespace: {
		_className: 'Namespace',
		_fullName: 'ma.Namespace',
		/**
		 * @private
		 * parses namespace string into array
		 *
		 * @param  namespace    [String]
		 * @param  baseScope    [Object] (optional, default: window) reference to object where to start looking for namespace
		 * @return [Array] (empty for invalid namespace; see errorIndex and errorName)
		 *           indexes    [String] parsed namespace path (e.g. ['window', 'document', 'body']
		 *           .length    [Integer] number of path parts (note that this is standard Array property)
		 *           .namespace [String] original namespace (e.g. 'window.document.body')
		 *           .nodeName  [String] name of last node (e.g. 'body')
		 *           .scopeName [String] namespace w/o/ node (e.g. 'window.document'); empty if namespace is direct child of baseScope
		 *           .node      [Object] reference to node (e.g. reference to window.document.body); undefined if node is invalid; NULL if node is NULL (in this case error is empty)
		 *           .scope     [Object] reference to scope (e.g. reference to window.document); undefined if a path part is invalid; NULL if errorName is NULL
		 *           .call      [Function] if node if function, calls is in its scope and given params and returns its result; otherwise returns undefined; note that it must be called in scope of this array
		 *           .errorIndex[Integer] index of path part that is undefined (path part must be defined and not NULL; node must be defined but can be NULL)
		 *                                is undefined when whole namespace is valid; -1 if only last node is invalid (i.e. scope is valid)
		 *           .errorName [String]  name of node that is invalid
		 *                                is undefined when whole namespace is valid
		 */
		_class: function(namespace, baseScope) {
			if ('string' !== typeof namespace) {
				this.errorIndex = 0;
				this.errorName = 'undefined';
				return this;
			}

			var
				scope = baseScope || window,
				path = namespace.split('.'),
				length = path.length,
				i, part;

			this.namespace = namespace;
			this.nodeName = path[length - 1];
			this.scopeName = path.slice(0, -1).join('.');

			for (i = 0; i < (length - 1); i++) {
				part = path[i];
				scope = scope[part];

				this.push(part);

				if (undefined === scope || null === scope) {
					//scope is undefined - write error and quit looking; null is also forbidden for scope as it needs to have child nodes
					this.errorIndex = i;
					this.errorName = part;
					break;
				}
			}

			this.scope = scope;

			if (scope) {
				this.node = scope[this.nodeName];

				if (undefined === this.node) {
					this.errorIndex = -1;
					this.errorName = this.nodeName;
				}
			}
			else {
				this.node = undefined;
			}
			this.push(this.node);

		}, //class constructor
		call: function() {
			if (undefined === this.errorIndex && ma.util.is(this.node, Function)) {
				this.node.apply(this.scope, arguments);
			}
		}
	},

	/**
	 * returns new Namespace object from given path
	 *
	 * @param  namespace    [String]
	 * @param  baseScope    [Object] (optional, default: window) reference to object where to start looking for namespace
	 * @return [ma.Namespace]
	 */
	_getNamespace: function(namespace, baseScope) {
		return new ma.Namespace(namespace, baseScope);
	},

	/**
	 * @private
	 * tests if given namespace if defined
	 *
	 * @param  [String] path to test (e.g. 'window.document.body' to test existance of body element)
	 * @param  [String] (optional, default: false) true to consider NULL value as same as undefined, false means NULL is valid value and means object is defined
	 * @return [String] name of namespace part that does not exist, empty string on success
	 * @see ma.isDefined()
	 */
	_isDefined: function(namespace, ignoreNull){
		var path;

		//try to find namespace in window
		path = ma._getNamespace(namespace);

		//if namespace begins with 'this', look again in current scope
		if ('this' === path[0]) {
			path = ma._getNamespace(namespace, this);
		}

		//on error, return the name
		if (undefined !== path.errorIndex) {
			return path.errorName;
		}

		//if ignoreError not set and node is null, return error
		if (true !== ignoreNull && null === path.node) {
			return path.nodeName;
		}

		return ''; //everything is defined
	},

	/**
	 * tests if given namespace if defined
	 *
	 * @param {String} path path to test (e.g. 'window.document.body' to test existance of body element)
	 * @param {Boolean} [ignoreNull=true] true to consider NULL value as same as undefined, false means NULL is valid value and means object is defined
	 * @return {Boolean} True if the namespace is already defined
	 *
	 * @note
	 * - path can be either relative to current scope or absolute by starting with "window.", "ma." or "Ext."
	 * - you can test any value that is defined (e.g. object (for NULL see second param), function, array, string (incl. empty), boolean (both True and False), etc.)
	 * - for debug purpose you can use private method _isDefined() that returns name of namespace that is undefined
	 */
	isDefined: function(path, ignoreNull){
		return '' === ma._isDefined.apply(this, arguments);
	},

	/**
	 * registers any function to be executed the moment framework is initialized
	 *
	 * @param  [Function/String] initialization function
	 * @param  [String]  (optional, default: none) name of namespace that must be defined before init can be called (e.g. 'ma.console' to wait for ma.console to initialize)
	 * @return [Boolean] true if function was already executed, false for function registered, null for error
	 */
	registerInitFunction: function(initFunction, required, name){
		required = required || 'window.ma';

		var init = {
			required: required,
			name: ('string' === typeof initFunction ? initFunction : name || 'anonymous')
		};

		if (-1 < ma._onInit.indexOf(initFunction)) {
			ma.console.warn('Each method can be used only once for initialization.');
		}

		if ('string' === typeof initFunction) {
			init.namespace = initFunction;
		}
		else if ('function' === typeof initFunction) {
			init.fn = initFunction;
		}

		if (true === ma._isReady) { //framework was already initialized...
			if (!ma._runInitFunction(initFunction)) {
				//initFunction must wait for required
				ma._onInit.push(initFunction);
				return false;
			}
			return true;
		}

		ma._onInit.push(init);
		return false;
	}, //registerInitFunction()

	/**
	 * @private
	 * executes initFunction
	 *
	 * @param  [Object] init function processed by registerInitFunction()
	 * @return [Boolean]  true when function was already executed, false for postponed ones
	 */
	_runInitFunction: function(initFunction){
		if (!initFunction.fn && !initFunction.namespace) {
			ma.console.log('Invalid init ' + initFunction.name + ' function ignored.');
			return true;
		}

		var required = initFunction.required, name = initFunction.name, ns;

		if ('string' === typeof required && !ma.isDefined(required)) {
			ma.console.log('Init method ' + name + ' is waiting for ' + required);
			if (!ma._onInit.waiting) { //set timer to execute this method again in a while
				ma._onInit.waiting = window.setInterval(ma._onInitExecuter, 50);
			}
			return false;
		}
		ma.console.log('Init method ' + name + ' is ready to execute');
		if (initFunction.namespace) {
			try {
				ns = new ma.Namespace(initFunction.namespace);
				ns.call();
			}
			catch (e) {
				ma.console.warn('Init method ' + name + ' failed to initialize its namespace!');
			}
		}
		else {
			try {
				initFunction.fn();
			}
			catch (e) {
				ma.console.warn('Init method ' + name + ' failed to run!');
			}
		}
		return true;
	},

	_loadJsExtension: '.js',
	_loadCssExtension: '.css',

	/**
	 * load JavaScript file into HTML head
	 *
	 * @param  [String] file name
	 * @param  [Boolean] (optional, default: false) if true, file will be loaded from web root, otherwise it will be loaded from maLib folder
	 * @return [void]
	 */
	loadJS: function(fileName, rootPath){
		var script, head, write;

		fileName = (true === rootPath ? '' : ma._filePath ? ma._filePath + '/' : '') + fileName + ma._loadJsExtension + '?' + (new Date()).getTime();

		if (ma.isReady()) {
			script = document.createElement('script');
			head = document.head || document.getElementByTagName('head')[0];

			script.type = 'text/javascript';
			script.src = fileName;
			head.appendChild(script);
		}
		else {
			write = 'write'; //prevents JSlint from saying that document.write is evil ;)
			document[write]('<script type="text/javascript" src="' + fileName + '"></script>');
		}
	}, //loadJS()

	/**
	 * load CSS file into HTML head
	 *
	 * @param  [String] file name
	 * @param  [Boolean] (optional, default: false) if true, file will be loaded from web root, otherwise it will be loaded from maLib folder
	 * @return [void]
	 */
	loadCSS: function(fileName, rootPath){
		var link = document.createElement('LINK');
		link.setAttribute('type', 'text/css');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href',  (true === rootPath ? '' : ma._filePath ? ma._filePath + '/' : '') + fileName + ma._loadCssExtension);
		document.getElementsByTagName("head").item(0).appendChild(link);
	}, //loadCSS
	/**
	 * @private
	 * waits for Ext to load and init
	 *
	 * @param  [void]
	 * @return [void]
	 */
	_waitForExt: function(){
		if (ma.isDefined('window.Ext.isReady') && Ext.isReady) {
			ma._init();
		}
		else {
			window.setTimeout(ma._waitForExt, 10);
		}
	},

	/**
	 * Parses server path of ma framework from current HTML code
	 *
	 * @param  [void]
	 * @return [String] server path (e.g. '/fx/maLib/') or empty string on error (e.g. maLib is loaded dynamically, parsed via eval, etc.)
	 */
	_getMyPath: function() {
		var
			scripts = document.getElementsByTagName('script'),
			regex = /(.*)\/maLib\.js(\?debug)?/g,
			cnt = scripts.length,
			path,
			i;

		for (i = 0; i < cnt; i++) {
			path = regex.exec(scripts[i].src);
			if (path) {
				break; //if path found, end the searching
			}
		}

		if (path && path[2]) {
			ma._isDebug = true;
		}

		return (path && path[1]) ? path[1] : '';
	}, //_getMyPath

	/**
	 * Extends class by its parent (improved Ext.extend method)
	 *
	 * @param  extendClass [Object / String] reference to class or its name incl. namespace (e.g. "ma.mySpace.MyClass")
	 * @param  superClass  [Object] parent class (equals to 'extends' keyword from other languages)
	 * @param  methods     [Object] object with class methods
	 * @return [Object] see Ext.extend() for details
	 *
	 * @example Class methods and properties created by this method (if called with extendClass of String type):
<code>
	._className [String] name of the new class (e.g. "MyClass") - can be used in debug reports
	._fullName  [String] name of the new class incl. namespace (e.g. "ma.mySpace.MyClass")
	._class     [Object] reference to class from which the object was created
	._class.superclass [Object] reference to superClass (i.e. parent class)
</code>
	 */
	extend: function(extendClass, superClass, methods) {
		var path;

		if ('string' === typeof extendClass) { //generate class references
			path = ma._getNamespace(extendClass);
			extendClass = path.node;

			Ext.applyIf(methods, {
				_className: path.nodeName,
				_fullName:  path.namespace,
				_class:     path.node
			}); //merge class references
		}
		else {
			if (!methods._className) {
				throw new Error('Extend: Missing class name. Either call extend with string className param or define own property methods._className');
			}
			if (!methods._class) {
				throw new Error('Extend: Missing class reference. Either call extend with string className param or define own property methods._class');
			}
			if (!methods._fullName) {
				throw new Error('Extend: Missing full name. Either call extend with string className param or define own property methods._fullName');
			}
		}

		if (!extendClass) {
			throw new Error('Extend: Invalid or undefined class for extension');
		}

		extendClass._isInstance = false;
		extendClass._isClass = true;

		return Ext.extend(extendClass, superClass, methods);
	}

}; //main scope object

//IE does not support HTMLElement class
//this creates fictive HTMLElement class to allow to use it in ma.util.is() method instead of native one
if (!window.HTMLElement) {
	window.HTMLElement = 'HTMLElement';
}

//workaround for Ext not being able to recognize Objects inherited from Array as an Array
ma.Array = function() { /* Array constructor */ return; };
ma.Array.prototype = []; //very simple inheritance from Array

ma._loadFiles(ma._getMyPath());

if (false) {
	/**
	 * Browser window object - helps some IDEs to detect definitions in JS
	 */
	window = {};
}
/**
 * Initialization after page is loaded
 * window.onload is alias for body.onload; its just available before body is created ;)
 */
(function(window, onload, onunload) {
	window.onload = function() {
		if ('function' === typeof onload) {
			onload.apply(window, arguments);
		}
		ma._init();
	};
	window.onunload = function() {
		if ('function' === typeof onload) {
			onunload.apply(window, arguments);
		}
		ma.console.log('Please ignore error "TypeError: h is null"');
	};

})(window, window.onload, window.onunload);

