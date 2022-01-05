<?php

/*  --------------------------------------------------------------
		sauvegarde le fichier json du tds
			@param {object} $json - objet json à sauver
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$content = json_decode($content, true);
	write_json($content);
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
	
	foreach ($json as $key => $value) {
       $fp = fopen($key."-reg.json", 'w');
		fwrite($fp, json_encode($value));
		fclose($fp);
    }
}

?>