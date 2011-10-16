/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded
 * from svn://svn.chobits.ch/source/maLib and used for free.
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
 *   NONE
 */

/**
 * Code in this file extends JavaScript itself
 *
 * There is one important rule: NEVER EVER EXTEND THE BASIC 'OBJECT'
 * (e.g. object.prototype.something = '...' is strictly forbidden!!!)
 */

/**
 * Method for getting string's length in bytes of UTF-8
 *
 * @param  [void]
 * @return [Number] e.g. 'abc' takes 3 bytes, 'ábč' takes 5 bytes
 */
String.prototype.lengthInBytes = function(){
	var
		i,
		charCode,
		length = this.length,
		lengthInBytes = 0;

	for (i = 0; i < length; i++) {
		charCode = this.charCodeAt(i);
		if (0x80 > charCode) { //this character is in ASCII
			lengthInBytes += 1; //takes one byte
			continue;
		}
		if (0x800 > charCode) { //this character takes two bytes in UTF-8
			lengthInBytes += 2;
			continue;
		}
		//other characters takes 3 bytes in UTF-8
		lengthInBytes += 3;
		continue;
	}

	return lengthInBytes;
}; //String.prototype.lengthInBytes()

/**
 * Replaces new-line characters (\r, \n) with HTML tag (BR)
 *
 * @param  {Boolean} (optional, default: true) if false will work oposite (e.g. change BR to with new-line character \n)
 * @return {String] changed text
 */
String.prototype.encodeBr = (function() {
	/**
	 * CLOSURE
	 */
	var
		html = new RegExp('<br( )?(\/)?>', 'gi'),
		ascii = new RegExp('(\n)|(\r)|(\r\n)', 'gi');

	return function(decode) {
		return (false === decode)
			? this.replace(html, '\n')
			: this.replace(ascii, '<br/>');
	};
})();

/**
 * calls method repeately until stopped; use with caution as it may consume CPU and Memory
 *
 * @param [Number] time in miliseconds of how offen the method should be called
 * @param [Object] (optional, default: window) scope for the method
 * @param [Array] (optional, default: none) list of params for the method
 * @param [Boolean] (optional, default: false) if true, method will be called right away for the first time (otherwise it will wait the interval before first execution)
 *
 * @return [Object]
 *            .stop   [Function] call this method to stop the loop; other way to stop the loop is to return False from the method
 *                 return [Boolen] true if loop was stopped, false if it was stopped before
 *            .pause  [Function] call this to pause the loop with possibility to continue (resume)
 *                 return [Boolean] true if loop was running; false if it was already suspended or stopped
 *            .resume [Function] starts the loop again; works only after suspend, cannot be used after stop
 *                 return [Boolean] true if loop was suspended and now is running again; false if it was NOT suspended or is already stopped
 */
Function.prototype.loop = function(interval, scope, params, startNow) {
	scope = scope || window;
	params = params || [];

	var
		index,
		suspended = false,
		method = this,
		fn = function() {
			if (false !== method.apply(scope, params)) {
				index = fn.defer(interval, scope, params);
			}
		}; //fn()

	if (true === startNow) {
		fn();
	}
	else {
		index = fn.defer(interval);
	}

	return {
		stop: function() {
			if (fn) {
				if (!suspended) {
					window.clearInterval(index);
					suspended = true;
				}
				fn = null;
				return true;
			}
			return false;
		},
		pause: function() {
			if (!suspended) {
				window.clearInterval(index);
				suspended = true;
				return true;
			}
			return false;
		},
		resume: function() {
			if (suspended && fn) { //resume only if loop was suspended and the function still exists (i.e. was not stopped)
				index = fn.defer(interval);
				return true;
			}
			return false;
		}
	};
}; //loop()

/**
 * Sets scope for the method when called; alternative for Ext.Function.createDelegate (where 3rd param is always True)
 *
 * @param  [Object] (required) scope for the method
 * @param  [Array, Mixed] (optional, default: none) params for the method; these are always added after the ones set by caller
 * @return [Function] wrapper function that can be used to call this method with given scope and params
 *
 * This code is based on code of Ext.Function.createDelegate()
 */
Function.prototype.setScope = function(scope, params) {
	if (!scope) { ma.util.errorAt('Undefined scope.', 'Function', 'setScope'); }

	var method = this;

	return function() {
		var args = Array.prototype.slice.call(arguments, 0).concat(params); //slice converts Arguments to valid array; then params are added
		return method.apply(scope, args);
	};
}; //callback()

/**
 * return the number divided by 2 in integer
 *
 * @param  [Number] number to divide
 * @param  [Boolean] (optional, default: false) false = round the number down, true = round the number up
 */
Math.half = function(number, roundUp) {
	var result = number / 2;

	if (true === roundUp) {
		return Math.ceil(result);
	}
	else {
		return Math.floor(result);
	}
};

/**
 * sorts this array randomly
 * code taken from http://javascript.about.com/library/blshuffle.htm
 *
 * @param  {void}
 * @return {Array}
 */
Array.prototype.randomize = function() {
	var result = [];

	while (this.length) {
		result.push(this.splice(Math.random() * this.length, 1)[0]);
	}
	while (result.length) {
		this.push(result.pop());
	}
	return this;
};
