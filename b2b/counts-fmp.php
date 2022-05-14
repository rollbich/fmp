<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");

/*  -------------------------------------------
		LFMM-FMP.FR : tâche CRON à 23h42 loc
    ------------------------------------------- */

/*  -----------------------------------------------------------------------
		instanciation soap FLOW Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]
	----------------------------------------------------------------------- */
 
$soapFlow = new B2B("flow");
$soapClientFlow = $soapFlow->get_client();

/*  ---------------------------------------------------------
					Appel b2b
		récupère le nbre de vols d'une journée d'un airspace
		(marche aussi pour un TV en changeant la requete par
		queryTrafficCountsByTrafficVolume et en remplacant
		airspace par trafficVolume)
	--------------------------------------------------------- */
function query_entry_day_count($airspace) {
	
	global $soapClientFlow;
	global $wef_flights;
	global $unt_flights;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>'LOAD'),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef_flights,'unt'=>$unt_flights),
		'computeSubTotals'=>false,
		'countsInterval'=>array('duration'=>'2400','step'=>'2400'),
		'airspace'=>$airspace,
		'calculationType'=>'ENTRY'
	);
	
	try {
		$output = $soapClientFlow->__soapCall('queryTrafficCountsByAirspace', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  --------------------------------------------------
					Appel b2b
		récupère le H20 (duration 60, step 20)
		dans la plage horaire $wef-$unt en heure UTC
	-------------------------------------------------- */
function query_entry_count($tv, $wef, $unt) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>'LOAD'),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'computeSubTotals'=>false,
		'countsInterval'=>array('duration'=>'0060','step'=>'0020'),
		'trafficVolume'=>$tv,
		'calculationType'=>'ENTRY'
	);
	
	try {
		$output = $soapClientFlow->__soapCall('queryTrafficCountsByTrafficVolume', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ------------------------------------------------------------
					Appel b2b
		récupère l'occ (duration en fonction du TV, step 1)
		dans la plage horaire $wef-$unt en heure UTC
	------------------------------------------------------------ */
function query_occ_count($tv, $tv_duration, $wef, $unt) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>'LOAD'),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'computeSubTotals'=>false,
		'countsInterval'=>array('duration'=>$tv_duration,'step'=>'0001'),
		'trafficVolume'=>$tv,
		'calculationType'=>'OCCUPANCY'
	);
							
	try {
		$output = $soapClientFlow->__soapCall('queryTrafficCountsByTrafficVolume', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
	
}

/*  --------------------------------------------------------------------
			récupère le H20 de la zone "est" ou "west"
		dans la plage horaire $wef-$unt en heure UTC
		@return [ ["TV", "yyyy-mm-dd", "hh:mm", MV, H/20], [...], ... ]
	-------------------------------------------------------------------- */
function get_entry($zone, $wef, $unt) {
	
	global $tvs_est;
	global $tvs_west;
	global $tve;
	global $tvw;
	
	$arr = array();
	
	if ($zone !== "est" && $zone !== "west") throw new Exception("La zone doit être \"est\" ou \"west\" !");
	
	if ($zone === "est") {
		$tv_group = $tvs_est;
		$tv_prefix = $tve;
	} 
	if ($zone === "west") {
		$tv_group = $tvs_west;
		$tv_prefix = $tvw;
	}

	foreach($tv_group as $tv) {
		
		if (isset($tv_prefix[$tv]["MV"])) { $tv_mv = $tv_prefix[$tv]["MV"]; } else { throw new Exception("Le TV ".$tv." a une MV non defini dans MV.json"); }
		
		$date = new DateTime($wef);
		$timestamp = $date->getTimestamp();
		$result = query_entry_count("LFM".$tv, $wef, $unt);

		for ($i=0; $i<count($result->data->counts->item); $i++) {
			  $date->setTimestamp($timestamp+$i*60*20);
			  array_push($arr, array($tv, $date->format('Y-m-d'), $date->format('H:i'), $tv_mv, $result->data->counts->item[$i]->value->item->value->totalCounts));
		}
	}
	return $arr;
}

/*  -------------------------------------------------------------------------------
			récupère l'occ de la zone "est" ou "west"
		dans la plage horaire $wef-$unt en heure UTC
		@return [ ["TV", "yyyy-mm-dd", "hh:mm", peak, sustain, H/20], [...], ... ]
	------------------------------------------------------------------------------- */

function get_occ($zone, $wef, $unt) {
	
	global $tvs_est;
	global $tvs_west;
	global $tve;
	global $tvw;
	$tv_duration = 0;
	
	$arr = array();
	
	if ($zone !== "est" && $zone !== "west") throw new Exception("La zone doit être \"est\" ou \"west\" !");
	
	if ($zone === "est") {
		$tv_group = $tvs_est;
		$tv_prefix = $tve;
	} 
	if ($zone === "west") {
		$tv_group = $tvs_west;
		$tv_prefix = $tvw;
	}

	foreach($tv_group as $tv) {
		
		if (isset($tv_prefix[$tv]["peak"])) { $tv_peak = $tv_prefix[$tv]["peak"]; } else { throw new Exception("Le TV ".$tv." a un peak non defini dans MV.json"); }
		if (isset($tv_prefix[$tv]["sustain"])) { $tv_sustain = $tv_prefix[$tv]["sustain"]; } else { throw new Exception("Le TV ".$tv." a un sustain non defini dans MV.json"); }
		if (isset($tv_prefix[$tv]["duration"])) { $tv_duration = str_pad($tv_prefix[$tv]["duration"], 4, '0', STR_PAD_LEFT); } else { throw new Exception("Le TV ".$tv." a une duration non defini dans MV.json"); }
		
		$date = new DateTime($wef);
		$timestamp = $date->getTimestamp();
		$result = query_occ_count("LFM".$tv, $tv_duration, $wef, $unt);
	
		for ($i=0; $i<count($result->data->counts->item); $i++) {
			  $date->setTimestamp($timestamp+$i*60);
			  array_push($arr, array($tv, $date->format('Y-m-d'), $date->format('H:i'), $tv_peak, $tv_sustain, $result->data->counts->item[$i]->value->item->value->totalCounts));
		}
	}
	return $arr;
}

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
		$delay_h = (int) substr($r->delay, 0, 2);
		$delay_mn = (int) substr($r->delay, -2);
		$delay = $delay_h*60 + $delay_mn;
		if (substr($r->trafficVolumeId, 0, 2) == $area) {
			array_push($arr, array($r->regulationId, $delay, $r->nrImpactedFlights));
		}
	}
	return $arr;
}

/* -----------------------------------------------------------------
	Récupère les confs déclarés
	@param {string} $airspace - "LFMMCTAE"
	@param {gmdate} $day - gmdate('Y-m-d', strtotime("tomorrow"));
		possible : yesterday, today, tomorrow 
   -----------------------------------------------------------------*/
function get_atc_conf($airspace, $day) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'day'=> $day,
		'airspace' => $airspace
	);
						
	try {
		$output = $soapClientFlow->__soapCall('retrieveSectorConfigurationPlan', array('parameters'=>$params));
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ---------------------------------------------------------------------
		Nombre de vols d'un TV par jour : FlightService
	--------------------------------------------------------------------- */
function get_nb_vols($tv, $wef, $unt) {

	global $soapClientFlight;
	global $receptionTime;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficType'=>'LOAD',
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'requestedFlightFields'=>array('timeAtReferenceLocationEntry','aircraftType','aircraftOperator','actualTakeOffTime','actualTimeOfArrival'),
		'trafficVolume'=>$tv,
		'calculationType'=>'ENTRY'
	);
						
	try {
		$output = $soapClientFlight->__soapCall('queryFlightsByTrafficVolume', array('parameters'=>$params));
		$receptionTime = $output->requestReceptionTime;
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ------------------------------------------
		Ecriture du fichier Excel XLS
		4 onglets H20, Occ, Regul et flights
	------------------------------------------ */
function write_xls($zone, $wef) {

	global $occ_est;
	global $occ_west;
	global $h20_est;
	global $h20_west;
	global $regul;
	global $flights;
		
	$header_occ = array(
	  'TV'=>'string',
	  'Date'=>'date',
	  'Time'=>'string',
	  'Peak'=>'integer',
	  'Sustain'=>'integer',
	  'Occ'=>'integer'
	);
	
	$header_h20 = array(
	  'TV'=>'string',
	  'Date'=>'date',
	  'Time'=>'string',
	  'MV'=>'integer',
	  'H20'=>'integer'
	);
	
	$header_reg = array(
	  'Reg-Id'=>'string',
	  'TV'=>'string',
	  'Date'=>'date',
	  'Début'=>'string',
	  'Fin'=>'string',
	  'Raison'=>'string',
	  'Normal Rate'=>'integer',
	  'Pending Rate'=>'integer',
	  'Equipment Rate'=>'integer',
	  'Total delay'=>'integer',
	  'Vols impactés'=>'integer',
	  'TV-Set'=>'string',
	  'Update Type'=>'string',
	  'Date update'=>'date',
	  'Heure update'=>'string'
	);
	
	$header_flights = array(
	  'TV'=>'string',
	  'Date'=>'date',
	  'Vols'=>'integer',
	);
	
	$style_header = array( 'font'=>'Arial','font-size'=>12,'font-style'=>'bold', 'halign'=>'center');
	$style = array('halign'=>'center');

	$writer = new XLSXWriter();
	$writer->setAuthor('LFMM-FMP'); 
	
	// Occ
	$writer->writeSheetHeader('Occ', $header_occ, $style_header );
		
	foreach(${"occ_".$zone} as $row) {
		$writer->writeSheetRow('Occ', $row, $style);
	}
	
	// H20
	$writer->writeSheetHeader('H20', $header_h20, $style_header );
		
	foreach(${"h20_".$zone} as $row) {
		$writer->writeSheetRow('H20', $row, $style);
	}
	
	// Reg
	$writer->writeSheetHeader('Regul', $header_reg, $style_header );
	if ($zone == "est") {
		foreach($regul["LFMMFMPE"] as $row) {
			$writer->writeSheetRow('Regul', $row, $style);
		}
	}
	if ($zone == "west") {	
		foreach($regul["LFMMFMPW"] as $row) {
			$writer->writeSheetRow('Regul', $row, $style);
		}
	}
	$writer->writeSheetHeader('Regul-App', $header_reg, $style_header );
	foreach($regul["LFMMAPP"] as $row) {
		$writer->writeSheetRow('Regul-App', $row, $style);
	}
	
	// Vols
	$writer->writeSheetHeader('Vols jour', $header_flights, $style_header );
	if ($zone == "est") {
		foreach($flights->LFMMFMPE as $row) {
			$writer->writeSheetRow('Vols jour', $row, $style);
		}
	}
	if ($zone == "west") {
		foreach($flights->LFMMFMPW as $row) {
			$writer->writeSheetRow('Vols jour', $row, $style);
		}
	}
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$dir = dirname(__FILE__)."/xls/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$writer->writeToFile($dir.$d."-Occ-H20-".$zone.".xlsx");

}

/*  ------------------------------------------
		Ecriture du fichier générique csv
		$arr : tableau contenant les données
		$zone : est ou west
		$type : H20, Occ, Reg
		$wef : pour la date du jour
		ex : 20210621-H20-est.csv
	------------------------------------------ */
function write_csv($arr, $zone, $type, $wef) {
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$dir = dirname(__FILE__)."/csv/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	// Open a file in write mode ('w')
	$fp = fopen($dir.$d.$type.$zone.".csv", 'w');
	  
	foreach ($arr as $fields) {
		fputcsv($fp, $fields);
	}
	  
	fclose($fp);
	
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
	$dir = dirname(__FILE__)."/json/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone.".json", 'w');
	fwrite($fp, json_encode($arr));
	fclose($fp);

}
/*  ------------------------------------------
		Ecriture d'un log
		ex : 20210621-log.csv
	------------------------------------------ */
function write_log($occ_text, $reg_text, $vol_text) {
	
	$date = new DateTime();
	$d = $date->format('Ymd');
	$dir = dirname(__FILE__)."/log/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	// Open a file in write mode ('w')
	$fp = fopen($dir.$d."-log.csv", 'w');
	  
	fwrite($fp, $occ_text."\n");
	fwrite($fp, $reg_text."\n");
	fwrite($fp, $vol_text."\n");
		  
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
include_once("hour_config".$config.".inc.php");
	
/*
$wef=gmdate("Y-m-d H:i", mktime(15, 0, 0, 5, 16, 2021));
$unt=gmdate("Y-m-d H:i", mktime(17, 0, 0, 5, 16, 2021));
*/

// récupère les données MV, duration, sustain, peak des TV LFMM
// données du fichier MV.json
// $tve : données de la zone est et $tvw : données west
$fichier_mv = file_get_contents(dirname(__FILE__)."/MV.json");
$obj = json_decode($fichier_mv, true);
$tve = $obj["TV-EST"];
$tvw = $obj["TV-OUEST"];

// récupère les TV que l'on veut compter en H/20 et Occ
// données du fichier TV_count.json
// Attention, il faut que le TV ait une MV, OTMV dans MV.json
$fichier_tv_count = file_get_contents(dirname(__FILE__)."/TV_count.json");
$obj2 = json_decode($fichier_tv_count, true);
$tvs_est = $obj2["TV-EST"];
$tvs_west = $obj2["TV-OUEST"];


// récupère les données H20, Occ et Reg

$occ_est = get_occ("est", $wef_counts, $unt_counts);
$occ_west = get_occ("west", $wef_counts, $unt_counts);
$h20_est = get_entry("est", $wef_counts, $unt_counts);
$h20_west = get_entry("west", $wef_counts, $unt_counts);

$regul = get_regulations("LF", $wef_regs, $unt_regs);
// objet contenant les reguls Europe
$json_atfcm_reg = get_ATFCM_situation();

// ATC conf du lendemain
$airspace1 = "LFMMCTAE";
$airspace2 = "LFMMCTAW";
$tomorrow = gmdate('Y-m-d', strtotime("tomorrow"));
$plan_e = get_atc_conf($airspace1, $tomorrow);
$plan_w = get_atc_conf($airspace2, $tomorrow);
$atc_confs = new stdClass();
$atc_confs->est = $plan_e->data->plan->nmSchedule->item;
$atc_confs->ouest = $plan_w->data->plan->nmSchedule->item;
// confs existantes dans NM pour l'est et l'ouest 
//$atc_confs->known_confs = new stdClass();
//$atc_confs->known_confs->est = $plan_e->data->plan->knownConfigurations->item;
//$atc_confs->known_confs->ouest = $plan_w->data->plan->knownConfigurations->item;

// Counts de LFMMCTAE
// Attention avec les réglages "local", on récupère effectiveTrafficWindow sur 2 jours => $query_LFMMCTA->data->counts->item[0]->value
// Alors qu'en prod, on récupère bien sur 1 journée => data->counts->item->value

$query_LFMMCTA = query_entry_day_count("LFMMCTA");
$today = substr($query_LFMMCTA->data->effectiveTrafficWindow->wef, 0, 10) ;
$counts_LFMMCTA = $query_LFMMCTA->data->counts->item->value->item->value->totalCounts;*/

/*  -----------------------------------------------------------------------
		instanciation soap FLIGHT Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]
	----------------------------------------------------------------------- */

$soapFlight = new B2B("flight");
$soapClientFlight = $soapFlight->get_client();

function get_vols_Est($obj, $tv_arr, $wef, $unt) {
	$obj->LFMMFMPE = array();
	$date = new DateTime($wef);
	foreach($tv_arr as $tv) {
		$res = get_nb_vols($tv, $wef, $unt);
		if ($tv == "LFMRAE") { // la 1ère fois, on remplit ces 2 propriétés
			$obj->requestReceptionTime = $res->requestReceptionTime;
			$obj->status = $res->status;
		}
		array_push($obj->LFMMFMPE, array($tv, $date->format('Y-m-d'), count($res->data->flights)));
		if ($tv == "LFMRAE") $obj->VOLS_RAE = $res->data->flights;
	}
}

function get_vols_West($obj, $tv_arr, $wef, $unt) {
	$obj->LFMMFMPW = array();
	$date = new DateTime($wef);
	foreach($tv_arr as $tv) {
		$res = get_nb_vols($tv, $wef, $unt);
		array_push($obj->LFMMFMPW, array($tv, $date->format('Y-m-d'), count($res->data->flights)));
		if ($tv == "LFMRAW") $obj->VOLS_RAW = $res->data->flights;
	}
}

function get_vols_App($obj, $tv_arr, $wef, $unt) {
	$obj->LFMMAPP = new stdClass();
	$obj->VOLS_APP = new stdClass();
	$date = new DateTime($wef);
	foreach($tv_arr as $tv) {
		$res = get_nb_vols($tv, $wef, $unt);
        // S'il n'y a pas de vol alors pas de property "flights"
        if (property_exists($res->data, "flights")) {
            // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
            if (is_array($res->data->flights)) {
                $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), count($res->data->flights));
            } else {
                $obj->LFMMAPP->$tv = array($tv, $date->format('Y-m-d'), 1);
            }
        } else {
            $obj->LFMMAPP->$tv = array($tv, $date->format('Y-m-d'), 0);
        }
        if (property_exists($res->data, "flights")) {
            // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
            if (is_array($res->data->flights)) {
                $obj->VOLS_APP->$tv = $res->data->flights;
            } else {
                $obj->VOLS_APP->$tv = $res->data->flights;
            }
        } else {
            $obj->VOLS_APP->$tv = new stdClass();
        }
	}
}

include("tab_TV.inc.php");

$flights = new stdClass();
$flights->LFMMCTA = ["LFMMCTA", $today, $counts_LFMMCTA];
get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
get_vols_West($flights, $tab_TVW, $wef_flights, $unt_flights);
get_vols_App($flights, $tab_TVAPP, $wef_flights, $unt_flights);


// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde
// écriture d'un log
// Envoi d'un email en cas d'erreur

try {	
	
	write_xls("est", $wef_counts);
	write_xls("west", $wef_counts);
	
	write_json($occ_est, "est", "-Occ-", $wef_counts);
	write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_est, "est", "-H20-", $wef_counts);
	write_json($h20_west, "west", "-H20-", $wef_counts);
	
	write_json($json_reg, "", "-reg", $wef_counts);
	write_json($json_atfcm_reg->data, "", "-atfcm-reg", $wef_counts);
	write_json($atc_confs, "", "-confs", $wef_counts);
	
	write_json($flights, "", "-vols", $wef_counts);
	

	// logs
	$nbr_vols_rae = $flights->LFMMFMPE[0][2];
	$nbr_vols_raw = $flights->LFMMFMPW[0][2];
	$heure = gmdate('Y-m-d H:i');
	$req_vols = "requete VOLS recue le ".$receptionTime." UTC pour la date du ".$wef_flights." UTC a ".$unt_flights." UTC<br>";
	$req_vols = $req_vols."test nbr vols    RAE: ".$nbr_vols_rae."<br>RAW: ".$nbr_vols_raw."<br>";
	$req_vols = $req_vols."LFMMCTA ".$counts_LFMMCTA." vols<br>";
	$req_vols = $req_vols."Export du ".$heure." UTC terminé";
	echo $req_vols;
	write_log("", "", $req_vols);
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	write_log("", "", $err);
	send_mail();
}


?>