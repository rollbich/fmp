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

/*  --------------------------------------------------
					Appel b2b
		récupère le H20 (duration 60, step 20)
		dans la plage horaire $wef-$unt en heure UTC
	-------------------------------------------------- */
function query_entry_count($tv, $wef, $unt, $trafficType) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>$trafficType),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'subTotalComputeMode'=>'NO_SUB_TOTALS',
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
function query_occ_count($tv, $tv_duration, $wef, $unt, $trafficType) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>$trafficType),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'subTotalComputeMode'=>'NO_SUB_TOTALS',
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
function get_entry($zone, $wef, $unt, $trafficType) {
	
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
		$result = query_entry_count("LFM".$tv, $wef, $unt, $trafficType);

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

function get_occ($zone, $wef, $unt, $trafficType) {
	
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
		$result = query_occ_count("LFM".$tv, $tv_duration, $wef, $unt, $trafficType);
		
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
	  'Load'=>'integer',
	  'Demand'=>'integer'
	);
	
	$header_h20 = array(
	  'TV'=>'string',
	  'Date'=>'date',
	  'Time'=>'string',
	  'MV'=>'integer',
	  'Load'=>'integer',
	  'Demand'=>'integer'
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

	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$h = $date->format('H');
	$dir = dirname(__FILE__)."/xls/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$writer->writeToFile($dir.$d."-Occ-H20-".$zone.$h."20.xlsx");

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
	$m = $date->format('m');
	$h = $date->format('H');
	$dir = dirname(__FILE__)."/json/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone.$h."20.json", 'w');
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
	$h = $date->format('Hi');
	$dir = dirname(__FILE__)."/log/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	// Open a file in write mode ('w')
	$fp = fopen($dir.$d.$h."-log.csv", 'w');
	  
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
include_once("hour_config".$config."-matin.inc.php");
	
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

// ---------------------------------------
// 		récupère les données H20, Occ
// ---------------------------------------

$h20_est = get_entry("est", $wef_counts, $unt_counts, "LOAD");
//$h20_est2 = get_entry("est", $wef_counts, $unt_counts, "DEMAND");
//$h20_west = get_entry("west", $wef_counts, $unt_counts, "LOAD");
//$h20_west2 = get_entry("west", $wef_counts, $unt_counts, "DEMAND");

$occ_est = get_occ("est", $wef_counts, $unt_counts, "LOAD");
//$occ_est2 = get_occ("est", $wef_counts, $unt_counts, "DEMAND");
//$occ_west = get_occ("west", $wef_counts, $unt_counts, "LOAD");
//$occ_west2 = get_occ("west", $wef_counts, $unt_counts, "DEMAND");


/*
// ------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux de H20
//	@params (array) : [ ["RAE", "2022-06-07", "05:20", mv, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-06-07", "05:20", mv, regulated_demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "05:20", mv, load, demand], [...] ]
// -------------------------------------------------------------------------------------------
$h20_est = array();
$h20_west = array();
foreach($h20_est1 as $key=>$val) {
	array_push($val, $h20_est2[$key][4]);
    array_push($h20_est, $val);
}
foreach($h20_west1 as $key=>$val) {
	array_push($val, $h20_west2[$key][4]);
    array_push($h20_west, $val);
}

// ----------------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux Occ
//	@params (array) : [ ["RAE", "2022-07-07", "17:48", peak, sustain, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-07-07", "17:48", peak, sustain, regulated_demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "17:48", peak, sustain, load, regulated_demand], [...] ]
// ----------------------------------------------------------------------------------------------------

$occ_est = array();
$occ_west = array();
foreach($occ_est1 as $key=>$val) {
	array_push($val, $occ_est2[$key][5]);
    array_push($occ_est, $val);
}
foreach($occ_west1 as $key=>$val) {
	array_push($val, $occ_west2[$key][5]);
    array_push($occ_west, $val);
}
*/
// ---------------------------------------
// 		récupère les données Reg
// ---------------------------------------
$regul = get_regulations("LF", $wef_regs, $unt_regs);


// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde
// écriture d'un log
// Envoi d'un email en cas d'erreur

try {	
	
	write_xls("est", $wef_counts);
	//write_xls("west", $wef_counts);
	
	write_json($occ_est, "est", "-Occ-", $wef_counts);
	//write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_est, "est", "-H20-", $wef_counts);
	//write_json($h20_west, "west", "-H20-", $wef_counts);
	
	write_json($json_reg, "", "-reg", $wef_counts);
	echo "<br>Recup OK<br>";
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>