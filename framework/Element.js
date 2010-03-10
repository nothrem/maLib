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
 * @return [Object] new element wrapper, existing wrapper of the element or null on error
 *
 * @event onContentLoaded   fires when an Element has loaded its content from server (see ma.Element.getContent())
 *           <param>   [ma.Element]  instance of the Element that got new content
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
		config, newConfig,
		children, //used to create element's children if defined
		parent;

	if (is(domElement, undefined)) {
		ma.console.errorAt('Undefined element.', this._fullName, 'constructor');
	}
	//if domElement is in fact a ma.Element already, return it (used in some functions for parameter)
	if (is(domElement, ma.Element)) {
		return domElement;
	}
	//if domElement is already wrapped, return the wrapper
	if (is(domElement, HTMLElement) && is(domElement._ma_wrapper, ma.Element)) {
		return domElement._ma_wrapper;
	}

	ma.Element.superclass.constructor.apply(this, arguments);

	this.addEvents(
		//HTML events
		'onClick', 'onDblClick',
		'onMouseDown', 'onMouseUp', 'onMouseMove', 'onMouseOver', 'onMouseOut',
		'onKeyDown', 'onKeyUp', 'onKeyPress',
		'onResize', 'onMove',
		'onFocus', 'onBlur', 'onSelect',
		'onChange',

		//own events
		'onContentLoaded'
	);

	//Create new element from configuration
	if (!is(domElement, HTMLElement)) { //we only get element configuration
		config = domElement || {};
		if (is(config, String)) {
			config = {
				tagName: config
			};
		}

		if (config.id) {
			if (document.getElementById(config.id)) {
				ma.console.errorAt('Duplicate Element; id "' + config.id + '" is already used!', this._fullName, 'constructor');
				return null;
			}
		}

		//get elements children
		if (config.children) {
			children = config.children;
			delete config.children;
		}

		domElement = document.createElement(config.tagName || 'div');

		//clone the config
		newConfig = ma.util.clone(config, {
			id: config.id || 'element_' + (ma.Element._lastId++)
		}); //clone config
		delete newConfig.tagName;
		ma.util.merge(domElement, newConfig);

	}

	this.dom = domElement;                  //reference to wrapped object
	domElement._ma_wrapper = this;          //backward reference for wrapper

	this.ext = new Ext.Element(domElement); //create Ext wrapper object
	this.ext._ma_wrapper = this;            //backward reference for wrapper

	//register new element
	ma.Element._register(this);

	//set other Element's properties
	this.merge({
		id:      domElement.id,
		tagName: domElement.tagName
	});
	this.ext.setVisibilityMode(Ext.Element.DISPLAY); //makes the hide() method to remove element from page instead just make it trasparent

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
	 * sets object properties to given values
	 *
	 * @param  [Object] {property:value} pairs to set (value can be object with another pairs)
	 * @return [void]
	 */
	set: function(config) {
		ma.util.merge(this.dom, config);
	}, //set()

	/**
	 * creates new element from given config and adds it to the end of childs of this element
	 *
	 * @param  [ma.Element / DOMelement / Object / Array] element, its configuration or list of elements or they configurations
	 * @param  [RESERVED] see ma.Element.insert()
	 * @return [Element/Array of Elements] reference to new object (for single object) or array of objects
	 */
	add: function(config, insertBefore) {
		var
			cfg,
			i, cnt,
			newEl,
			elements = [];

		//for any non-array, create new Array (even empty for undefined etc.)
		if (!ma.util.is(config, Array)){
			config = [config]; //create array from single object
		}

		//add element(s)
		for (i = 0, cnt = config.length; i < cnt; i++) {
			cfg = config[i];
			newEl = new ma.Element(cfg);
			if (insertBefore) {
				if (insertBefore instanceof ma.Element) {
					this.dom.insertBefore(newEl, insertBefore.dom);
				}
				else if (ma.Element.isHtmlElement(insertBefore)) {
					this.dom.insertBefore(newEl, insertBefore);
				}
				else {
					ma.console.error('Unknown type of element in %s.insert()', this._fullName);
				}
			}
			else {
				this.dom.appendChild(newEl.dom);
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
	 * @param  [Element] reference to Element the new one should be put before
	 * @return [Element/Array of Elements] reference to new object (for single object) or array of objects
	 *
	 * @note This is only alias for add() method, but add() should be used only for adding to the end!
	 */
	insert: function(config, insertBefore) {
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

		if (parent) {
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
		var child;

		if (!this.dom.childNodes) {
			return undefined; //does not have any children
		}

		child = this.dom.childNodes[index];

		if (!ma.util.is(child, HTMLElement)) {
			return undefined; //this child does not exist (or is not valid HTMLElement)
		}

		if (child._ma_wrapper) {
			return child._ma_wrapper; //this element is already wrapped
		}
		else {
			return new ma.Element(child); //create new wrapper
		}
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
			el = this.dom,
			child = el.firstChild,
			wrapper;

		while (child) {
			wrapper = child._ma_wrapper;
			if (wrapper) {
				//this child has been wrapped
				delete wrapper._parent; //remove reference to parent -> helps GC to remove the object from memory
			}
			el.removeChild(child);

			child = el.firstChild; //go to next child
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
			ext = this.ext;

		return {
			width:         ext.getWidth(),
			contentWidth:  ext.getWidth(true),
			height:        ext.getHeight(),
			contentHeight: ext.getHeight(true),

			left:   ext.getLeft(),
			right:  ext.getRight(),
			top:    ext.getTop(),
			bottom: ext.getBottom()
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
	 * @param  [String / Object} either URL of the HTML file or options for dataMiner
	 *             .object  [String]
	 *             .method  [String]
	 *             .params  [Mixed]
	 *             (note that other values available for ma.ajax.request() are ignored here; you can use onContentLoaded event for callback)
	 */
	getContent: function(url) {
		var
			callback = this._getContentCallback.createDelegate(this), //used to call callback in scope of this element instead of window
			options;

		this.mask();

		if (ma.util.is(url, String)) {
			options = url;
		}
		else {
			if (undefined === Ext.Ajax.url) {
				ma.console.error('Error in %s.getContent(): First you must set dataMiner URL. Use %s.setDefaultParams().', this._fullName, ma.ajax._fullName);
			}
			options = {
				url: Ext.Ajax.url,
				params: {
					object: url.object,
					method: url.method,
					token : ma.Cookie.get('token')
				}
			};
			if (url.params) { //add params only if they are defined
				ma.util.merge(options, {param: {params: this.jsonEncode(url.params) } } );
			}
		}

		this.ext.load(options, {}, callback); //this.ext.load();
	},

	/**
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
			this.notify(ma.Element.events.onContentLoaded, this);
		}
	},

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
			size = this.getInfo();
			mask = new ma.Element({
				id: id + 'mask',
				style: {
					display: 'none',
					backgroundColor: 'gray',
					position: 'absolute',
					left: size.left + 'px',
					top: size.top + 'px',
					width: size.width + 'px',
					height: size.height + 'px',
					cursor: 'wait',
					zIndex: 99999
				},
				children: [
					{
						tagName: 'table',
						id: id + 'maskFrame',
						style: {
							position: 'absolute'
						},
						children: [
							{
								tagName: 'tbody',
								children: [
									{
										tagName: 'tr',
										children: [
											{
												tagName: 'td',
												children: [
													{
														tagName: 'img',
														alt: '',
														src: 'img/loading.dots.gif'
													}
												] //maskFrame tbody tr td.first children
											},
											{
												tagName: 'td',
												children: [
													{
														id: id + 'maskText',
														innerHTML: 'Loading...',
														style: {
															fontSize: '50px',
															paddingLeft: '1em'
														}
													}
												] //maskFrame tbody tr td.second children
											}
										] //maskFrame tbody tr children
									}
								] //maskFrame .tbody children
							}
						] //maskFrame children
					} //maskFrame
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

			return mask;

		} //create mask
	}, //_getMask()

	mask: function(showMask, text) {
		var
			is = ma.util.is,
			mask = this._getMask();

		if (false === showMask) {
			mask.ext.setOpacity(0, true);
			mask.hide.defer(100, mask);
		}
		else {
			if (is(text, String) && !is(text, 'empty')) {
				mask.setText(text);
			}
			mask.ext.setOpacity(0);
			mask.show();
			mask.ext.setOpacity(0.9, true);
		}
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

	isHtmlElement: function(element) {
		if (!element) {
			return false;
		}
		if (ma.Element._unsupportedHtmlElement) { //IE or simililat clients that does not support HTMLElement class
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
	}
});

//IE does not support HTMLElement class
//this creates fictive HTMLElement class to allow to use it in ma.util.is() method instead of native one
if (!window.HTMLElement) {
	window.HTMLElement = new (function() {})();
	ma.Element._unsupportedHtmlElement = true;
}
