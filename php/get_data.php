<?php

include_once("../b2b/path.inc.php");

function get_data($url) {
	
	$ch = curl_init();
    //curl_setopt($ch, CURLOPT_URL, "localhost/json/$url");
	curl_setopt($ch, CURLOPT_URL, DATA_PATH."/$url");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	/*------------------------------------------------------*/
	$result = curl_exec($ch);
	
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	//echo "HTTP CODE:: " . $status_code;
	//echo curl_error($ch);
	if ($status_code == 404) return 404;
	//curl_close($ch);  //no effect on php >= 8.0
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	
	$data_url = $decoded["url"];
	$resultat = get_data($data_url);
	echo $resultat;
	
} else { echo "<br/>pas json<br/>"; }


?>