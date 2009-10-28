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
				if (is(value, Object) & !is(value, Array)) {
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
		if (Object === type ) {
			return true === Ext.isObject(value);
		}
		if (Ext.isFunction(type) || Ext.isObject(type)) {
			return value instanceof type;
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
	 * Counts difference in two times
	 *
	 * @param  start [Number / Date] time in miliseconds or Date object
	 * @param  end   [Number / Date] (optional, default: now) time in miliseconds or Date object
	 * @return [Number] number of miliseconds between times
	 */
	diffTime: function(start, end) {
		if (!(start instanceof Date)) {
			start = new Date(start);
		}
		if (!(end instanceof Date)) {
			if (undefined === end) { //Date constructor can't handle undefined value
				end = new Date();
			}
			else {
				end = new Date(end);
			}
		}

		return end - start;
	}, //diffTime()

	/**
	 * @private
	 * Same as eval(), just a way to prevent JSlint from reporting eval where its really needed
	 * note: new versions of JSlint reports this one as well
	 */
	_eval: eval,

	getReference: function(k_simple) {
		var is = ma.util.is;

		if (is(k_simple, String)) {
			return new String(k_simple);
		}
		if (is(k_simple, Number)) {
			return new Number(k_simple);
		}
		if (is(k_simple, Boolean)) {
			return new Boolean(k_simple);
		}
		//other values are already references (or undefined)
		return k_simple;
	}

};

