/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded
 * from svn://chobits.ch/source/maLib and used for free.
 *
 * Author does not guarantee any support and takes no resposibility for any damage.
 * You use this code at your own risk. You can modify it as long as this header is present and unchaged!
 */

/**
 * Required parts:
 *   ma.console
 * Optional parts:
 *   NONE
 */

/**
 * MA library's main scope
 */
ma = {
	/**
	 * load all framework files and init it; method must be called within page's HEAD
	 * 
	 * @param  path [String] (optional, default: '') relative path of framework files on server
	 * @return [void] note that after this method framework may not be fully loaded, see ma.registerInitFunction()
 	 */
	init: function(path) {
		path = path || '';
		ma._filePath = path;
		ma.loadJS('external/printf');
		ma.loadJS('external/ExtJS3core/ext-core');
		ma.loadJS('framework/console');
		ma.loadJS('framework/util');
		ma.loadJS('framework/events');
		
		ma._startInit();
	},

	/**
	 * @private
	 * List of methods to be executed after initialization if completed
	 */
	_onInit: [],

	/**
	 * @private
	 * initializes the framework
	 *
	 * @param  [void]
	 * @return [void]
	 */
	_init: function(){
		ma._isReady = true; //tells that its already initialased
		ma._onInitExecuter();
	}, //init()

	/**
	 * @private
	 * runs onInit functions
	 */
	_onInitExecuter: function(){
		var i, cnt, initFunction;
		for (i = 0, cnt = ma._onInit.length; i < cnt; i++) {
			initFunction = ma._onInit[i];
			if (ma._runInitFunction(initFunction)) {
				delete ma._onInit[i]; //cannot call non-function
			}
		} //for each init method
		
		//after all init methods are executed...
		if (0 == ma._onInit.length) {
			//disable interval if nothing is left to init
			if (ma._onInit.waiting) {
				window.clearInterval(ma._onInit.waiting);
			}
		}
	},

	/**
	 * return true when library is initialized
	 *
	 * @param  [void]
	 * @return [Boolean]
	 */
	isReady: function() {
		return (true === ma._isReady) && (true === Ext.isReady);
	},

	/**
	 * @private
	 * tests if given namespace if defined
	 *
	 * @param  [String] path to test (e.g. 'window.document.body' to test existance of body element)
	 * @return [String] name of namespace part that does not exist, empty string on success
	 * @see ma.isDefined()
	 */
	_isDefined: function(path){
		path = path.split('.');
		var scope;
		if ('window' === path[0]) {
			scope = window;
			path.shift(); //delete 'window' from the array
		}
		else if ('Ext' === path[0]) {
			scope = Ext;
			path.shift(); //delete 'window' from the array
		}
		else
			if ('ma' === path[0]) {
				scope = ma;
				path.shift(); //delete 'ma' from the array
			}
			else {
				scope = this;
			}

		for (var i = 0, c = path.length; i < c; i++) {
			scope = scope[path[i]];
			if (undefined === scope) {
				return path[i];
			} //else this namespace exists and we can test next part of path
		}

		return ''; //empty string means that given namespace exists
	},

	/**
	 * tests if given namespace if defined
	 *
	 * @param  [String] path to test (e.g. 'window.document.body' to test existance of body element)
	 * @return [String] name of namespace part that does not exist, empty string on success
	 *
	 * notes:
	 * - path can be either relative to current scope or absolute by starting with "window.", "ma." or "Ext."
	 * - you can test any value that is defined (e.g. object, function, array, string (incl. empty), boolean (both True and False), etc.)
	 */
	isDefined: function(path) {
		return ma._isDefined(path);
	},

	/**
	 * registers any function to be executed the moment framework is initialized
	 *
	 * @param  [Function] initialization function
	 * @param  [String]  (optional, default: none) name of namespace that must be defined before init can be called (e.g. 'ma.console' to wait for ma.console to initialize)
	 * @return [Boolean] true if function was already executed, false for funtion registered, null for error
	 */
	registerInitFunction: function(initFunction, required, name){
		required = required || 'window.ma';
		if ('function' === typeof initFunction) {
			if (initFunction._initRequired) {
				ma.console.warn('Each method can be used only once for initialization when "required" parameter is defined');
			}
			initFunction._initRequired = required;
			initFunction._name = name || 'NoName';
			if (true === ma._isReady) { //framework was already initialized...
				if (!ma._runInitFunction(initFunction)) {
					//initFunction must wait for required
					ma._onInit.push(initFunction);
					return false;
				}
				return true;
			}

			ma._onInit.push(initFunction);
			return false;
		}

		ma.console.error('Cannot use non-function for initialization');
		return null;
	}, //registerInitFunction()

	/**
	 * @private
	 * exucutes initFunction
	 *
	 * @param  [Function] reference to initFunction
	 * @return [Boolean]  true when function was already executed, false for posponed ones
	 */
	_runInitFunction: function(initFunction){
		if ('function' !== typeof initFunction) {
			return true;
		}
		if ('string' === typeof initFunction._initRequired && '' !== ma._isDefined(initFunction._initRequired)) {
			ma.console.log('Init method ' + initFunction.name + ' is waiting for ' + initFunction._initRequired);
			if (!ma._onInit.waiting) { //set timer to execute this method again in a while
				ma._onInit.waiting = window.setInterval("ma._onInitExecuter()", 500);
			}
			return false;
		}
		ma.console.log('Calling init method' + initFunction.name);
		initFunction.call(window); //call as function in the scope of window
		return true;
	},

	/**
	 * load JavaScript file into HTML head
	 * !can be called only from script within HTML's HEAD or BODY (see ma.ajax.request::isJS for later JS loading)
	 *
	 * @param  [String] file name
	 * @return [void]
	 */
	loadJS: function(fileName){
		var write = 'write'; //prevents JSlint from saying that document.write is evil ;)
		document[write]('<script type="text/javascript" src="' + ma._filePath + '/' + fileName + '.js"></script>');
	}, //loadJS()

	/**
	 * load CSS file into HTML head
	 *
	 * @param  [String] file name
	 * @return [void]
	 */
	loadCSS: function(fileName){
		var link = document.createElement('LINK');
		link.setAttribute('type', 'text/css');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', ma._filePath + '/' + fileName + '.css');
		document.getElementsByTagName("head").item(0).appendChild(link);
	}, //loadCSS

	/**
	 * @private
	 * waits until HTML is loaded and initializes the framework
	 */
	_startInit: function(){
		ma._waitForExt();
		if ('' === ma._isDefined('window.document.body')) {
			ma._init();
		}
		else {
			window.setTimeout(ma._startInit, 100);
		}
	},
	
	_waitForExt: function() {
		if ('' === ma._isDefined('window.document.body') && '' === ma._isDefined('ma.console')) {
			ma.console.log('Ext is ready to use.');
		}
		else {
			window.setTimeout(ma._waitForExt, 100);
		}
	}
}; //main scope object