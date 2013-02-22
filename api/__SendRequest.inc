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

class __SendRequest {

	private $values = array();

	/**
	 * for debugging - returns array with query params
	 *
	 * @param  $print [boolean] (optional, default: false) print to output when true
	 * @return [array] query data
	 */
	public function dump($print = false) {
		return var_export($this->values, !$print);
	}

	/**
	 * adds new value into query data
	 *
	 * @param  $name [string] name of value
	 * @param  $value [string/array] value of parametr (array will be split into more values with indexes)
	 * @return [boolean] success/failure (failure = incorrect data format)
	 */
	public function addValue($name, $value) {
		$name = (string)$name;
		if (!empty($name)) {

			if (is_array($value)) {
				$success = true;
				foreach ($value as $key=>$subvalue) {
					$index = $name . '[' . $key . ']';
					$success = $success && $this->addValue($index, $subvalue);
				}
				return $success;
			}
			elseif ((!isset($value)) || ('' === $value)) {
				$this->values[$name] = NULL;
					//for NULL and empty string is stored NULL (special case - see getRequest())
				return true;
			}
			else {
				$this->values[$name] = (string)$value;
				return true;
			}
		}
	}

	/**
	 * @protected
	 * creates string from query data (e.g. a=1&b=2)
	 *
	 * &param  [void]
	 * @return [string] formated query data
	 */
	protected function getRequest() {
		$request = '';
		foreach ($this->values as $key => $value) {
			$request .= urlencode($key) . (isset($value)?('=' . urlencode($value)):'') . '&';
			//isset is check for case when value is NULL and query param is passes only as name w/o value
		}

		$request = substr($request, 0, -1); //trim last character - the ampersand
		return $request;
	}

	/**
	 * parses URL/URI into parts and returns them in array
	 *
	 * @param  $url [string] URL or URI in any format (host is not optional!)
	 * @return [array] parsed parts (use string keys to get what you need)
	 *
	 * @see    http://www.ietf.org/rfc/rfc3986.txt
	 */
	static public function parseUrl($url) {
		//RegExp for URI     (please leave this part here even commented because of the examples)
		$uriMask = '/^'          //for better understanding i'll split this RegExp  (this line marks start of RegExp)
			.'(([a-z0-9\+\-\.]+)'  //this is the scheme part (e.g. "http://" but without the "://" part)
			.'\:[\/]{2,3})?'       //this is the end of scheme part and start of authority part ("://") - not returned
			.'((([^\:\@]+)'        //this is the login name (e.g. "ftp://user@server.com") - continues on next line...
			.'\:?([^\@]+)?\@)?'    //this is the password for login (e.g. "user:pass@server.com") - this part is deprecated!
			.'([a-z0-9\.\-]+'      //this is the host part for IPv4 (e.g. "www.server.com" or "127.0.0.1")
			.'|\[[a-z0-9\:]+\])'   //this is the host part for IPv6 (e.g. "[::1]" or "[1000:abcd::1234]")
			.'\:?([0-9]+)?)'       //this is the port (e.g. ":80")
			.'([^?\#]*)?'          //this is the path part (e.g. "/folder/file.php")
			.'\??([^\#]+)?'        //these are the parameters (e.g. "?p=1&q=2")
			.'\#?(.*)?'            //last part with bookmark/page part (e.g. "book.html#chapter5")
			.'($)'                 //this marks end of string and ensures there is always the same count of parts
			.'/i'                  //this marks the end of RegEx and case-insensitive matching
		;

		$keys = array(
			'url',  //original URI
			'scheme','protocol',  //scheme ("http://") and protocol ("http")
			'authority','userInfo','userName','userPass','host','port', //parts of "user:pass@server:port
			'path','query','fragment', //path ("/file.php"), query ("?q=1") and fragment ("#_top")
			'GET', //this fragment is always empty - will be filled by parsed query
		);

		//parse URL
		preg_match($uriMask, $url, $urlParts);
		if (empty($urlParts)) { return array();} //nothing found - not valid URL?
		$urlParts = array_combine($keys, $urlParts);

		//parse query part
		if (!empty($urlParts['query'])) {
			preg_match_all('/([^=]+)(\=([^&]+))?&?/', $urlParts['query'], $tmp);
			foreach ($tmp[1] as $key => $value) {
				$urlParts['GET'][$tmp[1][$key]] = !empty($tmp[3][$key])?$tmp[3][$key]:null;
			}
		}

		return $urlParts;
	}

	/**
	 * static method for sending requiest (can be used for hard-core sending w/o help)
	 *
	 * @param $host    [String] e.g. www.server.com
	 * @param $port    [String] e.g. 8080
	 * @param $request [String] raw data in HTTP-compatible format (e.g. POST /index.php?get=all HTTP/1.1)
	 * @return [String] raw HTTP response (i.e. all headers and response body)
	 */
	static public function send($host, $port, $request) {
		if (empty($port)) { return false;}

		//send request
		//echo "connecting to $host:$port...\n";
		try {
			$sock = fsockopen($host, $port, $errNo, $errStr, 5);
		}
		catch (Exception $e) {
			throw new Exception('Error '.$errNo.':"'.$errStr.'" when connecting to server '.$host.':'.$port);
			return false;
		}
		if (false === $sock) {
			throw new Exception('Error '.$errNo.':"'.$errStr.'" when connecting to server '.$host.':'.$port);
			return false;
		}

		try {
			//echo "sending data:\n$request\n---------\n";
			fwrite($sock, $request);
		}
		catch (Exception $e) {
			throw new Exception('Error '.$e.' when sending data to server '.$host.':'.$port);
			return false;
		}
		//recive response
		$response = '';
		//echo "reciving data...:\n";
		try {
			while (!feof($sock)) {
				$response .= fgets($sock, 28);
			}
		}
		catch (Exception $e) {
			throw new Exception('Error '.$e.' when recieving data from server '.$host.':'.$port);
			return false;
		}
		//echo "$response\n------\n";
		fclose($sock);

		//return response
		return $response;
	}

	/**
	 * sends request via POST
	 *
	 * @param $url     [String] (required) URL or URI (e.g. http://www.server.com:80)
	 * @param $data    [String] (optional, default: data from addValue()) data for request body (e.g. a=1&b=3)
	 * @param $headers [String] (optional, default: none) additional headers (i.e. header for host and content are send always)
	 * @return [String] raw HTTP response (i.e. all headers and response body) - use parseResponse() and getCookies()
	 */
	public function sendPost($url, $data = null, $headers = null) {
		if (!isset($data)) {
			$data = $this->getRequest();
		}
		$length = strlen($data);
		$url = self::parseUrl($url);

		if (empty($url['path'])) {
			$url['path'] = '/'; //servers cannot accept empty path - '/' means root of the server
		}

		if ('https' == $url['protocol']) { //secured HTTP protocol
			$url['host'] = 'ssl://'.$url['host']; //make PHP use OpenSSL library
			if (empty($url['port'])) {
				$url['port'] = 443; //https runs on 443 by default
			}
		}

		if (empty($url['port'])) {
			$url['port'] = 80;
		}

		//prepare request headers
		$request  = "POST ".$url['path']."?".$url['query']." HTTP/1.1\r\n";
		$request .= "Host: ".$url['host']."\r\n";
		$request .= "Content-Type: application/x-www-form-urlencoded\r\n";
		$request .= "Content-Length: $length\r\n";
		if (!empty($headers)) {
			$request .= $headers;
		}
		$request .= "Connection: close\r\n\r\n";
		$request .= $data;

		return self::send($url['host'], $url['port'], $request);
	}

	/**
	 * sends request via GET
	 *
	 * @param $url     [String] (required) URL or URI (e.g. http://www.server.com:80)
	 * @param $data    [String] (optional, default: data from addValue()) additional params for URL (e.g. a=1&b=3; note that GET request does not have body)
	 * @param $headers [String] (optional, default: none) additional headers (i.e. header for host and content are send always)
	 * @return [String] raw HTTP response (i.e. all headers and response body) - use parseResponse() and getCookies()
	 */
	public function sendGet($url, $data = null, $headers = null) {
		if (!isset($data)) {
			$data = $this->getRequest();
		}
		$url = self::parseUrl($url);

		if (empty($url['path'])) {
			$url['path'] = '/'; //servers cannot accept empty path - '/' means root of the server
		}

		if ('https' == $url['protocol']) { //secured HTTP protocol
			$url['host'] = 'ssl://'.$url['host']; //make PHP use OpenSSL library
			if (empty($url['port'])) {
				$url['port'] = 443; //https runs on 443 by default
			}
		}

		if (empty($url['port'])) {
			$url['port'] = 80;
		}

		//prepare request headers
		$request  = "GET ".$url['path'].'?'.$data." HTTP/1.1\r\n";
		$request .= "Host: ".$url['host']."\r\n";
		if (!empty($headers)) {
			$request .= $headers;
		}
		$request .= "Connection: close\r\n\r\n";

		return self::send($url['host'], $url['port'], $request);
	}

	/**
	 * sends request via HEAD
	 *
	 * @param $url     [String] (required) URL or URI (e.g. http://www.server.com:80)
	 * @param $data    [String] (optional, default: data from addValue()) additional params for URL (e.g. a=1&b=3; note that HEAD request does not have body)
	 * @param $headers [String] (optional, default: none) additional headers (i.e. header for host and content are send always)
	 * @return [String] raw HTTP response (i.e. all headers; note that HEAD response does not have body) - use parseResponse() and getCookies()
	 */
	public function sendHead($url, $data = null, $headers = null) {
		if (!isset($data)) {
			$data = $this->getRequest();
		}
		$url = self::parseUrl($url);

		//prepare request headers
		$request  = "HEAD ".$url['path'].'?'.$data." HTTP/1.1\r\n";
		$request .= "Host: ".$url['host']."\r\n";
		if (!empty($headers)) {
			$request .= $headers;
		}
		$request .= "Connection: close\r\n\r\n";

		return self::send($url['host'], $url['port'], $request);
	}

	/**
	 * static method for parsing Cookies from response
	 *
	 * @param $response [String] response from send*()
	 * @return [Array of Arrays] list of cookies; each Cookie has following keys:
	 *           name  [String]
	 *           value [String]
	 *           path  [String]
	 */
	static public function getCookies($response) {
		//RegExp for URI     (please leave this part here even commented because of the examples
		$cookieMask = '/'       //for better understanding I'll split this RegExp  (this line marks start of RegExp)
			.'Set-Cookie:\ '      //header that marks the cookie
			.'([^=]+)='           //name of the cookie
			.'([^;]+);'           //value of the cookie
			.'(\ path='           //string marking the path
			."(.*))?"             //remaining (i.e. the path)
			.'/'                  //this marks the end of RegExp and case-insensitive matching
		;

		//parse URL
		preg_match_all($cookieMask, $response, $tmp);
		if (empty($tmp)) { return array();} //nothing found - no Cookies in head?

		$cookies = array();
		foreach ($tmp[0] as $index=>$value) {
			$cookies[$tmp[1][$index]] = array(
				'name'=>$tmp[1][$index],
				'value'=>$tmp[2][$index],
				'path'=>trim($tmp[4][$index]),
			);
		}

		return $cookies;
	}

	/**
	 * static method to parse response
	 *
	 * @param $response [String] response from send*()
	 * @return [Array] has following keys:
	 *           headers [Array] separate rows of response headers
	 *           lines   [Array] separate rows of response body (use join() or implode() to get single string of response)
	 */
	static public function parseResponse($response) {
		$lines = explode("\n", $response);
		$result = array('headers'=>array(), 'lines'=>array());
		$doLines = false;

		foreach($lines as $key=>$value) {
			$line = strtr($value, array("\r"=>'', "\n"=>''));
			if ($doLines) {
				$result['lines'][] = $line;
			}
			elseif (empty($line)) {
				$doLines = true;
			}
			else {
				$result['headers'][] = $line;
			}
		}

		return $result;
	}
} //class SendRequest
?>