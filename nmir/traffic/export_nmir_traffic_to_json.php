<?php

/*  ------------------------------------------------------------------
		sauvegarde le fichier json
			@param {object} $json - objet json à sauver

		Sauve les fichiers dans le dossier en cours fmp/nmir/traffic
	------------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$content = json_decode($content, false);
	write_json($content);
	echo "OK";
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
	$day = $json->LFMMCTA[1];
	$day = str_replace("-","",$day);

	$fp = fopen($day."-vols.json", 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
	
}

?>