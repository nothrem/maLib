<?php
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

include_once('api.inc');

/**
 * tries to load file with class definition
 *
 * @param  $fileName   [String] (required) name of file to load
 * @param  $className  [String] (optional, default: fileName) name of class to instancinate
 * @return [Object] object or null if not found
 */
function getObject($fileName, $className = null) {
	$path = dirname(__FILE__);

	if (!(include_once($path . $fileName . '.inc'))) {
		die(json_encode(array('error' => 'Unknown scope ' . $fileName)));
	}

	$Class = (is_null($className) ? $fileName : $className);

	if (!class_exists($Class)) {
		die(json_encode(array('error' => 'Unknown class ' . $Class)));
	}

	return new $Class();
}

$api = new api('getObject');

$api->exec();

?>