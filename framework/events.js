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
 *   ma.console
 *   ma.util
 *   Ext
 *   Ext.util.Observable
 * Optional parts:
 *   NONE
 */

/**
 * @example
<code>
How to create global event:

	new ma.Event('onError'); //creates new event "onError"
	ma.Event.registerObserver('onError', function(...) {...}); //registers observer
	ma.Event.notify('onError', this);

How to create local observer

	this.onError = new ma.Event('PRIVATE_myClass.onError'); //creates new event "onError" - note the starting part!
	this.on = function(observer) {
		this.onError.registerObserver(observer);
	}
	if (error) {
		this.onError.notify(this);
	}
</code>
 */
/**
 * @constructor
 * @abstract
 * event that can be listened to by observers
 *
 * @param  name [String] (recommended to be structurised; e.g. "ma.util.onAlert")
 * @param  defaultParams [Object] (optional)
 */
ma.Observable = function(){
	ma.Observable.superclass.constructor.apply(this, arguments);

	this._class.events = this._class.events || {};

	return null; //abstract class
}; //ma.Observable

Ext.extend(ma.Observable, Ext.util.Observable, {
	/**
	 * @scope ma.Observable
	 */
	// static properties
	_className: 'Observable',
	_fullName: 'ma.Observable',
	_class: ma.Observable,

	/**
	 * notifies all observers about this event
	 *
	 * @param  sender [String] name of the event
	 * @param  params [Mixed] any number of params for listeners
	 * @return [Boolean] false if any of observers returned false
	 */
	notify: function(eventName, params){
		var is = ma.util.is;

		if (is(eventName, String)) {
			return this.fireEvent.apply(this, arguments);
		}
		else if(is(eventName, 'empty')) {
			ma.console.error(ma.util.printf('Undefined event in %s.notify()', this._fullName));
		}
		else {
			ma.console.error(ma.util.printf('Unexpected type of event in %s.notify()', this._fullName));
		}
	}, //notify()

	/**
	 * adds new events to this object
	 *
	 * @param  [String, ...] any number of event names
	 * @return [void]
	 */
	addEvents: function(/* Array events */) {
		ma.Observable.superclass.addEvents.apply(this, arguments);

		Ext.each(
			arguments,
			function(event) {
				this._class.events[event] = event;
			},
			this //scope for function
		); //each(argument)
	} //addEvents()

}); //ma.Observable