<?php

/*  ---------------------------------------------------------------
		sauvegarde le fichier des vols monthly pour toute l'année
	---------------------------------------------------------------  */

function calcul_mois($year, $month) {
    // premier et dernier jour du mois
    $first_day_of_month = new DateTime("$year-$month-01");
    $last_day_month = get_last_day_month($year, $month);
    $last_day_of_month = new DateTime("$last_day_month");

    echo "Year: $year<br>";
    echo "Mois: $month<br>";
    echo "First day of month: ".$first_day_of_month->format('Y-m-d')."<br>";
    echo "Last day of month: ".$last_day_of_month->format('Y-m-d')."<br>";

    $arr_traffic = get_monthly_traffic($first_day_of_month, $last_day_of_month);
    $file_traffic = "localhost/fmp/b2b/json/$year/$year-monthly-flights.json";
    //$file_traffic = "https://dev.lfmm-fmp.fr/b2b/json/$year/$year-monthly-flights.json";
    //$file_traffic = "https://lfmm-fmp.fr/b2b/json/$year/$year-monthly-flights.json";
    process_file_traffic($file_traffic, $arr_traffic, $month, $year);

    $arr_reguls = get_monthly_regs($first_day_of_month, $last_day_of_month);
    $file_reg = "localhost/fmp/b2b/json/$year/$year-monthly-reg.json";
    //$file_reg = "https://dev.lfmm-fmp.fr/b2b/json/$year/$year-monthly-reg.json";
    //$file_reg = "https://lfmm-fmp.fr/b2b/json/$year/$year-monthly-reg.json";
    process_file_reg($file_reg, $arr_reguls, $month, $year);

}

// recalcule toute l'année
function calcul_year(int $year) {
    for ($i = 1 ; $i <= 12; $i++) {
        calcul_mois($year, $i);
    }
}

calcul_year(2022);

/*  ----------------------------------------------------
                Monthly Traffic & Regs
    ---------------------------------------------------- */

// get all json traffic files file Between 2 Dates non incluse la dernière date
function get_monthly_traffic($dateTime1, $dateTime2) {

    $dateTime2 = $dateTime2->modify( '+1 day' );
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
        echo "day : $d<br>";
        $file_name = "localhost/fmp/b2b/json/$year/$month/$d-vols.json";
        //$file_name = "https://dev.lfmm-fmp.fr/b2b/json/$year/$month/$d-vols.json";
        //$data = file_get_contents("./json/".$file_name);
        $data = get_file($file_name);
        $donnees = json_decode($data[0]);
        $cta += intval($donnees->LFMMCTA[2]);
        $est += intval($donnees->LFMMCTAE[2]);
        $west += intval($donnees->LFMMCTAW[2]);
        if (isset($donnees->LFMMAPP)) {
            $app += intval($donnees->LFMMAPP->flights);
        } 
    }
    echo "monthly<br>";
    echo $app."<br>";
    return [$cta, $est, $west, $app];
}

/*  ----------------------------------------------------
                     Monthly Regs
    ---------------------------------------------------- */

/*  ------------------------------------------------------------------------------
      get all json reg files file Between 2 Dates non incluse la dernière date
        @return {
            "1": {"LFMMFMPE" : {
                "delay" : 321,
                "causes" : {
                    "ATC_STAFFING" : 39,
                    "...." : xx
                }
            },
            "nomTVsetFrance" : {
                ...
            },
            "N° sem": {}
        }
    ------------------------------------------------------------------------------ */
function get_monthly_regs($dateTime1, $dateTime2) {

    $dateTime2 = $dateTime2->modify( '+1 day' );
    $period = new DatePeriod(
        $dateTime1,
        new DateInterval('P1D'),
        $dateTime2
    );
    
    // Chargement de tous les fichiers
    // $donnees = [{reg-json du 1er jour}, ..., {reg-json lastday of month}]
    $donnees = [];
    foreach ($period as $key => $value) {
        $year = $value->format('Y');
        $month = $value->format('m');
        $d = $value->format('Ymd');
        $file_name = "localhost/fmp/b2b/json/$year/$month/$d-reg.json";
        //$file_name = "https://dev.lfmm-fmp.fr/b2b/json/$year/$month/$d-reg.json";
        $data = get_file($file_name);
        array_push($donnees, json_decode($data[0]));
    }

    // Récupération des tvset (on prend ceux du 1er objet)
    $tvsetall = array_keys(get_object_vars($donnees[0]));

    // Config de l'object $result
    $result = new stdClass();
    foreach ($tvsetall as $tvset) {
        $result->$tvset = new stdClass();
        $result->$tvset->delay = 0;
        $result->$tvset->causes = new stdClass();
        $result->$tvset->tvs = new stdClass();
    }

    // Calcul des délais et des causes
    // Itération sur chaque jour : $obj_jour = object reg-json du fichier du jour
    /* 
    {
    "LFMMFMPE" : [{regul1}, ..., {regul n}],
    "LFMMFMPW" : [{regul1}, ..., {regul n}],
    "LFMMAPP": [
    {
      "regId": "LFMTFA30",
      "tv": "LFMTFAAT",
      "lastUpdate": {
        "eventTime": "2022-06-30 06:27:00",
        "userUpdateEventTime": "2022-06-30 06:27:00",
        "userUpdateType": "DELETION",
        "userId": "F4ROS"
      },
      "applicability": { "wef": "2022-06-30 07:30", "unt": "2022-06-30 09:30" },
      "constraints": [
        {
          "constraintPeriod": {
            "wef": "2022-06-30 07:30",
            "unt": "2022-06-30 09:30"
          },
          "normalRate": 10,
          "pendingRate": 0,
          "equipmentRate": 0
        }
      ],
      "reason": "ATC_CAPACITY",
      "delay": 0,
      "impactedFlights": 6,
      "TVSet": "LFMMAPP"
    }, ... ]
    }
    */
    foreach ($donnees as $obj_jour) {
        foreach ($tvsetall as $tvset) {
            foreach ($obj_jour->$tvset as $obj) { 
                $result->$tvset->delay += intval($obj->delay);
                $r = $obj->reason;
                $t = $obj->tv;
                if (!isset($result->$tvset->causes->$r)) $result->$tvset->causes->$r = 0;
                if (!isset($result->$tvset->tvs->$t)) $result->$tvset->tvs->$t = 0;
                $result->$tvset->causes->$r += intval($obj->delay);
                $result->$tvset->tvs->$t += intval($obj->delay);
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
        $json_year->app = new stdClass();
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
    // Récupération des tvset
    $tvsetall = array_keys(get_object_vars($arr));

    $data = get_file($file);
    // existence du fichier
    if ($data[1] == 200) {
        echo "Fichier ".$file." existant"."<br>";
        $json_year = json_decode($data[0]);
        //var_dump($json_year);
        echo "<br>";
    } else {
        echo "Fichier ".$file." inexistant"."<br>";
        $json_year = new stdClass();
        $json_year->year = intval($year);
    }

    foreach ($tvsetall as $tvset) {
        $json_year->$month_number = $arr;
    }
    
    echo "Nouveau json reg"."<br>";
    //var_dump($json_year);
    write_json_reg($json_year, $year);
}

/*  ----------------------------------------------------
                     Utilities
    ---------------------------------------------------- */

// ne fonctionne pas sans dirname(__FILE__)
function write_json_traffic($json, $year) {
	$fp = fopen(dirname(__FILE__)."/json/$year/".$year."-monthly-flights.json", 'w');
	fwrite($fp, json_encode($json));
	fclose($fp);
}

function write_json_reg($json, $year) {
	$fp = fopen(dirname(__FILE__)."/json/$year/".$year."-monthly-reg.json", 'w');
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

function get_last_day_month($year, $month) {
    return date("Y-m-d", mktime(0, 0, 0, $month +1, 0, $year));
}

?>