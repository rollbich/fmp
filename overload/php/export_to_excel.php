<?php
include_once("xlsxwriter.class.php");

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

/*  --------------------------------------------------------------
	"filtre": % du filtre,
	"data" : [ [date, tv, heure, count, mv, pourcentage_mv], ... ]
	--------------------------------------------------------------  */

$filtre = "";
$zone = "";
$week = 0;
$annee = 0;

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	if (is_array($decoded)) {
		global $filtre, $zone, $week, $annee;
		$filtre = $decoded["filtre"];
		$zone = $decoded["zone"];
		$data = $decoded["data"];
		$range = $decoded["range"];
		$excel = array();
		$d = new DateTime($range[0]); // date du 1er jour 
		$d2 = new DateTime($range[1]); // date du dernier jour 
		$week = $d->format("W"); // numéro de la semaine
		$annee = $d->format("Y"); // année
		if ($week == 1) $annee = $d2->format("Y"); // en semaine 1, le dernier jour est dans la bonne année
		for ($i = 0; $i < count($data); $i++) {
			$temp = new DateTime($data[$i][0]);
			$date = $temp->format('Y-m-d');
			$tv = $data[$i][1];
			$heure = $data[$i][2];
			$count = $data[$i][3];
			$mv = $data[$i][4];
			$pourcentage_mv = $data[$i][5];
			array_push($excel, array($date, $tv, $heure, $count, $mv, $pourcentage_mv));
		}
		write_xls($excel);
		
		$dir = "../xls/".$annee."/";
		$nom = $dir.$annee."-Sem".$week."-capa-".$filtre."%-".$zone.".xlsx";
		echo "OK ".$nom;
	} else {
		echo "Impossible de décoder le fichier JSON";
		// Error  
	}
} else { echo "Erreur : données non json<br/>"; }


	
function write_xls($excel) {

	$header = array(
		'Date'=>'date',
		'TV'=>'string',
		'Heure'=>'string',
		'H/20'=>'integer',
		'MV'=>'integer',
		'% MV'=>'integer'
	);

	global $filtre, $zone, $week, $annee;

	$style_header = array( 'font'=>'Arial','font-size'=>12,'font-style'=>'bold', 'halign'=>'center');
	$style = array('halign'=>'center');

	$writer = new XLSXWriter();
	$writer->setAuthor('LFMM-FMP'); 
		
	$writer->writeSheetHeader('Capa', $header, $style_header );
		
	foreach($excel as $row) {
		$writer->writeSheetRow('Capa', $row, $style);
	}
	
	$dir = "../xls/".$annee."/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	$nom = $dir.$annee."-Sem".$week."-capa-".$filtre."%-".$zone.".xlsx";
	$writer->writeToFile($nom);
	
}

?>