/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded
 * from svn://svn.chobits.ch/source/maLib and used for free.
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
 *   NONE
 * Optional parts:
 *   NONE
 */

/**
 * Code in this file extends JavaScript itself
 *
 * There is one important rule: NEVER EVER EXTEND THE BASIC 'OBJECT'
 * (e.g. object.prototype.something = '...' if strictly forbidden!!!)
 */

/**
 * Method for getting string's length in bytes of UTF-8
 *
 * @param  [void]
 * @return [Number] e.g. 'abc' takes 3 bytes, 'ábč' takes 5 bytes
 */
String.prototype.lengthInBytes = function(){
	var
		i,
		charCode,
		length = this.length,
		lengthInBytes = 0;

	for (i = 0; i < length; i++) {
		charCode = this.charCodeAt(i);
		if (0x80 > charCode) { //this character is in ASCII
			lengthInBytes += 1; //takes one byte
			continue;
		}
		if (0x800 > charCode) { //this character takes two bytes in UTF-8
			lengthInBytes += 2;
			continue;
		}
		//other characters takes 3 bytes in UTF-8
		lengthInBytes += 3;
		continue;
	}

	return lengthInBytes;
}; //String.prototype.lengthInBytes()
