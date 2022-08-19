<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-functions.inc.php");

/*  --------------------------------------------------
		LFMM-FMP.FR : tâche CRON à 01h42dev/01h56 loc
    -------------------------------------------------- */

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
	
	$header_flights = array(
	  'TV'=>'string',
	  'Date'=>'date',
	  'Vols'=>'integer'
	);

	$header_cta = array(
	  'Airspace'=>'string',
	  'Date'=>'date',
	  'RegDemand'=>'integer',
	  'Load'=>'integer',
	  'Demand'=>'integer'
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

	// Vols CTA
	$writer->writeSheetHeader('Vols CTAs', $header_cta, $style_header );
	$writer->writeSheetRow('Vols CTAs', $flights->LFMMCTA, $style);
	$writer->writeSheetRow('Vols CTAs', $flights->LFMMCTAE, $style);
	$writer->writeSheetRow('Vols CTAs', $flights->LFMMCTAW, $style);
	
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = dirname(__FILE__)."/xls/$y/$m/";
	
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
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = dirname(__FILE__)."/csv/$y/$m/";
	
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
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = dirname(__FILE__)."/json/$y/$m/";
	
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
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = dirname(__FILE__)."/log/$y/$m/";
	
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

// ---------------------------------------
// 		récupère les données H20, Occ
// ---------------------------------------
$occ_est1 = get_occ("est", $wef_counts, $unt_counts, "LOAD");
$occ_est2 = get_occ("est", $wef_counts, $unt_counts, "DEMAND");
$occ_west1 = get_occ("west", $wef_counts, $unt_counts, "LOAD");
$occ_west2 = get_occ("west", $wef_counts, $unt_counts, "DEMAND");
$h20_est1 = get_entry("est", $wef_counts, $unt_counts, "LOAD");
$h20_est2 = get_entry("est", $wef_counts, $unt_counts, "DEMAND");
$h20_west1 = get_entry("west", $wef_counts, $unt_counts, "LOAD");
$h20_west2 = get_entry("west", $wef_counts, $unt_counts, "DEMAND");

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

// ---------------------------------------
// 		récupère les données Reg
// ---------------------------------------
$regul = get_regulations("LF", $wef_regs, $unt_regs);
// objet contenant les reguls Europe
$json_atfcm_reg = get_ATFCM_situation();

// ATC conf du jour
$airspace1 = "LFMMCTAE";
$airspace2 = "LFMMCTAW";
$today = gmdate('Y-m-d', strtotime("today"));
$plan_e = get_atc_conf($airspace1, $today);
$plan_w = get_atc_conf($airspace2, $today);
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

$query_LFMMCTAE_LOAD = query_entry_day_count("LFMMCTAE","LOAD");
if (is_array($query_LFMMCTAE_LOAD->data->counts->item)) {
	$counts_LFMMCTAE_LOAD = $query_LFMMCTAE_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_LOAD = $query_LFMMCTAE_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAE_DEMAND = query_entry_day_count("LFMMCTAE","DEMAND");
if (is_array($query_LFMMCTAE_DEMAND->data->counts->item)) {
	$counts_LFMMCTAE_DEMAND = $query_LFMMCTAE_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_DEMAND = $query_LFMMCTAE_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAE_REGDEMAND = query_entry_day_count("LFMMCTAE","REGULATED_DEMAND");
if (is_array($query_LFMMCTAE_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTAE_REGDEMAND = $query_LFMMCTAE_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_REGDEMAND = $query_LFMMCTAE_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_LOAD = query_entry_day_count("LFMMCTAW","LOAD");
if (is_array($query_LFMMCTAW_LOAD->data->counts->item)) {
	$counts_LFMMCTAW_LOAD = $query_LFMMCTAW_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_LOAD = $query_LFMMCTAW_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_DEMAND = query_entry_day_count("LFMMCTAW","DEMAND");
if (is_array($query_LFMMCTAW_DEMAND->data->counts->item)) {
	$counts_LFMMCTAW_DEMAND = $query_LFMMCTAW_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_DEMAND = $query_LFMMCTAW_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_REGDEMAND = query_entry_day_count("LFMMCTAW","REGULATED_DEMAND");
if (is_array($query_LFMMCTAW_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTAW_REGDEMAND = $query_LFMMCTAW_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_REGDEMAND = $query_LFMMCTAW_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTA_LOAD = query_entry_day_count("LFMMCTA","LOAD");
if (is_array($query_LFMMCTA_LOAD->data->counts->item)) {
	$counts_LFMMCTA_LOAD = $query_LFMMCTA_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_LOAD = $query_LFMMCTA_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTA_DEMAND = query_entry_day_count("LFMMCTA","DEMAND");
$today = substr($query_LFMMCTA_DEMAND->data->effectiveTrafficWindow->wef, 0, 10);
if (is_array($query_LFMMCTA_DEMAND->data->counts->item)) {
	$counts_LFMMCTA_DEMAND = $query_LFMMCTA_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_DEMAND = $query_LFMMCTA_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTA_REGDEMAND = query_entry_day_count("LFMMCTA","REGULATED_DEMAND");
if (is_array($query_LFMMCTA_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTA_REGDEMAND = $query_LFMMCTA_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_REGDEMAND = $query_LFMMCTA_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

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
		$res = get_nb_vols_TV($tv, $wef, $unt);
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
		$res = get_nb_vols_TV($tv, $wef, $unt);
		array_push($obj->LFMMFMPW, array($tv, $date->format('Y-m-d'), count($res->data->flights)));
		if ($tv == "LFMRAW") $obj->VOLS_RAW = $res->data->flights;
	}
}

function get_vols_App($obj, $tv_arr, $tv_arr2, $wef, $unt) {
	$obj->LFMMAPP = new stdClass();
	$obj->VOLS_APP = new stdClass();
	$date = new DateTime($wef);
	$total_app = 0;
	foreach($tv_arr as $tv) {
		$res = get_nb_vols_TV($tv, $wef, $unt);
		$nb_flight = 0;
        // S'il n'y a pas de vol alors pas de property "flights"
        if (property_exists($res->data, "flights")) {
            // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
            if (is_array($res->data->flights)) {
				$nb_flight = count($res->data->flights);
                $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), count($res->data->flights));
            } else {
				$nb_flight = 1;
                $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 1);
            }
        } else {
			$nb_flight = 0;
            $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 0);
        }
		$total_app += $nb_flight;
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
	foreach($tv_arr2 as $tv) {
		$res = get_nb_vols_AD($tv, $wef, $unt);
		$nb_flight = 0;
        // S'il n'y a pas de vol alors pas de property "flights"
        if (property_exists($res->data, "flights")) {
            // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
            if (is_array($res->data->flights)) {
				$nb_flight = count($res->data->flights);
                $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), count($res->data->flights));
            } else {
				$nb_flight = 1;
                $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 1);
            }
        } else {
			$nb_flight = 0;
            $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 0);
        }
		$total_app += $nb_flight;
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
	$obj->LFMMAPP->flights = $total_app;
}

include("tab_TV.inc.php");

$flights = new stdClass();
$flights->LFMMCTA = ["LFMMCTA", $today, $counts_LFMMCTA_REGDEMAND, $counts_LFMMCTA_LOAD, $counts_LFMMCTA_DEMAND];
$flights->LFMMCTAE = ["LFMMCTAE", $today, $counts_LFMMCTAE_REGDEMAND, $counts_LFMMCTAE_LOAD, $counts_LFMMCTAE_DEMAND];
$flights->LFMMCTAW = ["LFMMCTAW", $today, $counts_LFMMCTAW_REGDEMAND, $counts_LFMMCTAW_LOAD, $counts_LFMMCTAW_DEMAND];
get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
get_vols_West($flights, $tab_TVW, $wef_flights, $unt_flights);
get_vols_App($flights, $tab_TVAPP, $tab_ADAPP, $wef_flights, $unt_flights);

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
	$req_vols = $req_vols."LFMMCTA load ".$counts_LFMMCTA_LOAD." vols --- demand ".$counts_LFMMCTA_DEMAND." vols --- regdemand ".$counts_LFMMCTA_REGDEMAND." vols<br>";
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