<?php

/*  --------------------------------------------------------------
		sauvegarde le fichier des vols weekly tous les lundis
	--------------------------------------------------------------  */

$one_week = new DateInterval('P7D');
$one_day = new DateInterval('P1D');

$monday_last_week = new DateTime();
$monday_last_week->sub($one_week);
$monday = new DateTime();

$year = $monday_last_week->format('Y');
$week_number = getWeekNumber($monday_last_week);
$arr = get_date_array($monday_last_week, $monday);

echo "Year: ".$year."<br>";
echo "Week number: ".$week_number."<br>";

// chemin d'accès à votre fichier JSON
$file = $year.'-weekly-flights.json';
// existence
if (file_exists($file)) {
    // mettre le contenu du fichier dans une variable
    $data = file_get_contents("json/".$file); 
    // décoder le flux JSON
    $json_year = json_decode($data);
} else {
    $json_year = new stdClass();
    $json_year->year = $year;
    $json_year->est = new stdClass();
    $json_year->west = new stdClass();
    $json_year->cta = new stdClass();
}

$json_year->est->$week_number = $arr[1];
$json_year->west->$week_number = $arr[2];
$json_year->cta->$week_number = $arr[0];

var_dump($json_year);
write_json($json_year);

// get all json from file Between 2 Dates non incluse la dernière date
function get_date_array($dateTime1, $dateTime2) {
    //$array = array(); 
    $period = new DatePeriod(
        $dateTime1,
        new DateInterval('P1D'),
        $dateTime2
    );
    $cta =0;
    $est = 0;
    $west = 0;
    foreach ($period as $key => $value) {
        $file_name = $value->format('Ymd')."-vols.json";
        $data = file_get_contents("json/".$file_name);
        $donnees = json_decode($data);
        $cta += intval($donnees->LFMMCTA[2]);
        foreach ($donnees->LFMMFMPE as $value) {
            if ($value[0] == "LFMRAE") $est += intval($value[2]);
        }
        foreach ($donnees->LFMMFMPW as $value) {
            if ($value[0] == "LFMRAW") $west += intval($value[2]);
        } 
        //$array[] = json_decode($donnees);  
        //$array[] = $file_name;
    }
    return [$cta, $est, $west];
}

// weeknumber of a date
function getWeekNumber($datetime) {
    return idate('W', $datetime->getTimestamp());
}

// Calcul du nombre de semaines ISO
// the last week of the year always includes 28 December.
function getIsoWeeksInYear($year) {
    return idate('W', mktime(0, 0, 0, 12, 28, $year));
}

// To get the start of the week (Monday at midnight) as a DateTime object
function getFirstMondayofWeekNumber($year, $week) {
    $date = new DateTime('midnight'); 
    $date->setISODate($year, $week);
    return $date;
}

// ajoute 6 jours
function addDays($datetime) {
    $datetime->modify('+6 day');
    return $datetime;
}

function write_json($json) {
	$year = $json->year;
	$fp = fopen("json/".$year."-weekly-flights.json", 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
	
}

?>