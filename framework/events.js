/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded
 * from svn://chobits.ch/source/maLib and used for free.
 *
 * Author does not guarantee any support and takes no resposibility for any damage.
 * You use this code at your own risk. You can modify it as long as this header is present and unchaged!
 */

/**
 * Required parts:
 *   ma.console
 *   ma.util
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
 * event that can be listened to by observers
 *
 * @param  name [String] (recommended to be structurised; e.g. "ma.util.onAlert")
 * @param  defaultParams [Object] (optional)
 */
ma.Event = function(name, defaultParams){
	var events = ma.event._events;

	if (ma.Event.isDefined(name)) {
		ma.console.warn('Event ' + name + ' already registered!');
		return null;
	}
	ma.Event._events[name] = this;  //register new event
	ma.Event._observers[name] = []; //create list for observers

	//set propeties
	ma.util.merge(this, {
		_name: name,
		_default: defaultParams || {},
		_observers: ma.Event._observers[name]
	}); //merge()
	//add methods
	ma.util.merge(this, ma.Event._eventMethods);
	//add methods aliases
	ma.util.merge(this, {
		on: this.registerObserver,
		un: this.unregisterObserver,
		rise: this.notify
	}); //merge()
}; //ma.event

/**
 * list of methods that must have each new ma.event instance (used by constructor)
 */
ma.Event._eventMethods = {
	/**
	 * notifies all observers about this event
	 *
	 * @param  sender [Object] object that is the origin of this event (usually the one who called notify)
	 * @param  params [Object] params for this event
	 * @return [Array of Mixed] return values of every observer (unsorted!)
	 */
	notify: function(sender, params){
		var
			observers = ma.event._observers[this._name],
			results = [];

		params = ma.util.clone(this._default, params);

		if ('object' === typeof observers && Array === observers.constructor && 0 < observers.length) {
			for (var i = 0, c = observers.length; i < c; i++) {
				results.push(observers[i](sender, params));
			}
		}

		return results;
	}, //notify()

	/**
	 * registers new observer for this event
	 *
	 * @param  observer [Function] method that will be called on notify()
	 *           params:
	 *              sender  [Object]
	 *              params  [Object] (optional)
	 *           returns:
	 *              [Mixed] (optional)
	 * @return [Boolean] false on any error
	 */
	registerObserver: function(observer) {
		if ('function' !== typeof observer) {
			return false;
		}

		if (this.unregisterObserver(observer, false)) {
			return true;
		}

		this._observers.push(observer);
		return true;
	}, //registerObserver()

	/**
	 * removes observer from the listeners of this event
	 *
	 * @param  observer [Function] same method used for registerObserver()
	 * @param  remove [Boolean] (optional, default: true) set false only to test if the observer is in the list
	 * @return [Boolean] false on any error (e.g. observer was not in the list)
	 */
	unregisterObserver: function(observer, remove) {
		if ('function' !== typeof observer) {
			return false;
		}

		var observers = this._observers;
		for (var i = 0, c = observers.length; i < c; i++) {
			if (observers[i] === observer) {
				if (false !== remove) {
					delete observers[i];
				}
				return true;
			}
		}
		return false; //not found
	}

}; //ma.event._eventMethods

/**
 * list of static method of ma.event class
 */
ma.util.merge(ma.Event, {
	/**
	 * @private
	 * stores all observers for every event
	 *
	 * @see ma.Event.registerObserver()
	 */
	_observers: [],

	/**
	 * @private
	 * stores all events
	 *
	 * @see ma.Event()
	 */
	_events: [],

	/**
	 * returns true is the event is already defined
	 * @param {Object} name
	 */
	isDefined: function(name) {
		return (undefined !== ma.Event._events[name]);
	}, //ma.Event.isDefined()

	/**
	 * registers new observer to listen to an event
	 *
	 * @param  event [String / Event] event (or its name) to listen to
	 * @param  observer [Function] method that will be called on notify()
	 *           params:
	 *              sender  [Object]
	 *              params  [Object] (optional)
	 *           returns:
	 *              [Mixed] (optional)
	 * @return [Boolean] false on any error
	 */
	registerObserver: function(event, observer){
		if (event instanceof ma.Event) {
			return event.registerObserver(observer);
		}
		else if ('string' === typeof event){
			return ma.Event._events[event].registerObserver(observer);
		}
		return false;
	}, //ma.Event.registerObserver()

	/**
	 * removes observer from the listeners of this event
	 *
	 * @param  event [String / Event] event (or its name) to listen to
	 * @param  observer [Function] same method used for registerObserver()
	 * @param  remove [Boolean] (optional, default: true) set false only to test if the observer is in the list
	 * @return [Boolean] false on any error (e.g. observer was not in the list)
	 */
	unregisterObserver: function(event, observer, remove){
		if (event instanceof ma.Event) {
			event.unregisterObserver(observer, remove);
		}
		else if ('string' === typeof event){
			return ma.Event._events[event].unregisterObserver(observer, remove);
		}
		return false;
	}, //ma.Event.registerObserver()

	/**
	 * fires an event
	 *
	 * @param  [Object] event to fire
	 * @param  [Object] sender (scope for observers)
	 * @param  [Object] params for observers
	 * @return [Array/Null] list of results of each observer or Null for wrong event
	 */
	notify: function(event, sender, params){
		if (event instanceof ma.Event) {
			return event.notify(sender, params);
		}
		else if ('string' === typeof event && ma.Event._events[event]){
			return ma.Event._events[event].notify(sender, params);
		}
		return null;
	} //ma.Event.notify()
}); //ma.events
