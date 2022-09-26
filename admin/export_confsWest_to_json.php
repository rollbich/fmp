<?php
session_start();
if (!(isset($_SESSION['login_bureau'])) || $_SESSION['login_bureau'] === false) die("Interdit");
/*  --------------------------------------------------------------
		sauvegarde le fichier json des confs supp West
			@param {object} $json - objet json à sauver
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	write_json($content);
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
    $fp_west = fopen("../confs-west-supp.json", 'w');
	fwrite($fp_west, $json);
	fclose($fp_west);
}
?>