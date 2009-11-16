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
 *   ma.ajax
 *   ma.util
 * Optional parts:
 *   NONE
 */

/**
 * Object for caching and sending AJAX requests
 *
 * @event beforeRequest    fires before request is sent to server
 *          .params  [Object]
 * @event afterRequest     fires after request has returned from server (note that also fires after onError event)
 *          .response    [Object]
 *          .success     [Boolean]
 *          .params      [Object]
 * @event onError          fires after request has failed
 *          .response    [Object]
 *          .success     [Boolean]
 *          .params      [Object]
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
ma.ajax.AjaxCache = function() {
	this._class.superclass.constructor.apply(this, arguments);

	this.addEvents(
		'beforeRequest',
		'afterRequest',
		'onError'
	);

	ma.util.merge(this.events, this._class.events);
};

ma.extend('ma.ajax.AjaxCache', ma.Base, {
/**
 * @scope ma.ajax.AjaxCache
 */

//		this.notify(ma.ajax.events.beforeRequest, {connection: connection, options: options});

	_defaultParams: {},
	_requests: [],

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
		this._defaultParams = options;
	}, //setDefaultParams()

	/**
	 * returns number of requests in cache
	 *
	 * @param  [void]
	 * @return [Integer]
	 */
	length: function() {
		return this._requests.length;
	},

	/**
	 * adds new request to the cache
	 *
	 * @param options [Object]
	 * @return [Integer] current number of params (after this one was added)
	 */
	add: function(options) {
		var params = {};

		Ext.apply(params, this._defaultParams);
		Ext.apply(params, options);

		this._requests.push(params);

		return this.length();
	},

	/**
	 * adds new request to the cache at the first position
	 *
	 * @param options [Object]
	 * @return [Integer] current number of params (after this one was added)
	 */
	insert: function(options) {
		var params = {};

		Ext.apply(params, this._defaultParams);
		Ext.apply(params, options);

		this._requests.unshift(params);

		return this.length();
	},

	/**
	 * sends first request from the cache
	 *
	 * @param  [void]
	 * @return [Integer] current number of params (after this one was sent)
	 */
	send: function() {
		var
			options = this._requests.shift(),
			params = {};

		Ext.apply(params, options);
		Ext.apply(params, {
			callback: this._sendCallback,
			callbackScope: this,
			callbackParams: options
		});

		this.notify(this._class.events.beforeRequest, {params: options});

		ma.ajax.request(params);
	},

	/**
	 * @private
	 * handles response of the request and calls the user callback
	 *
	 * @param  [Object] options (see Ext.Ajax.request)
	 * @param  [Object] success (see Ext.Ajax.request)
	 * @param  [Object] response (see Ext.Ajax.request)
	 * @return [void]
	 */
	_sendCallback: function(response, success, params) {
		if (success) {
			this.notify(this._class.events.afterRequest, {
				response: response,
				success: success,
				params: params
			});
		}
		else {
			if (false === this.notify(this._class.events.onError, {
					response: response,
					success: success,
					params: params
				})) {
					this.notify(this._class.events.afterRequest, {
						response: response,
						success: success,
						params: params
					});
				}
		} //success

		params.callback.call(params.callbackScope, response, success, params.callbackParams);
	} //_requestCallback()

}); //extend(ma._Ajax)