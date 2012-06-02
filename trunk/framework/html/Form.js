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
ma.Element.Form = function(domElement){

	//Create new element from configuration
	if (!ma.util.is(domElement, HTMLElement)) { //we only get element configuration
		domElement.tagName = 'form';
	}

	this.items = [];

	ma.Element.Form.superclass.constructor.apply(this, arguments);

	this.addEvents({
		submit: true
	});

}; //ma.Element

ma.extend('ma.Element.Form', ma.Element, {
/**
 * @scope ma.Element.Form
 */

	_formIdPrefix: '',

	/**
	 * returns form item reference
	 *
	 * @param  [String] id of the form item
	 */
	getItem: function(itemId) {
		var
			item = this.items[itemId];

		if (item) {
			return new ma.Element(item);
		}
		return undefined;
	}, //getItem()

	/**
	 * creates new element from given config and adds it to the end of childs of this element
	 *
	 * @param  [ma.Element / DOMelement / Object / Array] element, its configuration or list of elements or their configurations (see ma.Element.FormItem or ma.Element constructors for details)
	 * @param  [RESERVED] see ma.Element.insert()
	 * @return [Element/Array of Elements] reference to new object (for single object) or array of objects
	 *
	 * @example Properties of elements:
	<code>
	</code>
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
			if (' ' === cfg) {
				cfg = { tagName: 'br' };
			}
			else if ('-' === cfg) {
				cfg = { tagName: 'hr' };
			}
			if (cfg.tagName) { //non-Form Element
				newEl = new ma.Element(cfg);
			}
			else {
				cfg.formIdPrefix = this.id + '_';
				newEl = new ma.Element.FormItem(cfg);
				this.items.push(newEl);
				this.items[cfg.id] = newEl;
			}
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
			newEl.form = this; //backward reference
		}

		//return value
		switch (elements.length) {
			case 0:  return null;
			case 1:  return elements[0];
			default: return elements;
		}
	}, //add()

	getValues: function() {
		var
			is = ma.util.is,
			i, cnt,
			item,
			values = {};

		for (i = 0, cnt = this.items.length; i < cnt; i++) {
			item = this.items[i];
			if (is(item, ma.Element.FormItem)) {
				values[item.getParam('itemId')] = item.getValue();
			}
		}

		return values;
	},

	setValues: function(values) {
		var
			is = ma.util.is,
			value,
			item;

		for (value in values) {
			if (!is(values[value], Function)) {
				item = this.getItem(value);
				if (is(item, ma.Element.FormItem)) {
					item.setValue(values[value]);
				}
			}
		}
	},

	isValid: function() {
		var
			items = this.items,
			item,
			i, cnt;

		for (i = 0, cnt = items.length; i < cnt; i++) {
			if (!items[i].isValid()) {
				return false;
			}
		}

		return true;
	}

}); //extend(ma.Element.Form)

/**
 * @constructor
 * creates new wrapper for FormItem
 *
 * @param  [Object] Element configuration
 *                    .id          [String] (required) id of the item
 *                    .type        [String] (optional, default: text) supported types: 'text', 'checkbox', 'select'
 *                    .caption     [String] (optional) description of the item
 *                    .value       [Mixed] (optional) type of value depends on item type (e.g. String for text, Boolean for checkbox, etc.)
 *                    .values      [Array] (optional; only for type=select) defines list (of strings) for the select's options
 *                    .itemAlign   [Number] (optional, default: 100px) width of the item's caption
 *                    .width       [Number] (optional, default: 20) width of the item (in characters)
 *                    .listeners   [Object] (optional) list of event listeners where key is event name and value is [Function] or [Array of Functions] (alias .on can be used)
 *
 *
 * @return [Object] new element wrapper, existing wrapper of the element or null on error
 *

 * @event HTMLevents      fires any time some HTML event occurs; events are click, doubleClick, mouseMove, keyDown, etc.
 *           <param>   [Event]      see ma.util.getEvent()
 *
 * @example Possibilities of ma.Element.Form objects
		<code>
			TODO
		</code>
 */
ma.Element.FormItem = function(config){
	var
		elConfig,
		id = (config.formIdPrefix || '') + config.id,
		idPrefix = id + '_',
		itemConfig = {};

	switch (config.type) {
		case 'checkbox':
			itemConfig = {
				tagName: 'input',
				type: 'checkbox',
				checked: (config.value ? 'true' : undefined)
			};
			break;
		case 'select':
			itemConfig = {
				tagName: 'select',
				items: (function() {
					var items = [];

					Ext.each(config.values, function(item) {
						items.push({
							tagName: 'option',
							value: item,
							selected: (config.value === item ? 'true' : undefined)
						});
					});
					return items;
				})()
			};
			break;
		case 'submit':
			itemConfig = {
				tagName: 'button',
				innerHTML: config.caption,
				on: {
					click: this._submit
				}
			};
			config.caption = '';
			break;
		default: //'text'
			itemConfig = {
				tagName: 'input',
				type: 'text',
				value: config.value || ''
			};
			break;
	}

	ma.util.merge(itemConfig, {
		id: idPrefix + 'item',
		size: config.width || 50,
		style: {
			position: 'absolute',
			left: config.itemAlign || '100px'
		}
	});


	elConfig = {
		tagName: 'div',
		id: id,
		className: 'formItem',
		style: {
			position: 'relative'
		},
		params: {
			itemId: config.id,
			validate: config.validate
		},
		items: [
			{
				tagName: 'label',
				id: idPrefix + 'label',
				'for': idPrefix + 'item',
				content: config.caption || '',
				style: {
					width: config.itemAlign || '100px'
				}
			},
			itemConfig
		]
	};

	config = elConfig;
	ma.Element.FormItem.superclass.constructor.apply(this, arguments);

	this._item = this.getChild(idPrefix + 'item');
	this._item._formItem = this;
	this.type = this._item.dom.type;

}; //ma.Element

ma.extend('ma.Element.FormItem', ma.Element, {
/**
 * @scope ma.Element.Form
 */

	/**
	 * Checks that the element if of given type
	 *
	 * @param  [String] tagName or type (e.g. 'input', 'select' or 'checkbox')
	 * @return [Boolean]
	 */
	is: function(tagNameOrType) {
		if (this._class.superclass.is.apply(this, arguments)) {
			return true;
		}
		return (tagNameOrType.toLowerCase() === this.type.toLowerCase());
	}, //is()

	getValue: function() {
		return this._item.getValue.apply(this._item, arguments);
	},

	setValue: function() {
		return this._item.setValue.apply(this._item, arguments);
	},

	isValid: function() {
		var
			is = ma.util.is,
			validate = this.getParam('validate'),
			value = this.getValue(),
			i, cnt;

		if (is(validate, String)) {
			validate = [ validate ];
		}

		if (is(validate, Array)) {
			for (i = 0, cnt = validate.length; i < cnt; i++) {
				switch (validate[i]) {
					case 'require':
						if (is(value, 'empty')) {
							return false;
						}
				}
			}
		}

		return true;
	},

	_submit: function() {
		var
			item = this._formItem,
			form = item.form;

		form.notify('submit', item);
	}
});