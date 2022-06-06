<?php

/*  --------------------------------------------------------------
		sauvegarde le fichier des vols weekly tous les lundis
	--------------------------------------------------------------  */

$one_week = new DateInterval('P7D');
$one_day = new DateInterval('P1D');

$d = "2021-01-11";
$monday_last_week = new DateTime($d);
$monday_last_week->sub($one_week);
$monday = new DateTime($d);

for ($i = 1; $i <= 52; $i++) {

    $week_number = getWeekNumber($monday_last_week);
    if ((int) $week_number === 1) {
        $year = $monday->format('Y');
    } else {
        $year = $monday_last_week->format('Y');
    }

    echo "Year: ".$year."<br>";
    echo "Week number: ".$week_number."<br>";

    $arr_traffic = get_weekly_traffic($monday_last_week, $monday);
    $file_traffic = "localhost/fmp/b2b/json/".$year.'-weekly-flights.json';
    process_file_traffic($file_traffic, $arr_traffic, $week_number, $year);

    $arr_reguls = get_weekly_regs($monday_last_week, $monday);
    $file_reg = "localhost/fmp/b2b/json/".$year.'-weekly-reg.json';
    process_file_reg($file_reg, $arr_reguls, $week_number, $year);

    $monday_last_week->add($one_week);
    $monday->add($one_week);

}

/*  ----------------------------------------------------
                     Weekly Traffic
    ---------------------------------------------------- */


// get all json traffic files file Between 2 Dates non incluse la dernière date
function get_weekly_traffic($dateTime1, $dateTime2) {
    //$array = array(); 
    $period = new DatePeriod(
        $dateTime1,
        new DateInterval('P1D'),
        $dateTime2
    );
    $cta = 0;
    $est = 0;
    $west = 0;
    $app = 0;
    foreach ($period as $key => $value) {
        //$file_name = $value->format('Ymd')."-vols.json";
        $file_name = "localhost/fmp/b2b/json/".$value->format('Ymd')."-vols.json";
        //$data = file_get_contents("./json/".$file_name);
        $data = get_file($file_name);
        $donnees = json_decode($data[0]);
        $cta += intval($donnees->LFMMCTA[2]);
        $est += intval($donnees->LFMMCTAE[2]);
        $west += intval($donnees->LFMMCTAW[2]);
        $app += intval($donnees->LFMMAPP->flights);
    }
    return [$cta, $est, $west, $app];
}

/*  ----------------------------------------------------
                     Weekly Regs
    ---------------------------------------------------- */

// get all json reg files file Between 2 Dates non incluse la dernière date
function get_weekly_regs($dateTime1, $dateTime2) {

    $period = new DatePeriod(
        $dateTime1,
        new DateInterval('P1D'),
        $dateTime2
    );
    // Chargement de tous les fichiers, tableau d'object journalier
    $donnees = [];
    foreach ($period as $key => $value) {
        $file_name = "localhost/fmp/b2b/json/".$value->format('Ymd')."-reg.json";
        $data = get_file($file_name);
        array_push($donnees, json_decode($data[0]));
    }

    // Récupération des tvset
    $tvsetall = array_keys(get_object_vars($donnees[0]));

    // Config de l'object $result
    $result = new stdClass();
    foreach ($tvsetall as $tvset) {
        $result->$tvset = new stdClass();
        $result->$tvset->delay = 0;
        $result->$tvset->causes = new stdClass();
    }

    // Calcul des délais et des causes
    foreach ($donnees as $obj_jour) {
        foreach ($tvsetall as $tvset) {
            foreach ($obj_jour->$tvset as $obj) { 
                $result->$tvset->delay += intval($obj->delay);
                $r = $obj->reason;
                if (!isset($result->$tvset->causes->$r)) $result->$tvset->causes->$r = 0;
                $result->$tvset->causes->$r += intval($obj->delay);
            }
        }
    }
    //var_dump($result);
    return $result;
}

/*  -----------------------------------------------------------------------------
            Process files
     file_get_contents ne fonctionne pas en prod mais seulement en local 
        => on utilise curl
    ----------------------------------------------------------------------------- */

function process_file_traffic($file, $arr, $week_number, $year) {
    $data = get_file($file);
    // existence du fichier
    if ($data[1] == 200) {
        echo "Fichier ".$file." existant"."<br>";
        $json_year = json_decode($data[0]);
        var_dump($json_year);
        echo "<br>";
    } else {
        echo "Fichier ".$file." inexistant"."<br>";
        $json_year = new stdClass();
        $json_year->year = intval($year);
        $json_year->est = new stdClass();
        $json_year->west = new stdClass();
        $json_year->cta = new stdClass();
    }

    $json_year->est->$week_number = $arr[1];
    $json_year->west->$week_number = $arr[2];
    $json_year->cta->$week_number = $arr[0];
    $json_year->app->$week_number = $arr[3];

    echo "Nouveau json traffic"."<br>";
    var_dump($json_year);
    write_json_traffic($json_year, $year);
}

function process_file_reg($file, $arr, $week_number, $year) {
    // Récupération des tvset
    $tvsetall = array_keys(get_object_vars($arr));

    $data = get_file($file);
    // existence du fichier
    if ($data[1] == 200) {
        echo "Fichier ".$file." existant"."<br>";
        $json_year = json_decode($data[0]);
        var_dump($json_year);
        echo "<br>";
    } else {
        echo "Fichier ".$file." inexistant"."<br>";
        $json_year = new stdClass();
        $json_year->year = intval($year);
    }

    foreach ($tvsetall as $tvset) {
        $json_year->$week_number = $arr;
    }
    
    echo "Nouveau json reg"."<br>";
    var_dump($json_year);
    write_json_reg($json_year, $year);
    
}

/*  ----------------------------------------------------
                     Utilities
    ---------------------------------------------------- */

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

// ne fonctionne pas sans dirname(__FILE__)
function write_json_traffic($json, $year) {
	$fp = fopen(dirname(__FILE__)."/json/".$year."-weekly-flights.json", 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
}

function write_json_reg($json, $year) {
	$fp = fopen(dirname(__FILE__)."/json/".$year."-weekly-reg.json", 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
}

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
	echo curl_error($ch);
	curl_close($ch);  
    return [$result, $status_code];
}

?>