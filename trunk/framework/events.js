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

ma.extend(ma.Observable, Ext.util.Observable, {
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
	}, //addEvents()

	/**
	 * converts browserEvent object into one more suitable
	 *
	 * @param  [Object] browserEvent
	 * @return [Event]
	 *              .element    [ma.Element] element that fired the event; undefined for 'window' or other special elements
	 *              .window     [Object] info about browser's window (see ma.util.getWindowInfo())
	 *              .mouse      [Object] details about mouse
	 *                .X             [Number]  position of mouse cursor (relative to window)
	 *                .Y             [Number]  position of mouse cursor (relative to window)
	 *                .leftButton    [Boolean] true if left mouse button was clicked (note: on some browsers (e.g. FF) is always True for non-click events (e.g. mouseMove))
	 *                .rightButton   [Boolean] true if right mouse button was clicked (note: on some browsers (e.g. FF) is True for CTRL + leftButton (i.e. secondary click on MacOS))
	 *                .middleButton  [Boolean] true if middle mouse button was clicked
	 *              .keys       [Object] details about pressed keys
	 *                .code          [Number]  code of the key (e.g. 13 for Enter)
	 *                .alt           [Boolean] true if ALT/Option key was pressed
	 *                .ctrl          [Boolean] true if CTRL key was pressed
	 *                .shift         [Boolean] true if SHIFT key was pressed
	 *                .mac           [Boolean] true if MAC/Command key was pressed
	 *              .browserEvent [Object] original event info created by browser (note that on some browsers (e.g. IE) it may change when another event occurs)
	 */
	getEvent: function(extEvent) {
		var
			element,
			browserEvent = extEvent.browserEvent,
			isIE = ma.browser.is(ma.browser.ie);


		element = extEvent.getTarget();

		return {
			event: extEvent.type,
			element: (ma.Element.isHtmlElement(element) ? new ma.Element(element) : undefined),
			window: ma.util.getWindowInfo(),
			mouse: {
				X: browserEvent.clientX,
				Y: browserEvent.clientY,
				leftButton: (isIE ? 1 === browserEvent.button : 0 === browserEvent.button),
				rightButton: (isIE ? 2 === browserEvent.button : 2 === browserEvent.button),
				middleButton: (isIE ? 4 === browserEvent.button : 1 === browserEvent.button)
			},
			keys: {
				code: extEvent.getKey(),
				alt: browserEvent.altKey,
				ctrl: browserEvent.ctrlKey,
				shift: browserEvent.shiftKey,
				mac: browserEvent.metaKey || false //MAC key available only on FF and Safari
			},
			browserEvent: browserEvent
		};
	}

}); //ma.Observable