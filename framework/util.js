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
		var property, value, error = false;

		if (!object) {
			return false;
		}

		if ('object' === typeof values && Array !== values.constructor) {
			for (property in values) {
				value = values[property];
				if ('object' === typeof value && Array !== value.constructor) {
					if ('object' !== typeof object[property]) {
						object[property] = {}; //ensure property is defined as object
					}
					error = ma.util.setProperties(value, object[property]) || error;
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
		var clone = {}; //new empty object - base for the clone

		//create 1:1 clone of the base object
		ma.util.merge(clone, object);
		//modify the clone with the values
		ma.util.merge(clone, values);

		return clone;
	}



};
