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
 *                    .cells    [Array of Array]  (optional) rows and columns in the table
 *                                  String value ' ' (space; in ma.Element.add is replaced to BR) is ignored here and can be added to end of each row used to
 *
 *
 * @return [Object] new element wrapper, existing wrapper of the element or null on error
 *

 * @event HTMLevents      fires any time some HTML event occurs; events are click, doubleClick, mouseMove, keyDown, etc.
 *           <param>   [Event]      see ma.util.getEvent()
 *
 * @example Possibilities of ma.Element.Table objects
		<code>
			TODO
		</code>
 */
ma.Element.Table = function(domElement){

	ma.Element.Table.superclass.constructor.apply(this, arguments);

	this._formIdPrefix = this.id + '_';

}; //ma.Element

ma.extend('ma.Element.Table', ma.Element, {
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
			id = this._formIdPrefix + itemId,
			item = this.getChild(id, true);

		return new ma.Element(item);
	}, //getItem()

	/**
	 * creates new element from given config and adds it to the end of childs of this element
	 *
	 * @param  [ma.Element / DOMelement / Object / Array] element, its configuration or list of elements or their configurations (see ma.Element constructor for details)
	 * @param  [RESERVED] see ma.Element.insert()
	 * @return [Element/Array of Elements] reference to new object (for single object) or array of objects
	 *
	 * @example Properties of elements:
	<code>
				.type    [String] if defined, tagName will be set to 'input' and it will create editable element
					text = text field that can edit any single-line text
					number = text field that can edit only numbers
					checkbox = edit element for Boolean type (True/False)
					button = clickable button with handler
				.caption [String] description of the field
				.value   [String/Number/Boolean] value to fill into the field; type depends on field type (e.g. you cannot set String into Checkbox)
				.id      [String] name of the field; methods setValues/getValues will use these names; note that actual HTML id may differ from this one, use getItem to get reference to actual ma.Element!
				other values are same as the one supported by ma.Element.add

			note: Form elements will be wrapped in Table to have common formating; make sure you are familiar with the form's HTML layout before creating any special formating elements or styles
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
			newEl = new ma.Element(cfg);
			if (insertBefore) {
				if (ma.Element.isHtmlElement(insertBefore)) {
					insertBefore = new ma.Element(insertBefore);
				}
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
	} //add()

}); //extend(ma.Element.Form)

ma.Element.FormItem = function(domElement){

	if (domElement.formIdPrefix) {
		domElement.id = domElement.formIdPrefix + domElement.id;
		delete domElement.formIdPrefix;
	}

	ma.Element.FormItem.superclass.constructor.apply(this, arguments);

}; //ma.Element

ma.extend('ma.Element.FormItem', ma.Element, {
/**
 * @scope ma.Element.Form
 */

	setValue: function() {
		ma.console.errorAt('TODO', 'ma.Element.FormItem', 'setValue');
	}
}