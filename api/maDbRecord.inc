<?php

class jsonDbRecord {
	protected $id;

	public function __construct($input) {
		foreach ($input as $key => $value) {
			$this->$key = $value;
		}

		$this->id = $this->generateId($input);
	}

	protected function generateId($input) {
		$this->id = $input['id'];
	}

	public function getId() {
		return $this->id;
	}
}
?>
