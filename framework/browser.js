/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded for free.
 * GIT repository: ssh://git@jii.chobits.ch:17222/~/maLib (send your public key to git@chobits.ch to gain free access).
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
 *   Ext
 * Optional parts:
 *   NONE
 */

/**
 * Singleton object to handle browser, window and document
 *
 * @event resize          fires when browser window is resized
 *           <param>   [void]      no params for this event; use ma.util.getWindowInfo() to get current window size
 * @event keyDown         fires when user pressed a keyboard button
 *           <param>   [event]     event info about pressed key
 * @event keyUp           fires when user releases a keyboard button
 *           <param>   [event]     event info about pressed key
 * @event keyPress         fires after user pressed and released a keyboard button
 *           <param>   [event]     event info about pressed key
 * @event changeState      fires when browser changes its state (see ma.browser.setState)
 *           <param>   [String]    name of the state (undefined if all states were removed)
 *           <param>   [String]    new value of the state (undefined if no value)
 *
 *
 * @example How to use
	<code>
		ma.browser.setPageTitle('This is my page');
		if (!ma.browser.is(ma.browser.windows)) {
			alert('This site is for Windows only!');
		}
		if (ma.browser.is({name: 'Firefox'}) && !ma.browser.is({minVersion: 3})) {
			alert('Firefox 1.5 and Firefox 2.0 are not supported anymore!');
		}
	</code>

 * @event resize   fires when browser's window is resized
 *           <param>   [Event]  see ma.util.getEvent()
 */
ma._Browser = function() {
	var version;

	this._class.superclass.constructor.apply(this, arguments);

	//instance properties
	version = this._class._detect();

	ma.util.merge(this, {
		_supportedBrowsers: [],
		_name:    version.browser,
		_version: version.version,
		_os:      version.os
	}); //merge properties

	this.body = new ma.Element(Ext.getBody().dom);
	this._document = new Ext.Element(window.document);

	this.body.addClass('br-' + this._name);
	this.body.addClass('br-ver-' + this._version);
	this.body.addClass('os-' + this._os);
};

ma.extend('ma._Browser', ma.Base, {
/**
 * @scope ma.browser
 */

	// static properties
	_className: 'Browser',
	_fullName: 'ma.browser',

	//class properties
	_info: window.navigator,

	ie: {
		name:      'Explorer',
		minVersion: 6
	},
	ie6: {
		name:      'Explorer',
		minVersion: 6,
		maxVersion: 7
	},
	ie7: {
		name:      'Explorer',
		minVersion: 7,
		maxVersion: 8
	},
	ie8: {
		name:      'Explorer',
		minVersion: 8,
		maxVersion: 9
	},
	ie9: {
		name:      'Explorer',
		minVersion: 9,
		maxVersion: 10
	},
	ff2: {
		name:      'Firefox',
		minVersion: 2,
		maxVersion: 3
	},
	ff3: {
		name:      'Firefox',
		minVersion: 3,
		maxVersion: 4
	},
	ff30: {
		name:      'Firefox',
		minVersion: 3,
		maxVersion: 3.5
	},
	ff35: {
		name:      'Firefox',
		minVersion: 3.5,
		maxVersion: 3.6
	},
	ff36: {
		name:      'Firefox',
		minVersion: 3.6,
		maxVersion: 4
	},
	ff4: {
		name:      'Firefox',
		minVersion: 4
	},
	safari: {
		name:      'Safari',
		minVersion: 2
	},
	safari2: {
		name:      'Safari',
		minVersion: 2,
		maxVersion: 3
	},
	safari3: {
		name:      'Safari',
		minVersion: 3,
		maxVersion: 4
	},
	safari4: {
		name:      'Safari',
		minVersion: 4,
		maxVersion: 5
	},
	safari5: {
		name:      'Safari',
		minVersion: 5,
		maxVersion: 6
	},
	chrome: {
		name:      'Chrome',
		minVersion: 3
	},
	opera9: {
		name:      'Opera',
		minVersion: 9,
		maxVersion: 10
	},
	opera10: {
		name:      'Opera',
		minVersion: 10,
		maxVersion: 11
	},
	windows: {
		os:      'Windows'
	},
	linux: {
		os:      'Linux'
	},
	mac: {
		os:      'Mac'
	},
	iphone: {
		os:      'iPhone/iPod'
	},
	ipad: {
		os:      'iPad'
	},

	/**
	 * Sets page title usually displayed in browser's title, on a tab etc.
	 *
	 * @param  [String] title of the page
	 * @return [void]
	 */
	setPageTitle: function(title) {
		document.title = title;
	},

	/**
	 * Adds browser to list of supported ones - use ma.browser.isSupported() to detect the result
	 *
	 * @param  supportedBrowsers [Array of Object] see ma.object.is() for details
	 * @return [void]
	 */
	addSupportedBrowsers: function(supportedBrowsers) {
		this._supportedBrowsers = this._supportedBrowsers.concat(supportedBrowsers);
	},

	/**
	 * Returns true if current browser is suppored
	 *
	 * @param  [void]
	 * @return [Boolean] true for supported browser
	 */
	isSupported: function() {
		if (ma.util.is(this._supportedBrowsers, Empty)) {
			ma.console.warn('No browser was registered as supported!');
		}
		return this.is(this._supportedBrowsers);
	},

	/**
	 * Checks that current browser is the defined one (or in the list)
	 *
	 * @param  params [Object or Array of Objects]
	 *            .name       [String] (optional, default: any browser) see supported browsers list
	 *            .minVersion [Number] (optional, default: any older version) minimal version that IS supported
	 *            .maxVersion [Number] (optional, default: any newer version) version that is NOT supported yet (e.g. 4.0 means last supported version is 3.9)
	 *            .os         [String] (optional, default: any os) see supported OS list
	 * @return [Boolean] true is current browser complies with given params; or any of browsers in the list
	 *
	 * @example Supported browsers and systems
<code>
	Browsers: Chrome, OmniWeb, Safari, Opera, iCab, Konqueror, Firefox, Camino, Netscape, Explorer, Mozilla (new versions of Netscape), Netscape
	OS:       Windows, Linux, Mac, iPhone/iPod
</code>
	 */
	is: function(params) {
		var i, cnt, isOk;

		if (ma.util.is(params, Array)) {
			isOk = false;
			for (i = 0, cnt = params.length; i < cnt; i++) {
				if (this.is(params[i])) {
					isOk = true;
				}
			}
			return isOk;
		}

		if (!ma.util.is(params, Object)) {
			ma.console.warn('ma.browser.is() called w/o valid params; given param is "'+params+'"');
			return false;
		}

		if (params.name) {
			if (this._name !== params.name) {
				return false;
			}
		}
		if (params.minVersion) {
			if (this._version < params.minVersion) {
				return false;
			}
		}
		if (params.maxVersion) {
			if (this._version >= params.maxVersion) {
				return false;
			}
		}
		if (params.os) {
			if (this._os !== params.os) {
				return false;
			}
		}

		return true; //no condition found
	},

	/**
	 * masks or unmasks whole window
	 *
	 * @param {Boolean} show or hide the mask
	 * @param {String} text to show in the mask
	 */
	mask: function(showMask, text) {
		this.body.mask.apply(this.body, arguments);
	},

	/**
	 * moves current window view to given coordinates
	 *
	 * @param {[Object]} config
	 *             .x   {[Number]} move to given X (horizontal) coordinate
	 *             .byX {[Number]} move by given delta horizontaly from current position
	 *             .y   {[Number]} move to given Y (vertical) coordinate
	 *             .byY {[Number]} move by given delta vertically from current position
	 *            'top' {String} when passed in instead of object it scrolls to body top
	 *            'bottom' {String} when passed in instead of object it scrolls to the end of the body
	 * @return {void}
	 */
	scroll: function(config) {
		var
			x,y,posX,posY,timer,
			is = ma.util.is,
			currentX = window.scrollX,
			currentY = window.scrollY;

		if (is(config, String) && ('top' === config || 'bottom' === config)) {
			x = 0;
			if ('top' === config) {
				y = 0;
			}
			else {
				y = ma.browser.body.ext.getHeight();
			}
		}
		else if (is(config, Object)) {
			if (is(config.byX, undefined)) {
				x = config.x;
			}
			else {
				x = currentX + config.byX;
			}
			if (is(config.byY, undefined)) {
				y = config.y;
			}
			else {
				y = currentY + config.byY;
			}
		}

		if (is(x, undefined)) {
			x = currentX;
		}
		if (is(y, undefined)) {
			y = currentY;
		}

		if (config.animate) {
			ma.console.warn('Scrolling animation not implemented.');
			window.scrollTo(x, y);
		}
		else {
			window.scrollTo(x, y);
		}
	},

	/**
	 * @private
	 * returns 2-level array representing hash in URL
	 *
	 * @return {Array} (e.g. "#x&y=1&z=a" will return [["x"],["y","1"],["z","a"]])
	 */
	_parseState: function() {
		var
			states = window.location.hash,
			i, cnt, state;

		states = states.replace('#', ''); //hash contains the hash symbol but we don't want it

		if (ma.util.is(states, 'empty')) {
			return []; //no states yet, just get empty array (otherwise it would generate array with empty string!)
		}

		states = states.split('&');

		for (i = 0, cnt = states.length; i < cnt; i++) {
			state = states[i].split('=');
			states[i] = state; //replace the state in array
			states[state[0]] = i; //create index value for the state
		}

		return states;
	},

	/**
	 * sets new URL hash from the states
	 *
	 * @param {Array} list of states (e.g. [["x"],["y","1"],["z","a"]] will create hash "#x&y=1&z=a")
	 */
	_setState: function(states) {
		var
			i, cnt, state;

		for (i = 0, cnt = states.length; i < cnt; i++) {
			states[i] = states[i].join('=');
		}

		states = states.join('&');

		window.location.hash = states;
	},

	/**
	 * sets new state of the application
	 * the state is saved in URL's hash and is remembered even after reload or when saved in Bookmark
	 * note: changing URL's hash does not reload the page which means it's save for JS execution
	 *
	 * @param  {String/Boolean} name of the state; false to delete all states (note that the hash key "#" will still remain in the URL!)
	 * @param  {String/Boolean} (optional) value for the state (e.g. "#state=value"; if undefined or True, the state will be saved without value (e.g. "#state"); use False to delete the state completely
	 * @return {void}
	 */
	setState: function(state, value) {
		var
			states = this._parseState(),
			index = states[state];

		if (false === state) { //remove any state in URL
			this._setState([]);
			this.notify('changeState', undefined, undefined);
			return;
		}

		if (undefined !== index) { //already defined
			if (undefined === value || true === value) {
				states[index].splice(1); //remove the value
			}
			else if (false === value) { //remove
				states.splice(index, 1);
			}
			else {
				states[index][1] = value; //replace the value
			}
		}
		else {
			if (undefined === value || true === value) {
				states.push([state]); //must be in array to correctly process
			}
			else if (false !== value) { //remove
				states.push([state, value]);
			} //else value is false which means "delete" but is does not exist
		}

		this.notify('changeState', state, value);

		this._setState(states);
	},

	/**
	 * returns value of the state
	 *
	 * @param {String} name of the state
	 * @return {String/Boolean} value of the state; false if not defined, true if defined w/o value (e.g. "#state")
	 */
	getState: function(state) {
		var
			states = this._parseState(),
			index = states[state],
			value;

		if (undefined === index) {
			return false; //not defined
		}

		value = states[index][1];

		if (undefined === value) {
			return true; //defined, but without value
		}

		return value;
	},

	/**
	 * @private
	 * sets event handlers for browsers events (window, document, etc.)
	 *
	 * @param  [Function/Array] see ma.Element.constructor()::listeners
	 * @return [void]
	 */
	_setEvents: function(listeners) {
		var
			htmlEvents = {
				'keyDown': { handler: 'onkeydown', event: 'keydown', element: 'document' },
				'keyUp': { handler: 'onkeyup', event: 'keyup', element: 'document' },
				'keyPress': { handler: 'onkeypress', event: 'keypress', element: 'document' },
				'resize': { handler: 'onresize', event: 'resize', element: 'window' },
				'changeState': { element: 'none' }
			},
			i, cnt, event;

		for (i in htmlEvents) {
			event = htmlEvents[i];
			this.addEvents(i);

			switch (event.element) {
				case 'document':
					this._document.on(event.event, this._htmlEventHandler.setScope(this));
					break;
				case 'window':
					window[event.handler] = this._htmlWindowEventHandler.createDelegate(this, [i]);
					break;
				case 'body':
					this.body.ext.on(event.event, this._htmlEventHandler.setScope(this));
					break;
				case 'none':
					//nothing, just create event (will be fired elsewhere manually)
					break;
				default:
					ma.console.errorAt('Cannot bind event ' + i + ' on element ' + event.element, this._fullName, '_setEvents');
			}

			if (!ma._Browser.htmlEvents) {
				ma._Browser.htmlEvents = {};
			}
			ma._Browser.htmlEvents[i] = event;
		}
	}, //_setEvents()

	/**
	 * @private
	 * universal HTML event handler for events created by Window element
	 *
	 * @param  [BrowserEvent]
	 * @return [Boolean] false if event should be canceled
	 */
	_htmlWindowEventHandler: function(eventName) {
		this.notify(eventName);
	},

	/**
	 * @private
	 * universal HTML event handler that converts BrowserEvent object into more suitable one
	 *
	 * @param  [BrowserEvent]
	 * @return [Boolean] false if event should be canceled
	 */
	_htmlEventHandler: function(extEvent) {
		var
			eventName,
			options,
			result = false;

		options = this.getEvent(extEvent);

		//get event name
		eventName = options.event;

		if (!eventName) {
			return; //this is not known event or is not called on valid element
		}

		try {
			result = this.notify(eventName, options);
		} catch (e) { //stops event if its handler caused error
			extEvent.stopEvent();
			ma.console.warn('Handler for event %s::%s has crashed, event was stopped.', this.id, eventName);
			throw e; //throw error again to actually let it go (here we only care about stopping the event)
		}
		if (!result) {
			extEvent.stopEvent();
		}
	} //_htmlEventHandler()


}); //extend(ma._Browser)

/**
 * Inits browser Singleton
 */
ma._Browser._init = function(){
	ma.browser = new ma._Browser();
	ma.browser._setEvents();
};

ma.registerInitFunction(ma._Browser._init);
