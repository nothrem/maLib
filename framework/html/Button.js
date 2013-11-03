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
 *   ma.Element
 * Optional parts:
 *   NONE
 */

/**
 * @constructor
 * creates new wrapper for Form element
 *
 * @param  [DOMelement / Object] DOM element to wrap or its configuration (see ma.Element.Add)
 *               [Object] configuration
 *                    .id          [String] (optional, default: 'element_' + index) id of the element
 *                    .children    [Array]  (optional) child nodes (see ma.Element.add()) for this element (alias .items can be used); note that setting both innerHTML and children may have unforseen consequences
 *                                            if children is string ' ' (space) then <br> element is created, while '-' creates <hr>
 *                                            each child that has property type but not tagName will be considered as input; supported types see ma.Element.Form.add
 *                    .listeners   [Object] (optional) list of event listeners where key is event name and value is [Function] or [Array of Functions] (alias .on can be used)
 *
 *
 * @return [Object] new element wrapper, existing wrapper of the element or null on error
 *

 * @event HTMLevents      fires any time some HTML event occurs; events are click, doubleClick, mouseMove, keyDown, etc.
 *           <param>   [Event]      see ma.Observable.getEvent()
 * @event submit          fires when user clicks on a button created by type 'submit
 *           <param>   [String]     if of a button that was clicked on
 *
 * @example Possibilities of ma.Element.Form objects
		<code>
			TODO
		</code>
 */
ma.Element.Button = function(domElement){
	var el, text;

	if (ma.is(domElement, ma.Element)) {
		domElement.isReady = false; //force constructor to initialize this element again
	}
	this.inherit(arguments);

	//Initialize JQUI button
	this.create();

	//if JQUI wrapped content in span, we need to get this wrapper
	this.text = ma.get('.ui-button-text', el);
}; //ma.Element.Button

ma.extend('ma.Element.Button', ma.Element, {
/**
 * @scope ma.Element.Button
 */

	call: function() {
		this.$().button.apply(this.$(), arguments);
	},

	create: function() {
		this.call();
	},

	destroy: function() {
		this.call('destroy');
	},

	disable: function() {
		this.call('destroy');
	},

	enable: function() {
		this.call('enable');
	},

	addHandler: function(event, handler) {
		if (this.text) { //if text element exists, register listener to the text element but on scope of the button
			if (this._htmlEvents[event]) {
				if (ma.util.is(handler, Function)) {
					this.text.addListener(event, this._htmlHandlerHelper.setScope(this, [handler]));
				}
				else {
					ma.console.errorAt('Invalid event handler for event ' + event, this._fullName, 'addHandler');
				}
			}
			else {
				ma.console.errorAt('Invalid event "' + event + '" to listen to.', this._fullName, 'addHandler');
			}
		}
		else {
			this.inherit('addHandler', arguments);
		}
	}
}); //extend(ma.Element.Form)
