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
 *   Ext.util.Observable
 * Optional parts:
 *   NONE
 */

/**
 * @constructor
 * creates new DOM element wrapper object
 *
 * @param  [DOMelement / Object] DOM element to wrap or its configuration (see ma.Element.Add)
 *               [Object] configuration
 *                    .id          [String] (optional, default: 'element_' + index) id of the element
 *                    .tagName     [String] (optional, default: 'div') type of the element (e.g. div, p, ul, table, etc.)
 *                    .innerHTML   [String] (optional) content of the element in HTML (alias .content can be used)
 *                    .children    [Array]  (optional) child nodes (see ma.Element.add()) for this element (alias .items can be used); note that setting both innerHTML and children may have unforseen consequences
 *                                            if children is string ' ' (space) then <br> element is created, while '-' creates <hr>
 *                    .childrenTagName [String] (optional, default: 'div') type of the element of the children if not specified otherwise (alias .itemsTagName can be used)
 *                    .listeners   [Object] (optional) list of event listeners where key is event name and value is [Function] or [Array of Functions] (alias .on can be used)
 *
 *
 * @return [Object] new element wrapper, existing wrapper of the element or null on error
 *

 * @event contentLoaded   fires when an Element has loaded its content from server (see ma.Element.getContent())
 *           <param>   [ma.Element]  instance of the Element that got new content
 * @event HTMLevents      fires any time some HTML event occurs; events are click, doubleClick, mouseMove, keyDown, etc.
 *           <param>   [Event]      see ma.util.getEvent()
 *
 * @example Possibilities of ma.Element objects
		<code>
			//each Element hold two references: one for original DOM element (Element.dom) and Ext.Element objects (Element.ext)
			// you can use DOM or EXT references directly, but it is recomended to use ma.Element wrapper methods (if they exist)

			//to create new element, you can use object with custom values
			new ma.Element({
				tagName: 'span', //this is type of the element; default DIV
				id: 'my-div',    //this is ID of the element, it must be unique, can be used e.g. for ma.Element.get(); by default its generated to be unique
				children: [],    //array of children (see ma.Element.add()) - by this, you can create a full tree of elements from single array
			});
		</code>
 */
ma.Element = function(domElement){
	var
		is = ma.util.is,
		config,
		children, //used to create element's children if defined
		listeners, //event listeners
		visibility,
		params,
		parent;

	if (is(domElement, 'empty')) {
		ma.console.errorAt('Undefined element.', this._fullName, 'constructor');
	}
	if (window === domElement) {
		ma.console.errorAt('Cannot wrap "window" object.', this._fullName, 'constructor');
	}
	//if domElement is in fact a ma.Element already, return it (used in some functions for parameter)
	if (is(domElement, ma.Element)) {
		return domElement;
	}
	//if domElement is Ext's Element, use the DOM instead
	if (is(domElement, Ext.Element)) {
		domElement = domElement.dom;
	}
	//if domElement is already wrapped, return the wrapper
	if (is(domElement, HTMLElement) && is(domElement._ma_wrapper, ma.Element)) {
		return domElement._ma_wrapper;
	}

	ma.Element.superclass.constructor.apply(this, arguments);

	//Create new element from configuration
	if (!is(domElement, HTMLElement)) { //we only get element configuration
		config = domElement || {};
		if (is(config, String)) {
			config = {
				tagName: config
			};
		}
		else {
			config = ma.util.clone(config);
		}

		if (config.id) {
			if (document.getElementById(config.id)) {
				ma.console.errorAt('Duplicate Element; id "' + config.id + '" is already used!', this._fullName, 'constructor');
				return null;
			}
		}

		//set visibility
		if (undefined !== config.visible) {
			visibility = false !== config.visible;
			delete config.visible;
		}

		//keep JS params
		if (undefined !== config.params) {
			params = config.params;
			delete config.params;
		}

		//get elements children
		if (config.children || config.items) {
			children = config.children || config.items;
			delete config.children;
			delete config.items;
		}
		if (config.childrenTagName || config.itemsTagName) {
			children.defaultTagName = config.childrenTagName || config.itemsTagName;
			delete config.childrenTagName;
			delete config.itemsTagName;
		}

		//convert content to innerHTML
		if (config.content) {
			config.innerHTML = config.content;
			delete config.content;
		}

		//get events
		if (config.listeners || config.on) {
			listeners = config.listeners || config.on;
			delete config.on;
			delete config.listeners;
		}

		domElement = document.createElement(config.tagName || 'div');

		ma.util.merge(config, {
			id: config.id || 'element_' + (ma.Element._lastId++)
		}); //clone config
		delete config.tagName;
		ma.util.merge(domElement, config);
	}

	this.dom = domElement;                  //reference to wrapped object
	domElement._ma_wrapper = this;          //backward reference for wrapper

	this.ext = new Ext.Element(domElement); //create Ext wrapper object
	this.ext._ma_wrapper = this;            //backward reference for wrapper

	//set other Element's properties
	this.merge({
		id:      domElement.id,
		tagName: domElement.tagName
	});

	this.ext.setVisibilityMode(Ext.Element.DISPLAY); //makes the hide() method to remove element from page instead just make it trasparent
	if (undefined !== visibility) {
		this.show(visibility);
	}

	this._params = params || {};

	this._setEvents(listeners);

	//register new element
	ma.Element._register(this);

	//create children
	if (is(children, Array)) {
		this.add(children);
	}

}; //ma.Element

Ext.extend(ma.Element, ma.Base, {
/**
 * @scope ma.Element
 */

	// static properties
	_className: 'Element',
	_fullName: 'ma.Element',
	_class: ma.Element,

	/**
	 * @private
	 * registers new Element into global list of elements
	 *
	 * @params [void]
	 * @return [void]
	 */
	_register: function() {
		ma.Element._cache[this.id] = this;
	}, //_register()

	/**
	 * @private
	 * sets event handlers for all element's events
	 *
	 * @param  [Function/Array] see ma.Element.constructor()::listeners
	 * @return [void]
	 */
	_setEvents: function(listeners) {
		var
			htmlEvents = {
				'click': { handler: 'onclick', event: 'click' },
				'doubleClick': { handler: 'ondblclick', event: 'dblClick' },
				'mouseDown': { handler: 'onmousedown', event: 'mousedown' },
				'mouseUp': { handler: 'onmouseup', event: 'mouseup' },
				'mouseMove': { handler: 'onmousemove', event: 'mousemove' },
				'mouseOver': { handler: 'onmouseover', event: 'mouseover' },
				'mouseOut': { handler: 'onmouseout', event: 'mouseout' },
				'keyDown': { handler: 'onkeydown', event: 'keydown' },
				'keyUp': { handler: 'onkeyup', event: 'keyup' },
				'keyPress': { handler: 'onkeypress', event: 'keypress' },
				'resize': { handler: 'onresize', event: 'resize' },
				'move': { handler: 'onmove', event: 'move' },
				'focus': { handler: 'onfocus', event: 'focus' },
				'blur': { handler: 'onblur', event: 'blur' },
				'select': { handler: 'onselect', event: 'select' },
				'change': { handler: 'onchange', event: 'change' },
				'submit': { handler: 'onsubmit', event: 'submit' },
				'reset': { handler: 'onreset', event: 'reset' },
				'unload': { handler: 'onunload', event: 'unload' }
			},
			i, cnt, event;

		this.addEvents('contentLoaded', 'set');
		for (i in htmlEvents) {
			this.ext.on(htmlEvents[i].event, this._htmlEventHandler.setScope(this));
			this.addEvents(i);
			ma.Element.htmlEvents[htmlEvents[i].event] = i;
		}

		//register listeners
		if (listeners) {
			for (event in listeners) {
				if (htmlEvents[event]) {
					if (ma.util.is(listeners[event], Function)) {
						this.on(event, this._htmlHandlerHelper.createDelegate(this, [listeners[event]]));
					}
					else if (ma.util.is(listeners[event], Array)) {
						for (i = 0, cnt = listeners[event].length; i < cnt; i++) {
							if (ma.util.is(listeners[event][i], Function)) {
								this.on(event, this._htmlHandlerHelper.createDelegate(this, [listeners[event][i]]));
							}
							else {
								ma.console.errorAt(['Unsupported listener (index %i, type %s) for event "%s" on Element "%s"', i, typeof listeners[event][i], event, this.id], this._className, '_setEvents');
							}
						}
					}
					else {
						ma.console.errorAt(['Unsupported listener (type %s) for event "%s" on Element "%s"', typeof listeners[event], event, this.id], this._className, '_setEvents');
					}
				}
			}
		}
	}, //_setEvents()

	/**
	 * @private
	 * used as wrapper for html event handler - makes sure event is canceled unless method returns True
	 *
	 * @param  [Function] listener to call
	 * @return [Boolean] returns false unless function returns True (e.i. undefined is converted to false)
	 */
	_htmlHandlerHelper: function(k_listener) {
		return (true === k_listener.call(this));
	}, //_htmlHandlerHelper()

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
			result;

		options = ma.util.getEvent(extEvent);

		//get event name and element wrapper
		eventName = ma.Element.htmlEvents[options.browserEvent.type];

		if (!eventName || !options.element) {
			return; //this is not known event or is not called on valid element
		}

		try {
			result = options.element.notify(eventName, options);
		} catch (e) { //stops event if its handler caused error
			extEvent.stopEvent();
			ma.console.warn('Handler for event %s::%s has crashed, event was stopped.', this.id, eventName);
			throw e; //throw error again to actually let it go (here we only care about stopping the event)
		}
		if (!result) {
			extEvent.stopEvent();
		}
	}, //_htmlEventHandler()

	/**
	 * Checks that the element is of given type (e.g. div, input, etc.)
	 *
	 * @param  [String] tagName
	 * @return [Boolean]
	 */
	is: function(tagName) {
		return (tagName.toLowerCase() === this.tagName.toLowerCase());
	}, //is()

	/**
	 * sets object properties to given values
	 *
	 * @param  [Object] {property:value} pairs to set (value can be object with another pairs)
	 * @return [void]
	 */
	set: function(config) {
		ma.util.merge(this.dom, config);
	}, //set()

	/**
	 * sets content of this element
	 *
	 * @param  content [String] (optional, default: empty)
	 * @return [void]
	 */
	setContent: function(content) {
		this.set({
			innerHTML: content || ''
		});
	}, //setContent()

	/**
	 * creates new element from given config and adds it to the end of childs of this element
	 *
	 * @param  [ma.Element / DOMelement / Object / Array] element, its configuration or list of elements or their configurations (see ma.Element constructor for details)
	 * @param  [RESERVED] see ma.Element.insert()
	 * @return [Element/Array of Elements] reference to new object (for single object) or array of objects
	 */
	add: function(config, insertBefore) {
		var
			cfg,
			i, cnt,
			newEl,
			defaultTagName,
			elements = [];

		defaultTagName = config.defaultTagName;

		//for any non-array, create new Array (even empty for undefined etc.)
		if (!ma.util.is(config, Array)){
			config = [config]; //create array from single object
		}

		//add element(s)
		for (i = 0, cnt = config.length; i < cnt; i++) {
			cfg = config[i];
			if (' ' === cfg) {
				cfg = { tagName: 'br' };
			}
			else if ('-' === cfg) {
				cfg = { tagName: 'hr' };
			}
			cfg.tagName = cfg.tagName || defaultTagName;
			newEl = new ma.Element(cfg);
			if (insertBefore) {
				if (ma.Element.isHtmlElement(insertBefore)) {
					insertBefore = new ma.Element(insertBefore);
				}
				if (insertBefore instanceof ma.Element) {
					newEl.ext.insertBefore(insertBefore.ext);
				}
			}
			else {
				this.ext.appendChild(newEl.ext);
			}
			elements.push(newEl);
			newEl.parent = this; //backward reference
		}

		//return value
		switch (elements.length) {
			case 0:  return null;
			case 1:  return elements[0];
			default: return elements;
		}
	}, //add()

	/**
	 * inserts new Element before given Element
	 *
	 * @param  [Object] element configuration (tagName for HTML type, any other for properties)
	 * @param  [Element] (optional, default: first position) reference to Element the new one should be put before
	 * @return [Element/Array of Elements] reference to new object (for single object) or array of objects
	 *
	 * @note This is only alias for add() method, but add() should be used only for adding to the end!
	 */
	insert: function(config, insertBefore) {
		if (!insertBefore) {
			insertBefore = this.ext.first();
			if (insertBefore) {
				insertBefore = new ma.Element(insertBefore.dom);
			}
			else {
				insertBefore = undefined; //probably the parent element is empty - use add() instead of insert()
			}
		}
		return this.add(config, insertBefore);
	}, //insert()

	/**
	 * returns wrapper of parent element
	 */
	getParent: function() {
		if (this._parent) {
			return this._parent;
		}

		var parent = this.dom.parentNode;

		if (parent && parent.tagName) { //element document is parent of HTML element but can't be wrapped - and document has no tagName
			if (parent._ma_wrapper) {
				//parent element is already wrapped
				this._parent = parent._ma_wrapper;
			}
			else {
				//parent node is not wrapped -> wrap it
				this._parent = new ma.Element(parent);
			}
			return this._parent;
		}
		else {
			//this element does not have a parent; its either single element or Root element
			return null;
		}
	}, //getParent()

	/**
	 * returns elements's child by id
	 *
	 * @param  [Object/Integer] id of the child you're looking for; also works as alias for Element.getChildByIndex()
	 * @param  [Object] (optional, default: false) true = tree search (search child of any level/generation); false searches only direct child; ignored when first param is Integer
	 * @return [Element] reference to child; undefined if not found (e.g. no such element, it's not child or any error)
	 *
	 * note: for tree search this method can search for parent-child bond only within tree created by Elements.
	 *       if there is any DOMelement (non-Element) in the tree, the bond will be broken (see Element.isElement)
	 */
	getChild: function(id, useTreeSearch) {
		var
			el,      //reference to child element
			parent,  //reference to child's parent (=> when it's equal to *this*, the element is child of this element)
			x;

		if ('number' === typeof id) { //for index use the other method
			return this.getChildByIndex(id);
		}

		el = ma.Element.get(id);
		if (!el) { //no such element
			return undefined;
		}

		parent = el.getParent();
		if (!parent) { //no parent => no search
			return undefined;
		}

		if (useTreeSearch) {
			while (true) { //infinite loop - it can be really infinite if there is cycle in the parent-child structure!!! (but infinity is prevented below)
				if (!parent) { //this element does not have a parent - no more search
					return undefined;
				}
				if (parent.id === id) { //prevents infinite loop if element is own parent (or element's own id is used to search its child)
					return undefined;
				}
				if (parent.id === this.id) { //parent of found element is this element
					return el;
				}
				parent = parent.getParent; //go to next level
			} //while (infinite loop)
		}

		//simple search -> parent's id must equal to this own id
		return (parent.id === this.id) ? el : undefined;
	}, //getChild()

	/**
	 * returns n-th child of this element
	 *
	 * @param  [Number] index of the child
	 * @return [Element] reference to child; undefined if element does not have such child
	 */
	getChildByIndex: function(index) {
		var
			child = this.ext.first(),
			i;

		if (!child) {
			return;
		}

		for (i = 0; i < index; i++) {
			child = child.ext.next();
			if (!child) {
				return;
			}
		}

		return new ma.Element(child); //create new wrapper
	}, //getChildByIndex()

	/**
	 * returns number of children of this Element
	 *
	 * @param  [void]
	 * @return [Number]
	 */
	getChildCount: function() {
		return (this.dom.childNodes) ? this.dom.childNodes.length : 0;
	},

	/**
	 * moves element from one DOM place to another (i.e. changes parent)
	 *
	 * @param  [Element/String] either parent or its id
	 * @return [void]
	 */
	moveTo: function(parent) {
		//get wrapper of element if it's not ma.Element
		if ('string' === typeof parent) {
			parent = ma.Element.get(parent);
		}
		else if (ma.Element.isHtmlElement(parent)) {
			parent = new ma.Element(parent);
		}
		else if (parent instanceof ma.Element) {
			//nothing, just filter this case out
		}
		else {
			ma.console.error('Unsupported parent node in %s.moveTo()', this._fullName);
			return;
		}

		parent.dom.appendChild(this);

		this._parent = parent; //change parent for case it was already cached
	},

	/**
	 * Removes this element from DOM
	 */
	remove: function() {
		this.removeAllChildren();
		this.ext.remove();
		delete this._parent;
	},

	/**
	 * removes direct child of this element
	 *
	 * @param  [Element/String] id of the child
	 * @return [Boolean/Element] removed element or False if the element does not exist or isn't child of this element
	 */
	removeChild: function(child) {
		var parent;

		if (child instanceof ma.Element) {
			//nothing, just filter this case out
		}
		else if ('string' === typeof child) {
				child = this.getChild(child);
		}
		else if (ma.Element.isHtmlElement(child)) {
			child = new ma.Element(child);
		}
		else {
			ma.console.error('Unsupported child node in %s.removeChild()', this._fullName);
			return;
		}

		if (child) {
			parent = child.getParent();
			if (parent && parent.id === this.id) {
				delete child._parent;
				return this.dom.removeChild(child.dom);
			}
		}
		//child does not exist or isn't child of this one element
		return false;
	},

	/**
	 * removes all element's children
	 *
	 * @param  [void]
	 * @return [void]
	 */
	removeAllChildren: function() {
		var
			child = this.getChildByIndex(0);

		while (child) {
			child.remove();

			child = this.getChildByIndex(0); //go to next child
		} //while (for each child)
	}, //removeAll()

	/**
	 * returns info about element (e.g. width and height)
	 *
	 * @param  [void]
	 * @return [Object]
	 *            .width  [Number]
	 *            .height [Number]
	 *            .left   [Number]
	 *            .top    [Number]
	 */
	getInfo: function() {
		var
			dom = this.dom,
			ext = this.ext,
			win = ma.util.getWindowInfo();

		return {
			width:         ext.getWidth(),
			contentWidth:  ext.getWidth(true),
			height:        ext.getHeight(),
			contentHeight: ext.getHeight(true),

			left:   ext.getLeft(),
			right:  win.width - ext.getRight(),
			top:    ext.getTop(),
			bottom: win.height - ext.getBottom()

		};
	}, //getInfo()

	/**
	 * returns true if element is hidden
	 *
	 * @param  [void]
	 * @return [Boolean] True if element is hidden (display='none')
	 */
	isHidden: function() {
		return !this.ext.isVisible;
	}, //isHidden()

	/**
	 * shows the element; sets last display mode before hiding
	 *
	 * @param  [Boolean] (optional, default: true) true to show the element, false to hide instead
	 * @return [void]
	 */
	show: function(show) {
		if (false !== show) {
			this.ext.show();
		}
		else {
			this.hide();
		}
	}, //show()

	/**
	 * hides the element from DOM; to show it again with same display mode use show() method
	 *
	 * @param  [Boolean] (optional, default: true) true to hide the element, false to show instead
	 * @return [void]
	 */
	hide: function(hide) {
		if (false !== hide) {
			this.ext.hide();
		}
		else {
			this.show();
		}
	},

	/**
	 * loads HTML content from server
	 *
	 * @param  [String] URL of a HTML file
	 */
	getContent: function(url) {
		var
			callback = this._getContentCallback.createDelegate(this), //used to call callback in scope of this element instead of window
			options;

		this.mask();

		if (!ma.util.is(url, String)) {
			ma.console.errorAt('Invalid URL for content', this._className, 'getContent');
		}

		this.ext.load(url, {}, callback); //this.ext.load();
	}, //getContent()

	/**
	 * @private
	 * handles loading of new content into the element
	 *
	 * @param  [Object]  params
	 * @param  [Boolean] success
	 * @param  [Object]  response
	 * @return [void]
	 */
	_getContentCallback: function(params, success, response) {
		if (success) {
			this.mask(false);
			this.notify(ma.Element.events.contentLoaded, this);
		}
	}, //_getContentCallback()

	_getMask: function() {
		var
			id = this.id + '_',
			size,
			mask,
			box,
			row,
			text;

		if (this._mask) {
			return this._mask;
		}
		else {
			//create new mask for this element
			mask = new ma.Element({
				id: id + 'mask',
				style: {
					display: 'none',
					backgroundColor: 'gray',
					position: 'absolute',
					cursor: 'wait',
					zIndex: 99999
				},
				children: [
					{
						tagName: 'span',
						id: id + 'maskText',
						style: {
							background: 'url(' + ma._filePath + '/img/loading.dots.gif) left center no-repeat',
							fontSize: '50px',
							paddingLeft: '2em'
						}
					}
				] //mask children
			});

			this._mask = mask;

			document.body.appendChild(mask.dom);
			mask._maskText = ma.Element.get(id + 'maskText');
			/**
			 * sets text inside the mask
			 *
			 * @param  [String] text
			 * @return [void]
			 */
			mask.setText = function(text){
				this._maskText.dom.innerHTML = text;
			}; //mask.setText()
			mask.setText('Loading...');

			ma.browser.on('resize', this._resizeMask.setScope(this));
			return mask;

		} //create mask
	}, //_getMask()

	_resizeMask: function() {
		var
			size = this.getInfo(),
			win = ma.util.getWindowInfo(),
			mask = this._mask,
			text = mask._maskText,
			tSize = text.getInfo(),
			pos;

		if ('BODY' === this.tagName) { //body may be smaller that the window, but masked should be whole window
			size = {
				left: 0,
				right: 0,
				bottom: 0,
				top: 0,
				width: win.width,
				height: win.height
			};
		}

		pos = mask.ext.getPositioning();
		ma.util.merge(pos, {
				position: 'fixed',
				left:   size.left,
				right:  size.right,
				top:    size.top,
				bottom: size.bottom,
				'z-index': 9999
			}
		); //merge
		mask.ext.setPositioning(pos);

		pos = text.ext.getPositioning();
		ma.util.merge(pos, {
				position: 'relative',
				left:   Math.half(size.width  - tSize.width),
				top:    Math.half(size.height - tSize.height)
			}
		); //merge
		text.ext.setPositioning(pos);
	}, //_resizeMask()

	/**
	 * Masks this element
	 *
	 * @param  [Boolean/String] (optional, default: true) true/false to show/hide the mask; if String, will be considered as second param with first param True
	 * @param  [String] text to show in the mask
	 * @return [void]
	 */
	mask: function(showMask, text) {
		var
			is = ma.util.is,
			mask = this._getMask();

		if (false === showMask) {
			mask.ext.setOpacity(0, true);
			mask.hide.defer(400, mask); //set opacity animates for 350ms
		}
		else {
			if (is(showMask, String)) {
				text = showMask;
			}
			if (is(text, String) && !is(text, 'empty')) {
				mask.setText(text);
			}
			else {
				mask.setText('');
			}
			mask.ext.setOpacity(0);
			mask.show();
			this._resizeMask();
			mask.ext.setOpacity(0.9, true);
		}
	}, //mask()

	/**
	 * makes the element appear from transparent into solid state (in 350ms)
	 *
	 * @param  [void]
	 * @return [Element] this element
	 */
	animateIn: function() {
		this.ext.setOpacity(0);
		this.show();
		this.ext.setOpacity(1, true);
		return this;
	}, //animateIn()

	/**
	 * makes the element disappers from the page (by making it transparent in 350ms)
	 *
	 * @param  [Boolean] if true, element will be deleted after it fades out
	 * @return [Element] this element
	 */
	animateOut: function(deleteSelf) {
		this.ext.setOpacity(0, (true === deleteSelf ? { callback: this.remove, scope: this } : true));
		return this;
	}, //animateOut()

	/**
	 * returns value of the element
	 *
	 * @param  [void]
	 * @return [Mixed] value of 'value' property of the HTML element
	 */
	getValue: function() {
		if (undefined !== this.dom.value) {
			return this.dom.value;
		}
		return this.dom.innerHTML;
	}, //getValue()

	/**
	 * sets new value for the element
	 *
	 * @param  [String]
	 * @return [void]
	 */
	setValue: function(value) {
		if (undefined !== this.dom.value) {
			this.dom.value = value;
		}
		this.dom.innerHTML = value;

	}, //setValue()

	/**
	 * sets empty value for the element (presuming it has a 'value' property)
	 *
	 * @param  [void]
	 * @return [void]
	 */
	reset: function() {
		this.setValue('');
	}, //reset()

	/**
	 * returns value of a param
	 *
	 * @param  [String] name of the param
	 * @return [Mixed]  value of the param
	 */
	getParam: function(name) {
		return this._params[name];
	},

	/**
	 * sets new value to a param
	 *
	 * @param  [String] name of the param
	 * @param  [Mixed]  value to set
	 * @return [void]
	 */
	setParam: function(name, value) {
		this._params[name] = value;
	},

	/**
	 * adds new CSS class to the element
	 *
	 * @param  [String/Array] CSS Class or list of them
	 * @return [void]
	 */
	addClass: function(cssClass) {
		this.ext.addClass(cssClass);
	},

	/**
	 * removes CSS class frm the element
	 *
	 * @param  [String/Array] CSS Class or list of them
	 * @return [void]
	 */
	removeClass: function(cssClass) {
		this.ext.removeClass(cssClass);
	},

	/**
	 * checks if the element has given CSS class
	 *
	 * @param  [String] CSS Class or list of them
	 * @return [Boolean]
	 */
	hasClass: function(cssClass) {
		return this.ext.hasClass(cssClass);
	}

}); //extend(ma.Element)

/**
 * add methods into namespace ma.Element
 */
Ext.apply(ma.Element, {
	/**
	 * @scope ma.Element
	 */

	/**
	 * @private
	 * cache for all created elements (used by ma.Element.get())
	 */
	_cache: {},

	_lastId: 0, //used to generate element ids (e.g. 'element_1')

	//stores mapping function of html event names to ma.Element events
	htmlEvents: {},

	_register: function(element) {
		ma.Element._cache[element.id] = element;
	},

	/**
	 * return element with given ID
	 *
	 * @param  [String] element id
	 * @return [Element]
	 */
	get: function(elementId) {
		var el = ma.Element._cache[elementId];

		if (el) {
			return el;
		}
		else {
			el = document.getElementById(elementId);
			if (el) {
				return new ma.Element(el);
			}
			else {
				return null;
			}
		}
	},

	/**
	 * tests that given object is HTML element (DOM object)
	 *
	 * @param  [Object] element
	 * @return [Boolean]
	 */
	isHtmlElement: function(element) {
		if (!element) {
			return false;
		}
		if ('string' === typeof HTMLElement) { //IE or simililar clients that does not support HTMLElement as class, maLib's created string replacement
			try {
				return (undefined !== element.nodeType);
			}
			catch (err) {
				return false;
			}
		}
		else { //other clients that supports HTMLElement
			return (element instanceof HTMLElement);
		}
	},

	/**
	 * calls given method on all the elements
	 *
	 * @param  methodName [String] name of ma.Element's method
	 * @param  elements   [Element/Array] list of elements (any other objects are ignored!)
	 * @param  params     [Array] param for the method
	 * @return [Array] list of return values (e.g. content of all elements for method 'getValue')
	 */
	callOnElements: function(methodName, elements, params) {
		var
			is = ma.util.is,
			result,
			resultList = [],
			element,
			i, cnt;

		if (!is(elements, Array)) {
			elements = [ elements ];
		}

		for (i = 0, cnt = elements.length; i < cnt; i++) {
			element = elements[i];
			if (!is(element, ma.Element)) {
				continue;
			}
			if (!is(element[methodName], Function)) {
				continue;
			}

			result = element[methodName].apply(element, params);
			resultList[i] = result;
			resultList[element.id] = result;
		}

		return resultList;
	}, //callOnElements()

	/**
	 * calls given method on all children of the element
	 *
	 * @param  methodName [String] name of ma.Element's method
	 * @param  element    [Element] an element
	 * @param  params     [Array] param for the method
	 * @return [Array] list of return values (e.g. content of all children for method 'getValue')
	 */
	callOnChildren: function(methodName, element, params) {
		var
			elements = [],
			extChild = element.ext.first();

		while (extChild) {
			elements.push(new ma.Element(extChild));
			extChild = extChild.next();
		}

		return this.callOnElements(methodName, elements, params);
	} //callOnChildren()

});
