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

//this function is called any time dataMiner needs an object (i.e. AJAX request asked to call a method of this object)
function getObject($name) {
	//function's main reason is to know which file to include to get the object and where is the file stored on server
	require_once('dataMiner/objects/'.$name.'.inc');
	//return new instance of the object - usefull e.g. when $name is just alias for real object
	return new $name();
}

//include dataMiner class file
require_once('maLib/dataMiner.inc');
//create new instance of the dataMiner
//                         as a param pass the name of function that can load objects
$dataMiner = new dataMiner(getObject);
//call dataMiner's method exec() to execute the method requested by AJAX
$dataMiner->exec();

?>