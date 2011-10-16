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
 *   Ext
 *   Ext.util.Observable
 *   ma.console
 *   ma.util
 * Optional parts:
 *   NONE
 */

/**
 * @constructor
 * @extends Ext.util.Observable
 *
 * Creates new base object for maFx
 *
 * @param  [void]
 * @return [void]
 */
ma.Base = function() {
	ma.Base.superclass.constructor.apply(this, arguments);
	this.isReady = true;
	this._isInstance = true;
	this._isClass = false;

};

Ext.extend(ma.Base, ma.Observable, {
	/**
	 * @scope ma.Base
	 */
	// static properties
	_isClass: true,
	_isInstance: false,
	_className: 'Base',
	_fullName: 'ma.Base',
	_class: ma.Base,

	/**
	 * Merges this object with given values (deep merge)
	 *
	 * @param  values [Object] object with properties
	 * @return [void]
	 */
	merge: function(values) {
		ma.util.merge(this, values);
	},
	/**
	 * Creates new deep clone of this object
	 *
	 * @param  values [Object] Values to change
	 * @return [Object] new clone
	 */
	clone: function(values) {
		return ma.util.clone(this, values);
	}
});

ma.Base._isClass = true;
ma.Base._isInstance = false;