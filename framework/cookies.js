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
 *   ma.Base
 * Optional parts:
 *   NONE
 */


/**
 * @based on JavaScript Lab code

// **************************************************************************
// Copyright 2007 - 2008 The JSLab Team, Tavs Dokkedahl and Allan Jacobs
// Contact: http://www.jslab.dk/contact.php
//
// This file is part of the JSLab Standard Library (JSL) Program.
//
// JSL is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// any later version.
//
// JSL is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.
// ***************************************************************************
// File created 2008-10-29 09:45:37

 */

/**
 * creates new object that represents cookie
 *
 * @param [String] (required) name of the cookie
 * @param [Number] (optional, default: 0) age of the cookie in seconds
 * @param [String] (optional, default: current URL) path for the cookie
 * @param [String] (optional, default: current server) domain for the cookie
 * @param [Boolean](optional, default: false) true for HTTPS only cookie
 *
 * @event onRead     fires after a cookie is read from browser
 *         <param> [ma.Cookie] the cookie
 * @event onWrite    fires before a cookie is written to the browser
 *         <param> [ma.Cookie] the cookie
 * @event onRemove   fires before cookie is removed from browser; the param is ma.Cookie instance of the cookie
 *         <param> [ma.Cookie] the cookie
 */
ma.Cookie = function(name, age, path, domain, secure) {
	if (false === ma.Cookie._isReady) {
		ma.console.error('Cookies are not supported by this browser, cannot create instance of %s.', this._fullName);
		return null;
	}
	if ('string' !== typeof name || '' === name) {
		ma.console.error('Invalid or missing Cookie name in %s.constructor().', this._fullName);
		return null;
	}

	ma.Cookie.superclass.constructor.call(this);

	this.addEvents(
		'onRead',
		'onWrite',
		'onRemove'
	);//events

	//set own properties at once
	this.merge({
		_name: name,
		_value: '',
		_age: age || 0,
		_path: path,
		_domain: domain,
		_secure: true === secure
	});
};

Ext.extend(ma.Cookie, ma.Base, {
/**
 * @scope ma.Cookie
 */

	// static properties
	_className: 'Cookie',
	_fullName: 'ma.Cookie',
	_class: ma.Cookie,

	//Default encoding functions
	_decode: decodeURIComponent,
	_encode: encodeURIComponent,

	//Default name/value seperators
	_nameSeparator:  '=', //this string is used by browser to separate name from value
	_cookieSeparator:';', //this string is used by browser to separate different cookies (or their optional params)
	_valueSeparator: ':', //this string is used by framework to encode object's name/value into string
	_pairSeparator : '&', //this string is used by framework to separate different name/value pairs of one object

	/**
	 * sets new value for this cookie
	 *
	 * @param [Mixed/Object] value convertable to string or one-level object with values (see ma.Cookie.get())
	 * return [void]
	 */
	set: function(value) {
		this._value = value;
	},

	/**
	 * returns value of the cookie
	 *
	 * @param  [String] (optional, default: none) if defined and value is object, returns value of the object's property
	 * @return [Mixed] values of the cookie or its property (if its name is defined)
	 *
	 * @example
		<code>
		c = new Cookie('test');

		//set/get value w/o saving to browser
		c.set('value');
		c.get(); //returns 'value';

		//set/get value as object
		c.set({a:1,b:2});
		c.get(); //returns object {a:1,b:2}
		c.get('a'); //returns number 1  (!!! see below !!!)

		//store value into browser
		c.write();

		//get value stored in browser
		c.read();
		c.get('a'); //returns string '1' (!!! any non-string value is converted to string after read() call !!!)
		</code>
	 */
	get: function(name) {
		var value = this._value;

		if (undefined === name) {
			return value;
		}
		else {
			if ('object' === typeof value) {
				return value[name];
			}
			else {
				return null;
			}
		}
	},

	/**
	 * reads value stored in browser - note that it may overwrite any set value
	 *
	 * @param  [void]
	 * @return [Boolean] true if cookie was found
	 */
	read: function() {
		var
			name = this._name,
			cookies = document.cookie,
			pos, start, end, //cookie positions
			cookie,
			values,
			value,
			i, cnt;

		pos = cookies.indexOf(name+'='); // Start position of cookie

		if (0 > pos) {
			return false;
		}

		start  = pos + name.length + 1; //start of value = position of name + length of the name + 1 for '='
		end    = cookies.indexOf(';', start); //end is at first ';' after start position

		if (end != -1) {
			//value is in middle - it has start and end
			values = cookies.substring(start, end);
		}
		else {
			//this is last value - it ends at the end of string
			values = cookies.substring(start);
		}

		// Decode and split into array
		values = this._decode(values).split(this._pairSeparator);

		if (1 === values.length) {
			//there is only one value pair (or single value) in the cookie
			value = values[0].split(this._valueSeparator);
			if (1 === value.length) {
				//there is only single value - set it directly
				this._value = value[0];
			}
			else {
				//there is onve value but in pair - set it under name
				this._value[value[0]] = value[1];
			}
		}
		else {
			for (i = 0, cnt = values.length; i < cnt; i++) {
				value = values[i].split(this._valueSeparator);
				this._value[value[0]] = value[1];
			}
		}

		//fire event
		this.notify(ma.Cookie.events.onRead, this);

		return true;
	},

	/**
	 * writes value into browser
	 *
	 * @param  [void] (use Cookie.set() to define the value)
	 * @return [void]
	 */
	write: function() {
		//fire event
		this.notify(ma.Cookie.events.onWrite, this);

		var
			values = this._value,
			cookie = '',
			list, name, value, //for object encoding
			expire;

		if ('object' === typeof values) {
			list = [];
			for (name in values) {
				value = values[name];
				if ('function' === typeof value) {
					continue;
				}
				list.push(name + this._valueSeparator + value);
			}
			cookie = list.join(this._pairSeparator);
		}
		else {
			cookie = values;
		}

		//encode string
		cookie = this._encode(cookie);

		//get expire date
		expire  = (new Date()).getTime(); //current time
		expire += this._age * 1000;       //add age of the cookie (time is in msecs, but age in seconds)
		expire  = (new Date(expire)).toUTCString(); //get the expire date in format browser can understand (this is human-readable format)

		// Save cookie
		cookie = this._name + this._nameSeparator + cookie + this._cookieSeparator
							+ ' expires=' + expire         + this._cookieSeparator
							+ ' max-age=' + this._age      + this._cookieSeparator
							//optional values
							+ (this._path   ? ' path='    + this._path   + this._cookieSeparator : '')
							+ (this._domain ? ' domain='  + this._domain + this._cookieSeparator : '')
							+ (this._secure ? ' ' + this._secure         + this._cookieSeparator : '')
		; //create full cookie
		document.cookie = cookie;
	},

	/**
	 * deletes the cookie from browser
	 *
	 * @param  [void]
	 * @return [void]
	 *
	 * Notes:
	 *    - cookie may not be deleted immediatelly; it depends on browser when expired cookies are deleted
	 *    - this method overwrites set 'age' value
	 */
	remove: function() {
		//fire event
		this.notify(ma.Cookie.events.onRemove, this);

		// Setting the age to -1 * now will create an expiration
		// date of 1/1 1970 when the cookie is written
		this._age = (new Date()).getTime() / -1000;
		this.write();
	},

	/**
	 * method to convert cookie to string
	 *
	 * @param  [void]
	 * @return [String] string value of cookie or '[Object]' string when cookie contains Object
	 */
	toString: function() {
		if (ma.util.is(this._value, 'empty')) {
			return '';
		}
		else if (ma.util.is(this._value, Object)) {
			return '[Object]';
		}
		else {
			return this._value.toString();
		}
	}

}); //extend(ma.Cookie)

Ext.apply(ma.Cookie, {
	/**
	 * tests that cookies are supported by browser
	 */
	_test: function() {
		var
			name = 'ma_Cookie_init_test',
			value = 'test_value',
			cookie = new ma.Cookie(name, 1000);

		cookie.set(value);
		cookie.write();
		if (value !== ma.Cookie.get(name)) {
			ma.console.warn('Cookie are not supported on this client!');
			ma.Cookie._isReady = false;
			return;
		}
		cookie.remove();
		ma.Cookie._isReady = true;
	},

	/**
	 * Quickly reads cookie value from browser
	 *
	 * @param  [String] name of the cookie
	 * @return [String] value of the cookie (empty string if cookie does not exist)
	 */
	get: function(name) {
		var cookie = new ma.Cookie(name);

		if (cookie.read()) {
			return cookie.get();
		}
		else {
			return '';
		}
	}
}); //ma.Cookie class methods

ma.registerInitFunction(ma.Cookie._test);
