<?php

require_once('../maLib/api/jsonReader.inc');

class jsonDb {
	protected $session;
	protected $reader;
	protected $directory = '../data';
	protected $file = '';
	protected $useSingleFile = false;

	public function __construct() {
		if (session::isValid()) {
			$this->session = session::getHandler();
		}
		else {
			api::quit('Error: no session!');
		}
	}

	public function _needAdmin($method) {
		switch ($method) {
			case 'add':
			case 'edit':
			case 'remove':
				return true;
			default:
				return false;
		}
	}

	protected function getRecord($input) {
		return new jsonDbRecord($input);
	}

	private function openFile($file = '', $type = 'db', $temporal = false) {
		if (empty($file)) {
			if ($this->useSingleFile) {
				$file = $this->file;
			}
			else {
				$file = $this->session->get('file', 'default');
				api::log('Otevírám soubor ' . $file);
			}
		}
		else {
			if (!$temporal) {
				$this->session->set('file', $file);
				api::log('Aktivní soubor změněn na ' . $file);
			}
		}

		$file .= '.' . $type;
		$reader = new jsonDbReader($file, $this->directory);
		$reader->read();

		$this->reader = $reader;
	}

	private function getName($input) {
		return (array_key_exists('name', $input)) ? $input['name'] : '';
	}

	public function get($input, $output) {
		$name = $this->getName($input);

		$this->getRecords($input, &$output);

		return true;
	}

	public function getRecords($input, $output = null) {
		$name = $this->getName($input);

		$this->openFile($name, 'db');
		if (is_array($output)) {
			$output['records'] = $this->reader->getAll();
		}

		return true;
	}

	public function add($input, $output) {
		if (!$this->session->isAdmin()) {
			api::quit('No admin rights');
		}
		$this->openFile();
		$reader = $this->reader;

		$new = $this->getRecord($input);
		$id = $new->getId();
		$id = $reader->getFreeId($id);

		$output['id'] = $id;

		$reader->set($id, $new);
		$reader->write();

		return true;
	}

	public function edit($input, $output) {
		$this->openFile();
		$reader = $this->reader;

		$new = $this->getRecord($input);
		$id = $input['id'];

		$output['id'] = $id;

		if (!$this->reader->exists($id)) {
			return 'Toto slovo neexistuje';
		}

		$reader->set($id, $new);
		$reader->write();

		return true;
	}

	public function remove($input, $output) {
		$this->openFile();
		$reader = $this->reader;

		$id = $input['id'];

		$reader->remove($id);
		$reader->write();

		return true;
	}

}


//class jsonDb {
//
//	/**
//	 * performs SELECT operation
//	 *
//	 * @param  [Object] input params in jsonSQL format
//	 * @return [Array] found columns
//	 */
//	public function select($input) {
//		$from = $this->getDb($input['from']);
//		if (is_string($from)) {
//			return $from;
//		}
//
//
//		$columns = $input['select'];
//		$conditions = $input['where'];
//		if (array_key_exists('limit', $input)) {
//			$limit = $input['limit'];
//			if (is_numeric($limit)) {
//				$limit = array(0, $limit);
//			}
//			else {
//				if (is_string($limit)) {
//					$limit = explode(',', $limit);
//				}
//				if (!is_array($limit)) {
//					return 'Invalid limit type';
//				}
//				if (1 === count($limit)) {
//					array_unshift($limit, 0);
//				}
//			}
//		}
//		else {
//			$limit = false;
//		}
//
//		$output = array();
//		$totalCount = 0;
//		$matchCount = 0;
//		foreach ($from['data'] as $item) {
//			$outputItem = array();
//			$totalCount++;
//			if (!$this->match($item, $conditions)) {
//				continue; //skip this item
//			}
//			$matchCount++;
//			if (is_array($columns)) {
//				foreach ($columns as $column) {
//					if (array_key_exists($column, $item)) {
//						$outputItem[$column] = $item[$column];
//					}
//				}
//			}
//			else {
//				$outputItem = $item;
//			}
//			$output['rows'][] = $outputItem;
//		}
//
//		if ($limit AND 0 < $limit[1]) {
//			$output['rows'] = array_slice($output['rows'], $limit[0], $limit[1]);
//		}
//
//		$output['totalCount'] = $totalCount;
//		$output['matchCount'] = $matchCount;
//		$output['rowsCount'] = count($output['rows']);
//		$output['skipCount'] = $limit[0];
//
//		return $output;
//	}
//
//
//	/**
//	 * checks given data against given conditions
//	 *
//	 * @param  [Mixed] data to check
//	 * @param  [Mixed/Array] array with conditions or value to match with data
//	 * @return [Boolean] true if data matches all of the conditions
//	 */
//	protected function match($data, $conditions) {
//		if (is_array($conditions)) {
//			foreach ($conditions as $column => $value) {
//				if (array_key_exists($column, $data)) {
//					if (!$this->match($data[$column], $value)) { //recursive call
//						return false;
//					}
//				}
//				else {
//					return false; //column not found = does not match
//				}
//			}
//			return true; //no non-matching condition found - data are OK
//		}
//		else if ($data === $conditions) {
//			return true; //end of recursion
//		}
//		else {
//			return false; //unknown condition or does not match (end of recursion)
//		}
//	}
//
//	/**
//	 * returns decoded database
//	 *
//	 * @param  [String] name of database
//	 * @return [Array] decoded json
//	 */
//	protected function getDb($name) {
//
//		if (defined('DB_ROOT')) {
//			$path = DB_ROOT . $name;
//		}
//		else {
//			$path = getcwd();
//			$path = $path . '/' . $name;
//		}
//
//		if (file_exists($path . '.json')) {
//			$path .= '.json';
//		}
//
//		if (!file_exists($path)) {
//			return 'Missing DB file ' . $path;
//		}
//
//		$file = file_get_contents($path);
//		$json = json_decode($file, true);
//
//		if (!$json OR !array_key_exists('jsonDB', $json)) {
//			return 'Invalid DB file ' . $path;
//		}
//		elseif (db::MIN_SUPPORTED_VERSION > $json['jsonDB']){
//			return 'Old DB file version, upgrade your jsonDB to ' . db::MIN_SUPPORTED_VERSION;
//		}
//		elseif (db::MAX_SUPPORTED_VERSION < $json['jsonDB']){
//			return 'Unsupported DB file version, this jsonSQL supports jsonDB up to ' . db::MAX_SUPPORTED_VERSION;
//		}
//
//		if (!array_key_exists('data', $json) || !is_array($json['data'])) {
//			$json['data'] = array(); //empty DB - allow to write into it
//		}
//
//		return $json;
//	}
//} //class db
