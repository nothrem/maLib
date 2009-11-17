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
 *   Ext
 * Optional parts:
 *   NONE
 */

/**
 * Singleton object to handle browser, window and document
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
 */
ma._Browser = function() {
	var version;

	this._class.superclass.constructor.apply(this, arguments);

	this.addEvents(
	);

	ma.util.merge(this.events, this._class.events);

	//add handlers for events

	//instance properties
	version = this._class._detect();

	ma.util.merge(this, {
		_supportedBrowsers: {},
		_name:    version.browser,
		_version: version.version,
		_os:      version.os
	}); //merge properties


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
	opera9: {
		name:      'Safari',
		minVersion: 9,
		maxVersion: 10
	},
	opera10: {
		name:      'Safari',
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
		ma.util.merge(this._supportedBrowsers, supportedBrowsers);
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

		if (params.browser) {
			if (this._name !== params.browser) {
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
	}
}); //extend(ma._Browser)

/**
 * Inits browser Singleton
 */
ma._Browser._init = function(){
	ma.browser = new ma._Browser();
};

ma.registerInitFunction(ma._Browser._init);
