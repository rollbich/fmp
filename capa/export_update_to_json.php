<?php

/*  --------------------------------------------------------------
		sauvegarde le fichier json du tds
			@param {object} $json - objet json à sauver
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	write_json($content);
	echo $content;
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
	$fp = fopen("../update.json", 'w');
	fwrite($fp, $json);
	fclose($fp);
}

?>