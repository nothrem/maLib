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
 * based on:
 *
 * Copyright 2009 Peter-Paul Koch (http://www.quirksmode.org). All rights reserved
 * http://www.quirksmode.org/js/detect.html
 *
 * Terms of use: see http://www.quirksmode.org/about/copyright.html
 */

/**
 * Required parts:
 *   ma._Browser
 *   ma.console
 * Optional parts:
 *   NONE
 */

if (!ma._Browser) {
	ma.console.error('BrowserDetect loaded before ma.browser, it may not be available for use!');
	ma._Browser = {};
}

/**
 * @private
 * Detects client browser and OS
 *
 * @param  [void]
 * @return [Object]
 *              .browser [String] name of browser (e.g. 'Firefox')
 *              .version [Number] version of the browser (e.g. 1.5)
 *              .os      [String] name of OS (e.g. 'Windows')
 *
 * @example Supported browsers and systems
<code>
	Browsers: Chrome, OmniWeb, Safari, Opera, iCab, Konqueror, Firefox, Camino, Netscape, Explorer, Mozilla (new versions of Netscape), Netscape
	OS:       Windows, Linux, Mac, iPhone/iPod
</code>
 */
ma._Browser._detect = function() {
	var
		result = {},
		me = ma._Browser._detect;

	result.browser = me._searchString(me._dataBrowser) || '';
	result.version = me._searchVersion(navigator.userAgent) || me._searchVersion(navigator.appVersion) || 0;
	result.os = me._searchString(me._dataOS) || '';

	return result;
}; //ma._Browser._detect()

ma.util.merge(ma._Browser._detect, {
	_searchString: function (data) {
		var
			i, cnt,
			dataString,
			dataProp;

		for (i = 0, cnt = data.length; i < cnt; i++) {
			dataString = data[i].string;
			dataProp = data[i].prop;
			ma._Browser._detect.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (-1 !== dataString.indexOf(data[i].subString)) {
					return data[i].identity;
				}
			}
			else if (dataProp) {
				return data[i].identity;
			}
		}
	}, //_searchString()
	_searchVersion: function (dataString) {
		var
			search = ma._Browser._detect.versionSearchString,
			index = dataString.indexOf(search);

		if (index == -1) {
			return;
		}

		return parseFloat(dataString.substring(index + search.length + 1));
	},
	_dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "Chrome"
		},
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	_dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.userAgent,
			subString: "iPhone",
			identity: "iPhone/iPod"
		},
		{
			string: navigator.userAgent,
			subString: "iPad",
			identity: "iPad"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]
}); //merge ma._Browser._detect methods
