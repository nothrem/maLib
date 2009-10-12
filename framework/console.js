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
	},

	/**
	 * @private
	 * cache for all logged messages
	 */
	_logCache: [],

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
	 * adds an error into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	error: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('Internal error: ' + message);
		if (window.console) {
			console.trace(this);
			console.error(message);
		}
		throw message;
	},

	/**
	 * adds a warning into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	warn: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log('Warning: ' + message);
		if (window.console) {
			console.warn(message);
		}
	},

	/**
	 * adds an information into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	info: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log(message);
		if (window.console) {
			console.info(message);
		}
	},

	/**
	 * adds a debug information into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	debug: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log(message);
		if (window.console) {
			console.log(message);
		}
	},

	/**
	 * adds a log message into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	log: function(message) {
		message = ma.console._printf.apply(this, arguments);
		ma.console._log(message);
		if (window.console) {
			console.log(message);
		}
	},

	/**
	 * counts number of milisecons between time() and timeEnd()
	 *
	 * @param  [String] name of timer (use same for timeEnd() to get result)
	 * @return [Number] current time for the timer (usable to get 'lap' time)
	 */
	time: function(timer){
		var cache = ma.console._cache.count;

		if (undefined === cache[timer]) {
			cache[timer] = new Date(); //get current time
		}

		return ma.util.diffTime(cache[timer]);
	},
	/**
	 * empty function
	 */
	timeEnd: function(timer) {
		var
			cache = ma.console._cache.count,
			time = ma.util.diffTime(cache[timer]);

		cache[timer] = undefined; //reset the timer

		return time;
	},

	/**
	 * counts number of calls
	 */
	count: function(counter) {
		var
			cache = ma.console._cache.count,
			count = cache[counter];

		cache[counter] = (cache[counter] || 0) + 1;

		return count;
	},
	/**
	 * resets counter
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