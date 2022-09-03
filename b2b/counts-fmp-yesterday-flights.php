<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("config.inc.php");
include_once("hour_config".$config.".inc.php");
/* 16 mai 2021 15h
$wef=gmdate("Y-m-d H:i", mktime(15, 0, 0, 5, 16, 2021));
$unt=gmdate("Y-m-d H:i", mktime(17, 0, 0, 5, 16, 2021));
*/

/*  ------------------------------------------
		Ecriture du fichier Excel XLS
		4 onglets H20, Occ, Regul et flights
	------------------------------------------ */
function write_xls($zone, $wef, $flights) {
		
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
	
	// Vols
	$writer->writeSheetHeader('Vols jour', $header_flights, $style_header );
	if ($zone == "est") {
		if (isset($flights->LFMMFMPE)) {
			foreach($flights->LFMMFMPE as $row) {
				$writer->writeSheetRow('Vols jour', $row, $style);
			}
		}
	}
	if ($zone == "west") {
		if (isset($flights->LFMMFMPE)) {
			foreach($flights->LFMMFMPW as $row) {
				$writer->writeSheetRow('Vols jour', $row, $style);
			}
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
	
	$writer->writeToFile($dir.$d."-flights-".$zone.".xlsx");

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

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$soapClient = new B2B();
$today = gmdate('Y-m-d', strtotime("today"));

$query_LFMMCTA_LOAD = $soapClient->flowServices()->query_entry_day_count("LFMMCTA","LOAD", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTA_LOAD->data->counts->item)) {
	$counts_LFMMCTA_LOAD = $query_LFMMCTA_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_LOAD = $query_LFMMCTA_LOAD->data->counts->item->value->item->value->totalCounts;
}

echo "get CTA LOAD OK<br>";

$query_LFMMCTA_DEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTA","DEMAND", $wef_flights, $unt_flights);
$today = substr($query_LFMMCTA_DEMAND->data->effectiveTrafficWindow->wef, 0, 10);
if (is_array($query_LFMMCTA_DEMAND->data->counts->item)) {
	$counts_LFMMCTA_DEMAND = $query_LFMMCTA_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_DEMAND = $query_LFMMCTA_DEMAND->data->counts->item->value->item->value->totalCounts;
}

echo "get CTA DEMAND OK<br>";

$query_LFMMCTA_REGDEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTA","REGULATED_DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTA_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTA_REGDEMAND = $query_LFMMCTA_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_REGDEMAND = $query_LFMMCTA_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

echo "get CTA REGULATED_DEMAND OK<br>";

$query_LFMMCTAE_LOAD = $soapClient->flowServices()->query_entry_day_count("LFMMCTAE","LOAD", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAE_LOAD->data->counts->item)) {
	$counts_LFMMCTAE_LOAD = $query_LFMMCTAE_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_LOAD = $query_LFMMCTAE_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAE_DEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAE","DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAE_DEMAND->data->counts->item)) {
	$counts_LFMMCTAE_DEMAND = $query_LFMMCTAE_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_DEMAND = $query_LFMMCTAE_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAE_REGDEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAE","REGULATED_DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAE_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTAE_REGDEMAND = $query_LFMMCTAE_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_REGDEMAND = $query_LFMMCTAE_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_LOAD = $soapClient->flowServices()->query_entry_day_count("LFMMCTAW","LOAD", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAW_LOAD->data->counts->item)) {
	$counts_LFMMCTAW_LOAD = $query_LFMMCTAW_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_LOAD = $query_LFMMCTAW_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_DEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAW","DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAW_DEMAND->data->counts->item)) {
	$counts_LFMMCTAW_DEMAND = $query_LFMMCTAW_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_DEMAND = $query_LFMMCTAW_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_REGDEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAW","REGULATED_DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAW_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTAW_REGDEMAND = $query_LFMMCTAW_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_REGDEMAND = $query_LFMMCTAW_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

echo "get Entry day count Est-West OK<br>";

include("tab_TV.inc.php");

$flights = new stdClass();
$flights->LFMMCTA = ["LFMMCTA", $today, $counts_LFMMCTA_REGDEMAND, $counts_LFMMCTA_LOAD, $counts_LFMMCTA_DEMAND];
$flights->LFMMCTAE = ["LFMMCTAE", $today, $counts_LFMMCTAE_REGDEMAND, $counts_LFMMCTAE_LOAD, $counts_LFMMCTAE_DEMAND];
$flights->LFMMCTAW = ["LFMMCTAW", $today, $counts_LFMMCTAW_REGDEMAND, $counts_LFMMCTAW_LOAD, $counts_LFMMCTAW_DEMAND];
$soapClient->flightServices()->get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
echo "get vols Est OK<br>";
$soapClient->flightServices()->get_vols_West($flights, $tab_TVW, $wef_flights, $unt_flights);
echo "get vols West OK<br>";
$soapClient->flightServices()->get_vols_App($flights, $tab_TVAPP, $tab_ADAPP, $wef_flights, $unt_flights);
echo "get vols App OK<br>";

try {	
	
	write_xls("est", $wef_counts, $flights);
	write_xls("west", $wef_counts, $flights);
		
	write_json($flights, "", "-vols", $wef_counts);
	
}

catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	$soapClient->flightServices()->send_mail($err);
}

?>