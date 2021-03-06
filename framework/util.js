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
	printf: function(message) {
		var
			args = ma.util.getArguments(arguments, 1),
			placeholder,
			regexp = /\%([0-9])+/,
			i = 0; //for safety

		placeholder = regexp.exec(message);
		while (null !== placeholder) {
			//message contains positional params
			message = message.replace(placeholder[0], args[placeholder[1]-1]);
			placeholder = regexp.exec(message); //get next placeholder

			if (100 < i++) {
				ma.errorAt('Reached recursion limit: ' + message, 'ma.util', 'printf');
				return message;
			}
		}

		if (-1 !== message.indexOf('%')) {
			//there are still some placeholders remaining
			if (window.printf) {
				message = window.printf.apply(window, args);
			}
		}

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

		param = param.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		regexS = "[\\?&]" + param + "=([^&#]*)";
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
	 *            [Boolean] <True/False>   = for values True and False will check if given value may be interpreted as boolean (True is equal to boolean True, non-zero number, strings "true", "1" and "1.0"; False is equal to boolean False, numeric zero and strings "false", "0" and "")
	 *            [Mixed] <any value>      = any other value will check that value is equal to this value (e.g. is('10', 10.0); returns true as the values are equal)
	 * @return [Boolean] true when value equals to given type
	 */
	is: function(value, type) {
		if ('string' === typeof type) {
			if ('empty' === type.toLowerCase()) {
				return Ext.isEmpty(value);
			}
			if ('zero' === type.toLowerCase()) {
				return Ext.isEmpty(value) || 0 === value || false === value;
			}
		}
		if (undefined === type) {
			return undefined === value;
		}
		else if (undefined === value) {
			return false;
		}
		if (null === type) {
			return null === value;
		}
		else if (null === value) {
			return false;
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
			if (ma.Array && ma.util.is(value, ma.Array)) {
				return true;
			}
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
			return 'object' === typeof value;
		}
		if (Ext.isFunction(type) || Ext.isObject(type)) {
			return (value instanceof type);
		}

		//for values True/False check if the value may be interpreted as true/false
		if ('boolean' === typeof type) {
			if (('boolean' === typeof value)) {
				return value === type;
			}
			if (('string' === typeof value)) {
				if (true === type && ('true' === value.toLowerCase() || 1 == value)) {
					return true;
				}
				if (false === type && ('false' === value.toLowerCase() || 0 == value || "" === value)) {
					return true;
				}
				return false;
			}
			if ('number' === typeof value) {
				if (true === type && 0 != value) {
					return true;
				}
				if (false === type && 0 == value) {
					return true;
				}
			}
			return value == type;
		}

		//unknown type, consider it as direct value
		return value == type;
	}, //is()

	/**
	 * @private
	 * Same as eval(), just a way to prevent JSlint from reporting eval where its really needed
	 */
	_eval: function(code){
		var convert = 'eval';
		return window[convert](code);
	},

	/**
	 * Converts function Arguments to full-featured array
	 *
	 * @param  [Arguments] arguments of the calling method
	 * @param  [Number] (optional, default: 0) number of arguments to ignore (e.g. if first 2 params are fixed and the rest is optional)
	 * @return [Array]
	 */
	getArguments: function(args, skipCount) {
		return Array.prototype.slice.call(args, skipCount || 0);
	}

};

/**
 * Alias for checking a type
 */
ma.is = ma.util.is;