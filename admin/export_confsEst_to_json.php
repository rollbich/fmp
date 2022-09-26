<?php
session_start();
if (!(isset($_SESSION['login_bureau'])) || $_SESSION['login_bureau'] === false) die("Interdit");
/*  --------------------------------------------------------------
		sauvegarde le fichier json des confs supp Est et West
			@param {object} $json - objet json à sauver
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	write_json($content);
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
	$fp_est = fopen("../confs-est-supp.json", 'w');
	fwrite($fp_est, $json);
	fclose($fp_est);
}

?>