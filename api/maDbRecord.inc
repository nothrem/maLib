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
