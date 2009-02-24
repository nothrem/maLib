/**
 * @author Nothrem Sinsky
 */
/* Technical manual
 *
 * Data Types
 * ==========
 * This framework uses names of data types differently from standart JS
 *
 *   Undefined        = undefined value
 *   Void / Null      = null value
 *   Boolean          = True / False
 *
 *   DOMelement       = element of DOM created by document.createElement()
 *   Element          = element created by $.element()
 */
_ = null;

/**
 * MA library's main scope
 */
$ = {
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
		$._isReady = true; //tells that its already initialased
		$._onInitExecuter();
	}, //init()

	/**
	 * @private
	 * runs onInit functions
	 */
	_onInitExecuter: function(){
		var i, cnt, initFunction;
		for (i = 0, cnt = $._onInit.length; i < cnt; i++) {
			initFunction = $._onInit[i];
			if ($._runInitFunction(initFunction)) {
				delete $._onInit[i]; //cannot call non-function
			}
		} //for each init method
		//disable interval if nothing is left to init
		if (0 == $._onInit.length && $._onInit.waiting) {
			window.clearInterval($._onInit.waiting);
		}
	},

	/**
	 * return true when library is initialized
	 *
	 * @param  [void]
	 * @return [Boolean]
	 */
	isReady: function() {
		return true === $._isReady;
	},

	/**
	 * @private
	 * tests if given namespace if defined
	 *
	 * @param  [String] path to test (e.g. 'window.document.body' to test existance of body element)
	 * @return [String] name of namespace part that does not exist, empty string on success
	 * @see $.isDefined()
	 */
	_isDefined: function(path){
		path = path.split('.');
		var scope;
		if ('window' === path[0]) {
			scope = window;
			path.shift(); //delete 'window' from the array
		}
		else
			if ('$' === path[0]) {
				scope = $;
				path.shift(); //delete '$' from the array
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
	 * - path can be either relative to current scope or absolute by starting with "window." or "$."
	 * - you can test any value that is defined (e.g. object, function, array, string (incl. empty), boolean (both True and False), etc.)
	 */
	isDefined: function(path) {
		return $._isDefined(path);
	},

	/**
	 * registers any function to be executed the moment framework is initialized
	 *
	 * @param  [Function] initialization function
	 * @param  [String]  (optional, default: none) name of namespace that must be defined before init can be called (e.g. '$.console' to wait for $.console to initialize)
	 * @return [Boolean] true if function was already executed, false for funtion registered, null for error
	 */
	registerInitFunction: function(initFunction, required){
		required = required || 'window.$';
		if ('function' === typeof initFunction) {
			if (initFunction._initRequired) {
				$.console.warn('Each method can be used only once for initialization when "required" parameter is defined');
			}
			initFunction._initRequired = required;
			if (true === $._isReady) { //framework was already initialized...
				if (!$._runInitFunction(initFunction)) {
					//initFunction must wait for required
					$._onInit.push(initFunction);
					return false;
				}
				return true;
			}

			$._onInit.push(initFunction);
			return false;
		}

		$.console.error('Cannot use non-function for initialization');
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
		if ('string' === typeof initFunction._initRequired && '' !== $._isDefined(initFunction._initRequired)) {
			$.console.log('Init method is waiting for ' + initFunction._initRequired);
			if (!$._onInit.waiting) { //set timer to execute this method again in a while
				$._onInit.waiting = window.setInterval("$._onInitExecuter()", 500);
			}
			return false;
		}
		$.console.log('Calling Init method');
		initFunction.call(window); //call as function in the scope of window
		return true;
	},

	/**
	 * load JavaScript file into HTML head
	 * !can be called only from script within HTML's HEAD or BODY (see $.ajax.request::isJS for later JS loading)
	 *
	 * @param  [String] file name
	 * @return [void]
	 */
	loadJS: function(fileName){
		document.write('<script type="text/javascript" src="' + fileName + '.js"></script>');
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
		link.setAttribute('href', fileName + '.css');
		document.getElementsByTagName("head").item(0).appendChild(link);
	}, //loadCSS

	/**
	 * @private
	 * waits until HTML is loaded and initializes the framework
	 */
	_startInit: function(){
		if ('' === $._isDefined('window.document.body')) {
			$._init();
		}
		else {
			window.setTimeout($._startInit, 100);
		}
	}

}; //main scope object

/**
 * load all framework files
 */
$_PATH = $_PATH || '';
$.loadJS($_PATH + 'external/printf');
$.loadJS($_PATH + 'framework/console');
//$.loadJS($_PATH + 'framework/lib');
//$.loadJS($_PATH + 'framework/ex');
//$.loadJS($_PATH + 'framework/ajax');
//$.loadJS($_PATH + 'framework/element');
//$.loadJS($_PATH + 'framework/framework');
////$.loadJS($_PATH + 'framework/animations');
//$.loadJS($_PATH + 'framework/tween/tween');
//$.loadCSS($_PATH + 'style/framework');

/**
 * Try to initialize the library
 */
$._startInit();
