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
	 *          .dataMiner  [String] (required) URL of dataMiner
	 *          .headers    [Object] (optional, default: none) HTTP headers for request; see Ext.Ajax.request.header
	 *          .noCaching  [String] (optional, default: '_hash') name of param to prevent response caching (e.g. in IE), empty string to allow caching
	 * @return [void]
	 *
	 * Note: Optional params do NOT always set its default value when not present but keeps the previous one; default value is only for first call
	 */
	setDefaultParams: function(options) {
		Ext.Ajax.url = options.dataMiner;

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
	}, //setDefaultParams()

	/**
	 * sends request to dataMiner
	 *
	 * @param [Object] options
	 *          .object  [String]
	 *          .method  [String]
	 *          .params  [Mixed]
	 *          .callback       [Function] callback to handle response
	 *              .response     [Object]    response from server
	 *              .success      [Boolean]   true if response is OK
	 *              .params       [Object]    see options.callbackParams
	 *          .callbackParams [Object]   params for callback function
	 *          .callbackScope  [Object]   scope for callback
	 */
	request: function(options) {
		if (undefined === Ext.Ajax.url) {
			ma.console.error('Error in %s.request(): First you must set dataMiner URL. Use %s.setDefaultParams().', this._fullName, this._fullName);
		}

		var params = {
			params: {
				object: options.object,
				method: options.method,
				params: options.params ? this.jsonEncode(options.params) : undefined, //undefined would be converted to "null" which is not acceptable
				token : ma.Cookie.get('token')
			},
			callback: this._requestCallback,
			scope: { //fictive object to serve as scope and keep options required by callback
				ajax: this,
				scope: options.callbackScope,
				params: options.callbackParams,
				callback: options.callback
			} //scope object
		};

		Ext.Ajax.request(params);
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
				json: ajax.jsonDecode(response.responseText),
				headers: response.getResponseHeader,
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};
			callback.call(callbackScope, res, res.json.result, callbackParams);
		}
		else {
			res = {
				text: '',
				json: {},
				headers: response.getResponseHeader,
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};
			callback.call(callbackScope, res, false, callbackParams);
		}
	}, //_requestCallback()

	/**
	 * converts JSON text to JS object
	 *
	 * @param  [String] response - JSON encoded data
	 * @return [Object] decoded JSON
	 */
	jsonDecode: function(response) {
		return Ext.util.JSON.decode.call(this, response, true); //true to convert invalid JSON to NULL
	}, //jsonDecode()

	/**
	 * converts JS object to JSON-encoded text
	 *
	 * @param  [String] JS object
	 * @return [Object] JSON encoded text
	 */
	jsonEncode: function(object) {
		return Ext.util.JSON.encode.call(this, object);
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
			if (response.json.result) {
				ma.console.log('Response to unhandled request recieved successfully with positive result.');
			}
			else {
				if (response.json.error) {
					ma.console.log('Response to unhandled request recieved successfully but with error: %s.', response.json.error);
				}
				else {
					ma.console.log('Response to unhandled request recieved successfully but with negative result.');
				}
			}
		}
		else {
			ma.console.log('Response to unhandled request failed!');
		}
	}, //_defaultCallback()

	/**
	 * loads new JS file from server
	 *
	 * @param [Object] options
	 *          .url  [String]
	 *
	 *          .callback       [Function] callback to handle response
	 *              .response     [Object]    response from server
	 *              .success      [Boolean]   true if response is OK
	 *              .params       [Object]    see options.callbackParams
	 *          .callbackParams [Object]   params for callback function
	 *          .callbackScope  [Object]   scope for callback
	 */
	getJS: function(options) {
		if ('string' === typeof options) {
			options = { url: options }; //convert file name to url param
		}
		if (undefined === options.url) {
			ma.console.error('Error in %s.getJS(): You must define URL of the file.', this._fullName);
		}

		var params = {
			url: options.url,
			method: 'GET',

			callback: this._getJSCallback,
			scope: { //fictive object to serve as scope and keep options required by callback
				ajax: this,
				scope: options.callbackScope,
				params: options.callbackParams,
				callback: options.callback
			} //scope object
		};

		Ext.Ajax.request(params);
	}, //ma.ajax.getJS()

	/**
	 * @private
	 * handles response of the request and calls the user callback
	 *
	 * @param  [Object] options (see Ext.Ajax.request)
	 * @param  [Object] success (see Ext.Ajax.request)
	 * @param  [Object] response (see Ext.Ajax.request)
	 * @return [void]
	 */
	_getJSCallback: function(options, success, response) {
		var
			ajax            = this.ajax,
			callbackScope   = this.scope || window,
			callbackParams  = this.params || {},
			callback        = this.callback || ajax._defaultJSCallback,
			res;

		callbackParams.url = options.url;

		if (success) {
			res = ma.util._eval(response.responseText);
			res = {
				value: res,
				headers: response.getResponseHeader,
				status: {
					code: response.status,
					text: response.statusText
				} //status
			};
			callback.call(callbackScope, res, true, callbackParams);
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
			callback.call(callbackScope, res, false, callbackParams);
		}
	}, //getJSCallback()

	/**
	 * @private
	 * This method is called if no callback is defined for ma.ajax.request()
	 *
	 * @param {Object} response
	 * @param {Object} success
	 * @param {Object} params
	 */
	_defaultJSCallback: function(response, success, params) {
		if (success) {
			if (response.value) {
				ma.console.log('JS file %s loaded successfully with result: %s.', params.url, response.value);
			}
			else {
				ma.console.log('JS file %s loaded successfully.', params.url);
			}
		}
		else {
			ma.console.log('Loading of JS file %s failed.', params.url);
		}
	} //_defaultJSCallback()

}); //extend(ma._Ajax)

ma.ajax = new ma._Ajax();
