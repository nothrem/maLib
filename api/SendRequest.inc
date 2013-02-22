<?php

/**
 * @author Nothrem Sinsky <malib@nothrem.cz>
 *
 * This library is distributed as Open-Source.
 * Whole library or any part of it can be downloaded for free.
 * GIT repository: ssh://git@jii.chobits.ch:17222/~/maLib (send your public key to git@chobits.ch to gain free access).
 *
 * Author does not guarantee any support and takes no resposibility for any damage.
 * You use this code at your own risk. You can modify it as long as this header is present and unchaged!
 *
 * This library may contain whole, parts or modifications of third party files,
 * libraries, frameworks or other code, which are published under one of 'free'
 * licences. See head of main file or file LICENCE.* .
 */

require_once dirname(__FILE__) . '/__SendRequest.inc';

class SendRequest extends __SendRequest{

	static private function parseInput(&$input) {
		if (!array_key_exists('url', $input)) {
			return false;
		}
		if (!array_key_exists('data', $input)) {
			$input['data'] = null;
		}
		if (!array_key_exists('headers', $input)) {
			$input['headers'] = null;
		}
		return true;
	}

	/**
	 * for debugging - returns array with query params
	 */
	public function dump($input, $output) {
		$output = var_export($this->values, true);
		return true;
	}

//	public function addValue($name, $value)

	/**
	 * sends request via POST
	 */
	public function sendPost($input, $output) {
		if (!self::parseInput(&$input)) {
			$output = array('error' => 'Missing URL!');
			return false;
		}
		$response = parent::sendPost($input['url'], $input['data'], $input['headers']);

		$output = array();
		$output['Cookies'] = parent::getCookies($response);

		$result = parent::parseResponse($response);
		$output['headers'] = $result['headers'];
		$output['response'] = $result['lines'];
		return true;
	}

	/**
	 * sends request via GET
	 */
	public function sendGet($input, $output) {
		$response = parent::sendGet($input['url'], $input['data'], $input['headers']);

		$output = array();
		$output['Cookies'] = parent::getCookies($response);

		$result = parent::parseResponse($response);
		$output['headers'] = $result['headers'];
		$output['response'] = $result['lines'];
		return true;
	}

	/**
	 * sends request via HEAD
	 */
	public function sendHead($input, $output) {
		$response = parent::sendHead($input['url'], $input['data'], $input['headers']);

		$output = array();
		$output['Cookies'] = parent::getCookies($response);

		$result = parent::parseResponse($response);
		$output['headers'] = $result['headers'];
		return true;
	}

} //class SendRequest
?>