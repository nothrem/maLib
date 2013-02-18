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

require_once(dirname(__FILE__) . '/dataReader.inc');

class jsonReader extends dataReader {

	protected $fileName;

	/**
	 * @constructor
	 *
	 * @param {String} name of the file to open (w/o extension)
	 * @param {String} (optional) directory to look for the file in (w/o ending slash)
	 */
	public function __construct($fileName, $directory = '') {
		parent::__construct();

		if ('' !== $directory) {
			$directory .= '/';
		}

		$this->fileName = $directory . $fileName . '.json';
	}

	/**
	 * reads date from input (e.g. file, console, etc.)
	 */
	public function read() {

		$file = $this->fileName;

		if (file_exists($file)) {
			api::log(__CLASS__ . ': Čtení souboru ' . $file);
			$file = file_get_contents($file);
		}
		else {
			api::log(__CLASS__ . ': Soubor ' . $file . ' neexistuje');
			$file = '{}';
		}
		if (empty($file)) {
			$this->reset();
			return false;
		}

		$file = json_decode($file);

		if (!$file) {
			$this->reset();
			return false;
		}

		$this->data = $file;

		return true;
	}

	/**
	 * writes data into output (e.g. file, console, etc.)
	 */
	public function write() {
		$data = json_encode($this->data);
		$file = $this->fileName;

		api::log(__CLASS__ . ': Zápis souboru ' . $file);
		file_put_contents($file, $data);
	}

	/**
	 * returns items with given key
	 */
	public function get($key, $default = null) {
		$data = $this->data;

		if (is_object($data) && property_exists($data, $key)) {
			return $data->$key;
		}
		else {
			return $default;
		}
	}

	/**
	 * returns all items in the list
	 */
	public function getAll() {
		return $this->data;
	}

	/**
	 *
	 */
	public function set($key, $value) {
		$data = $this->data;

		if (is_object($data)) {
			$data->$key = $value;
		} //else nothing, cannot work with non-object store
	}

	public function remove($key) {
		$data = $this->data;

		if (is_object($data)) {
			unset($data->$key);
		} //else nothing, cannot works with non-object store
	}

} //class dataReader

?>