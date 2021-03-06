/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This file is example of shortcuts for maLib methods.
 *
 * You can either use original methods, create your own shortcuts or just use this file
 *
 */

/**
 * Properties use for ma.util.is() for Types
 */
Empty = 'empty';
Zero  = 'zero';

//global shortcut for ma.util.is() method and it's oposite
is = ma.util.is;
isnt = function() { return ! is.apply(this, arguments); };

//shortcuts for console
ma.log = ma.console.log;
ma.error = ma.console.error;
ma.errorAt = ma.console.errorAt;

//shortcut for ma.Element.get() in style of Ext.get()
ma.get = ma.Element.get;

//shortcut for fast value storing (string-only!)
ma.store = ma.Storage.set;
ma.restore = ma.Storage.get;



//methods to make important or dificult things easier
/**
 * Initiates AJAX requests by settings dataMiner URL and starting session
 *
 * @param  [String] URL for server API
 * @param  [Function] callback fired when dataMiner is ready to response
 * @return [void]
 */
ma.initAjax = function(url, callback) {
	if (is(url, Empty)) {
		ma.error('Please define API URL in ma.initAjax() method.');
	}

	ma.ajax.setDefaultParams({url: url});

	ma.ajax.request({
		data: {
			method: 'api.session.init'
		},
		callbackParams: callback,
		/**
		 * callback for session::init, calls user defined callback
		 */
		callback: (isnt(callback, Function)) ? ma.util.nop : function(response, success, callback) {
			if (success) {
				callback.call(window);
			}
			else {
				ma.errorAt('Cannot initiate AJAX requests!', 'shortcuts', 'initAjax');
			}
		}
	});
}; //ma.initAjax()

ma.util.merge(ma.Element.prototype, {
	/**
	 * Allows to call many methods on Element
	 *
	 * @param  [Array] list of methods and its params
	 *           <item>  [String] name of method to call (e.g. 'hide' will hide the Element)
	 *           <item>  [Array]  method and its params (e.g. ['setX', 100] will move the element to position of 100px from left
	 *              <1st item>  [String]  name of method to call (e.g. 'hide' will hide the Element)
	 *              <nth item>  [Mixed]   param for the method
	 * @return [void]
	 *
	 * @example How to use ma.Element.apply()
		<code>
			el = new ma.Element('div');
			el.apply([
				['setX', 100], //calls Ext.Element.setX(100)
				['setY', 200], //calls Ext.Element.setY(200)
				'show',        //calls ma.Element.show()
				['add', 'div', 'div'] //calls ma.Element.add('div', 'div') which adds two new divs into this one
				'isHidden'     //calls ma.Element.isHidden() but you won't get the result!!!
			]);
		</code>
	 */
	apply: function(params) {
		var
			i, cnt,
			param,
			methodName, methodParams;

		if (isnt(params, Array)) {
			ma.error('Invalid param for %s.apply().', this._fullName);
			return;
		}

		for (i = 0, cnt = params.length; i < cnt; i++) {
			param = params[i];
			if (is(param, String)) {
				methodName = param;
				methodParams = [];
			}
			else if (is(param, Array)){
				methodName = param.shift();
				methodParams = param;
			}

			if (is(this[methodName], Function)) {
				(this[methodName]).apply(this, methodParams);
			}
			else if (is(this.ext[methodName], Function)) {
				(this.ext[methodName]).apply(this.ext, methodParams);
			}
			else if (is(this.dom[methodName], Function)) {
				(this.dom[methodName]).apply(this.dom, methodParams);
			}
			else {
				ma.error('Invalid method in %s.apply() on index %d.', this._fullName, i);
			}
		} //for each param
	},

	/**
	 * alias for ma.Element.getContent
	 *
	 * @param  [String / Object] url or ma.ajax options
	 * @return [void]
	 */
	load: ma.Element.prototype.getContent
}); //extend ma.Element
