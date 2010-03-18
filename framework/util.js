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
	 * converts browserEvent object into one more suitable
	 *
	 * @param  [Object] browserEvent
	 * @return [Event]
	 *              .element    [ma.Element] element that fired the event; undefined for 'window' or other special elements
	 *              .window     [Object] info about browser's window (see ma.util.getWindowInfo())
	 *              .mouse      [Object] details about mouse
	 *                .X             [Number]  position of mouse cursor (relative to window)
	 *                .Y             [Number]  position of mouse cursor (relative to window)
	 *                .leftButton    [Boolean] true if left mouse button was clicked (note: on some browsers (e.g. FF) is always True for non-click events (e.g. mouseMove))
	 *                .rightButton   [Boolean] true if right mouse button was clicked (note: on some browsers (e.g. FF) is True for CTRL + leftButton (i.e. secondary click on MacOS))
	 *                .middleButton  [Boolean] true if middle mouse button was clicked
	 *              .keys       [Object] details about pressed keys
	 *                .alt           [Boolean] true if ALT/Option key was pressed
	 *                .ctrl          [Boolean] true if CTRL key was pressed
	 *                .shift         [Boolean] true if SHIFT key was pressed
	 *                .mac           [Boolean] true if MAC/Command key was pressed
	 *              .browserEvent [Object] original event info created by browser (note that on some browsers (e.g. IE) it may change when another event occurs)
	 */
	getEvent: function(extEvent) {
		var
			element,
			browserEvent = extEvent.browserEvent,
			isIE = ma.browser.is(ma.browser.ie);


		element = extEvent.getTarget();

		return {
			element: (ma.Element.isHtmlElement(element) ? new ma.Element(element) : undefined),
			window: ma.util.getWindowInfo(),
			mouse: {
				X: browserEvent.clientX,
				Y: browserEvent.clientY,
				leftButton: (isIE ? 1 === browserEvent.button : 0 === browserEvent.button),
				rightButton: (isIE ? 2 === browserEvent.button : 2 === browserEvent.button),
				middleButton: (isIE ? 4 === browserEvent.button : 1 === browserEvent.button)
			},
			keys: {
				code: extEvent.getKey(),
				alt: browserEvent.altKey,
				ctrl: browserEvent.ctrlKey,
				shift: browserEvent.shiftKey,
				mac: browserEvent.metaKey || false //MAC key available only on FF and Safari
			},
			browserEvent: browserEvent
		};
	}

};

