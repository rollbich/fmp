<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");

/*  ----------------------------------------------------
		LFMM-FMP.FR : tâche CRON à 05h30 puis 07h00 loc
    ---------------------------------------------------- */

/*  -----------------------------------------------------------------------
		instanciation soap FLOW Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]

		TrafficType : 
        	DEMAND : Traffic demand ("FTFM": Filed Tactical Flight Model).
	        REGULATED_DEMAND : Regulated traffic demand ("RTFM": Regulated Tactical Flight Model).
        	LOAD : Traffic load ("CTFM": Current Tactical Flight Model).

	----------------------------------------------------------------------- */
 
$soapFlow = new B2B("flow");
$soapClientFlow = $soapFlow->get_client();

/*  ----------------------------------------------------------------------
		récupère les reguls d'une zone définie par un trigramme
				$area : 3 premières lettres (ex : LFM)
				$wef-$unt : plage en heure UTC
		Note :  queryRegulations ne récupère pas les delais des TV
				c'est pourquoi, on effectue une requete atfcm_situation
				
		On récupère un tableau pour sauvegarde simple en xls et csv
		On créé un objet global json plus complet $json_reg
		pour la sauvegarde json
	---------------------------------------------------------------------- */
function get_regulations($area, $wef, $unt) {

	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'requestedRegulationFields'=>array('item'=>array('applicability', 'initialConstraints', 'delayTVSet', 'reason', 'location', 'lastUpdate')),
		'queryPeriod'=>array('wef'=>$wef,'unt'=>$unt),
		'tvs'=>array($area."*")
	);
	
	$reg = [];
	$reg["LFMMFMPE"] = array();
	$reg["LFMMFMPW"] = array();
	$reg["LFMMAPP"] = array();
	
	$reg["LFBBFMP"] = array();
	$reg["LFBBAPP"] = array();
	
	$reg["LFEEFMP"] = array();
	$reg["LFEEAPP"] = array();
	
	$reg["LFFFFMPE"] = array();
	$reg["LFFFFMPW"] = array();
	$reg["LFFFAD"] = array();
	
	$reg["LFRRFMP"] = array();
	$reg["LFRRAPP"] = array();
	
	$reg["LFDSNA"] = array();
	
	global $json_reg;
	
	try {
		$output = $soapClientFlow->__soapCall('queryRegulations', array('parameters'=>$params));
		$situation_ATFCM = get_ATFCM_situation();
		$situation = get_area_situation($situation_ATFCM, $area);
		for ($i=0; $i<count($output->data->regulations->item); $i++) {
			$r = $output->data->regulations->item[$i];
			$id = $r->regulationId;
			$lastUpdateDate = substr($r->lastUpdate->userUpdateEventTime, 0, 10);
			$lastUpdateTime = substr($r->lastUpdate->userUpdateEventTime, 11, 5);
			$delay = 0;
			$nbrImpactedFlight = 0;
			foreach ($situation as $regul) {
				if ($regul[0] == $id) {
					$delay = (int) $regul[1];
					$nbrImpactedFlight = (int) $regul[2];
				}
			}
			$tvset = $r->delayTVSet;
			$c = $r->initialConstraints;
			if (is_array($c)) {
				// pour export Excel
				for($j=0; $j<count($c); $j++) {
					$date = substr($r->initialConstraints[$j]->constraintPeriod->wef, 0, 10);
					$hdeb = substr($r->initialConstraints[$j]->constraintPeriod->wef, -5);
					$hfin = substr($r->initialConstraints[$j]->constraintPeriod->unt, -5);
					array_push($reg[$tvset], array($r->regulationId, $r->location->id, $date, $hdeb, $hfin, $r->reason, $r->initialConstraints[$j]->normalRate, $r->initialConstraints[$j]->pendingRate, $r->initialConstraints[$j]->equipmentRate, $delay, $nbrImpactedFlight, $r->delayTVSet, $r->lastUpdate->userUpdateType, $lastUpdateDate, $lastUpdateTime));
				}
				// pour export json
				$obj = new stdClass();
				$obj->regId = $r->regulationId;
				$obj->tv = $r->location->id;
				$obj->lastUpdate = $r->lastUpdate;
				$obj->applicability = $r->applicability;
				$obj->constraints = $r->initialConstraints;
				$obj->reason = $r->reason;
				$obj->delay = $delay;
				$obj->impactedFlights = $nbrImpactedFlight;
				$obj->TVSet = $r->delayTVSet;
				array_push($json_reg->$tvset, $obj);
			} else {
				// pour export Excel
				$init_c = array($r->initialConstraints->constraintPeriod, $r->initialConstraints->normalRate, $r->initialConstraints->pendingRate, $r->initialConstraints->equipmentRate);
				$date = substr($r->initialConstraints->constraintPeriod->wef, 0, 10);
				$hdeb = substr($r->initialConstraints->constraintPeriod->wef, -5);
				$hfin = substr($r->initialConstraints->constraintPeriod->unt, -5);
				array_push($reg[$tvset], array($r->regulationId, $r->location->id, $date, $hdeb, $hfin, $r->reason, $r->initialConstraints->normalRate, $r->initialConstraints->pendingRate, $r->initialConstraints->equipmentRate, $delay, $nbrImpactedFlight, $r->delayTVSet, $r->lastUpdate->userUpdateType, $lastUpdateDate, $lastUpdateTime));
				// pour export json
				$obj = new stdClass();
				$obj->regId = $r->regulationId;
				$obj->tv = $r->location->id;
				$obj->lastUpdate = $r->lastUpdate;
				$obj->applicability = $r->applicability;
				$obj->constraints = array($r->initialConstraints);
				$obj->reason = $r->reason;
				$obj->delay = $delay;
				$obj->impactedFlights = $nbrImpactedFlight;
				$obj->TVSet = $r->delayTVSet;
				array_push($json_reg->$tvset, $obj);
			}
			
		}
		return $reg;
	}
	
	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
		
}

/*  -----------------------------------------------------------------------------------
		récupère la situation ATFCM en europe
		- delai, nbre vols (landed, suspendus...), reason globaux europe
		- reguls europe avec delai de chaque TV (format string HHMM), vols impactés
	----------------------------------------------------------------------------------- */

function get_ATFCM_situation() {

	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'day'=>gmdate("Y-m-d")
	);
						
	try {
		$output = $soapClientFlow->__soapCall('retrieveATFCMSituation', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}	
}

/*  ---------------------------------------------------------------------
		Extrait la situation ATFCM europe une zone précise d'europe
		définies par un bigramme (ex : LF)
		-> reguls de la zone avec delai de chaque TV, vols impactés
	--------------------------------------------------------------------- */
function get_area_situation($output, $area) {
	$arr = array();
	
	for ($i=0; $i<count($output->data->regulations->item); $i++) {
		$r = $output->data->regulations->item[$i];
		$delay_h = null;
		if (strlen($r->delay) === 5) $delay_h = (int) substr($r->delay, 0, 3); else $delay_h = (int) substr($r->delay, 0, 2);
		$delay_mn = (int) substr($r->delay, -2);
		$delay = $delay_h*60 + $delay_mn;
		if (substr($r->trafficVolumeId, 0, 2) == $area) {
			array_push($arr, array($r->regulationId, $delay, $r->nrImpactedFlights));
		}
	}
	return $arr;
}

/*  ------------------------------------------
		Ecriture du fichier générique json
		$arr : tableau contenant les données
		$zone : est ou west
		$type : H20, Occ, Reg
		$wef : pour la date du jour
		ex : 20210621-H20-est.csv
	------------------------------------------ */
function write_json($arr, $zone, $type, $wef) {
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$y = $date->format('Y');
	$h = $date->format('H');
	$dir = dirname(__FILE__)."/json/$y/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone.$h."20.json", 'w');
	fwrite($fp, json_encode($arr));
	fclose($fp);

}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

// objet contenant les reguls de LF*
$json_reg = new stdClass();
$json_reg->LFMMFMPE = array();
$json_reg->LFMMFMPW = array();
$json_reg->LFMMAPP = array();

$json_reg->LFBBFMP = array();
$json_reg->LFBBAPP = array();

$json_reg->LFEEFMP = array();
$json_reg->LFEEAPP = array();

$json_reg->LFDSNA = array();

$json_reg->LFFFFMPE = array();
$json_reg->LFFFFMPW = array();
$json_reg->LFFFAD = array();

$json_reg->LFRRFMP = array();
$json_reg->LFRRAPP = array();

include_once("config.inc.php");
include_once("hour_config".$config."-matin.inc.php");
	
// ---------------------------------------
// 		récupère les données Reg
// ---------------------------------------
$regul = get_regulations("LF", $wef_regs, $unt_regs);


// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde

try {	
	
	write_json($json_reg, "", "-reg", $wef_counts);
	echo "<br>Recup Reg OK<br>";
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>