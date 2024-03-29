<?php

include_once("path.inc.php");
$data_path = DATA_PATH."/$year/";
if (!file_exists($data_path)) {
    mkdir($data_path, 0775, true);
}
define("FLIGHTS_SUFFIX", "-weekly-flights.json");
define("REG_SUFFIX", "-weekly-reg.json");

/*  ---------------------------------------------------------------
		sauvegarde le fichier des vols weekly pour toute l'année
	---------------------------------------------------------------  */

function calcul_semaine($year, $week_number) {
    // premier et dernier jour de la semaine à calculer
    $first_day_of_week = getFirstMondayofWeekNumber($year, $week_number);
    $last_day_of_week = getFirstMondayofWeekNumber($year, $week_number);
    $one_week = new DateInterval('P7D');
    $last_day_of_week->add($one_week);
    $first_day_year = $first_day_of_week->format('Y');
    $first_day_month = $first_day_of_week->format('m');

    // faire avec le week number car le 1er jour pourrait être une année et le numéro de week celle d'après
    if ((int) $week_number === 1 && (int) $first_day_month === 12) {
        $year = (int) $first_day_year + 1;
    } else {
        $year = (int) $first_day_year;
    }

    echo "Year: $year<br>";
    echo "Week number: $week_number<br>";
    echo "First day of week: ".$first_day_of_week->format('Y-m-d')."<br>";
    echo "Last day of week: (non inclus)".$last_day_of_week->format('Y-m-d')."<br>";

    $arr_traffic = get_weekly_traffic($first_day_of_week, $last_day_of_week);
    $file_traffic = DATA_PATH."/$year/$year".FLIGHTS_SUFFIX;
    //$file_traffic = "https://dev.lfmm-fmp.fr/b2b/json/$year/$year-weekly-flights.json";
    //$file_traffic = "https://lfmm-fmp.fr/b2b/json/$year/$year-weekly-flights.json";
    process_file_traffic($file_traffic, $arr_traffic, $week_number, $year);

    $arr_reguls = get_weekly_regs($first_day_of_week, $last_day_of_week);
    $file_reg = DATA_PATH."/$year/$year".REG_SUFFIX;
    //$file_reg = "https://dev.lfmm-fmp.fr/b2b/json/$year/$year-weekly-reg.json";
    //$file_reg = "https://lfmm-fmp.fr/b2b/json/$year/$year-weekly-reg.json";
    process_file_reg($file_reg, $arr_reguls, $week_number, $year);

}

// recalcule toute l'année
function calcul_year($year) {
    $nb_weeks = getIsoWeeksInYear($year);
    for ($i = 1 ; $i <= $nb_weeks; $i++) {
        calcul_semaine($year, $i);
    }
}

calcul_year(2023);

/*
$one_week = new DateInterval('P7D');
$one_day = new DateInterval('P1D');

// date du lundi de la semaine à calculer (1er jour)
$y = 2022;
$d = "2022-10-03";
$first_day = new DateTime($d);
$last_day = new DateTime($d);
$last_day->add($one_week);

function calcul(DateTime $first_day_of_week, DateTime $last_day_of_week) {
    // numéro de la semaine à calculer
    $week_number = getWeekNumber($first_day_of_week);
    $first_day_year = $first_day_of_week->format('Y');
    $first_day_month = $first_day_of_week->format('m');

    // faire avec le week number car le 1er jour pourrait être une année et le numéro de week celle d'après
    if ((int) $week_number === 1 && (int) $first_day_month === 12) {
        $year = (int) $first_day_year + 1;
    } else {
        $year = (int) $first_day_year;
    }

    echo "Year: ".$year."<br>";
    echo "Week number: ".$week_number."<br>";

    $arr_traffic = get_weekly_traffic($first_day_of_week, $last_day_of_week);
    //$file_traffic = "localhost/fmp/b2b/json/$year/$year-weekly-flights.json";
    //$file_traffic = "https://dev.lfmm-fmp.fr/b2b/json/$year/$year-weekly-flights.json";
    $file_traffic = "https://lfmm-fmp.fr/b2b/json/$year/$year-weekly-flights.json";
    process_file_traffic($file_traffic, $arr_traffic, $week_number, $year);

    $arr_reguls = get_weekly_regs($first_day_of_week, $last_day_of_week);
    //$file_reg = "localhost/fmp/b2b/json/$year/$year-weekly-reg.json";
    //$file_reg = "https://dev.lfmm-fmp.fr/b2b/json/$year/$year-weekly-reg.json";
    $file_reg = "https://lfmm-fmp.fr/b2b/json/$year/$year-weekly-reg.json";
    process_file_reg($file_reg, $arr_reguls, $week_number, $year);

}

//calcul($first_day, $last_day);
*/


/*  ----------------------------------------------------
                     Weekly Traffic
    ---------------------------------------------------- */


// get all json traffic files file Between 2 Dates non incluse la dernière date
function get_weekly_traffic(DateTime $dateTime1, DateTime $dateTime2) {
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
        $year = $value->format('Y');
        $month = $value->format('m');
        $d = $value->format('Ymd');
        $file_name = DATA_PATH."/$year/$month/$d-vols.json";
        //$file_name = "https://dev.lfmm-fmp.fr/b2b/json/$year/$month/$d-vols.json";
        //$file_name = "https://lfmm-fmp.fr/b2b/json/$year/$month/$d-vols.json";
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
        $year = $value->format('Y');
        $month = $value->format('m');
        $d = $value->format('Ymd');
        $file_name = DATA_PATH."/$year/$month/$d-reg.json";
        //$file_name = "https://dev.lfmm-fmp.fr/b2b/json/$year/$month/$d-reg.json";
        //$file_name = "https://lfmm-fmp.fr/b2b/json/$year/$month/$d-reg.json";
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
        echo "<br>Fichier ".$file." existant"."<br>";
        $json_year = json_decode($data[0]);
        //var_dump($json_year);
        echo "<br>";
    } else {
        echo "<br>Fichier ".$file." inexistant"."<br>";
        $json_year = new stdClass();
        $json_year->year = intval($year);
        $json_year->est = new stdClass();
        $json_year->west = new stdClass();
        $json_year->cta = new stdClass();
        $json_year->app = new stdClass();
    }

    $json_year->est->$week_number = $arr[1];
    $json_year->west->$week_number = $arr[2];
    $json_year->cta->$week_number = $arr[0];
    $json_year->app->$week_number = $arr[3];

    echo "Nouveau json traffic"."<br>";
    //var_dump($json_year);
    write_json_traffic($json_year, $year);
}

function process_file_reg($file, $arr, $week_number, $year) {
    // Récupération des tvset
    $tvsetall = array_keys(get_object_vars($arr));

    $data = get_file($file);
    // existence du fichier
    if ($data[1] == 200) {
        echo "<br>Fichier ".$file." existant"."<br>";
        $json_year = json_decode($data[0]);
        //var_dump($json_year);
        echo "<br>";
    } else {
        echo "<br>Fichier ".$file." inexistant"."<br>";
        $json_year = new stdClass();
        $json_year->year = intval($year);
    }

    foreach ($tvsetall as $tvset) {
        $json_year->$week_number = $arr;
    }
    
    echo "Nouveau json reg"."<br>";
    //var_dump($json_year);
    write_json_reg($json_year, $year);
    
}

/*  ----------------------------------------------------
                     Utilities
    ---------------------------------------------------- */

// weeknumber of a date
function getWeekNumber(DateTime $datetime) {
    return idate('W', $datetime->getTimestamp());
}

// Calcul du nombre de semaines ISO
// the last week of the year always includes 28 December.
function getIsoWeeksInYear(int $year) {
    return idate('W', mktime(0, 0, 0, 12, 28, $year));
}

// To get the start of the week (Monday at midnight) as a DateTime object
function getFirstMondayofWeekNumber(int $year, int $week) {
    $date = new DateTime('midnight'); 
    $date->setISODate($year, $week);
    return $date;
}

// ajoute 6 jours
function addDays(DateTime $datetime) {
    $datetime->modify('+6 day');
    return $datetime;
}

// 
function write_json_traffic($json, $year) {
	$fp = fopen(WRITE_PATH."/json/$year/$year".FLIGHTS_SUFFIX, 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
}

function write_json_reg($json, $year) {
	$fp = fopen(WRITE_PATH."/json/$year/$year".REG_SUFFIX, 'w');
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
	echo "HTTP CODE: " . $status_code."<br>\n";
	$curl_error = curl_error($ch);
	if ($curl_error !== '') {
        echo "\nCurl Error : $curl_error";
    }
	//curl_close($ch);  //no effect on php >= 8.0
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
    return [$result, $status_code];
}

?>