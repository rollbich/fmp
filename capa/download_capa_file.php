<?php

function clean($data) {
    $data = trim($data);
    $data = htmlspecialchars($data);
	
	//check php 
	$lower = strtolower($data);

	$pos = strpos($lower,'php');
	if(!($pos === false)) {
		die('Error1');
	}
	
	$pos = strpos($lower,'ucesos');
	if($pos === false) {
		die('Error3');
	}
	
	$info = pathinfo($lower);
	$extension = $info['extension'];
	$extensionsAutorisees = array("xlsx");
	if (!(in_array($extension, $extensionsAutorisees))) {
		die('Error');
	}	
	
    return $data;
}

$filename = clean($_GET['filename']);
download($filename);

function download($filename) {

	if(file_exists($filename)) {	
		$file_name = basename($filename);
		$date = gmdate(DATE_RFC1123);
		 
		header('Pragma: public');
		header('Cache-Control: must-revalidate, pre-check=0, post-check=0, max-age=0');
		header('Content-Tranfer-Encoding: none');
		header('Content-Length: '.filesize($filename));
		header('Content-MD5: '.base64_encode(md5_file($filename)));
		header('Content-Type: application/octetstream; name="'.$file_name.'"');
		header('Content-Disposition: attachment; filename="'.$file_name.'"');
		 
		header('Date: '.$date);
		header('Expires: '.gmdate(DATE_RFC1123, time()+1));
		header('Last-Modified: '.gmdate(DATE_RFC1123, filemtime($filename)));
		 
		readfile($filename);
		exit; // nécessaire pour être certain de ne pas envoyer de fichier corrompu
	}

}

?>