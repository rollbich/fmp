<?php
header('content-type:application/json');
/* ----------------------------------------------------------------------------------------------------------------------------------------
	https://olafatco.dsna.aviation-civile.gouv.fr/ws/teamCompositionGet.php?center=LFMM&zone=$zone&dateStart=$date&dateEnd=$date&type=team
	* la zone n'est obligatoire que pour les centres bizones, zone = E ou W
	* on peut mettre date=2022-01-24 si on veut une seule journée,
	* type= team est optionnel et permet d'enlever toutes les données nominatives et donc de réduire la taille du retour.
   ---------------------------------------------------------------------------------------------------------------------------------------- */

function get_olaf($zone, $date) {
	$login = 'olafatco_tds_lfmm-bf';
	$password = '(dgac2021)';
	$url = "https://olafatco.dsna.aviation-civile.gouv.fr/ws/teamCompositionGet.php?center=LFMM&zone=$zone&date=$date";
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

/*	----------------------------------------------------
		 	API lfmm
			inclut detacheQuantity corrigé + Jx
		@return {object}
		{
			"date":"2022-03-22",
			"zone":"E",
			"9-E":{"teamQuantity":9,"BV":9,"roQuantity":0,"roInduction":0,"detacheQuantity":2},
			"8-E":{"teamQuantity":10,"BV":7,"roQuantity":2,"roInduction":0,"detacheQuantity":1},
			"7-E":{"teamQuantity":7,"BV":7,"roQuantity":0,"roInduction":0,"detacheQuantity":1},
			"4-E":{"teamQuantity":8,"BV":7,"roQuantity":0,"roInduction":0,"detacheQuantity":1},
			"3-E":{"teamQuantity":11,"BV":7,"roQuantity":3,"roInduction":0,"detacheQuantity":1},
			"2-E":{"teamQuantity":6,"BV":9,"roQuantity":0,"roInduction":0,"detacheQuantity":0},
			"Renfort": {"J0A": 2, "J0B": 2, "J0C": 2}
		}
	---------------------------------------------------- */
function toint($elem) { return (int) $elem;}

if (isset($_GET["zone"]) && isset($_GET["date"])) {
    $zone = $_GET["zone"];
    $day = $_GET["date"];
    $resultat = get_olaf($zone, $day);
    $resultat = json_decode ($resultat, true);
   
    $res = new stdClass();
    $res->date = $day;
    $res->zone = $zone;
    foreach ($resultat[$day] as $eq=>$value) {
		if ($eq === "Renfort") {
			$res->$eq = new stdClass();
			$res->$eq->Jx = new stdClass();
			foreach ($value as $code1=>$val1) {
				$count = count($val1);
				foreach ($val1 as $code2=>$val2) {
					$vac = substr($val2["contextmenutype"]["label"], 0, 3);
					$agent = $val2["agent"]["nomComplet"];
					if (!property_exists($res->$eq->Jx, $vac)) {
						$res->$eq->Jx->$vac = new stdClass();
						$res->$eq->Jx->$vac->nombre = 0;
						$res->$eq->Jx->$vac->agent = array();
					}
					$res->$eq->Jx->$vac->nombre++;
					array_push($res->$eq->Jx->$vac->agent, $agent);
				}
			}
		} else {
			$res->$eq = new stdClass();
			$res->$eq->teamQuantity = $resultat[$day][$eq]["teamReserve"]["teamQuantity"];
			$res->$eq->BV = $resultat[$day][$eq]["teamReserve"]["BV"];
			$res->$eq->roQuantity = $resultat[$day][$eq]["teamReserve"]["roQuantity"];
			$res->$eq->roInduction = $resultat[$day][$eq]["teamReserve"]["roInduction"];
			if (isset($resultat[$day][$eq]["html"][$day][$eq]["lesrenforts"])) {
				$res->$eq->detacheQuantity = count($resultat[$day][$eq]["html"][$day][$eq]["lesrenforts"]);
			} else {
				$res->$eq->detacheQuantity = 0;
			}
			$aTeamComposition = $resultat[$day][$eq]["aTeamComposition"];
			$teamData = $resultat[$day][$eq]["teamData"];
			$res->$eq->workers = new stdClass();
			$res->$eq->stage = new stdClass();
			$res->$eq->conge = new stdClass();
			
			foreach ($aTeamComposition as $code1=>$val1) {
				foreach ($val1 as $code2=>$val2) {
					$nom = $val2["agent"]["nom"];
					$prenom = $val2["agent"]["prenom"];
					$name = $nom." ".$prenom;
					$context = $val2["contextmenuType"];
					if (array_key_exists("role", $val2["agent"])) $role = $val2["agent"]["role"]; else $role = [999]; // n'existe pas pour les remplaçants
					// bug $role est un array d'int pour les acds sinon c'est une string => on s'assure que cela soit un array d'integer
					//echo $name."\n";
					//var_dump($role);
					if (!is_array($role)) {
						$role = explode(",", $role);
						array_map('toint', $role);
					}
					$pushed = false;
					//var_dump($context);
					if (in_array(82, $role)) {
						if (count($context) === 0) $res->$eq->workers->$name = "PC-CDS"; else $res->$eq->workers->$name = "CDS";
						$pushed = true;
					}
					if (in_array(80, $role)) {
						$res->$eq->workers->$name = "PC-ACDS";
						$pushed = true;
					}
					if (in_array(14, $role)) {
						$res->$eq->workers->$name = "PC-DET";
						$pushed = true;
					}
					if (in_array(10, $role) || in_array(154, $role)) { // 10 : élève, 154 : élève ENAC
						$res->$eq->workers->$name = "stagiaire";
						$pushed = true;
					}
					if (in_array(21, $role)) { // 21 : retour salle PC
						$res->$eq->workers->$name = "requalif";
						$pushed = true;
					}
					if (array_key_exists("type", $context)) {
						$type = $context["type"];
						$label = $context["label"];
						if ($type === "reserve_operationnelle") {
							$res->$eq->workers->$name = "RO";
							$pushed = true;
						}
					}
					if ($pushed === false) $res->$eq->workers->$name = "PC";
				}
			}
			foreach ($teamData["stage"] as $key=>$val) {
				$res->$eq->stage->$key = "stage";
			}
			foreach ($teamData["conge"] as $key=>$val) {
				$res->$eq->conge->$key = "conge";
			}
		}
    }
    echo json_encode($res);
} else {
    echo "Il faut indiquer les parametres de zone et de date dans l'url";
}

?>