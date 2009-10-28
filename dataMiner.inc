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
 * How to use dataMiner
 *
 * 1. First you need to write your dataMiner.php (or any other name you like)
 *    -> you can find example dataMiner in 'Examples' folder of this framework
 *
 * 2. from client you need to init session
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
class dataMiner
{
	protected $object;
	protected $method;
	protected $getObjectCallback;

	/**
	 * @constructor
	 * creates new dataMiner instance
	 *
	 * @param [Function] callback function that is able to return instance of object of given name
	 *           .objectName  [String] name of object expected to get
	 *           return       [Object] instance of the object
	 * @return [void]
	 *
	 * @example How to use dataMiner object (e.g. content of your dataMiner.php)
		<code>
			function getObject($name) {
				require_once('dataMiner/objects/'.$name.'.inc');

				return new $name();
			}

			require_once('maLib/dataMiner.inc');

			$dataMiner = new dataMiner(getObject);

			$dataMiner->exec();
		</code>
	 */
	public function __construct($getObjectCallback) {

		//check correct params
		if (!isset($_POST['object']) || !isset($_POST['method'])) {
			$this->quit();
		}

		$object = $_POST['object'];
		$method = $_POST['method'];

		session_start();

		//init session if asked to
		if ('Session' == $object AND 'init' == $method) {
			$now    = time();
			$client = $_SERVER['REMOTE_ADDR'];
			$token = md5($now . $client);

			setcookie('token', $token);

			$_SESSION['loginTime'] = $now;
			$_SESSION['loginMode'] = 0; //only initiated w/o login

			$this->quit(true);
		} //if (init session)

		//check correct session and token
		$loginTime = $_SESSION['loginTime'];
		$client    = $_SERVER['REMOTE_ADDR'];
		$token     = md5($loginTime . $client);

		if (!isset($_POST['token']) OR $token <> $_POST['token']) {
			$this->quit();
		} //if (invali token)

		$this->object = $object;
		$this->method = $method;

		$this->getObjectCallback = $getObjectCallback;

	} //dataMiner::__construct


	/**
	 * runs given method of given object
	 *
	 * @param  [void] (params are loaded from $_POST)
	 * @return [void] (result is printed to the standart output)
	 */
	public function exec() {
		$objectName = $this->object;
		$methodName = $this->method;

		$params = $_POST['params'];
		$params = json_decode($params, true);
		$output = array();

		$object = $this->getInternalObject($objectName);
		if (is_null($object)) {
			$object = $this->getObjectCallback($objectName);
		}

		$result = $object->$methodName($params, &$output);

		$output['result'] = $result;

		echo json_encode($output);
	}

	/**
	 * returns either JSON OK or error and quits PHP script
	 *
	 * @param  [Boolean] true means end with OK result, any other produces error
	 * @return [void]
	 */
	public function quit($ok) {
		if (true == $ok) {
			echo '{"result":true}';
		}
		else {
			echo '{"result":false,"error":"invalid request"}';
		}

		exit();
	}

	/**
	 * tries to load object from internal library
	 *
	 * @param  $objectName [String] name of the object
	 * @return [Object] object or null if not found
	 */
	protected function getInternalObject($objectName) {
		$path = dirname(__FILE__);
		$path .= '/dataMiner/';

		if (!(include_once($path . $objectName . '.inc'))) {
			return null;
		}

		return new $objectName();
	}

}

?>