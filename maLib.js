/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded
 * from svn://chobits.ch/source/maLib and used for free.
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
 */
ma = {
	/**
	 * load all framework files
	 *
	 * @param  path [String] (optional, default: '') relative path of framework files on server
	 * @return [void] note that after this method framework may not be fully loaded, see ma.registerInitFunction()
	 *
	 * @note start path with '/' to use absolute path (e.g. http://server/path) or w/o '/' for relative (e.g. http://server/project/path)
	 */
	_loadFiles: function(path){
		path = path || '';
		ma._filePath = path;
		//load external files and frameworks
		ma.loadJS('external/printf');
		ma.loadJS('external/ExtJs3core/ext-core');
		//load internal files
		ma.loadJS('framework/console');
		ma.loadJS('framework/util');
		ma.loadJS('framework/events');
		ma.loadJS('framework/Base');
		ma.loadJS('framework/Element');
		ma.loadJS('framework/cookies');
		ma.loadJS('framework/ajax');
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
				ma.registerInitFunction(ma.onReady, '', 'onReady'); //putOnReady as last method to be executed
				ma._onInitExecuter();
				ma._isReady = true; //tells that page is initialased and ready for developer interaction
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
	 * @private
	 * runs onInit functions
	 */
	_onInitExecuter: function(){
		var i, cnt, initFunction;
		for (i = 0, cnt = ma._onInit.length; i < cnt; i++) {
			initFunction = ma._onInit[i];
			if (ma._runInitFunction(initFunction, i)) {
				delete ma._onInit[i]; //cannot call non-function
			}
		} //for each init method
		//after all init methods are executed...
		if (0 === ma._onInit.length) {
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
	 * @param  [String] true to consider NULL value as same as undefined, false means NULL is valid value and means object is defined
	 * @return [String] name of namespace part that does not exist, empty string on success
	 * @see ma.isDefined()
	 */
	_isDefined: function(path, ignoreNull){
		path = path.split('.');
		var scope;
		if ('window' === path[0]) {
			scope = window;
			path.shift(); //delete 'window' from the array
		}
		else
			if ('Ext' === path[0]) {
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
			if (undefined === scope || (ignoreNull && null === scope)) {
				return path[i];
			} //else this namespace exists and we can test next part of path
		}

		return ''; //empty string means that given namespace exists
	},

	/**
	 * tests if given namespace if defined
	 *
	 * @param  [String] path to test (e.g. 'window.document.body' to test existance of body element)
	 * @param  [String] true to consider NULL value as same as undefined, false means NULL is valid value and means object is defined
	 * @return [Boolean] True if the namespace is already defined
	 *
	 * notes:
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
			if (required) { //prevents saving null or empty string
				initFunction._initRequired = required;
			}
			initFunction._name = name || 'NoName';
			if (true === ma._isReady) { //framework was already initialized...
				if (!ma._runInitFunction(initFunction, 'post-init')) {
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
	_runInitFunction: function(initFunction, index){
		if ('function' !== typeof initFunction) {
			return true;
		}

		index = !ma.util.is(index, 'empty') ? ' (index:' + index + ')' : '';

		var required = initFunction._initRequired, name = initFunction._name;

		if ('string' === typeof required && !ma.isDefined(required)) {
			ma.console.log('Init method ' + name + index + ' is waiting for ' + required);
			if (!ma._onInit.waiting) { //set timer to execute this method again in a while
				ma._onInit.waiting = window.setInterval("ma._onInitExecuter()", 500);
			}
			return false;
		}
		ma.console.log('Init method ' + name + index + ' is ready to execute');
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

	_getMyPath: function() {
		var
			head = document.getElementsByTagName('HEAD')[0],
			regex = /src=\"(.*)\/maLib\.js\"/g,
			path = regex.exec(head.innerHTML);

		return (path && path[1]) ? path[1] : '';
	} //_getMyPath

}; //main scope object

ma._loadFiles(ma._getMyPath());

/**
 * Initialization after page is loaded
 * window.onload is alias for body.onload; its just available before body is created ;)
 */
window.onload = function() {
	ma._init();
};