<?php

/*  --------------------------------------------------------------
		sauvegarde le fichier des vols weekly tous les lundis
	--------------------------------------------------------------  */
/*
$day_last_month = (int) gmdate('d', strtotime("yesterday 04:00"));
$last_month = (int) gmdate('m', strtotime("yesterday 04:00"));
$year_last_month = (int) gmdate('Y', strtotime("yesterday 04:00"));
$first_day_last_month = new DateTime("$year_last_month-$last_month-01");
$last_day_last_month = new DateTime("$year_last_month-$last_month-$day_last_month");
$today = new DateTime();
*/
$last_month = 5;
$year_last_month = 2022;
$first_day_last_month = new DateTime("2022-05-01");
$last_day_last_month = new DateTime("2022-05-31");
$today = new DateTime("2022-06-01");

echo $first_day_last_month->format('Y-m-d');
echo "<br>";
echo $last_day_last_month->format('Y-m-d');
echo "<br>";
echo $today->format('Y-m-d');
echo "<br>";

// 8 = aout
//$longueur_last_month = cal_days_in_month(CAL_GREGORIAN, $last_month, $year_last_month);

/*  ----------------------------------------------------
                     Monthly Traffic
    ---------------------------------------------------- */

$arr_traffic = get_monthly_traffic($first_day_last_month, $today);
$file_traffic = "https://dev.lfmm-fmp.fr/b2b/json/$year_last_month-monthly-flights.json";

process_file_traffic($file_traffic, $arr_traffic, $last_month, $year_last_month);

// get all json traffic files file Between 2 Dates non incluse la dernière date
function get_monthly_traffic($dateTime1, $dateTime2) {
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
        $file_name = "https://dev.lfmm-fmp.fr/b2b/json/".$value->format('Ymd')."-vols.json";
        //$data = file_get_contents("./json/".$file_name);
        $data = get_file($file_name);
        $donnees = json_decode($data[0]);
        $cta += intval($donnees->LFMMCTA[2]);
        foreach ($donnees->LFMMFMPE as $value) {
            if ($value[0] == "LFMRAE") $est += intval($value[2]);
        }
        foreach ($donnees->LFMMFMPW as $value) {
            if ($value[0] == "LFMRAW") $west += intval($value[2]);
        } 
        $app += intval($donnees->LFMMAPP->flights);
    }
    return [$cta, $est, $west, $app];
}

/*  ----------------------------------------------------
                     Monthly Regs
    ---------------------------------------------------- */

$arr_reguls = get_monthly_regs($first_day_last_month, $today);
$file_reg = "https://dev.lfmm-fmp.fr/b2b/json/$year_last_month-monthly-reg.json";

process_file_reg($file_reg, $arr_reguls, $last_month, $year_last_month);

// get all json reg files file Between 2 Dates non incluse la dernière date
function get_monthly_regs($dateTime1, $dateTime2) {

    $period = new DatePeriod(
        $dateTime1,
        new DateInterval('P1D'),
        $dateTime2
    );
    $cta = 0;
    $app = 0;
    $est = 0;
    $west = 0;
    foreach ($period as $key => $value) {
        $file_name = "https://dev.lfmm-fmp.fr/b2b/json/".$value->format('Ymd')."-reg.json";
        $data = get_file($file_name);
        $donnees = json_decode($data[0]);
        
        foreach ($donnees->LFMMFMPE as $obj) {
            $est += intval($obj->delay);
        }
        foreach ($donnees->LFMMFMPW as $obj) {
            $west += intval($obj->delay);
        }
        foreach ($donnees->LFMMAPP as $obj) {
            $app += intval($obj->delay);
        }
        $cta = $est + $west;
    }
    return [$cta, $est, $west, $app];
}

/*  -----------------------------------------------------------------------------
            Process files
     file_get_contents ne fonctionne pas en prod mais seulement en local 
        => on utilise curl
    ----------------------------------------------------------------------------- */

function process_file_traffic($file, $arr, $month_number, $year) {
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

    $json_year->est->$month_number = $arr[1];
    $json_year->west->$month_number = $arr[2];
    $json_year->cta->$month_number = $arr[0];
    $json_year->app->$month_number = $arr[3];

    echo "Nouveau json traffic"."<br>";
    var_dump($json_year);
    write_json_traffic($json_year, $year);
}

function process_file_reg($file, $arr, $month_number, $year) {
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
        $json_year->cta = new stdClass();
        $json_year->est = new stdClass();
        $json_year->west = new stdClass();
        $json_year->app = new stdClass();
    }

    $json_year->cta->$month_number = $arr[0];
    $json_year->est->$month_number = $arr[1];
    $json_year->west->$month_number = $arr[2];
    $json_year->app->$month_number = $arr[3];
    
    echo "Nouveau json reg"."<br>";
    var_dump($json_year);
    write_json_reg($json_year, $year);
}

/*  ----------------------------------------------------
                     Utilities
    ---------------------------------------------------- */

// ne fonctionne pas sans dirname(__FILE__)
function write_json_traffic($json, $year) {
	$fp = fopen(dirname(__FILE__)."/json/".$year."-monthly-flights.json", 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
}

function write_json_reg($json, $year) {
	$fp = fopen(dirname(__FILE__)."/json/".$year."-monthly-reg.json", 'w');
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