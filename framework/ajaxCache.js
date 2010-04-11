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

	this._requests = [];
	this.defaultParams = {};


	ma.util.merge(this.events, this._class.events);
};

ma.extend('ma.ajax.AjaxCache', ma.Base, {
/**
 * @scope ma.ajax.AjaxCache
 */

	/**
	 * sets common params for each AJAX request
	 *
	 * @param [Object] options
	 *          .url        [String] (required) URL to send request to
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
	 *           .method   [String] (optional, default: request or get depending on if options contains data property) name of method (request, get, post)
	 *           other params are same as for selected method (see the method under ma.ajax)
	 * @return [Integer] current number of params (after this one was added)
	 */
	add: function(options) {
		var params = {};

		//first use default params
		Ext.apply(params, this._defaultParams);
		//then overwrite default params by the ones defined in options
		Ext.apply(params, options);

		this._requests.push(params);

		return this.length();
	},

	/**
	 * adds new request to the cache at the first position
	 *
	 * @param options [Object]
	 *           .method   [String] (optional, default: request or get depending on if options contains data property) name of method (request, get, post)
	 *           other params are same as for selected method (see the method under ma.ajax)
	 * @return [Integer] current number of params (after this one was added)
	 */
	insert: function(options) {
		//first use add() to add the request to the end
		this.add(options);
		//and then take the last one request and put it to the begining
		this._requests.unshift(this._requests.pop());

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
			params = {},
			method;

		if (!options) {
			ma.console.errorAt('No requests to send.', 'ma.ajaxCache', 'send');
			return;
		}

		//first add request options into method params
		Ext.apply(params, options);
		//the overwrite callback in params so the own callback is called (original callback will be in its params)
		Ext.apply(params, {
			callback: this._sendCallback,
			callbackScope: this,
			callbackParams: options
		});

		method = options.method || (options.data ? 'request' : 'get');

		this.notify(this._class.events.beforeRequest, {params: options});

		ma.ajax[method](params);
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

		params.callback.apply(params.callbackScope, [response, success, params.callbackParams]);
	} //_requestCallback()

}); //extend(ma._Ajax)