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

/*
 * How to use API
 *
 * 1. from client you need to init session
 *    A) prepare params:
 *      var object = 'session';
 *      var method = 'init';
 *
 *      var callback = function(response, params) { ... }; //body of callback method see below
 *
 *    B) send AJAX request to your dataMiner via POST with params above
 *      ma.ajax.request({
 *       	object: object,
 *       	method: method,
 *       	callback: callback
 *       });
 *
 *    C) expect JSON-encoded response:
 *       a) value on error:
 *          result: false
 *          error:  <short error description>
 *
 *          if (!response.result) {
 *          	alert(response.error);
 *          }
 *
 *       b) values on success:
 *          result: true
 *
 *          if (response.result) {
 *          	... //see below
 *          }
 *
 * 2. send a request
 *    A) prepare params:
 *      object: <name of object you want to use>
 *      method: <name of method to call>
 *      params: JSON-encoded params (optional)
 *
 *      var object = 'htmlContent';
 *      var method = 'get';
 *      var params = {element: 'my-div'};
 *
 *      var callback = function(response, params) { ... }; //body of callback method see below
 *
 *    B) send AJAX request to dataMiner via POST with params above
  *      ma.ajax.request({
 *       	object: object,
 *       	method: method,
 *       	params: params,
 *       	callback: callback,
 *       	callbackParams: params //so callback will know which element to set
 *       });
*
 *    C) expect JSON-encoded response:
 *       a) value on error:
 *          result:  false
 *          error:   <short error description>
 *
 *          if (!response.json.result) {
 *          	ma.Element.get(params.element).set({innerHTML: 'Error on getting content: ' + response.error});
 *          }
 *
 *       b) values on success:
 *          result:  true
 *          <other>: <values returned by called method>
 *
 *          if (response.json.result) {
 *          	html = response.html;
 *          	ma.Element.get(params.element).set({innerHTML: html});
 *          }
 */
class api
{
	protected $json;
	protected $getObjectCallback;
	protected $result;

	/**
	 * @constructor
	 * creates new api instance
	 *
	 * @param [Function] callback function that is able to return instance of object of given name
	 *           $fileName   [String] (required) name of file to load
	 *           $className  [String] (optional, default: fileName) name of class to instancinate
	 *           return      [Object] instance of the object
	 * @return [void]
	 *
	 * @example How to use api object (e.g. content of your api.php)
		<code>
			function getObject($file, $class) {
				require_once('api/objects/'.$file.'.inc');
				$Class = (is_null($class) ? $file : $class);
				return new $Class();
			}

			require_once('maLib/api/api.inc');

			$api = new api(getObject);

			$api->exec();
		</code>
	 */
	public function __construct($getObjectCallback) {

		//check correct params
		if (!isset($_POST['json'])) {
			$this->quit('Invalid request');
		}

		$json = json_decode(stripslashes($_POST['json']), true);

		if (is_null($json) || !array_key_exists('method', $json)) {
			$this->quit('Invalid JSON');
		}

		$this->json = $json;
		$this->setClassLoader($getObjectCallback);

	} //api::__construct

	public function setClassLoader($getObjectCallback) {
		if (function_exists($getObjectCallback)) {
			$this->getObjectCallback = $getObjectCallback;
		}
	}

	/**
	 * runs given method of given object
	 *
	 * @param  [void] (params are loaded from $_POST)
	 * @return [void] (result is printed to the standart output)
	 */
	public function exec() {
		$method = explode('.', $this->json['method']);
		switch (count($method)) {
			case 1:
				$this->quit('Cannot call function ' . $method[0]);
				break;
			case 2: //only 'class.method' format => ...
				$method[2] = $method[1]; //...move method name into 3rd param
				$method[1] = $method[0]; //... and make both scope and class the same
				break;
			case 3: //already OK
				break;
			default:
				$this->quit('Invalid method ' . $this->json['method']);
				break;
		}

		if (array_key_exists('params', $this->json)) {
			$params = $this->json['params'];
		}
		else {
			$params = array();
		}
		$output = array();

		$object = $this->getInternalObject($method[0], $method[1]);

		if (is_null($object)) {
			$methodName = $this->getObjectCallback;
			$object = $methodName($method[0], $method[1]);
		}

		if (method_exists($object, 'setClassLoader')) { //object with this method needs the callback for getting new classes (e.g. children of this class)
			$object->setClassLoader($this->getObjectCallback);
		}

		$methodName = $method[2];

		if (!method_exists($object, '_needSession') || $object->_needSession($methodName)) {
			if (!session::isValid()) {
				$this->quit('Invalid session');
			}
		}


		if (!method_exists($object, $methodName)) {
			$this->quit('Unknown method ' . $methodName);
		}

		try {
			$result = $object->$methodName($params, &$output);
		}
		catch (Exception $e) {
			$this->quit('Failed to run method ' . $methodName);
		}
		$this->result = (object)$output;

		$this->quit($result);
	}

	/**
	 * returns either JSON OK or error and quits PHP script
	 *
	 * @param  [String/Boolean] true means end with OK result, string defines an error message
	 * @return [void]
	 */
	public function quit($result) {
		if (true === $result) {
			die(json_encode(array('result' => $this->result)));
		}
		elseif (false === $result) {
			die(json_encode(array('error' => 'method failed', 'result' => $this->result)));
		}
		elseif (is_null($result)) {
			die(json_encode(array('error' => 'method did not return either success or failure state', 'result' => $this->result)));
		}
		else {
			die(json_encode(array('error' => $result)));
		}
	}

	/**
	 * tries to load object from internal library
	 *
	 * @param  $fileName   [String] (required) name of file to load
	 * @param  $className  [String] (optional, default: fileName) name of class to instancinate
	 * @return [Object] object or null if not found
	 */
	protected function getInternalObject($fileName, $className = null) {
		$path = dirname(__FILE__) . '/';

		if (!file_exists($path . $fileName . '.inc')) {
			return null;
		}

		if (!(include_once($path . $fileName . '.inc'))) {
			return null;
		}

		$Class = (is_null($className) ? $fileName : $className);

		if (!class_exists($Class)) {
			return null;
		}

		return new $Class();
	}

	public static function expect($input, $expected) {

		foreach ($expected as $key) {
			if (!array_key_exists($key, $input)) {
				return $key;
			}
		}
		return false;
	}

}

class session {

	/**
	 * checks that request is from the correct client
	 *
	 * @param  [void]
	 * @return [Boolean]
	 */
	public final static function isValid() {
		session_start();

		//get last values
		$loginTime = array_key_exists('loginTime', $_SESSION) ? $_SESSION['loginTime'] : time();
		$client    = array_key_exists('ipAddress', $_SESSION) ? $_SESSION['ipAddress'] : '';
		$token     = md5($loginTime . $client);

		return (isset($_POST['xtoken']) && $token === $_POST['xtoken']);
	}

	/**
	 * returns false if a method does not need settion to work
	 *
	 * @param  [String] method name
	 * @return [Boolean] true = method needs session, false = method does not need session (e.g. method that creates the session)
	 */
	public function _needSession($method) {
		switch ($method) {
			case 'init':
				return false;
			default:
				return true;
		}
	} //_needSession

	/**
	 * creates settion for current client
	 *
	 * @param  [Object] input params
	 * @param  [&Object] output params
	 * @return [Boolean] ok/fail
	 */
	public final function init($input, $output) {
		$now = time();
		$client = $_SERVER['REMOTE_ADDR'];
		$token = md5($now . $client);

		setcookie('xtoken', $token, 0, '/');

		session_start();
		$_SESSION['loginTime'] = $now;
		$_SESSION['loginMode'] = 0; //only initiated w/o login
		$_SESSION['ipAddress'] = $client;

		return true;
	} //if (init session)
}

class batchQuitException extends Exception {}

class batch extends api  {
	protected $requests;
	protected $batchParams;
	protected $batchResult;

	public function __construct() {
$this->name = 'BATCH';
		//check correct params
		$json = json_decode(stripslashes($_POST['json']), true);

		if (!array_key_exists('requests', $json)) {
			$this->requests = null;
		}
		else {
			$this->requests = $json['requests'];
		}

		$this->batchParams = $json['params'];
		$this->batchResult = array();
	} //batch::__construct

	public function run($input, $output) {
		if (is_null($this->requests) || 0 === count($this->requests)) {
			$this->quit('Missing requests');
		}

		foreach ($this->requests as $request) {
			$this->json = array(
				'method' => $request['method'],
				'params' => $request['params']
			);
			try {
				$this->exec();
			}
			catch (batchQuitException $bqe) {
				//nothing, this is not real Exception
			}
		}

		$output = array('batchResult' => $this->batchResult);
		return true;
	}

	/**
	 * returns either JSON OK or error and quits PHP script
	 *
	 * @param  [String/Boolean] true means end with OK result, string defines an error message
	 * @return [void]
	 */
	public function quit($result) {
		if (true === $result) {
			$this->batchResult[] = array('result' => $this->result);
			throw new batchQuitException();
		}
		elseif (false === $result) {
			$this->batchResult[] = array('error' => 'method failed', 'result' => $this->result);
			throw new batchQuitException();
		}
		else {
			$this->batchResult[] = array('error' => $result);
			throw new batchQuitException();
		}
	}
}

class test {
	public function copy($input, $output) {
		$output = $input;
		$output['tested'] = true;
		return true;
	}
}

/**
 * jsonSQL database
 *
 * versions:
 *    0.1
 *       - supports SELECT command with ability to filter columns
 *       - supports FROM command with ability to open jsonDB files
 *       - supports WHERE command with simple comparing conditions
 *       - supports LIMIT command to filter from/to rows
 */
class db {
	const MIN_SUPPORTED_VERSION = 0.1;
	const MAX_SUPPORTED_VERSION = 0.1;
	/**
	 * processes jsonSQL query
	 *
	 * @param  [Object] input parameters
	 *             .select  [String/Array] returns data from DB file; string '' (or any non-array value) returns all data; otherwise returns only columns listed in the array (empty array returns only list of empty objects - usable for only counting available items)
	 *             .from    [Strng] name of the DB file (i.e. path on server)
	 *             .where   [Object] conditions for filtering items (array key is columns name, value is expected value); empty array means no condition; if condition value is array, it's considered as subvalue conditions
	 *             .limit   [Number/String/Array]
	 *                         number  = returns given number of items (starting by the first one); same goes for string containing single number
	 *                         string  = should contain single number (see above) or two numbers separated by comma (,) - then its converted to array (see below)
	 *                         array   = array with two number defines start and count of items to return; if only one number is defined, it's considered as limit (and start is 0)
	 * @param  [&Array of Object] requested data
	 * @return [Boolean/String]
	 */
	public function query($input, $output) {
		if (array_key_exists('select', $input)) {
			$expect = api::expect($input, array('from', 'where'));

			if ($expect) {
				return 'Missing required parameter ' . $expect;
			}

			$result = $this->getDb($input['from']);

			if (is_string($result)) {
				return $result;
			}
			else {
				$input['from'] = $result;
			}

			$output = $this->select($input);

			return true;
		}
	}

	/**
	 * checks gived data against given conditions
	 *
	 * @param  [Mixed] data to check
	 * @param  [Mixed/Array] array with conditions or value to match with data
	 * @return [Boolean] true if data matches all of the conditions
	 */
	protected function match($data, $conditions) {
		if (is_array($conditions)) {
			foreach ($conditions as $column => $value) {
				if (array_key_exists($column, $data)) {
					if (!$this->match($data[$column], $value)) { //recursive call
						return false;
					}
				}
				else {
					return false; //column not found = does not match
				}
			}
			return true; //no non-matching condition found - data are OK
		}
		else if ($data === $conditions) {
			return true; //end of recursion
		}
		else {
			return false; //unknown condition or does not match (end of recursion)
		}
	}

	/**
	 * performs SELECT operation
	 *
	 * @param  [Object] input params in jsonSQL format
	 * @return [Array] found columns
	 */
	protected function select($input) {
		$from = $input['from'];
		$columns = $input['select'];
		$conditions = $input['where'];
		if (array_key_exists('limit', $input)) {
			$limit = $input['limit'];
			if (is_numeric($limit)) {
				$limit = array(0, $limit);
			}
			else {
				if (is_string($limit)) {
					$limit = explode(',', $limit);
				}
				if (!is_array($limit)) {
					return 'Invalid limit type';
				}
				if (1 === count($limit)) {
					array_unshift($limit, 0);
				}
			}
		}
		else {
			$limit = false;
		}

		$output = array();
		$totalCount = 0;
		$matchCount = 0;
		foreach ($from['data'] as $item) {
			$outputItem = array();
			$totalCount++;
			if (!$this->match($item, $conditions)) {
				continue; //skip this item
			}
			$matchCount++;
			if (is_array($columns)) {
				foreach ($columns as $column) {
					if (array_key_exists($column, $item)) {
						$outputItem[$column] = $item[$column];
					}
				}
			}
			else {
				$outputItem = $item;
			}
			$output['rows'][] = $outputItem;
		}

		if ($limit AND 0 < $limit[1]) {
			$output['rows'] = array_slice($output['rows'], $limit[0], $limit[1]);
		}

		$output['totalCount'] = $totalCount;
		$output['matchCount'] = $matchCount;
		$output['rowsCount'] = count($output['rows']);
		$output['skipCount'] = $limit[0];

		return $output;
	}

	/**
	 * returns decoded database
	 *
	 * @param  [String] name of database
	 * @return [Array] decoded json
	 */
	protected function getDb($name) {

		if (defined('DB_ROOT')) {
			$path = DB_ROOT . $name;
		}
		else {
			$path = getcwd();
			$path = $path . '/' . $name;
		}

		if (file_exists($path . '.json')) {
			$path .= '.json';
		}

		if (!file_exists($path)) {
			return 'Missing DB file ' . $path;
		}

		$file = file_get_contents($path);
		$json = json_decode($file, true);

		if (!$json OR !array_key_exists('jsonDB', $json)) {
			return 'Invalid DB file ' . $path;
		}
		elseif (db::MIN_SUPPORTED_VERSION > $json['jsonDB']){
			return 'Old DB file version, upgrade your jsonDB to ' . db::MIN_SUPPORTED_VERSION;
		}
		elseif (db::MAX_SUPPORTED_VERSION < $json['jsonDB']){
			return 'Unsupported DB file version, this jsonSQL supports jsonDB up to ' . db::MAX_SUPPORTED_VERSION;
		}

		if (!array_key_exists('data', $json) || !is_array($json['data'])) {
			$json['data'] = array(); //empty DB - allow to write into it
		}

		return $json;
	}
}

?>