<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
include_once("config.inc.php");
include_once("hour_config".$config.".inc.php");
include_once("path.inc.php");

/*  ------------------------------------------
		Ecriture du fichier Excel XLS
		4 onglets H20, Occ, Regul et flights
	------------------------------------------ */

function write_xls($zone, $wef, $occ_est, $occ_west, $h20_est, $h20_west, $regul, $flights) {
		
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
		if (isset($flights["LFMMFMPE"])) {
			foreach($flights["LFMMFMPE"] as $row) {
				$writer->writeSheetRow('Vols jour', $row, $style);
			}
		}
	}
	if ($zone == "west") {
		if (isset($flights["LFMMFMPW"])) {
			foreach($flights["LFMMFMPW"] as $row) {
				$writer->writeSheetRow('Vols jour', $row, $style);
			}
		}
	}

	// Vols CTA
	$writer->writeSheetHeader('Vols CTAs', $header_cta, $style_header );
	$writer->writeSheetRow('Vols CTAs', $flights["LFMMCTA"], $style);
	$writer->writeSheetRow('Vols CTAs', $flights["LFMMCTAE"], $style);
	$writer->writeSheetRow('Vols CTAs', $flights["LFMMCTAW"], $style);
	
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = WRITE_PATH."/xls/$y/$m/";
	//pour alban DGAC $dir = "J:/Svc_Expl/SUB_CT/FMP/Utilisateurs Bureau FMP/Adonis/Récup B2B NM/xls/$y/$m/";
	
	echo "Writing...<br>";
	echo $dir."<br>";

	if (!file_exists($dir)) {
		echo "dossier inexistant<br>";
		mkdir($dir, 0777, true);
	} else {
		echo "dossier deja existant<br>";
	}
	
	$writer->writeToFile($dir.$d."-Occ-H20-".$zone.".xlsx");

}

/*  ------------------------------------------
		lecture d'un fichier via curl
	------------------------------------------ */

function get_file($url) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	//curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	//curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	$result = curl_exec($ch);
    echo "Fichier: ".$url."<br>";
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	echo "HTTP CODE: " . $status_code."<br>";
    $curl_error = curl_error($ch);
	if ($curl_error !== '') {
        echo "\nCurl Error : $curl_error";
    }
	unset($ch); 
    return [$result, $status_code];
}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$date = new DateTime($wef_counts);
$d = $date->format('Ymd');
$y = $date->format('Y');
$m = $date->format('m');
$dir = DATA_PATH."/$y/$m/";

// ---------------------------------------
// 		récupère les données Reg
// ---------------------------------------
$json_reg_file = get_file($dir."$d-reg.json");
$temp_reg = json_decode($json_reg_file[0], false);

$reg = [];
$reg["LFMMFMPE"] = array();
$reg["LFMMFMPW"] = array();
$reg["LFMMAPP"] = array();

if (isset($temp_reg->LFMMFMPE)) {
	foreach($temp_reg->LFMMFMPE as $r) {
		$id = $r->regId;
		$tv = $r->tv;
		$reason = $r->reason;
		$lastUpdateDate = substr($r->lastUpdate->userUpdateEventTime, 0, 10);
		$lastUpdateTime = substr($r->lastUpdate->userUpdateEventTime, 11, 5);
		$userUpdateType = $r->lastUpdate->userUpdateType;
		$delay = $r->delay;
		$nbrImpactedFlight = $r->impactedFlights;
		$TVSet = $r->TVSet;
		$constraints = $r->constraints;
		for($j=0; $j<count($constraints); $j++) {
			$date = substr($constraints[$j]->constraintPeriod->wef, 0, 10);
			$hdeb = substr($constraints[$j]->constraintPeriod->wef, -5);
			$hfin = substr($constraints[$j]->constraintPeriod->unt, -5);
			array_push($reg[$TVSet], array($id, $tv, $date, $hdeb, $hfin, $reason, $constraints[$j]->normalRate, $constraints[$j]->pendingRate, $constraints[$j]->equipmentRate, $delay, $nbrImpactedFlight, $TVSet, $userUpdateType, $lastUpdateDate, $lastUpdateTime));
		}
	}
} 

if (isset($temp_reg->LFMMFMPW)) {
	foreach($temp_reg->LFMMFMPW as $r) {
		$id = $r->regId;
		$tv = $r->tv;
		$reason = $r->reason;
		$lastUpdateDate = substr($r->lastUpdate->userUpdateEventTime, 0, 10);
		$lastUpdateTime = substr($r->lastUpdate->userUpdateEventTime, 11, 5);
		$userUpdateType = $r->lastUpdate->userUpdateType;
		$delay = $r->delay;
		$nbrImpactedFlight = $r->impactedFlights;
		$TVSet = $r->TVSet;
		$constraints = $r->constraints;
		for($j=0; $j<count($constraints); $j++) {
			$date = substr($constraints[$j]->constraintPeriod->wef, 0, 10);
			$hdeb = substr($constraints[$j]->constraintPeriod->wef, -5);
			$hfin = substr($constraints[$j]->constraintPeriod->unt, -5);
			array_push($reg[$TVSet], array($id, $tv, $date, $hdeb, $hfin, $reason, $constraints[$j]->normalRate, $constraints[$j]->pendingRate, $constraints[$j]->equipmentRate, $delay, $nbrImpactedFlight, $TVSet, $userUpdateType, $lastUpdateDate, $lastUpdateTime));
		}
	}
} 

if (isset($temp_reg->LFMMAPP)) {
	foreach($temp_reg->LFMMAPP as $r) {
		$id = $r->regId;
		$tv = $r->tv;
		$reason = $r->reason;
		$lastUpdateDate = substr($r->lastUpdate->userUpdateEventTime, 0, 10);
		$lastUpdateTime = substr($r->lastUpdate->userUpdateEventTime, 11, 5);
		$userUpdateType = $r->lastUpdate->userUpdateType;
		$delay = $r->delay;
		$nbrImpactedFlight = $r->impactedFlights;
		$TVSet = $r->TVSet;
		$constraints = $r->constraints;
		for($j=0; $j<count($constraints); $j++) {
			$date = substr($constraints[$j]->constraintPeriod->wef, 0, 10);
			$hdeb = substr($constraints[$j]->constraintPeriod->wef, -5);
			$hfin = substr($constraints[$j]->constraintPeriod->unt, -5);
			array_push($reg[$TVSet], array($id, $tv, $date, $hdeb, $hfin, $reason, $constraints[$j]->normalRate, $constraints[$j]->pendingRate, $constraints[$j]->equipmentRate, $delay, $nbrImpactedFlight, $TVSet, $userUpdateType, $lastUpdateDate, $lastUpdateTime));
		}
	}
} 

//var_dump($temp_reg);
echo "get regulation OK<br>";

// Vols
$json_flights_file = get_file($dir."$d-vols.json");
$flights = json_decode($json_flights_file[0], true);
//var_dump($flights);

echo "get conf jour OK<br>"; 

// Occ et H20
$json_h20_est_file = get_file($dir."$d-H20-est.json");
$h20_est = json_decode($json_h20_est_file[0], true);
$json_h20_west_file = get_file($dir."$d-H20-west.json");
$h20_west = json_decode($json_h20_west_file[0], true);

$json_occ_est_file = get_file($dir."$d-Occ-est.json");
$occ_est = json_decode($json_occ_est_file[0], true);
$json_occ_west_file = get_file($dir."$d-Occ-west.json");
$occ_west = json_decode($json_occ_west_file[0], true);

echo "get H20 & Occ OK<br>";


try {	
	
	write_xls("est", $wef_counts, $occ_est, $occ_west, $h20_est, $h20_west, $reg, $flights);
	write_xls("west", $wef_counts, $occ_est, $occ_west, $h20_est, $h20_west, $reg, $flights);
	
}

catch (Exception $e) {
	$err = "Erreur, verifier le fichier XLS\n"."Exception reçue : ".$e->getMessage()."\n";
	echo $err;
	//$soapClient->flightServices()->send_mail($err);
}

?>