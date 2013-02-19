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
 * creates new object that represents a storage space 
 *
 * @param [String] (required) name of the storage
 * @param [Boolean] (optional, default: false) read values from storage to get filled initial state; if false, storage will be initially empty
 *
 * @event onRead     fires after a value is read from browser
 *         <param> [ma.Storage]
 * @event onWrite    fires before a value is written to the browser
 *         <param> [ma.Storage]
 * @event onRemove   fires before a value is removed from browser
 *         <param> [ma.Storage]
 */
ma.Storage = function(name, autoRead) {
	if (false === ma.Storage._isReady) {
		ma.console.error('LocalStorage is not supported by this browser, cannot create instance of %s.', this._fullName);
		return null;
	}
	if ('string' !== typeof name || '' === name) {
		ma.console.error('Invalid or missing Storage name in %s.constructor().', this._fullName);
		return null;
	}

	if (ma.Storage._cache[name]) {
		return ma.Storage._cache[name];
	}

	ma.Storage.superclass.constructor.call(this);

	this.addEvents(
		'onRead',
		'onWrite',
		'onRemove'
	);//events

	//set own properties at once
	this.merge({
		_name: name,
		_values: {},
	});

	if (true === autoRead) {
		this.read();
	}

	ma.Storage._cache[name] = this;
};

ma.extend(ma.Storage, ma.Base, {
/**
 * @scope ma.Storage
 */

	// static properties
	_className: 'Storage',
	_fullName: 'ma.Storage',
	_class: ma.Storage,

	//Default encoding functions
	_decode: function(response) {
		try {
			return Ext.util.JSON.decode(response, true); //true to convert invalid JSON to NULL
		}
		catch (err) {
			return null;
		}
	},
	_encode: function(object) {
		return Ext.util.JSON.encode(object);
	},

	/**
	 * sets new named value
	 *
	 * @param [String] name of the value
	 * @param [Mixed/Object] any value that can be saved into JSON format
	 * return [void]
	 */
	set: function(name, value) {
		this._values[name] = value;
	},

	/**
	 * returns a value 
	 *
	 * @param  [String] (required) name of the value
	 * @return [Mixed/Object] value (or NULL if not defined)
	 *
	 * @example
		<code>
		//TODO
		</code>
	 */
	get: function(name) {
		var value = this._values[name];

		if (undefined === name) {
			return NULL;
		}
		else {
			return value;
		}
	},

	/**
	 * returns list of keys defined in the storage
	 *
	 * @param [void]
	 * @return [Array]
	 */
	getKeys: function() {
		var
			keys = [],
			key;

		for (key in this._values) {
			if (!ma.util.is(this._values[key], Function)) {
				keys.push(key);
			}
		}

		return keys;
	},

	/**
	 * reads value stored in browser - note that it may overwrite any set value
	 *
	 * @param  [void]
	 * @return [Boolean] true if storage was found
	 */
	read: function() {
		var
			name = this._name,
			storage = localStorage,
			values,
			value,
			i, cnt;

		values = storage.getItem(name);

		// Decode and split into array
		values = this._decode(values);

		this._values = values || {};

		//fire event
		this.notify(ma.Storage.events.onRead, this);

		return true;
	},

	/**
	 * writes value into browser storage
	 *
	 * @param  [void] (use storage.set() to define the value)
	 * @return [void]
	 */
	write: function() {
		//fire event
		this.notify(ma.Storage.events.onWrite, this);

		var values = this._values;

		//encode to string
		if ('object' === typeof values) {
   			values = this._encode(values);
		}

		//save value into storage
		localStorage.setItem(this._name, values);
	},

	/**
	 * deletes all values from browser storage
	 *
	 * @param  [void]
	 * @return [void]
	 *
	 * Notes:
	 *    - this does NOT destroy the values of the ma.Storage; you can still use
	 *         get() to read values or write() to restore values in browser storage
	 *    - use read() after remove() if you want to completely remove all values
	 */
	remove: function() {
		//fire event
		this.notify(ma.Storage.events.onRemove, this);

		localStorage.removeItem(this._name);
	},

	/**
	 * add new value and save in into browser storage
	 *
	 * @param [String] name of the value
	 * @param [Mixed/Object] any value that can be saved into JSON format
	 * return [void]
	 */
	push: function(name, value) {
		this.set(name, value);
		this.write();
	}

}); //extend(ma.Cookie)

Ext.apply(ma.Storage, {
	//store for existing storages
	_cache: [],

	/**
	 * tests that local storage is supported by browser
	 */
	_test: function() {
		var
			name = 'ma_Storage_init_test',
			value = 'test_value',
			storage = new ma.Storage(name);

		storage.set(name, value);
		storage.write();

		storage = new ma.Storage(name);
		storage.read(name);

		if (value !== storage.get(name)) {
			ma.console.warn('LocalStorage is not supported on this client!');
			ma.Storage._isReady = false;
			return;
		}
		storage.remove();
		ma.Storage._isReady = true;
	},

	/**
	 * Quickly reads a value from browser storage
	 *
	 * @param  [String] name
	 * @return [String] value
	 */
	get: function(name) {
		if (!this._isReady) {
			ma.console.error('LocalStorage is not supported by this browser, cannot read value %s.', name);
			return;
		}

		var
			json = localStorage.getItem(name),
			value = ma.Storage.prototype._decode(json);

		if (ma.util.is(value, null)) { //if original value was saved as plain string, JSON returns NULL...
			return json;
		}
		else {                         //... then return the raw value
			return value;
		}
	},

	/**
	 * Quickly reads a value from browser storage
	 *
	 * @param  [String] name
	 * @param  [String] value
	 */
	set: function(name, value) {
		if (!this._isReady) {
			ma.console.error('LocalStorage is not supported by this browser, cannot save value %s.', name);
			return;
		}

		if (ma.util.is(value, String)) {
			//localStorage supports strings, so it can be saved as-is
			localStorage.setItem(name, value);
		}
		else {
			//other values must be converted to string (JSON) to be correctly decoded
			localStorage.setItem(name, ma.Storage.prototype._encode(value));
		}
	},

	/**
	 * Removes all values from localStorage
	 */
	clear: function() {
		localStorage.clear();
	}
}); //ma.Cookie class methods

ma.registerInitFunction(ma.Storage._test);
