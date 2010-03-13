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
		if (!function_exists($getObjectCallback)) {
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

?>