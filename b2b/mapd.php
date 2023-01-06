<?php
header('content-type:application/json');

function get_mapd($start_time, $end_time, $designator) {
	$login = 'crna-se';
	$password = 'wI0ft+YlM+p173UIrMa+K4riiYEh+6C5kQs+jgciOblUzPWQns5WPgjDJexGvZUj';
	$url = "https://mapd-test.acc.asap.dsna.fr/api/activations?start=$start_time&end=$end_time&areaName=$designator";
	
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	/*------------------------------------------------------*/
	curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
	curl_setopt($ch, CURLOPT_USERPWD, "$login:$password");
	$result = curl_exec($ch);
	/*
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	echo "HTTP CODE:: " . $status_code;
	echo curl_error($ch);
	*/
	curl_close($ch);  
	return $result;
}
/*
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	
	$zone = $decoded["zone"];
	$day = $decoded["day"];
	$yesterday = $decoded["yesterday"];
	$resultat = get_olaf($zone, $day, $yesterday);
	echo $resultat;
	
} else { echo "<br/>pas json<br/>"; }
*/
$mapd = get_mapd("2022-09-15T06:00:00Z", "2022-09-16T06:00:00Z", "LF*");
echo $mapd;
?>