<?php
ini_set('memory_limit', '1G');
require_once("capa_class.php");
require_once("xlsxwriter.class.php");
define("WRITE_PATH", "/opt/bitnami/data/steph");

/*	----------------------------------------------------------
	Récupère dans un tableau les dates entre 2 dates incluses
	  @param {object} start_date - String
	  @param {object} end_date - String 
	  @returns {array} - ["2021-06-21", "2021-06-22", ...]
	---------------------------------------------------------- */

function getDatesFromRange(string $start, string $end, string $format = 'Y-m-d') {
      
    $array = array();
    // Variable that store the date interval
    // of period 1 day
    $interval = new DateInterval('P1D');

    $realEnd = new DateTime($end);
    $realEnd->add($interval);
    $period = new DatePeriod(new DateTime($start), $interval, $realEnd);
  
    // Use loop to store date into array
    foreach($period as $date) {                 
        $array[] = $date->format($format); 
    }
  
    // Return the array elements
    return $array;
}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	
	$zone = $decoded["zone"]; // "est" ou "ouest"
	$start_day = $decoded["startDay"];
	$end_day = $decoded["endDay"];
	//echo "Zone: $zone<br>";
	//echo "Start: $start_day<br>";
	//echo "End: $end_day<br>";
	
} else { 
	echo "<br/>pas json<br/>"; 
}

try {	
	$arr_dates = getDatesFromRange($start_day, $end_day);
	//var_dump($arr_dates);

	$header_steph = array(
		'Date'=>'string',
		'Zone'=>'string',
		'Heure'=>'string',
		'ucesos'=>'string'
	);
	
	$style_header = array( 'font'=>'Arial','font-size'=>12,'font-style'=>'bold', 'halign'=>'center');
	$style = array('halign'=>'center');

	$writer = new XLSXWriter();
	$writer->setAuthor('LFMM-FMP'); 

	foreach($arr_dates as $day) {
		$c = new capa($day, $zone);
		$capacite = $c->get_nbpc_dispo();
		//echo "$day - $zone<br><br>";
		//echo "<pre>";
		//var_dump($capacite->uceso);
		//echo "</pre>";
		//write_xls($day, "est", $capacite->uceso);

		$writer->writeSheetHeader('Ucesos', $header_steph, $style_header );
		foreach($capacite->compacted_uceso as $row) {
			$temp = [];
			$temp[0] = $day;
			$temp[1] = $zone;
			$temp[2] = $row[0];
			$temp[3] = $row[2];
			$writer->writeSheetRow('Ucesos', $temp, $style);
		}
		$writer->writeSheetRow('Ucesos', [], $style);
	}

	$start_date = new DateTime($start_day);
	$end_date = new DateTime($end_day);
	$sd = $start_date->format('Ymd');
	$ed = $end_date->format('Ymd');
	$dir = WRITE_PATH."/steph/";
	//$dir = WRITE_PATH;
	
	//echo "Writing...<br>";
	//echo $dir."<br>";

	if (!file_exists($dir)) {
		//echo "dossier inexistant<br>";
		mkdir($dir, 0775, true);
	} else {
		//echo "dossier deja existant<br>";
	}
	$filename = "$sd-$ed-ucesos-$zone.xlsx";
	$writer->writeToFile(WRITE_PATH."/$filename");
	echo $filename;
}

catch (Exception $e) {
	$err = "Erreur, verifier le fichier XLS\n"."Exception reçue : ".$e->getMessage()."\n";
	echo $err;
}

?>