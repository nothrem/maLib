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
		isRunning: function() {
			return !suspended;
		},
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

if ('function' !== typeof Function.prototype.bind) {
	/**
	 * Sets scope for the method call
	 *
	 * @param  scope {Object} (optional, default: window) scope for the method
	 * @param  more_params {Mixed} (optional) any more params will be prepended to params of the method
	 * @returns {Function} new function with defined scope
	 */
	Function.prototype.bind = function(scope){
		var
			f = this,
			params = Array.prototype.splice.call(arguments, 1);

		return function(){
			return f.apply(scope || window, params.concat(arguments));
		};
	};
}


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
};

/**
 * Adds ability to call function only once in given time period
 * i.e. if you call method several times it will process only once (with the last params given)
 *
 * @param  delay {Number} (required) number of millisecons to wait for another call
 * @param  scope {Object} (optional, default: window)
 * @param  parms {Array}  (optional, default: []) params for the method
 * @return {Number} index of the timer; you can use window.clearTimeout() to stop the execution using this number
 */
Function.prototype.buffer = function(delay, scope, params) {
	var f = this;

	scope = scope || window;

	if (f.__buffer) {
			clearTimeout(f.__buffer);
	}
	this.__buffer = this.defer.apply(this, arguments);

	return this.__buffer;
};

/**
 * Returns a method that can be used as buffered callback
 * i.e. if the event happens more times in given interval, method will be processes only once (with the last params given)
 *
 * @param  delay {Number} (required) number of millisecons to wait for another call
 * @param  scope {Object} (optional, default: scope passed to the returned function when called)
 * @return {Function} Any time you call this function, it will serve as buffer for the original one (use same params as for the original method)
 */
Function.prototype.getBuffered = function(delay, scope, params) {
	var f = this;

	return function() {
			f.buffer(delay, scope || this, params.concat(arguments));
	};
};

/**
 * Calls the method and returns the result; while the delay lasts returns the same result w/o actually calling the method
 * Note that cached result is returned regardless of actual method params; e.g. Math.pow.cache(100, null, [10,2]); //100//; Math.pow.cache(100, null, [100,2]); //100, correct is 10000 //
 * Use Function::cacheStop() to clear the cache and allow the method to be called again
 *
 * @param  delay  {Number} Number of milliseconds to cache the result for
 * @param  scope  {Object} scope for the method call
 * @param  params {Array}  params for the method call
 * @return {Mixed} result of the original method
 */
Function.prototype.cache = function(delay, scope, params) {
	scope = scope || window;

	if (true === this.__cached) {
		return this.__cacheResult;
	}

	this.__cached = true;
	this.__cacheResult = this.apply(scope, params);
	this.__cacheClear = setTimeout(this.cacheStop.bind(this), delay);

	return this.__cacheResult;
};

/**
 * Clears cached result of the first method call; next call of Function::cache() will call the method to get new result
 *
 * @return {Mixed} content of the cache (before it was cleared)
 */
Function.prototype.cacheStop = function() {
	var result = this.cacheResult;

	this.__cached = false;
	this.cacheResult = null;
	this.cacheClear = -1;

	return result;
};

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

	return Math.floor(result);
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

Array.prototype.pushIf = function(item) {
	if (0 > this.indexOf(item)) {
		this.push(item);
	}
};

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(fce) {
		var i, cnt;

		for (i = 0, cnt = this.length; i <= cnt; i++) {
			fce.call(this, this[i]);
		}
	};
}

Array.prototype.contains = function(item) {
	return (-1 < this.indexOf(item));
};
