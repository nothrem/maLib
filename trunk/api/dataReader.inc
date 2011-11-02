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

abstract class dataReader {
	protected $data;

	/**
	 * @constructor
	 */
	public function __construct() {
		$this->reset();
	}

	/**
	 * Clears all data in the list
	 */
	public function reset() {
		$this->data = new stdClass;
	}

	/**
	 * reads date from input (e.g. file, console, etc.)
	 */
	abstract public function read();

	/**
	 * writes data into output (e.g. file, console, etc.)
	 */
	abstract public function write();

	/**
	 * returns items with given key
	 */
	public function get($key, $default = null) {
		$data = $this->data;

		if (is_object($data) && property_exists($data, $key)) {
			return $data->$key;
		}

		return $default;
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
		} //else nothing, cannot works with non-object store
	}

	public function remove($key) {
		$data = $this->data;

		if (is_object($data)) {
			unset($data->$key);
		} //else nothing, cannot works with non-object store
	}

	public function exists($key) {
		$data = $this->data;

		if (is_object($data) && property_exists($data, $key)) {
			return true;
		}

		return false;
	}

	public function getFreeId($prefix = 'item') {
		return $this->getUniqueId($prefix, 0);
	}

	private function getUniqueId($id = 'item', $i = 0) {
		if (999 < $i) {
			api::quit('Cannot generate new id for ' . $id);
		}
		$newId = $id . $i;
		if ($this->exists($newId)) {
			return $this->getUniqueId($id, $i++);
		}
		return $newId;
	}

} //class dataReader

?>