<?php

/*  ------------------------------------------------------------------
		sauvegarde le fichier json
			@param {object} $json - objet json à sauver

		Sauve les fichiers dans le dossier en cours fmp/nmir/traffic
	------------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	write_json($content);
<<<<<<<< HEAD:capa/export_date_supp_to_json.php
	echo $content;
========
	echo "OK";
>>>>>>>> e7135e5861e7edb0af7bc49c10c736d23a32f238:nmir/traffic/export_nmir_traffic_to_json.php
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
	$fp = fopen("../date_supp.json", 'w');
	fwrite($fp, $json);
	fclose($fp);
}

?>