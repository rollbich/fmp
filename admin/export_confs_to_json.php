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
    $decoded = json_decode($content, false); // true = array / false = object
	write_json($decoded);
	echo "OK";
} else { echo "Erreur : données non json<br/>"; }

function write_json($json) {
    $json_est = $json->est;
    $json_west = $json->ouest;
	$fp_est = fopen("../confs-est-supp.json", 'w');
	fwrite($fp_est, json_encode($json_est));
	fclose($fp_est);
    $fp_west = fopen("../confs-west-supp.json", 'w');
	fwrite($fp_west, json_encode($json_west));
	fclose($fp_west);
}

?>