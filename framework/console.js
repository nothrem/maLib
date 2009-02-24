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
$.console = {
	/**
	 * @private
	 * initialization method
	 */
	_init: function() {
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
		$.console._logCache.push(message);
	},

	/**
	 * adds an error into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	error: function(message) {
		message = $.console._printf.apply(this, arguments);
		$.console._log('Internal error: ' + message);
		if (window.console) {
			console.trace(this);
			console.log(message);
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
		message = $.console._printf.apply(this, arguments);
		$.console._log('Warning: ' + message);
		if (window.console) {
			console.log(message);
		}
	},

	/**
	 * adds an information into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	info: function(message) {
		message = $.console._printf.apply(this, arguments);
		$.console._log(message);
		if (window.console) {
			console.log(message);
		}
	},

	/**
	 * adds a debug information into log
	 *
	 * @param  [String] (required) string, optionally with format placeholders
	 * @param  [Mixed]  (optional) any number of params to be placed to placeholders
	 */
	debug: function(message) {
		message = $.console._printf.apply(this, arguments);
		$.console._log(message);
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
		message = $.console._printf.apply(this, arguments);
		$.console._log(message);
		if (window.console) {
			console.log(message);
		}
	},

	/**
	 * empty function
	 */
	time: function(message){},
	/**
	 * empty function
	 */
	timeEnd: function(message) {},

	/**
	 * empty function
	 */
	count: function(message) {},
	/**
	 * empty function
	 */
	trace: function(message) {},
	/**
	 * empty function
	 */
	profile: function(message) {},
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
		$.console.log('Opening Console');
		if (!$.console._logConsole) {
			$.console._logConsole = window.open();
		}
		var win = $.console._logConsole;
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

		var messages = $.console._logCache;
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
		return $.console._logCache;
	},

	/**
	 * returns all log messages in one string (new-line char terminated)
	 *
	 * @param  [void]
	 * @return [String]
	 */
	getText: function() {
		return $.console._logCache.join('\n');
	},

	/**
	 * returns all log messages in one string (line-break HTML tag terminated)
	 *
	 * @param  [void]
	 * @return [String]
	 */
	getHtml: function() {
		return $.console._logCache.join('<br>');
	}


};

//if (!window.console) {
//	window.console = $.console;
//}

$.registerInitFunction($.console._init);
