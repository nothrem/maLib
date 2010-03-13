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
 *   NONE
 * Optional parts:
 *   (external) window.printf
 */


ma.util = {
	/**
	 * NOP (null operation; empty function; does nothing)
	 *
	 * @param  [void]
	 * @return [void]
	 */
	nop: function(){
		return;
	}, //nop()
	/**
	 * formats message with placeholders
	 *
	 * @param  [String] string with format placeholders
	 * @param  [Mixed]  any number of variables to be placed to plasceholders
	 * @return [String] formated string
	 *
	 * @see printf function from C++
	 */
	printf: window.printf ||
	function(message){
		return message;
	}, //printf()
	/**
	 * shows a message
	 *
	 * @param  [String] (required) message to show, optionally with placeholders
	 * @param  [Mixed]  (optional) any number of variables to be placed to plasceholders
	 * @return [void]
	 *
	 * @see ma.util.printf()
	 */
	alert: function(message){
		message = ma.util.printf.apply(this, arguments);
		window.alert(message);
	}, //alert()
	/**
	 * returns info about current window
	 *
	 * @param  [void]
	 * @return [object] list of values; any value can be null if browser does not support it
	 *            .width [Integer] width of current document
	 *            .height [Integer] height of current document
	 */
	getWindowInfo: function(){
		if (!window) {
			ma.console.error("Window is not defined");
			return;
		}

		var info = {
			width: null,
			height: null
		};

		if (window.innerHeight) {
			//usual in FF, O9, S3
			info.width = window.innerWidth;
			info.height = window.innerHeight;
		}
		else
			if (document.documentElement && document.documentElement.clientHeight) {
				//workaround in IE7
				info.width = document.documentElement.clientWidth;
				info.height = document.documentElement.clientHeight;
			}

		return info;
	}, //getWindowInfo()

	/**
	 * sets object's properties
	 *
	 * @param  object [Object] (required) object to merge values into
	 * @param  values [Object] (required) object with values to merge
	 * @return [Boolean] false on any error, true when all values are set OK
	 */
	merge: function(object, values){
		var
			is = ma.util.is,
			error = false,
			property,
			value;

		if (is(object,'empty')) {
			return false;
		}

		if (is(values, Object) && !is(values, Array)) {
			for (property in values) {
				value = values[property];
				if (
					is(value, Object)
					& !is(value, Array)
					& !is(value, HTMLElement)
					& !is(value, RegExp)) {
					if (!is(object[property], Object)) {
						object[property] = {}; //ensure property is defined as object
					}
					error = ma.util.merge(object[property], value) || error;
				}
				else {
					object[property] = value;
				} //recursion or not
			} //for each property
			return !error;
		}
		else {
			return false;
		}
	},

	/**
	 * creates new independent clone of an object
	 *
	 * @param  object [Object] (required) object to clone
	 * @param  values [Object] (optional) object with additional values
	 * @return [Object] new clone
	 */
	clone: function(object, values){
		var clone = object.constructor(); //new empty object - base for the clone

		//create 1:1 clone of the base object
		ma.util.merge(clone, object);
		//modify the clone with the values
		ma.util.merge(clone, values);

		return clone;
	},

	/**
	 * returns value of GET parameter from page's URL
	 *
	 * @param  [String] name of the param to get
	 * @return [String] value of the param or empty string if param does not exist
	 *
	 * @author NetLobo.com (optimized by nothrem)
	 */
	getUrlParam: function(param){
		var regexS, regex, value;

		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		regexS = "[\\?&]" + name + "=([^&#]*)";
		regex = new RegExp(regexS);
		value = regex.exec(window.location.href);
		return (null === value) ? "" : value[1];
	}, //getUrlParam

	/**
	 * checks type of a value
	 *
	 * @param  [Mixed] value you want to check
	 * @param  [Mixed] type you want to check (available values check below)
	 *            undefined                = value is undefined (note that is() results to true since both params are undefined and it means equal)
	 *            null                     = value is null (i.e. reference to NULL)
	 *            [String] 'empty'         = undefined, null, empty array ([]) or empty string (''); NOT 0 (zero), false, empty object ({}) or empty function (ma.util.nop)
	 *            [String] 'zero'          = same as 'empty' including 0 (zero) and false
	 *            String, Number, Boolean  = object of this type (e.g. new String('A')) or primitive value of this type ('A')
	 *            Array, Function          = object of this type (e.i. for Array = new Array() or []; for Function = function() {})
	 *            Object                   = any object (either any of mentioned above EXCEPT Function and NULL!!)
	 *            [Function] <Class>       = if you pass a constructor function, it will check that value is instance of this class
	 *            [Mixed] <any value>      = any other value will check that value is equal to this value (e.g. is('10', 10.0); returns true as the values are equal)
	 * @return [Boolean] true when value equals to given type
	 */
	is: function(value, type) {
		if (undefined === type) {
			return undefined === value;
		}
		if (null === type) {
			return null === value;
		}
		if (String === type ) {
			return 'string' === typeof value || value instanceof String;
		}
		if (Number === type ) {
			return 'number' === typeof value || value instanceof Number;
		}
		if (Boolean === type ) {
			return 'boolean' === typeof value || value instanceof Boolean;
		}
		if (Array === type ) {
			return true === Ext.isArray(value);
		}
		if (Function === type ) {
			return true === Ext.isFunction(value);
		}
		if (ma.Element && HTMLElement === type ) {
			if (ma.Element.isHtmlElement) {
				return ma.Element.isHtmlElement(value);
			}
			else {
				if (window.HTMLElement) {
					return value instanceof HTMLElement;
				}
				else {
					ma.console.errorAt('Cannot check HTMLElement in this client', 'ma.util', 'is');
				}
			}
		}
		if (Object === type ) {
			return true === Ext.isObject(value);
		}
		if (Ext.isFunction(type) || Ext.isObject(type)) {
			return (value instanceof type);
		}
		if (ma.util.is(type, String)) {
			if ('empty' === type.toLowerCase()) {
				return Ext.isEmpty(value);
			}
			if ('zero' === type.toLowerCase()) {
				return Ext.isEmpty(value) || 0 === value || false === value;
			}
		}
		//unknown type, consider it as direct value
		return value == type;
	}, //is()

	/**
	 * executes callback in given scope and with given params
	 *
	 * @param  [Callback] options
	 *            .callback  [Function] (optional, default: no callback)
	 *            .callbackScope [Object] (optional, default: window)
	 *            .callbackParams [Array] (optional, default: none)
	 * @return [Mixed] what returned the callback; undefined for invalid callback
	 *
	 * @note: as a type Callback will be called any object that contains properties defined above
	 */
	runCallback: function(options) {
		if (ma.util.is(options.callback, Function)) {
			return options.callback.apply(options.callbackScope || window, options.callbackParams || []);
		}
	},

	/**
	 * executes given method in a loop (method must accept callback in first param)
	 *
	 * @param  [Number] number of milisecond for the loop
	 * @param  [Callback] function to call
	 *              .callback [Function]
	 *                   callback [Callback]
	 *                   params   [Object]
	 * @param  [Boolean] (optional, default: false) true to wait before execution, false to call the method now
	 * @return [void]
	 */
	loopCallback: function(interval, callback, wait) {
		var callbackParams;

		if (ma.util.is(callback, Object) && ma.util.is(callback.callback, Function)) {
			callbackParams = [ //params for the called method
				{ //callback
					callback: ma.util.loopCallback,
					callbackScope: ma.util,
					callbackParams: [
						interval,
						callback,
						true //always wait in callback
					]
				}, //callback
				callback.callbackParams
			];
			if (true === wait) {
				ma.util.runCallback.defer(interval, ma.util, [{
					callback: callback.callback,
					callbackScope: callback.callbackScope,
					callbackParams: callbackParams
				}]);
			}
			else {
				ma.util.runCallback({
					callback: callback.callback,
					callbackScope: callback.callbackScope,
					callbackParams: callbackParams
				});
			}
		}
		else {
			ma.console.errorAt('Invalid function.', 'ma.util', 'loopCallback');
		}
	},

	/**
	 * @private
	 * Same as eval(), just a way to prevent JSlint from reporting eval where its really needed
	 */
	_eval: function(code){
		var convert = 'eval';
		return window[convert](code);
	}

};

