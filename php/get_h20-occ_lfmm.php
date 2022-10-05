<?php

/* ----------------------------------------------------------------------------------------------------------------------------------------
	https://lfmm-fmp.fr/php/get_H20_lfmm.php?type=occ&zone=est&date=2022-09-03
		@param {string} - type = "H20" ou "Occ"
	    @param {string} - zone = "est" ou "west"
	    @param {string} - date = 2022-01-24 
		@param {string} - heure = 1320 (13h20) - Optional
   ---------------------------------------------------------------------------------------------------------------------------------------- */
function clean($data) {
    $data = trim($data ?? '');
    $data = htmlspecialchars($data);
    return $data;
}

function get_courbe($type, $zone, $year, $month, $day, $heure) {
	//$login = 'olafatco_tds_lfmm-bf';
	//$password = '(dgac2021)';
	$url = "https://lfmm-fmp.fr/b2b/json/$year/$month/$year$month$day-$type-$zone$heure.json";
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	/*------------------------------------------------------*/
	//curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
	//curl_setopt($ch, CURLOPT_USERPWD, "$login:$password");
	$result = curl_exec($ch);
	
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	//echo "HTTP CODE:: " . $status_code;
	//echo curl_error($ch);
	if ($status_code == 404) {
		header('content-type:text/html');
		throw new Exception("Le fichier $url n'existe pas");
	}
	curl_close($ch);
	return $result;
}

/*	----------------------------------------------------
		 	API lfmm - get H20
			inclut detacheQuantity corrigé + Jx
		@return {object}
		[
			["RAE","2022-09-01","04:00",32,73,63],["RAE","2022-09-01","04:20",32,108,107],...
            ["GYAB","2022-09-01","04:00",32,73,63],["GYAB","2022-09-01","04:20",32,108,107],
		]
	---------------------------------------------------- */
try {
	if (isset($_GET["type"]) && isset($_GET["zone"]) && isset($_GET["date"])) {
		if (isset($_GET["heure"])) {
			$heure = clean($_GET["heure"]);
		} else {
			$heure = "";
		}
		$ok_type = true;
		$ok_zone = true;
		$ok_date = true;
		$type = clean($_GET["type"]); // $type ne peut etre null avec clean => OK pour php 8.1
		$zone = clean($_GET["zone"]);
		$date = clean($_GET["date"]);
		if (strtolower($type) !== "h20" && strtolower($type) != "occ") $ok_type = false;
		if (strtolower($zone) !== "est" && strtolower($zone) !== "west") $ok_zone = false;
		$d = explode("-", $date);
		$year = $d[0];
		$month = $d[1];
		$day = $d[2];
		if (!checkdate($month, $day, $year)) $ok_date = false;
		if ($ok_type === false) { throw new Exception("Le type est H20 ou Occ: actuellement $type"); }
		if ($ok_zone === false) { throw new Exception("La zone est est ou west: actuellement $zone"); }
		if ($ok_date === false) { throw new Exception("La date est incorrecte: actuellement $date"); }
		$resultat = get_courbe($type, $zone, $year, $month, $day, $heure);
		header('content-type:application/json');
		echo $resultat;  
	} else {
		throw new Exception("Il faut indiquer les parametres de type, zone et de date dans l'url");
	}
}
catch(Exception $e) {
    header('content-type:text/html');
	echo 'Erreur : ' . $e->getMessage();
}
?>