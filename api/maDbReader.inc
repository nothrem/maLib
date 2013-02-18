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

class jsonDbReader extends jsonReader {

	private $version = 0.2;
	protected $subversion = null;

	/**
	 * reads date from input (e.g. file, console, etc.)
	 */
	public function read() {

		$result = parent::read();

		if ($result) {
			$data = $this->data;

			if (property_exists($data, 'maDb')) {
				if ($data->maDb > $this->version) {
					api::quit(__CLASS__ . ': Nelze zpracovat databázy. Databáze byla vytvořena novější verzí frameworku než je tento.');
				}
				$this->data = $data->records;
			}
			else if (property_exists($data, 'jsonDb')) { //older version with jsonDb header //DEPRECATED
				$this->data = $data->records;
			} //else: older version that did not have the 'records' property and data were saved as simple object

			return true;
		}

		return false;
	}

	/**
	 * writes data into output (e.g. file, console, etc.)
	 */
	public function write() {
		$data = json_encode($this->data);
		$file = $this->fileName;

		$db = new stdClass();
		if (!is_null($this->subversion)) {
			$db->maDb = $this->version . $this->subversion;
		}
		else {
			$db->maDb = $this->version;
		}
		$db->records = $data;

		api::log(__CLASS__ . ': Zápis souboru ' . $file);
		file_put_contents($file, $db);
	}

	/**
	 * returns items with given key
	 */
	public function get($key, $default = null) {
		$data = $this->data;

		if (is_object($data) && property_exists($data, $key)) {
			return $data->$key;
		}
		elseif (is_array($data) && array_key_exists($key, $data)) {
			return $data[$key];
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
	 * adds new value or changes existing one
	 *
	 * @param  $key   [String/Number/NULL] id of the key (string for indexed DB, number for ordered DB); NULL will add new item into ordered DB
	 * @param  $value [Mixed]
	 */
	public function set($key, $value) {
		$data = $this->data;

		if (is_object($data)) {
			$data->$key = $value;
		}
		elseif (is_array($data)) {
			if (is_numeric($key)) {
				$data[$key] = $value;
			}
			else {
				$data[] = $value;
			}
		} //else nothing, cannot work with non-object store
	}

	/**
	 * removes key from the DB
	 */
	public function remove($key) {
		$data = $this->data;

		if (is_object($data)) {
			unset($data->$key);
		}
		elseif (is_array($data)) {
			unset($data[$key]);
		} //else nothing, cannot works with non-object store
	}

	/**
	 * reindexes ordered DB (i.e. removes already deleted keys)
	 */
	public function optimze() {
		$data = $this->data;

		if (is_object($data)) {
			return;
		}
		elseif (is_array($data)) {
			$this->data = array_values($data);
		} //else nothing, cannot works with non-object store
	}

} //class dataReader

?>