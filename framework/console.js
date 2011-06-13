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
 *   (external) window.printf()
 */

/**
 * console scope
 */
ma.console = {
	/**
	 * cache for methods
	 */
	_cache: {
		time: {},
		count: {},
		profile: {}
	},
	/**
	 * @private
	 * cache for all logged messages
	 */
	_logCache: [],
	/**
	 * formats message with placeholders
	 *
	 * @param  [String] string with format placeholders
	 * @param  [Mixed]  any number of variables to be placed to plasceholders
	 * @return [String] formated string
	 *
	 * @see printf function from C++
	 */
	_printf: window.printf || function(message) {
		return message;
	}, //_printf()

	/**
	 * Returns number formated as two digits
	 *
	 * @param  [Number] number
	 * @return [String]
	 */
	_twoDigitsNumber: function(number) {
		return (9 < number) ? '' + number : '0' + number;
	}, //_twoDigitsNumber()

	/**
	 * Returns number formated as two digits
	 *
	 * @param  [Number] number
	 * @return [String]
	 */
	_threeDigitsNumber: function(number) {
		return (99 < number) ? '' + number : (9 < number) ? '0' + number : '00' + number;
	}, //_twoDigitsNumber()

	/**
	 * Returns format in ISO format (y-m-d h:m:s.t)
	 *
	 * @param  [void]
	 * @return [String]
	 */
	_getTime: function() {
		var
			n2 = ma.console._twoDigitsNumber,
			n3 = ma.console._threeDigitsNumber,
			now = new Date();

		return now.getYear() + '-' + n2(now.getMonth()+1) + '-' + n2(now.getDate()) + ' '
				+ n2(now.getHours()) + ':' + n2(now.getMinutes()) + ':' + n2(now.getSeconds()) + '.' + n3(now.getMilliseconds());
	}, //_getTime()

	/**
	 * Counts difference in two times
	 *
	 * @param  start [Number / Date] time in miliseconds or Date object
	 * @param  end   [Number / Date] (optional, default: now) time in miliseconds or Date object
	 * @return [Number] number of miliseconds between times
	 */
	_diffTime: function(start, end) {
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
	 * adds new message into cache
	 *
	 * @param  message [String]
	 */
	_log: function(message) {
		ma.console._logCache.push(message);
	},

	/**
	 * Returns call stack based on function's caller list
	 *
	 * @param [void]
	 * @return [Array] list of function and their acctual params (tip: use .join() to convert it into string)
	 */
	_getCallStack: function getCallStack() {
		var
			is = ma.util.is,
			caller = arguments.callee.caller.caller, //caller of the methods that called this method (i.e. function that accually called the error() method)
			result = [],
			callerHead,
			callerArgs,
			arg,
			i, c,
			failSafe = 0;

		while(failSafe++ < 100 && caller) { //condition with 'failSafe' prevents infinite cycle in case there is some problem in caller reference (or error was already caused by infinite recurence)
			callerArgs = [];
			callerHead = new String(caller); //convert function to string containing its code
			callerHead = callerHead.match(/^(function)(\ )*([^\(]*)(\()([^\)]*)(\))/); //parse only function header "function name(a,b)"

			//get caller's arguments into regullar array
			for (i = 0, c = caller.arguments.length; i < c; i++) {
				arg = caller.arguments[i];
				if (is(arg, false)) { arg = 'False'; }
				if (is(arg, true)) { arg = 'True'; }
				if (is(arg, Function)) { arg = 'Function'; }
				if (is(arg, Object)) { arg = 'Object'; }
				callerArgs.push(arg);
			}
			//add function into stack
			callerHead[0] = ''; //remove full RegExp result
			callerHead[5] = callerArgs.join(', '); //replace abstract params with actual ones
			result.push(callerHead.join(''));

			caller = caller.caller; //go to next item in the stack
		}
		return result;
	}, //_getCallStack()

	/**
	 * adds error in specified file and method into log
	 *
	 * @param [String/Array] (required) error message as [String]; or [Array] where first item is [String] with message, others are [Mixed] positional arguments
	 * @param [String] file where the error happened
	 * @param [Number/String] line or function name where error happened
	 * @return [void]
	 */
	errorAt: function(message, file, line) {
		var fileInfo = '';

		if (file) {
			fileInfo = file;
			if (line) {
				fileInfo += '::' +  line;
			}
			fileInfo = '[' + fileInfo + ']';
		}

		if (ma.util.is(message, Array)) {
			message = ma.console._printf.apply(window, message);
		}

		ma.console._log('[ERROR]' + fileInfo + ' ' + message + ' (call stack: ' + ma.console._getCallStack().join(' <- ') + ')');

		if (this !== window) { //if called as onError handler, do not throw the error again
			throw fileInfo + ' ' + message;
		}
	}, //errorAt()

	/**
	 * adds an error into log; accepts placable params
	 *
	 * @param  [String] (required) error message, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 * @return [void]
	 */
	error: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('[ERROR] ' + message + ' (call stack: ' + ma.console._getCallStack().join(' <- ') + ')');

		throw message;
	}, //error()

	/**
	 * adds a warning into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 * @return [void]
	 */
	warn: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('[WARN ] ' + message);

		if (window.console) {
			console.warn(message);
		}
	}, //warn()

	/**
	 * adds an information into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	info: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('[INFO ] ' + message);
		if (window.console) {
			console.info(message);
		}
	}, //info()

	/**
	 * adds a debug information into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	debug: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('[DEBUG] ' + message);
		if (window.console) {
			console.log(message);
		}
	}, //debug()

	/**
	 * adds a log message into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 * @return [void]
	 */
	log: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('[OTHER] ' + message);

		if (window.console) {
			console.log(message);
		}
	}, //log()

	/**
	 * counts number of milisecons between time() and timeEnd()
	 *
	 * @param  [String] name of timer (use same for timeEnd() to get result)
	 * @return [Number] current time for the timer (usable to get 'lap' time)
	 */
	time: function(timer){
		var cache = ma.console._cache.time;

		if (undefined === cache[timer]) {
			cache[timer] = new Date(); //get current time
		}

		return ma.console._diffTime(cache[timer]);
	}, //time()

	/**
	 * resets timer and returns the number of passed seconds
	 *
	 * @param  [String] name of timer
	 * @return [Number] final time for the timer
	 */
	timeEnd: function(timer) {
		var
			cache = ma.console._cache.time,
			time = ma.console._diffTime(cache[timer]);

		cache[timer] = undefined; //reset the timer

		return time;
	},

	/**
	 * counts number of calls
	 *
	 * @param  [String] name of counter (use same for countEnd() to get result)
	 * @return [Number] current number of calls
	 */
	count: function(counter) {
		var
			cache = ma.console._cache.count,
			count = cache[counter];

		cache[counter] = (cache[counter] || 0) + 1;

		return count;
	},
	/**
	 * resets counter and returns the result
	 *
	 * @param  [String] name of counter
	 * @return [Number] final number of calls
	 */
	countEnd: function(counter) {
		var cache = ma.console._cache.count,
			count = cache[counter];

		cache[counter] = 0;

		return count;
	},

	/**
	 * empty function
	 */
	trace: function(message) {},
	/**
	 * empty function
	 */
	profile: function(profile) {
		ma.console.warn('Profiling is not supported on this browser'); //only Firefox with firebug can profile
	},
	/**
	 * empty function
	 */
	profileEnd: function(message) {},

	/**
	 * opens new window and writes all log messages inside
	 *
	 * @param  [void]
	 * @return [void]
	 */
	openInWindow: function() {
		if (ma.browser.is({name: 'Firefox'})) {
			alert('This feature is not working in FireFox; please use FireBug instead.');
			return;
		}
		ma.console.log('Opening Console');
		if (!ma.console._logConsole) {
			ma.console._logConsole = window.open();
		}
		var win = ma.console._logConsole;
		win.focus();
		var body = win.document.body; //get html body of the new window
		if (!body) {
			alert('Internal error: Crash while opening new window with console messages!\n\nPlease, try again...');
			win.close();
			return false;
		}

		var a = win.document.createElement('h1');
		a.innerHTML = 'DEBUG CONSOLE of <a href="' + window.location.href + '" target="_blank">' + window.location.href + '</a> @ ' + new Date().toLocaleString();
		body.appendChild(a);

		var messages = ma.console._logCache;
		for (var i = 0, c = messages.length; i < c; i++) {
			a = win.document.createElement('li');
			a.innerHTML = messages[i];
			body.appendChild(a);
		}

		a = win.document.createElement('h1');
		a.innerHTML = 'HTML ELEMENTS in <a href="' + window.location.href + '" target="_blank">' + window.location.href + '</a> @ ' + new Date().toLocaleString();
		body.appendChild(a);

		a = win.document.createElement('pre');
		a.innerHTML = window.document.body.innerHTML.replace(/\</g, '<br>&lt;'); //place every HTML tag to new line and make it safe for displaying inside PRE
		body.appendChild(a);

		body.style.display = "block";
		return false;
	},

	/**
	 * returns all log messages
	 *
	 * @param  [void]
	 * @return [Array]
	 */
	get: function() {
		return ma.console._logCache;
	},

	/**
	 * returns all log messages in one string (new-line char terminated)
	 *
	 * @param  [void]
	 * @return [String]
	 */
	getText: function() {
		return ma.console._logCache.join('\n');
	},

	/**
	 * returns all log messages in one string (line-break HTML tag terminated)
	 *
	 * @param  [void]
	 * @return [String]
	 */
	getHtml: function() {
		return ma.console._logCache.join('<br>');
	}
};

window.onerror = ma.console.errorAt;