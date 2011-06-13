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
 *      var method = 'api.session.init';
 *
 *      var callback = function(response, params) { ... }; //body of callback method see below
 *
 *    B) send AJAX request into your api folder via POST with params above
 *      ma.ajax.request({
 *          data: { method: method }, //why this is in data will be cleared below
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
 *      method: <name of method to call>
 *      params: JSON-encoded params (optional)
 *
 *      var method = 'html.content.get'; //example html = file, content = class, get = method
 *      var params = {element: 'my-div'};
 *
 *      var callback = function(response, params) { ... }; //body of callback method see below
 *
 *    B) send AJAX request to dataMiner via POST with params above
 *      ma.ajax.request({
 *         data: { //anything that is inside 'data' will be send to server
 *             method: method,
 *             params: params
 *         },
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

	protected static $log = array();

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

	/**
	 * use this to define method that will be responsible for loading files containing classes
	 *
	 * @param  [Function] Name (String) of method that can load PHP files; method can be called several times for each class, it should use '*_once' methods for loading
	 *             param  [String] name of scope of the class (usually this is name of file); may be same as the class name if no scope is defined
	 *             param  [String] name of class to load; this method should verify that the class exists before returning it!
	 *             return [Object] new instance of the class; null if the class could not have been loaded
	 * @return [void]
	 */
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
			die(json_encode(array('result' => $this->result, 'log' => api::$log)));
		}
		elseif (false === $result) {
			die(json_encode(array('error' => 'method failed', 'result' => $this->result, 'log' => api::$log)));
		}
		elseif (is_null($result)) {
			die(json_encode(array('error' => 'method did not return either success or failure state', 'result' => $this->result, 'log' => api::$log)));
		}
		else {
			die(json_encode(array('error' => $result, 'log' => api::$log)));
		}
	}

	/**
	 * saves the message and returns it to client as a server log
	 *
	 * @param  [String] message (single row)
	 * @return [void]
	 */
	public static function log($message) {
		array_push(api::$log, $message);
	}

	/**
	 * tries to load object from internal library
	 *
	 * @param  $fileName   [String] (required) name of file to load
	 * @param  $className  [String] (optional, default: fileName) name of class to instancinate
	 * @return [Object] object or null if not found
	 */
	protected function getInternalObject($fileName, $className = null) {
		if ('api' === $fileName && 'session' === $className) {
			return session::getHandler();
		}

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

	/**
	 * tests that given input files contains expected values
	 *
	 * @param  [Array] input params
	 * @param  [Array] expected params
	 * @return [Boolean/String] false if all keys were found; on error returns name of first key that was NOT found
	 */
	public static function expect($input, $expected) {

		foreach ($expected as $key) {
			if (!array_key_exists($key, $input)) {
				return $key;
			}
		}
		return false;
	}

}

/**
 * Handles session and login
 *
 * @example How to allow login
 *   1. create a class that extends this session
 */
class session {

	private $isReady = false;
	private static $instance = null;

	/**
	 * @protected
	 * returns instance of the session handler
	 *
	 * @return [Object] session class instance
	 */
	public static final function getHandler() {
		if (is_null(session::$instance)) {
			session::$instance = new session();
		}
		return session::$instance;
	}

	/**
	 * sets new handler for the session
	 *
	 * @param  [String] name of class to use as handler
	 * @return [void]
	 */
	protected static final function setHandler($Class) {
		if (class_exists($Class)) {
			session::$instance = new $Class();
		}
	}

	private function start() {
		if (!$this->isReady) {
			session_start();
			$this->isReady = true;
		}
	}

	/**
	 * checks that request is from the correct client
	 *
	 * @param  [void]
	 * @return [Boolean]
	 */
	public final static function isValid() {
		$session = session::getHandler();

		$session->start();

		//get last values
		$loginTime = $session->_get('internal', 'loginTime', time());
		$client    = $session->_get('internal', 'ipAddress', '');
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
			case 'login':
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
		if (session::isValid()) {
			if (api::expect($input, array('logout')) || !$input['logout']) {
				//if session is already created and params does not contain "logout=true", then use existing session
				$output['mode'] = session::_get('internal', 'loginMode', 0);
				return true;
			}
		}


		$now = time();
		$client = $_SERVER['REMOTE_ADDR'];
		$token = md5($now . $client);

		setcookie('xtoken', $token, 0, '/');

		session::_set('internal', 'loginTime', $now);
		session::_set('internal', 'loginMode', 0);
		session::_set('internal', 'ipAddress', $client);
		session::_remove('roles');

		$output['mode'] = 0;
		return true;
	}

	/**
	 * allows user to login - this is only simple class that actually does NOT support login, only returns error
	 *
	 * @param  [Array] input
	 *             .username [String]
	 *             .password [String]
	 * @param  [Array] output
	 * @return [Boolean/String]
	 */
	public function login($input, $output) {
		return 'Server does not support login; please see manual for how to support login.';
	}

	/**
	 * @private
	 * sets new value into session store or overwrites old one
	 *
	 * @param  [String] name of scope
	 * @param  [String] name of the value
	 * @param  [Mixed] the value
	 * @return [void]
	 */
	private static final function _set($scope, $key, $value) {
		$session = session::getHandler();

		if (!$session->isReady) {
			api::log('Session not ready, cannot save value ' . $key);
			return;
		}

		if (!array_key_exists($scope, $_SESSION)) {
			$_SESSION[$scope] = array();
		}

		$_SESSION[$scope][$key] = $value;
	}

	/**
	 * sets new value into session store or overwrites old one
	 *
	 * @param  [String] name of the value
	 * @param  [Mixed] the value
	 * @return [void]
	 */
	public static final function set($key, $value) {
		session::_set('values', $key, $value);
	}

	/**
	 * reads value from session store
	 *
	 * @param  [String] name of the scope
	 * @param  [String] name of the value
	 * @param  [Mixed]  (optional, default: null) default value which is returned in case the value does not exist
	 * @return [Mixed]  content of the value
	 */
	private final function _get($scope, $key, $defaultValue = null) {
		$session = session::getHandler();

		if (!$session->isReady) {
			api::log('Session not ready, cannot read value ' . $key);
			return;
		}

		if (!array_key_exists($scope, $_SESSION)) {
			return $defaultValue;
		}

		return array_key_exists($key, $_SESSION[$scope]) ? $_SESSION[$scope][$key] : $defaultValue;
	}

	/**
	 * reads value from session store
	 *
	 * @param  [String] name of the value
	 * @param  [Mixed]  (optional, default: null) default value which is returned in case the value does not exist
	 * @return [Mixed]  content of the value
	 */
	public final function get($key, $defaultValue = null) {
		session::_get('values', $key, $defaultValue);
	}

	/**
	 * removes values from session
	 *
	 * @param  [String] name of scope
	 * @param  [String] (optional, default: all keys) key to remove from scope; if not defined, all keys will be removed
	 * @return [void]
	 */
	protected final function _remove($scope, $key = null) {
		if (is_null($key)) {
			unset($_SESSION[$scope]);
		}
		else {
			unset($_SESSION[$scope][$key]);
		}
	}

	/**
	 * sets session into login state and defined roles
	 *
	 * @param [Array] list of roles:
	 *              to allow/deny a role, use format: array("role1" => true, "role2" => false, ...);
	 *              to simply allow several roles, use formar: array('role1', 'role2', ...);
	 *              if one of roles is 'admin', it will change the value returned by session::isAdmin() method;
	 *              note that roles NOT defined in this call but defined in previous call of this method will NOT be removed!
	 * @return [void]
	 */
	public static final function setLogin($roles) {
		session::getHandler()->start();
		session::_set('internal', 'loginMode', 1);
		if (!is_array($roles)) {
			return;
		}

		foreach ($roles as $role => $allow) {
			if (is_string($allow)) { //roles can defined as list of strings
				$role  = $allow;     //but expected is ['key' => True/False]
				$allow = true;
			}

			if ('admin' === $role) {
				session::_set('internal', 'loginMode', ($allow ? 2 : 1));
			}

			session::set('roles', $role, $allow);
		}
	}

	public static final function isLogged() {
		return 0 < session::_get('internal', 'loginMode', 0);
	}

	public static final function isAdmin() {
		return 1 < session::_get('internal', 'loginMode', 0);
	}

	public static final function hasRole($role) {
		return session::_get('roles', $role, false);
	}
}

/**
 * @private
 * Exception to catch the forced end of batch execution
 */
class batchQuitException extends Exception {}

/*
 * How to use API Batch
 *
 *   TODO?
 */
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

/**
 * Testing API class, can be used to verify that communication with server works correctly
 */
class test {
	/**
	 * returns what has recieved, adds value 'tested'
	 *
	 * @param  [Array] any input params
	 * @param  [Array] input params + value 'tested = true'
	 * @return [Boolean] true for success
	 */
	public function copy($input, $output) {
		$output = $input;
		$output['tested'] = true;
		return true;
	}
}

/**
 * jsonSQL database
 *
 * @example How to send a query
<code>
	//select some rows
	params: {
		select: 'name, address, phone', //select only these columns
		from: 'jsonDb:data/users', //access method ('jsonDb') and name of database (here its file 'data/users.json'); other access methods may require other params
		where: { //select active users who wants to recieve email news
			active: true,
			newsSubscribed: true
		},
		limit: 100 //get only first 100 users; next 100 can be selected by "limit: [ 100, 100 ]" (first is start, second is count)
	}

	//insert new row
	params: {
		insert: 1,
		into: 'jsonDb:data/news',
		values: { date: '2000-01-01', text: 'This is some message' }
	}
	//insert new row - simple way
	params: {
		insert: { date: '2000-01-01', text: 'This is some message' },
		into: 'jsonDb:data/news'
	}
	//insert several rows (the 'simple way' can be used as well)
	params: {
		insert: 3,
		into: 'jsonDb:data/news',
		values: [
			{ date: '2000-01-01', text: 'This is some message 1' },
			{ date: '2000-01-02', text: 'This is some message 2' },
			{ date: '2000-01-03', text: 'This is some message 3' }
		]
	}
</code>
 *
 * versions:
 *    0.2
 *       - supports INSERT command to add rows
 *           - supports INTO command with ability to open DB access (e.g. jsonDb, mySQL, etc.)
 *           - supports VALUES command with simple comparing conditions (VALUES can be set under INSERT command as well)
 *    0.1
 *       - supports SELECT command with ability to filter columns
 *           - supports FROM command with ability to open DB access (e.g. jsonDb, mySQL, etc.)
 *           - supports WHERE command with simple comparing conditions
 *           - supports LIMIT command to filter from/to rows
 */
class db {
	const MIN_SUPPORTED_VERSION = 0.1;
	const MAX_SUPPORTED_VERSION = 0.2;

	public $access = null;

	/**
	 * definition of available commands
	 */
	private $commands = array(
		'select' => array(
			'expect' => array( 'from', 'where' ),
			'dbKey'  => 'from'
		),
		'insert' => array(
			'expect' => array('into'),
			'dbKey' => 'into'
		)
	);

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

		foreach ($this->commands as $command => $cmdDef) {
			if (array_key_exists($command, $input)) {
				$expect = api::expect($input, $cmdDef['expect']);

				if ($expect) {
					return 'Missing required parameter ' . $expect;
				}

				$this->access = $this->init($input[$cmdDef['dbKey']]);

				if (false === $this->access) {
					return 'Cannot init specified DB access method';
				}

				if (!method_exists($this->access, $command)) {
					return 'This DB access does not suppor method ' . $command;
				}

				$result = $this->access->$command($input);

				if (is_string($result)) {
					return $result;
				}

				$output = $result;
				return true;
		} //select
		}
	}

	private function init(&$from) {
		$values = explode(':', $from);

		if (count($values, 2) && $values[0] && class_exists($values[0])) {
			$class = $values[0];
			$from = $values[1];
			return new $class();
		}
		elseif (count($values, 1) && class_exists('jsonDb')) {
			api::log('Access method not specified, accessing DataBase using jsonDb method');
			$from = $values[0];
			return new jsonDb();
		}
		else {
			return false;
		}
	}

} //class db

class jsonDb {

	/**
	 * performs SELECT operation
	 *
	 * @param  [Object] input params in jsonSQL format
	 * @return [Array] found columns
	 */
	public function select($input) {
		$from = $this->getDb($input['from']);
		if (is_string($from)) {
			return $from;
		}


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
	 * checks given data against given conditions
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
} //class db

?>