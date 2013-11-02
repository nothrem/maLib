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
	 * Calls inherited (superclass'/parent's) constructor with given arguments
	 *
	 * @param  args {Arguments} list of arguments of the contructor
	 * @return {Mixed} result of the parent constructor - in most cases it should be the calling object (i.e. 'this')
	 */
	inherit: function(args) {
		return this.superclass().constructor.apply(this, args);
	},

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
	},

	/**
	 * Calls method on the instance; the returns reference to the instance to allow call another chain
	 *
	 * @param  {String} method
	 * @param  {Array} params
	 */
	chain: function(method, params) {
		if (!ma.util.is(params, Array)) {
			params = [ params ];
		}
		this[method](params);
		return this;
	}
});

ma.Base._isClass = true;
ma.Base._isInstance = false;