<?php

$data = array(
	array('FirstName' => 'Jane', 'LastName' => 'Wells'),
	array('FirstName' => 'Spicer', 'LastName' => 'Matthews'),
	array('FirstName' => 'Lady', 'LastName' => 'Gaga'),
	array('FirstName' => 'Will', 'LastName' => 'iAm')
);

$json = array(
	'status' => 1,
	'errors' => array(),
	'data' => $data
);

header('Content-Type: application/json');
echo json_encode($json);