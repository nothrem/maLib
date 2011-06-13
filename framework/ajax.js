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
 *   ma.Cookies
 *   Ext.Ajax
 * Optional parts:
 *   NONE
 */

/**
 * Singleton object to handle AJAX requests
 *
 * @event beforeRequest    fires before request is sent to server
 *          .connection  [Object]
 *          .options     [Object]
 * @event afterRequest     fires after request has returned from server (note that also fires after onError event)
 *          .connection  [Object]
 *          .options     [Object]
 *          .response    [String]
 *          .success     [Boolean] true on success
 * @event onError          fires after request has failed
 *          .connection  [Object]
 *          .options     [Object]
 *          .response    [String]
 *          .success     [Boolean] always false
 *          return       [Boolean] return false to stop afterRequest event
 *
 * @example request callback
	<code>
		function(response, success, params) {
			if (!success) {
				ma.console.error('Error recieving response!');
				return;
			}

			var json = response.json;

			value1 = json.value1;
			value2 = json.value2;

			this.set(value1, value2, params.value3);
		}
	</code>
 */
ma._Ajax = function() {
	ma._Ajax.superclass.constructor.apply(this, arguments);

	this.addEvents(
		'beforeRequest',
		'afterRequest',
		'onError'
	);

	ma.util.merge(this.events, ma._Ajax.events);

	//add handlers for Ext.ajax events
	Ext.Ajax.on('beforerequest', this._beforeRequest, this);
	Ext.Ajax.on('requestcomplete', this._requestComplete, this);
	Ext.Ajax.on('requestexception', this._requestException, this);

	//set noCache param and other default values
	Ext.Ajax.disableCachingParam = '_hash';
	Ext.Ajax.method = "POST";

};

Ext.extend(ma._Ajax, ma.Base, {
/**
 * @scope ma.ajax
 */

	// static properties
	_className: 'Ajax',
	_fullName: 'ma.ajax',
	_class: ma._Ajax,

	/**
	 * @private
	 * security token for ma.ajax.request() method
	 */
	_token: null,

	/**
	 * @private
	 * handles Ext.Ajax event beforerequest
	 *
	 * @param  [Object] connection
	 * @param  [Object] options
	 * @return [void]
	 */
	_beforeRequest: function(connection, options) {
		this.notify(ma.ajax.events.beforeRequest, {connection: connection, options: options});
	}, //_beforeRequest()

	/**
	 * @private
	 * handles Ext.Ajax event requestcomplete
	 *
	 * @param  [Object] connection
	 * @param  [Object] response
	 * @param  [Object] options
	 * @return [void]
	 */
	_requestComplete: function(connection, response, options) {
		this.notify(ma.ajax.events.afterRequest, {connection: connection, options: options, response: response, success: true});
	}, //_requestComplete()

	/**
	 * @private
	 * handles Ext.Ajax event requestcomplete
	 *
	 * @param  [Object] connection
	 * @param  [Object] response
	 * @param  [Object] options
	 * @return [void]
	 */
	_requestException: function(connection, response, options) {
		if (false !== this.notify(ma.ajax.events.onError, {connection: connection, options: options, response: response, success: false})) {
			this.notify(ma.ajax.events.afterRequest, {connection: connection, options: options, response: response, success: false});
		} //else onError returned false to stop afterRequest event
	}, //_requestException()

	/**
	 * sets common params for each AJAX request
	 *
	 * @param [Object] options
	 *          .url        [String] (optional, required for request() method) URL to send requests to
	 *          .token      [String] (optional, required for request() method) security token for dataMiner
	 *          .headers    [Object] (optional, default: none) HTTP headers for request; see Ext.Ajax.request.header
	 *          .noCaching  [String] (optional, default: '_hash') name of param to prevent response caching (e.g. in IE), empty string to allow caching
	 * @return [void]
	 *
	 * Note: Optional params do NOT always set its default value when not present but keeps the previous one; default value is only for first call
	 */
	setDefaultParams: function(options) {
		Ext.Ajax.url = options.url;

		if (options.header) {
			Ext.Ajax.defaultHeaders = options.headers;
		}
		if ('string' === typeof options.noCaching) {
			if ('' === options.noCaching) {
				Ext.Ajax.disableCaching = false;
			}
			else {
				Ext.Ajax.disableCaching = true;
				Ext.ajax.disableCachingParam = options.noCaching;
			}
		}
		if ('string' === typeof options.token) {
			ma.ajax._token = options.token;
		}
	}, //setDefaultParams()

	/**
	 * sends GET request to specified URL
	 *
	 * @param  [Object] options
	 *          .url     [String] (required)
	 *          .params  [String/Object/Function] (optional)
	 *          .callback       [Function] callback to handle response
	 *              .response     [Object]    response from server
	 *              .success      [Boolean]   true if response is OK
	 *              .params       [Object]    see options.callbackParams
	 *          .callbackParams [Object]   params for callback function
	 *          .callbackScope  [Object]   scope for callback
	 * @return [void]
	 */
	get: function(options) {
		if (undefined === options.url) {
			ma.console.errorAt('You must define URL of the request.', this._fullName, 'get');
		}

		var extParams = {
			url: options.url,
			method: 'GET',
			callback: ma.ajax._requestCallback,
			scope: { //fictive object to serve as scope and keep options required by callback
				ajax: this,
				scope: options.callbackScope,
				params: options.callbackParams,
				callback: options.callback,
				getJson: options.getJson || false
			} //scope object
		};

		if (options.params) { //add params only if they are defined
			extParams.params = options.params;
		}

		Ext.Ajax.request(extParams);
	}, //get()

	/**
	 * sends POST request to specified URL
	 *
	 * @param  [Object] options
	 *          .url     [String] (required)
	 *          .params  [String/Object/Function] (optional) POST data or GET data when .data is defined; Object will be converted to URL-encoded string
	 *          .data    [String/Object/Function] (optional) POST data; Object will be converted to JSON-encoded string
	 *          .callback       [Function] callback to handle response
	 *              .response     [Object]    response from server
	 *              .success      [Boolean]   true if response is OK
	 *              .params       [Object]    see options.callbackParams
	 *          .callbackParams [Object]   params for callback function
	 *          .callbackScope  [Object]   scope for callback
	 * @return [void]
	 */
	post: function(options) {
		if (undefined === options.url) {
			ma.console.errorAt('You must define URL of the request.', this._fullName, 'get');
		}

		var extParams = {
			url: options.url,
			method: 'POST',
			callback: ma.ajax._requestCallback,
			scope: { //fictive object to serve as scope and keep options required by callback
				ajax: this,
				scope: options.callbackScope,
				params: options.callbackParams,
				callback: options.callback,
				getJson: options.getJson || false
			} //scope object
		};

		if (options.params) { //add params only if they are defined
			extParams.params = options.params;
		}
		if (options.data) { //add params only if they are defined
			if (ma.util.is(options.data, Function)) { //Ext.Ajax does not support function for JSON data - supply it
				options.data = options.data();
			}
			extParams.data = options.data;
		}

		Ext.Ajax.request(extParams);
	}, //get()

	/**
	 * sends request to API method
	 *
	 * @param [Object] options
	 *          .data  [Object]
	 *              .method  [String]
	 *              .params  [Mixed]
	 *          .callback       [Function] callback to handle response
	 *              .response     [Object]    response from server
	 *              .success      [Boolean]   true if response is OK
	 *              .params       [Object]    see options.callbackParams
	 *          .callbackParams [Object]   params for callback function
	 *          .callbackScope  [Object]   scope for callback
	 * @return [void]
	 */
	request: function(options) {
		var
			data,
			extParams;

		if (undefined === Ext.Ajax.url) {
			Ext.Ajax.url = ma._filePath + '/api/';
			ma.console.info('No URL set for API, presuming default API URL.');
		}

		if (undefined === options.data) {
			ma.console.errorAt('Undefined data param.', 'ma.ajax', 'request');
		}

		extParams = {
			params: {
				json: this.jsonEncode(options.data),
				xtoken: ma.ajax._token || ma.Cookie.get('xtoken')
			},
			callback: this._requestCallback,
			scope: { //fictive object to serve as scope and keep options required by callback
				ajax: this,
				scope: options.callbackScope,
				params: options.callbackParams,
				callback: options.callback,
				getJson: true
			} //scope object
		};

		Ext.Ajax.request(extParams);
	}, //ma.ajax.request()

	/**
	 * @private
	 * handles response of the request and calls the user callback
	 *
	 * @param  [Object] options (see Ext.Ajax.request)
	 * @param  [Object] success (see Ext.Ajax.request)
	 * @param  [Object] response (see Ext.Ajax.request)
	 * @return [void]
	 */
	_requestCallback: function(options, success, response) {
		var
			ajax            = this.ajax,
			callbackScope   = this.scope || window,
			callbackParams  = this.params || {},
			callback        = this.callback || ajax._defaultCallback,
			res;

		if (success) {
			res = {
				text: response.responseText,
				json: (this.getJson ? ajax.jsonDecode(response.responseText) : null),
				headers: response.getAllResponseHeaders(),
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};

			if (res.json) {
				ajax._outputLog(res.json.log);
			}

			if (res.json && undefined !== res.json.error) {
				success = false;
			}
		}
		else {
			response = response || {};
			res = {
				text: '',
				json: null,
				headers: (response.getAllResponseHeaders ? response.getAllResponseHeaders() : []),
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};
		}

		callback.call(callbackScope, res, success, callbackParams);
	}, //_requestCallback()

	/**
	 * writes to log messages returned by server
	 *
	 * @param  [Array] log messages fom server
	 * @return [void]
	 */
	_outputLog: function(log) {
		var i, cnt;

		if (ma.util.is(log, Array)) {
			for (i = 0, cnt = log.length; i < cnt; i++) {
				ma.console.log('Server log: ' + log[i]);
			}
		}
	},

	/**
	 * converts JSON text to JS object
	 *
	 * @param  [String] response - JSON encoded data
	 * @return [Object] decoded JSON
	 */
	jsonDecode: function(response) {
		try {
		return Ext.util.JSON.decode(response, true); //true to convert invalid JSON to NULL
		}
		catch (err) {
			return null;
		}
	}, //jsonDecode()

	/**
	 * converts JS object to JSON-encoded text
	 *
	 * @param  [String] JS object
	 * @return [Object] JSON encoded text
	 */
	jsonEncode: function(object) {
		return Ext.util.JSON.encode(object);
	}, //jsonEncode()

	/**
	 * @private
	 * This method is called if no callback is defined for ma.ajax.request()
	 *
	 * @param {Object} response
	 * @param {Object} success
	 * @param {Object} params
	 */
	_defaultCallback: function(response, success, params) {
		if (success) {
			if (!response.json || !response.json.error) {
				ma.console.log('Response to unhandled request recieved successfully with positive result.');
			}
			else {
				ma.console.log('Response to unhandled request recieved successfully but with error: %s.', response.json.error);
			}
		}
		else {
			if (response.json && response.json.error) {
				ma.console.log('Response to unhandled request failed with error: %s.', response.json.error);
			}
			else {
				ma.console.log('Response to unhandled request failed!');
			}
		}
	}, //_defaultCallback()

	/**
	 * loads new JS file from server
	 *
	 * @param [Object] options
	 *          .url  [String]
	 *
	 *          .callback       [Function/String] callback to handle response; it can be passed as string in case the method is from the loaded JS (then it's called only with callbackParams in the scope from string)
	 *              .response     [Object]    response from server
	 *              .success      [Boolean]   true if response is OK
	 *              .params       [Object]    see options.callbackParams
	 *          .callbackParams [Object]   params for callback function
	 *          .callbackScope  [Object]   scope for callback
	 */
	getJs: function(options) {
		if ('string' === typeof options) {
			options = { url: options }; //convert file name to url param
		}
		if (undefined === options.url) {
			ma.console.errorAt('You must define URL of the file.', this._fullName, 'getJs');
		}

		var params = {
			url: options.url,
			method: 'GET',

			callback: this._getJsCallback,
			scope: { //fictive object to serve as scope and keep options required by callback
				ajax: this,
				scope: options.callbackScope,
				params: options.callbackParams,
				callback: options.callback
			} //scope object
		};

		Ext.Ajax.request(params);
	}, //ma.ajax.getJs()

	/**
	 * @private
	 * handles response of the request and calls the user callback
	 *
	 * @param  [Object] options (see Ext.Ajax.request)
	 * @param  [Object] success (see Ext.Ajax.request)
	 * @param  [Object] response (see Ext.Ajax.request)
	 * @return [void]
	 */
	_getJsCallback: function(options, success, response) {
		var
			ajax            = this.ajax,
			callbackScope   = this.scope || window,
			callbackParams  = this.params || {},
			callback        = this.callback || ajax._defaultJsCallback,
			res;

		callbackParams.url = options.url;

		if (success) {
			try {
				res = ma.util._eval(response.responseText);
			}
			catch (error) {
				ma.console.errorAt('Loaded file is not valid JavaScript: ' + error.message, this._fullName, 'getJs::response');
			}
			res = {
				value: res,
				headers: response.getResponseHeader,
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};
			if (ma.util.is(callback, Function)) {
				callback.call(callbackScope, res, true, callbackParams);
			}
			else if (ma.util.is(callback, String)) {
				ma._getNamespace(callback).call(callbackParams);
			}
			else {
				ma.console.errorAt('Invalid callback type', 'ma.ajax', 'getJs');
			}
		}
		else {
			res = {
				value: undefined,
				headers: response.getResponseHeader,
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};
			if (ma.util.is(callback, Function)) {
				callback.call(callbackScope, res, false, callbackParams);
			}
			else if (ma.util.is(callback, String)) {
				ma.console.errorAt('Cannot call callback "' + callback + '" because JS file was not loaded correctly.', 'ma.ajax', 'getJs');
			}
			else {
				ma.console.errorAt('Invalid callback type', 'ma.ajax', 'getJs');
			}
		}
	}, //getJsCallback()

	/**
	 * @private
	 * This method is called if no callback is defined for ma.ajax.request()
	 *
	 * @param {Object} response
	 * @param {Object} success
	 * @param {Object} params
	 */
	_defaultJsCallback: function(response, success, params) {
		if (success) {
			if (response.value) {
				ma.console.debug('Js file %s loaded successfully with result: %s.', params.url, response.value);
			}
			else {
				ma.console.debug('Js file %s loaded successfully.', params.url);
			}
		}
		else {
			ma.console.error('Loading of Js file %s failed.', params.url);
		}
	} //_defaultJsCallback()

}); //extend(ma._Ajax)

ma.ajax = new ma._Ajax();
