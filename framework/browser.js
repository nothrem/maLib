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
 * Singleton object to handle browser and objects window and document
 *
 * @example How to use
	<code>
	</code>
 */
ma._Browser = function() {
	this._class.superclass.constructor.apply(this, arguments);

	this.addEvents(
	);

	ma.util.merge(this.events, this._class.events);

	//add handlers for events

};

Ext.extend(ma._Browser, ma.Base, {
/**
 * @scope ma.browser
 */

	// static properties
	_className: 'Browser',
	_fullName: 'ma.browser',
	_class: ma._Browser,

	/**
	 * Sets page title usually displayed in browser's title, on a tab etc.
	 *
	 * @param  [String] title of the page
	 * @return [void]
	 */
	setPageTitle: function(title) {
		document.title = title;
	}
}); //extend(ma._Browser)

ma.browser = new ma._Browser();
