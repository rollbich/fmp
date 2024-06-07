<?php
require_once("configsql.inc.php");
require_once("pdo.class.php");

// JSON_COMPACT(json_string)
// ex ajout avec json
// $req = "INSERT INTO $table (JX) VALUES ('$nom', '{\"category\": \"Landmark\", \"lastVisitDate\": \"11/10/2019\"}')";

function getBetweenDates(string $startDate, string $endDate) {
    $array = array();
    $interval = new DateInterval('P1D');
 
    $realEnd = new DateTime($endDate);
    $realEnd->add($interval);
 
    $period = new DatePeriod(new DateTime($startDate), $interval, $realEnd);
 
    foreach($period as $date) {
        $array[] = $date->format('Y-m-d');
    }
 
    return $array;
}

// Récupère le décalage horaire en heures à 6h
function get_decalage(string $day) {
    $d = new DateTime($day);
    $d->modify('+ 6 hours');
    $timeZoneParis = new DateTimeZone("Europe/Paris");
    $timeOffset = abs(($timeZoneParis->getOffset($d)) / 3600);
    return $timeOffset;
}

// récupère les 2 chiffres après la virgule
function get_decimale(float $nombre) {
	return sprintf("%02d", ($nombre - (int) $nombre) * 100) ;
}

/*  ------------------------------------------------------------------------------
	  récupère l'heure en fonction du numéro de colonne 
	 	@param {integer} col - Numéro de la colonne du tds
		@returns {string} - "hh:mm"
	------------------------------------------------------------------------------ */
function get_time($col) {
    $h = sprintf("%02d", floor($col/4));
    $minut = $col%4 === 0 ? "00" : get_decimale($col/4)*15/25;
    $minut = $minut === 3 ? "30" : $minut;
    return $h.":".strval($minut);
}

class bdd_tds {

    private $client;

    // est ou ouest
    public function __construct(string $day = "", string $zone = "est") {
        $this->day = $day;
        if (strcmp($day, "") === 0) $this->day = date("Y-m-d");
        $this->zone = $zone;
        $this->saison = $this->get_current_tds();
        $this->saison_greve = $this->get_current_tds(1);
    }

    // @return JSON string - ["JX","J1","J3","S2","","","J2","S1","N","","",""]
    public function get_cycle() {
        $table_cycle = "cycle";
        $req = "SELECT * FROM $table_cycle WHERE zone='$this->zone' ORDER BY 'jour' ASC"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $arr = [];
        foreach($resultat as $key=>$value) {
            array_push($arr, $value["vacation"]);
        }
        return $arr;
    }

    // @param int $greve - 0 ou 1
    // @return string - "nom de la saison" actuelle
    public function get_current_tds(int $greve = 0) {
        try {
            $req = "SELECT nom_tds FROM `dates_saisons` WHERE debut <= '$this->day' AND fin >= '$this->day' AND greve = $greve AND zone = '$this->zone'"; 
            $stmt = Mysql::getInstance()->prepare($req);
            $stmt->execute();
            $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $resultat[0]["nom_tds"];
        }
        catch(Exception $e){
            print_r($e);
        }
    }

    /*  --------------------------------------------------------------------------
            @return  :
            object(stdClass)#26 (3) {
                "vac" : {
                    "nb_cds": ...,
                    "cds" : [ 0, 0, 0, 0, 0, 0 ... ],   96 valeurs
                    "sous-vac1" : [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
                    "sous-vac2" : [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
                    ...
                }
                ...
            }
        -------------------------------------------------------------------------- */

    public function get_tds(string $saison = "", bool $greve = false) {
        if (strcmp($saison, "") === 0) {
            if ($greve) $saison = $this->saison_greve; else $saison = $this->saison;
        }
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "SELECT * FROM $table WHERE nom_tds = '$saison'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC)[0];
        unset($resultat["nom_tds"]);
        $obj = new stdClass();
        foreach($resultat as $key=>$value) {
            $obj->{$key} = json_decode($value);
        }
        return $obj;
    }

    /*   --------------------------------------------------------------------------
           @return object contenant tous les tds 
            {
            "tds 1": {
                    "JX": ...,
                    "J1": ...,
                    "...": ...,
                    ...
                },
            "tds 2": {
                ...
            }
         -------------------------------------------------------------------------- */
    public function get_all_tds(bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "SELECT * FROM $table"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $obj = new stdClass();
        
        foreach($resultat as $elem) {
            $obj->{$elem["nom_tds"]} = new stdClass();
            foreach($elem as $key=>$value) {
                if (strcmp($key, "nom_tds") !== 0) {
                    $obj->{$elem["nom_tds"]}->{$key} = json_decode($value);
                }
            }
        }
        return $obj;
    }

    public function add_tds(string $nom, bool $greve) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "INSERT INTO $table (nom_tds) VALUES ('$nom')"; // simple quote autour de $nom obligatoire
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $this->create_tds_repartition($nom, $greve);
    }

    public function delete_tds(string $nom, bool $greve) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "DELETE FROM $table WHERE nom_tds = '$nom'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $table2 = "tds_repartition_$this->zone";
        if ($greve === true) $table2 = "tds_repartition_greve_$this->zone";
        $req2 = "DELETE FROM $table2 WHERE nom_tds = '$nom'";
        $stmt2 = Mysql::getInstance()->prepare($req2);
        $stmt2->execute();
    }

    /*  ------------------------------------------------------------------------------------------------------------
            sauve une saison avec toutes les vacs
            @param $tds_json - Object { "JX": {"nb_cds": 0, "cds", [...], "A": [...]...}, "J1": ...,...} }
        ------------------------------------------------------------------------------------------------------------ */
    public function set_tds(string $saison, $tds_obj, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $vacs = array_keys(get_object_vars($tds_obj)); // array des vacs
       foreach($vacs as $vac) {
            $this->set_vac($saison, $vac, $tds_obj, $greve);
       }

    }

    /*  ------------------------------------------------------------------------------------------------------------
            copie un TDS classique ou de greve
                @param $nom         - TDS à copier
                @param $new_name    - nom du nouveau TDS
                @param $greve       - TDS de greve ?
        ------------------------------------------------------------------------------------------------------------ */
    public function duplicate_tds(string $nom, string $new_name, bool $greve) {
        $tds = $this->get_tds($nom, $greve);
        $this->add_tds($new_name, $greve);
        $this->set_tds($new_name, $tds, $greve);
    }

   /*  ------------------------------------------------------------------------------------------------------------
        sauve une vac d'une saison
        @param $tds_json - Object { zone: "est", saison: "hiver_2024", tds_local: {"JX": ..., "J1": ...,...} }
    ------------------------------------------------------------------------------------------------------------ */
    private function set_vac(string $saison, string $vac, $tds_obj, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        // get all keys but "nb_cds" and "cds" => get all sousvacs
        $sousvacs = array_keys(get_object_vars($tds_obj->$vac));
        if (($key = array_search("nb_cds", $sousvacs)) !== false) {
            unset($sousvacs[$key]);
        }
        if (($key = array_search("cds", $sousvacs)) !== false) {
            unset($sousvacs[$key]);
        }
       
        $nbcds = $tds_obj->$vac->nb_cds;       
        $cds_str = "[".implode(', ', $tds_obj->$vac->cds)."]";

        // construction du json string
        $j = '{"nb_cds":'.$nbcds.','.'"cds":'.$cds_str;
        foreach($sousvacs as $sousvac) {
            $sousvac_str = "[".implode(', ', $tds_obj->$vac->$sousvac)."]";
            $j = $j.','.'"'.$sousvac.'":'.$sousvac_str;
        }
        $j .= '}';
        
        $req = "UPDATE $table SET $vac = JSON_COMPACT('$j') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();

    }

    public function add_sous_vac(string $saison, string $vac, string $nom_sous_vac, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_COMPACT(JSON_INSERT($vac,'$.$nom_sous_vac',JSON_ARRAY(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0))) WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function remove_sous_vac(string $saison, string $vac, string $nom_sous_vac, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_REMOVE($vac, '$.$nom_sous_vac') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // @param $tds_json - Object { zone: "est", saison: "hiver_2024", tds_local: {"JX": ..., "J1": ...,...} }
    //  change only a key whose value is array
    public function set_sousvac(string $saison, string $vac, string $sousvac, $tds_obj, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $value = implode(', ', $tds_obj->$vac->$sousvac); // string "0,0,1...,0" 96 valeurs
        $req = "UPDATE $table SET $vac = JSON_COMPACT(JSON_SET($vac, '$.$sousvac', JSON_ARRAY($value))) WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // @return JSON string - {nb_cds: 1}
    public function get_nb_cds(string $vac, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "SELECT JSON_VALUE($vac, '$.nb_cds') AS nb_cds FROM $table";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC)[0];
        return $resultat;
    }

    // @param $saison   - String - "hiver_2024"
    // @param $vac      - String - "J1"
    // @param $saison   - Int    - 0 ou 1
    //  change nb_cds key 
    public function change_cds(string $saison, string $vac, int $value, bool $greve = false) {
        $table = "tds_$this->zone";
        if ($greve === true) $table = "tds_greve_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_COMPACT(JSON_SET($vac, '$.nb_cds', $value)) WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function add_vac(string $vac) {
        $table = "tds_$this->zone";
        $req = "ALTER TABLE $table ADD $vac JSON NOT NULL DEFAULT '{}' CHECK (json_valid('$vac'))";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function remove_vac(string $vac) {
        $table = "tds_$this->zone";
        $req = "ALTER TABLE $table DROP $vac";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*   --------------------------------------------------------------------------
           @return array of object - toutes les saisons > today
            [
                {
                    "id": ...,
                    "debut": ...,
                    "fin": ...,
                    "nom_tds": ...
                },
                {...}
            ]
         -------------------------------------------------------------------------- */
    public function get_saisons($all = true, int $greve = 0) {
        $req = "SELECT * FROM `dates_saisons` WHERE zone = '$this->zone' AND greve = $greve"; 
        if ($all === false) $req = "SELECT * FROM `dates_saisons` WHERE fin >= '$this->day' AND zone = '$this->zone' AND greve = $greve"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $arr = [];
        $obj = new stdClass();
        foreach($resultat as $value) {
            //$prop = substr($value["Renfort"], 0, -5); // pour enlever -2023
            $obj->{$value["id"]} = $value;
            array_push($arr, $obj);
        }
        return $obj;
    }

    public function add_plage(string $debut, string $fin, string $tds, int $greve) {
        $table = "dates_saisons";
        $req = "INSERT INTO $table VALUES(null, '$this->zone', $greve, '$debut', '$fin', '$tds')";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function save_plage(string $id, string $saison, string $debut, string $fin) {
        $table = "dates_saisons";
        $req = "UPDATE $table SET debut = '$debut', fin = '$fin', nom_tds = '$saison' WHERE id = '$id' AND zone = '$this->zone'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function supprime_plage(string $id) {
        $table = "dates_saisons";
        $req = "DELETE FROM $table WHERE id = '$id'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function get_all_tds_supp() {
        $table = "tds_supp_$this->zone";
        $req = "SELECT * FROM $table"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $obj = new stdClass();
        foreach($resultat as $value) {
            $obj->{$value["Renfort"]} = json_decode($value["tds"]);
        }
        return $obj;
    }
    
    // pour sélecter les tds supp inclus dans la plage de date
    public function get_tds_supp() {
        $table = "tds_supp_$this->zone";
        $req = "SELECT * FROM $table WHERE debut <= '$this->day' AND fin >= '$this->day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $obj = new stdClass();
        foreach($resultat as $value) {
            $obj->{$value["Renfort"]} = json_decode($value["tds"]);
        }
        return $obj;
    }

    public function add_tds_supp(string $nom, string $debut, string $fin) {
        $table = "tds_supp_$this->zone";
        $req = "INSERT INTO $table (Renfort, debut, fin) VALUES ('$nom', '$debut', '$fin')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function delete_tds_supp(string $nom) {
        $table = "tds_supp_$this->zone";
        $req = "DELETE FROM $table WHERE Renfort = '$nom'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // @param $arr_json String - string de [96 valeurs]
    public function save_tds_supp(string $nom, string $arr_json) {
        $table = "tds_supp_$this->zone";
        $req = "UPDATE $table SET tds = JSON_COMPACT('$arr_json') WHERE Renfort = '$nom'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  ---------------------------------------------------------------
            Répartition
        --------------------------------------------------------------- */

    public function get_all_repartition(bool $greve = false) {
        $cycle = $this->get_cycle();
        $table = "tds_repartition_$this->zone";
        if ($greve === true) $table = "tds_repartition_greve_$this->zone";
        $req = "SELECT * FROM $table"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $obj = new stdClass();
        foreach ($resultat as $obj_value) {
            $obj->{$obj_value["nom_tds"]} = new stdClass();
            foreach ($cycle as $vac) {
                if ($vac != "") {
                    $obj->{$obj_value["nom_tds"]}->$vac = json_decode($obj_value[$vac]);
                }
            }
        }
        return $obj;
    }
    
    /*  ----------------------------------------------------------------------------------------
        @return array(8) {
            ["nom_tds"]=> string(10) "mshxp_2024",
            ["JX"]=> string(4654) "{
                "type_repartition":"standard",
                "standard":{
                    "sousvac2":{"reste0":{"A":0,"B":0},"reste1":{"A":0,"B":1}},
                    "sousvac3":{"reste0":{"A":0,"B":0,"C":0},"reste1":{"A":0,"B":0,"C":1},"reste2":{"A":0,"B":1,"C":1}}
                },
                "fixe":{
                    "sousvac2":{
                        "dimanche":{"pc2":{"A":0,"B":2},"pc3":{"A":0,"B":3},"pc4":{"A":2,"B":2},"pc5":{"A":2,"B":3},"pc6":{"A":3,"B":3},"pc7":{"A":3,"B":4},"pc8":{"A":4,"B":4},"pc9":{"A":4,"B":5},"pc10":{"A":5,"B":5},"pc11":{"A":5,"B":6},"pc12":{"A":6,"B":6},"pc13":{"A":6,"B":7},"pc14":{"A":7,"B":7}},
                        "lundi":{...},...
                    },
                    "sousvac3":{
                        "dimanche":{"pc2":{"A":2,"B":0,"C":0},"pc3":{"A":3,"B":0,"C":0},"pc4":{"A":2,"B":2,"C":0},"pc5":{"A":2,"B":3,"C":0},"pc6":{"A":2,"B":2,"C":2},"pc7":{"A":2,"B":2,"C":3},"pc8":{"A":2,"B":3,"C":3},"pc9":{"A":3,"B":3,"C":3},"pc10":{"A":3,"B":3,"C":4},"pc11":{"A":3,"B":4,"C":4},"pc12":{"A":4,"B":4,"C":4},"pc13":{"A":4,"B":4,"C":5},"pc14":{"A":4,"B":5,"C":5}},
                        "lundi":{...},...
                    }
                }
            },
            ["J1]=> "{...}",
            ...
        }
        ------------------------------------------------------------------------------------------- */

    public function get_repartition(string $saison = "", bool $greve = false) {
        if (strcmp($saison, "") === 0) $saison = $this->saison;
        $cycle = $this->get_cycle();
        $table = "tds_repartition_$this->zone";
        if ($greve === true) $table = "tds_repartition_greve_$this->zone";
        $req = "SELECT * FROM $table WHERE nom_tds = '$saison'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC)[0];
        $obj = new stdClass();
        foreach ($cycle as $vac) {
           if ($vac != "") {
            $obj->$vac = json_decode($resultat[$vac]);
           }
        }
        return $obj;
    }

    // @param $saison   - String - "hiver_2024"
    // @param $vac      - String - "J1"
    // @param $saison   - Int    - "standard" ou "fixe"
    public function change_type_repartition(string $saison, string $vac, string $value, bool $greve = false) {
        if (strcmp($value, "standard") !== 0 && strcmp($value, "fixe") !== 0) return;
        $table = "tds_repartition_$this->zone";
        if ($greve === true) $table = "tds_repartition_greve_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_SET($vac, '$.type_repartition', '$value') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function set_repartition(string $saison, string $vac, string $json, bool $greve = false) {
        $table = "tds_repartition_$this->zone";
        if ($greve === true) $table = "tds_repartition_greve_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_COMPACT('$json') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // lorsqu'un nouveau tds est créé, il faut créer une ligne dans la table de répartition
    public function create_tds_repartition(string $saison, bool $greve = false) {
        $table = "tds_repartition_$this->zone";
        if ($greve === true) $table = "tds_repartition_greve_$this->zone";
        $req = "INSERT IGNORE INTO $table (nom_tds) VALUES ('$saison')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  ---------------------------------------------------------------
           uceso / Realise / i1
        --------------------------------------------------------------- */
    
    public function save_uceso(string $day, string $typejour, int $i1, string $uceso, string $realise, int $maxsecteurs, string $tvh, string $nbpc, int $minutes_ucesa) {
        $table = "rh";
        $r0 = "SELECT * FROM $table WHERE jour = '$day' AND zone = '$this->zone'";
        $stmt0 = Mysql::getInstance()->prepare($r0);
        $stmt0->execute();
        $resultat0 = $stmt0->fetchAll(PDO::FETCH_ASSOC);
        if (count($resultat0) === 0) { 
            $req = "INSERT INTO $table (id_rh, jour, typejour, zone, uceso, realise, i1, maxsecteurs, tvh, nbpc, minutes_ucesa) VALUES (null, '$day', '$typejour', '$this->zone', JSON_COMPACT('$uceso'), JSON_COMPACT('$realise'), '$i1', '$maxsecteurs', JSON_COMPACT('$tvh'), JSON_COMPACT('$nbpc'), '$minutes_ucesa')"; 
            $stmt = Mysql::getInstance()->prepare($req);
            $stmt->execute();
        }
    }

    public function get_ucesa(string $start_day, string $end_day) {
        $table = "rh";
        $req = "SELECT jour, typejour, realise, i1, maxsecteurs, tvh, nbpc, minutes_ucesa FROM $table WHERE jour <= '$end_day' AND jour >= '$start_day' AND zone = '$this->zone'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function set_minutes_ucesa(string $day, int $minutes) {
        $table = "rh";
        $req = "UPDATE $table SET minutes_ucesa = '$minutes' WHERE jour = '$day' AND zone = '$this->zone'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // pour Laurent Martinelli
    public function get_ucesa_daily(string $day) {
        $table = "rh";
        $req = "SELECT jour, realise, nbpc, minutes_ucesa FROM $table WHERE jour = '$day' AND zone = '$this->zone'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

}

class bdd_instr {

    // @return JSON string - ["JX","J1","J3","S2","J2","S1","N"]
    public function get_clean_cycle(string $zone) {
        $table_cycle = "cycle";
        $req = "SELECT * FROM $table_cycle WHERE zone='$zone' ORDER BY 'jour' ASC"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $arr = [];
        foreach($resultat as $key=>$value) {
            if ($value["vacation"] !== "") array_push($arr, $value["vacation"]);
        }
        return $arr;
    }

    public function get_clean_cycle_json(string $zone) {
        echo json_encode($this->get_clean_cycle($zone)); 
    }

    // @return string - "nom de la saison" actuelle
    public function get_tds_name(string $day, string $zone) {
        try {
            $req = "SELECT nom_tds FROM `dates_saisons` WHERE debut <= '$day' AND fin >= '$day' AND zone = '$zone'"; 
            $stmt = Mysql::getInstance()->prepare($req);
            $stmt->execute();
            $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $resultat[0]["nom_tds"];
        }
        catch(Exception $e){
            print_r($e);
        }
    }

/*  --------------------------------------------------------------------------
        @return  :
        object(stdClass)#26 (3) {
            "vac" : {
                "nb_cds": ...,
                "cds" : [ 0, 0, 0, 0, 0, 0 ... ],   96 valeurs
                "sous-vac1" : [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
                "sous-vac2" : [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
                ...
            }
            ...
        }
    -------------------------------------------------------------------------- */

    public function get_tds(string $saison, string $zone) {
        $table = "tds_$zone";
        $req = "SELECT * FROM $table WHERE nom_tds = '$saison'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC)[0];
        unset($resultat["nom_tds"]);
        $obj = new stdClass();
        foreach($resultat as $key=>$value) {
            $obj->{$key} = json_decode($value);
        }
        return $obj;
    }

    public function add_creneau_supp(string $day, string $debut, string $fin, string $zone, string $type, string $comm) {
        $table = "creneaux_supp";
        $req = "INSERT INTO $table VALUES (NULL, '$day', '$debut', '$fin', '$zone', '$type', '$comm')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // 	retourne les sous-vacs d'une vac
	// $sv = ["A", "B"]
	public function get_sv(string $vacation, $tour_local) {
		$vac = $vacation;
		if ($vacation === "N-1") $vac = "N";
		$temp_sv = array_keys(get_object_vars($tour_local->{$vac}));
		$sv = array_filter($temp_sv, static function ($element) {
			return ($element !== "cds" && $element !== "nb_cds");
		});
		return $sv;
	}

    // objet : passage par référence par défaut
	private function push_utc($vac, $tour_utc, $timeOffset, $tour_local) {

		$index_deb = $timeOffset*4 - 1;	
		$sousvacs = $this->get_sv($vac, $tour_local);
		
		foreach($sousvacs as $sousvac) {
			$tour_utc->{$vac}->{$sousvac} = $tour_local->{$vac}->{$sousvac};
		}
		
		if ($timeOffset === 2) {
			for($i=0;$i<4;$i++) {
				foreach($sousvacs as $sousvac) {
					$z = array_shift($tour_utc->{$vac}->{$sousvac});
					array_push($tour_utc->{$vac}->{$sousvac}, $z);
				}
			}
		}

		for($i=0;$i<4;$i++) {
			foreach($sousvacs as $sousvac) {
				$z = array_shift($tour_utc->{$vac}->{$sousvac});
				array_push($tour_utc->{$vac}->{$sousvac}, $z);
			}
		}		

	}

    // enlève 1PC sur toutes les plages de la vac
    public function add_creneau_supp_greve(string $day, string $vac, string $sousvac, string $zone, string $type, string $comm) {
        $tds_name = $this->get_tds_name($day, $zone);
        $tds = $this->get_tds($tds_name, $zone);
        $workingCycle = $this->get_clean_cycle($zone);
        $timeOffset = get_decalage($day);

        $tour_utc = new stdClass();
		foreach($workingCycle as $vacation) {
			$tour_utc->{$vacation} = new stdClass();
			$this->push_utc($vacation, $tour_utc, $timeOffset, $tds);
		}
        if (isset($tour_utc->{$vac}->$sousvac)) {
            $arr_sousvac = $tour_utc->{$vac}->$sousvac;
            $compacted_plages = [];
            $index_debut = null;
            $index_fin = null;
            if ($arr_sousvac[0] === 1) {
                $index_debut = 0;
            }
            for($j=1;$j<95;$j++) {
                if ($arr_sousvac[$j] === 1) {
                    if ($arr_sousvac[$j-1] === 0 || $arr_sousvac[$j-1] === null) {
                        $index_debut = $j;
                    } 
                }
                if ($arr_sousvac[$j] === 0) {
                    if ($arr_sousvac[$j-1] === 1) {
                        $index_fin = $j;
                        array_push($compacted_plages, [get_time($index_debut), get_time($index_fin)]);
                    } 
                }
            }
            foreach($compacted_plages as $plage) {
                $this->add_creneau_supp($day, $plage[0], $plage[1], $zone, $type, $comm);
            }
            $obj = new stdClass();
            $obj->status = "ok";
            $obj->texte = "";
        } else {
            $obj = new stdClass();
            $obj->status = "error";
            $obj->texte = "La sous-vac $sousvac n'existe pas dans la vac $vac";
        }
        echo json_encode($obj);
    }
    
    public function delete_creneau_supp(int $id) {
        $table = "creneaux_supp";
        $req = "DELETE FROM $table WHERE id = '$id'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  --------------------------------------------------------------------------
            @return  :
            [ 
                [
                ["id"]=>int(612), 
                ["day"]=>string(10) "2023-09-12", 
                ["debut"]=>string(8) "07:00:00",
                ["fin"]=>string(8) "09:00:00",
                ["zone"]=>string(3) "Est",
                ["type"]=>string(5) "Eleve",
                ["comment"]=>string(2) "EK"]
                ],
                [...]
            ]
        -------------------------------------------------------------------------- */

    public function get_creneaux_day($day, $zone) {
        $table = "creneaux_supp";
        $req = "SELECT * FROM $table WHERE day = '$day' AND zone = '$zone'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $resultat;
    }

    public function get_creneaux_supp($zone) {
        $day_min = new DateTime('now');
        $day_min->modify('-2 days');
        $day_min_str = $day_min->format('Y-m-d');
        $table = "creneaux_supp";
        $req = "SELECT * FROM $table WHERE day > '$day_min_str' AND zone = '$zone'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $resultat;
    }
}

class bdd_admin {

    public function get_day_MV_OTMV() {
        $table = "default_date_mv_otmv";
        $req = "SELECT default_day FROM $table"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC)[0];
        return $resultat;
    }

    public function set_day_MV_OTMV(string $day) {
        $table = "default_date_mv_otmv";
        $req = "UPDATE $table SET default_day = '$day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $resultat;
    }

}

class bdd {

    public function get_vols_crna(string $start_day = "", $end_day = "", $zone = "crna", $vols = false) {
        if (strcmp($start_day, "") === 0 || strcmp($end_day, "") === 0) {
            return null;
        }
        $table = "vols_crna";
        if ($zone === "crna") {
            $req = "SELECT jour, typejour, LFMMCTA_regdemand, LFMMCTAE_regdemand, RAE, SBAM, GY, AB ,EK , LFMMCTAW_regdemand, RAW, MALY, WW, MF, DZ";
            if ($vols === true) $req .= ", vols_RAE, vols_RAW";
            $req .= " FROM $table WHERE jour >= '$start_day' AND jour <= '$end_day'"; 
        }
        if ($zone === "est") {
            $req = "SELECT jour, typejour, LFMMCTAE_regdemand, RAE, SBAM, GY, AB ,EK";
            if ($vols === true) $req .= ", vols_RAE";
            $req .= " FROM $table WHERE jour >= '$start_day' AND jour <= '$end_day'"; 
        }
        if ($zone === "ouest") {
            $req = "SELECT jour, typejour, LFMMCTAW_regdemand, RAW, MALY, WW, MF, DZ";
            if ($vols === true) $req .= ", vols_RAW";
            $req .= " FROM $table WHERE jour >= '$start_day' AND jour <= '$end_day'"; 
        }
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function get_vols_app(string $start_day = "", $end_day = "") {
        if (strcmp($start_day, "") === 0 || strcmp($end_day, "") === 0) {
            return null;
        }
        $table = "vols_app";
        $req = "SELECT * FROM $table WHERE jour >= '$start_day' AND jour <= '$end_day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function get_vols_app_by_week(string $year) {
        $table = "vols_app";
        $req = "SELECT week, SUM(flights) AS total_flights, SUM(LFKJ) AS total_LFKJ, SUM(LFKF) AS total_LFKF, SUM(LFKB) AS total_LFKB, SUM(LFKC) AS total_LFKC, SUM(LFMN) AS total_LFMN, SUM(LFMD) AS total_LFMD, SUM(LFTZ) AS total_LFTZ, SUM(LFTH) AS total_LFTH, SUM(LFML) AS total_LFML, SUM(LFMV) AS total_LFMV, SUM(LFMQ) AS total_LFMQ, SUM(LFLL) AS total_LFLL, SUM(LFLY) AS total_LFLY, SUM(LFLS) AS total_LFLS, SUM(LFLB) AS total_LFLB, SUM(LFLP) AS total_LFLP, SUM(LFLC) AS total_LFLC, SUM(LFMT) AS total_LFMT, SUM(LFTW) AS total_LFTW, SUM(LFMP) AS total_LFMP, SUM(LFMU) AS total_LFMU, SUM(LFLV) AS total_LFLV, SUM(LFLN) AS total_LFLN, SUM(LFLU) AS total_LFLU, SUM(LFMI) AS total_LFMI, SUM(LFMH) AS total_LFMH, SUM(LFMA) AS total_LFMA, SUM(LFLI) AS total_LFLI, SUM(LFMC) AS total_LFMC, SUM(LFKS) AS total_LFKS, SUM(LFMY) AS total_LFMY, SUM(LFMO) AS total_LFMO, SUM(LFKA) AS total_LFKA, SUM(LFKO) AS total_LFKO, SUM(LFMS) AS total_LFMS, SUM(LFMZ) AS total_LFMZ, SUM(LFMF) AS total_LFMF, SUM(LFTF) AS total_LFTF, SUM(LFLE) AS total_LFLE, SUM(LFLG) AS total_LFLG, SUM(LFLJ) AS total_LFLJ, SUM(LFLM) AS total_LFLM, SUM(LFLO) AS total_LFLO, SUM(LFNA) AS total_LFNA, SUM(LFNB) AS total_LFNB, SUM(LFNG) AS total_LFNG, SUM(LFNH) AS total_LFNH, SUM(LFXA) AS total_LFXA FROM $table WHERE week_year = '$year' GROUP BY week"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function get_vols_crna_by_week(string $year, int $week_max=53) {
        $table = "vols_crna";
        $req = "SELECT week, SUM(LFMMCTA_regdemand) AS total_LFMMCTA_regdemand, SUM(LFMMCTA_load) AS total_LFMMCTA_load, SUM(LFMMCTA_demand) AS total_LFMMCTA_demand, SUM(LFMMCTAE_regdemand) AS total_LFMMCTAE_regdemand, SUM(LFMMCTAE_load) AS total_LFMMCTAE_load, SUM(LFMMCTAE_demand) AS total_LFMMCTAE_demand, SUM(LFMMCTAW_regdemand) AS total_LFMMCTAW_regdemand, SUM(LFMMCTAW_load) AS total_LFMMCTAW_load, SUM(LFMMCTAW_demand) AS total_LFMMCTAW_demand, SUM(RAE) AS total_RAE, SUM(SBAM) AS total_SBAM, SUM(GY) AS total_GY, SUM(AB) AS total_AB, SUM(EK) AS total_EK, SUM(RAW) AS total_RAW, SUM(MALY) AS total_MALY, SUM(WW) AS total_WW, SUM(MF) AS total_MF, SUM(DZ) AS total_DZ FROM $table WHERE week_year = '$year' AND week <= '$week_max' GROUP BY week"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function get_vols_app_by_month(string $year) {
        $table = "vols_app";
        $req = "SELECT MONTH(jour) AS mois, SUM(flights) AS total_flights, SUM(LFKJ) AS total_LFKJ, SUM(LFKF) AS total_LFKF, SUM(LFKB) AS total_LFKB, SUM(LFKC) AS total_LFKC, SUM(LFMN) AS total_LFMN, SUM(LFMD) AS total_LFMD, SUM(LFTZ) AS total_LFTZ, SUM(LFTH) AS total_LFTH, SUM(LFML) AS total_LFML, SUM(LFMV) AS total_LFMV, SUM(LFMQ) AS total_LFMQ, SUM(LFLL) AS total_LFLL, SUM(LFLY) AS total_LFLY, SUM(LFLS) AS total_LFLS, SUM(LFLB) AS total_LFLB, SUM(LFLP) AS total_LFLP, SUM(LFLC) AS total_LFLC, SUM(LFMT) AS total_LFMT, SUM(LFTW) AS total_LFTW, SUM(LFMP) AS total_LFMP, SUM(LFMU) AS total_LFMU, SUM(LFLV) AS total_LFLV, SUM(LFLN) AS total_LFLN, SUM(LFLU) AS total_LFLU, SUM(LFMI) AS total_LFMI, SUM(LFMH) AS total_LFMH, SUM(LFMA) AS total_LFMA, SUM(LFLI) AS total_LFLI, SUM(LFMC) AS total_LFMC, SUM(LFKS) AS total_LFKS, SUM(LFMY) AS total_LFMY, SUM(LFMO) AS total_LFMO, SUM(LFKA) AS total_LFKA, SUM(LFKO) AS total_LFKO, SUM(LFMS) AS total_LFMS, SUM(LFMZ) AS total_LFMZ, SUM(LFMF) AS total_LFMF, SUM(LFTF) AS total_LFTF, SUM(LFLE) AS total_LFLE, SUM(LFLG) AS total_LFLG, SUM(LFLJ) AS total_LFLJ, SUM(LFLM) AS total_LFLM, SUM(LFLO) AS total_LFLO, SUM(LFNA) AS total_LFNA, SUM(LFNB) AS total_LFNB, SUM(LFNG) AS total_LFNG, SUM(LFNH) AS total_LFNH, SUM(LFXA) AS total_LFXA FROM $table WHERE YEAR(jour) = '$year' GROUP BY mois"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function get_vols_crna_by_month(string $year, int $month_max=12) {
        $table = "vols_crna";
        $req = "SELECT MONTH(jour) AS mois, SUM(LFMMCTA_regdemand) AS total_LFMMCTA_regdemand, SUM(LFMMCTA_load) AS total_LFMMCTA_load, SUM(LFMMCTA_demand) AS total_LFMMCTA_demand, SUM(LFMMCTAE_regdemand) AS total_LFMMCTAE_regdemand, SUM(LFMMCTAE_load) AS total_LFMMCTAE_load, SUM(LFMMCTAE_demand) AS total_LFMMCTAE_demand, SUM(LFMMCTAW_regdemand) AS total_LFMMCTAW_regdemand, SUM(LFMMCTAW_load) AS total_LFMMCTAW_load, SUM(LFMMCTAW_demand) AS total_LFMMCTAW_demand, SUM(RAE) AS total_RAE, SUM(SBAM) AS total_SBAM, SUM(GY) AS total_GY, SUM(AB) AS total_AB, SUM(EK) AS total_EK, SUM(RAW) AS total_RAW, SUM(MALY) AS total_MALY, SUM(WW) AS total_WW, SUM(MF) AS total_MF, SUM(DZ) AS total_DZ FROM $table WHERE YEAR(jour) = '$year' AND MONTH(jour) <= '$month_max' GROUP BY mois"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function set_vols_crna(string $day, int $LFMMCTA_regdemand, int $LFMMCTA_load, int $LFMMCTA_demand, int $LFMMCTAE_regdemand, int $LFMMCTAE_load, int $LFMMCTAE_demand, int $LFMMCTAW_regdemand, int $LFMMCTAW_load, int $LFMMCTAW_demand, int $RAE, int $SBAM, int $EK, int $AB, int $GY, int $RAW, int $MALY, int $WW, int $MF, int $DZ, string $vols_RAE, string $vols_RAW) {
        $date = new DateTime($day);
        $week_number = intval($date->format("W")); // sinon on a un string avec un éventuel 0 devant le numéro
        $week_year = $date->format('o'); // année correspondant à la semaine (peut être différent de l'année en cours => des jours de la semaine 53 de 2023 peuvent être en 2024)
        $js = $date->format('w');
        $tab_jour = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
        $jour_semaine = $tab_jour[$js];
        $table = "vols_crna";
        $req = "INSERT INTO $table VALUES ('$day', '$jour_semaine', '$week_year', '$week_number', '$LFMMCTA_regdemand', '$LFMMCTA_load', '$LFMMCTA_demand', '$LFMMCTAE_regdemand', '$LFMMCTAE_load', '$LFMMCTAE_demand', '$LFMMCTAW_regdemand', '$LFMMCTAW_load', '$LFMMCTAW_demand', '$RAE', '$SBAM', '$EK', '$AB', '$GY', '$RAW', '$MALY', '$WW', '$MF', '$DZ', JSON_COMPACT('$vols_RAE'), JSON_COMPACT('$vols_RAW'))"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // $LFMMAPP = {"flights": nb_total_vol_app, "LFKJ": vols, "ad": nb, ...}
    public function set_vols_app(string $day, stdClass $LFMMAPP) {
        $date = new DateTime($day);
        $week_number = intval($date->format("W")); // sinon on a un string avec un éventuel 0 devant le numéro
        $week_year = $date->format('o'); // année correspondant à la semaine (peut être différent de l'année en cours => des jours de la semaine 53 de 2023 peuvent être en 2024)
        $js = $date->format('w');
        $tab_jour = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
        $jour_semaine = $tab_jour[$js];
        $table = "vols_app";
        $keys = array_keys(get_object_vars($LFMMAPP));
        $nb_flights = $LFMMAPP->flights;
        $req = "INSERT INTO $table VALUES ('$day', '$jour_semaine', '$week_year', '$week_number', '$nb_flights'";
        foreach($keys as $ad) {
            if ($ad != "flights") {
                $data = $LFMMAPP->{$ad};
                $req .= ", '$data'";
            } 
        }
        $req .= ")";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  ----------------------------------------------------------------------------
            @param $zone (string) - "est", "west" ou "app"
            @return [{
                "id": 2139,
                "jour": "2023-09-01",
                "typejour": "Vendredi",
                "regId": "ME301",
                "tv": "LFME3",
                "debut": "2023-09-01 07:20",
                "fin": "2023-09-01 11:40",
                "delay": 201,
                "reason": "ATC_CAPACITY",
                "impactedFlights": 103,
                "creation": "[{\"time\":\"2023-09-01 04:56\",\"debut\":\"2023-09-01 07:20\",\"fin\":\"2023-09-01 11:40\",\"rates\":[{\"start\":\"2023-09-01 07:20\",\"end\":\"2023-09-01 11:40\",\"rate\":32}]}]",
                "updates": "[]",
                "deletion": "",
                "rates": "[{\"start\":\"2023-09-01 07:20\",\"end\":\"2023-09-01 11:40\",\"rate\":32}]"
                }, {...}]
        ---------------------------------------------------------------------------- */
    public function get_reguls(string $zone, string $start_day, string $end_day) {
        $table = "reguls_$zone";
        $req = "SELECT * FROM $table WHERE jour >= '$start_day' AND jour <= '$end_day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    /*  ----------------------------------------------------------------------------
            @param $zone (string) - "est", "west" ou "app"
            @param $interval (string) - "week", "month" 
            trie par week puis par reason
            $resultat = [
                {"week": 1, "reason": "ATC_CAPACITY", "total_delay": 398 },
                {"week": 1, "reason": "ATC_STAFFING", "total_delay": 402 },
                {"week": 2, "reason": "WEATHER", "total_delay": 100 },
                {"week": 2, "reason": "ATC_STAFFING", "total_delay": 200 },
                }, {...}]
            @return {
                "1": {"ATC_CAPACITY": 398, "ATC_STAFFING": 402},
                "2": {...},
                ...
            }
        ---------------------------------------------------------------------------- */
       
    public function get_reguls_by_interval_reason(string $zone, string $year, string $interval) {
        $nb_week = idate('W', mktime(0, 0, 0, 12, 28, $year));
        $table = "reguls_$zone";
        if ($interval === "week") {
            $req = "SELECT $interval, reason, SUM(delay) AS total_delay FROM $table WHERE week_year = '$year' GROUP BY $interval, reason"; 
        }
        if ($interval === "month") {
            $req = "SELECT MONTH(jour) AS month, reason, SUM(delay) AS total_delay FROM $table WHERE YEAR(jour) = '$year' GROUP BY month, reason"; 
        }
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response = new stdClass();
        foreach($resultat as $res) {
            if (isset($response->{$res[$interval]})) {
                if (isset($response->{$res["reason"]})) {
                    $response->{$res["$interval"]}->{$res["reason"]} += (int) $res["total_delay"];
                } else {
                    $response->{$res[$interval]}->{$res["reason"]} = (int) $res["total_delay"];
                }

            } else {
                $response->{$res[$interval]} = new stdClass();
                $response->{$res[$interval]}->{$res["reason"]} = (int) $res["total_delay"];
            }
            
        }
        // s'il n'y a pas de regul cette semaine/mois, alors on met un objet vide au lieu de rien
        if ($interval === "week") {
            for($i=1;$i<$nb_week+1;$i++) {
                if(isset($response->{$i}) === false) $response->{$i} = new stdClass();
            }
        }
        if ($interval === "month") {
            for($i=1;$i<13;$i++) {
                if(isset($response->{$i}) === false) $response->{$i} = new stdClass();
            }
        }
        echo json_encode($response);
    }

    // redondant, à vérifier utilité
    public function get_reguls_by_week(string $zone, string $year) {
        $table = "reguls_$zone";
        $req = "SELECT week, SUM(delay) AS total_delay FROM $table WHERE week_year = '$year' GROUP BY week"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response = new stdClass();
        foreach($resultat as $res) {
            $response->{$res["week"]} = (int) $res["total_delay"];
        }
        echo json_encode($response);
    }

    /*  --------------------------------------------------------------------------
            Utilisé par set_reguls pour remplir la BDD en automatique
            $tvset : LFMMFMPE, LFMMFMPW, LFMMAPP, (LFMMAPPE, LFMMAPPW ??)
        -------------------------------------------------------------------------- */
    public function get_reguls_b2b(string $day, string $tvset = "LFMMAPP") {
        if ($tvset === "LFMMFMPE") $table = "reguls_est";
        if ($tvset === "LFMMFMPW") $table = "reguls_west";
        if ($tvset === "LFMMAPP") $table = "reguls_app";
        $req = "SELECT * FROM $table WHERE jour = '$day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $resultat;
    }

    /*  ----------------------------------------------------------------------------------------------------------------
            Sauve/met à jour les reguls récupérées en B2B
          @param (string) $jour : "2024-02-28" 
          @param (stdClass) $reguls : 
            {
                "LFMMFMPE": [
                    {
                        "regId": "MAB3423A",
                        "tv": "LFMAB34",
                        "lastUpdate": {
                            "eventTime": "2023-08-23 14:39:00",
                            "userUpdateEventTime": "2023-08-23 14:39:00",
                            "userUpdateType": "UPDATE",
                            "userId": "F3BBT"
                        },
                        "applicability": { "wef": "2023-08-23 14:00", "unt": "2023-08-23 20:40" },
                        "constraints": [
                            {
                            "constraintPeriod": {
                                "wef": "2023-08-23 14:00",
                                "unt": "2023-08-23 14:40"
                            },
                            "normalRate": 34,
                            "pendingRate": 2,
                            "equipmentRate": 0
                            },
                            {
                            "constraintPeriod": {
                                "wef": "2023-08-23 14:40",
                                "unt": "2023-08-23 20:40"
                            },
                            "normalRate": 30,
                            "pendingRate": 1,
                            "equipmentRate": 0
                            }
                        ],
                        "reason": "ATC_STAFFING",
                        "delay": 2320,
                        "impactedFlights": 203,
                        "TVSet": "LFMMFMPE"
                    }, {...}, ... ],
                "LFMMFMPW": [{...}, ...],
                "LFMMAPP": [ {...}, ...],
                "LFBBFMP": ...
                ...
            }
          @param (string) $tvset : LFMMFMPE, LFMMFMPW, LFMMAPP, (LFMMAPPE, LFMMAPPW sont forcés en amont en LFMMAPP)
               
            (array) $update_obj de la BDD
                [ 
                    {
                        "time" : "hh:mm", 
                        "rates": [{"start": .., "end": .., "rate": ..}, ..., {}], 
                        "debut": .., 
                        "fin": .. 
                    },
                    ...
                    {}
                ]

            Attention : lorsque les reguls sont à cheval sur 2 jours, le delay est imputée au 1er jour et le 2è jour
            la régul est notée avec un delay de 0 => pas de mise à jour de regul si elle a commencé la veille

            start of the week as a dateTime : 
            $date = new DateTime('midnight'); 
            $date->setISODate($year, $week);

            nombre de semaines dans l'année : idate('W', mktime(0, 0, 0, 12, 28, $year)).
            This is based on the fact that the last week of the year always includes 28 December.
        ---------------------------------------------------------------------------------------------------------------- */
    
    public function set_reguls(string $jour, stdClass $reguls, string $tvset = "LFMMAPP") {

        $date = new DateTime($jour);
        $week_number = intval($date->format("W")); // sinon on a un string avec un éventuel 0 devant le numéro
        $week_year = $date->format('o'); // année correspondant à la semaine (peut être différent de l'année en cours => des jours de la semaine 53 de 2023 peuvent être en 2024)

        if ($tvset === "LFMMFMPE") $table = "reguls_est";
        if ($tvset === "LFMMFMPW") $table = "reguls_west";
        if ($tvset === "LFMMAPP") $table = "reguls_app";

        $yesterday = new DateTime($jour);
        $yesterday->modify('-1 day');
        $veille = $yesterday->format('Y-m-d');
        
        $table_reg_jour = $this->get_reguls_b2b($jour, $tvset); // [ ["id"=>nb, ...], ..., ["id"=>nb, ...] ]
        $table_reg_veille = $this->get_reguls_b2b($veille, $tvset);

        // array des reguls existantes dans la BDD jour J et la veille
        $table_reg = array_merge($table_reg_jour, $table_reg_veille);

        foreach($reguls->$tvset as $reg) {
            $exist_in_bdd = false;
            $day = substr($reg->applicability->wef, 0, 10);
            $j = new DateTime($day);
            $js = $j->format('w');
            $tab_jour = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
            $jour_semaine = $tab_jour[$js];
            $regId = $reg->regId;
            $tv = $reg->tv;
            $debut = $reg->applicability->wef;
            $fin = $reg->applicability->unt;
            $delay = $reg->delay;
            $reason = $reg->reason;
            $impactedFlights = $reg->impactedFlights;
            $constraints = $reg->constraints;
            $last_update = $reg->lastUpdate->userUpdateType;
            $last_update_time = substr($reg->lastUpdate->userUpdateEventTime,0,16);
            
            $rates = [];
            foreach($constraints as $constraint) {
                $rate = new stdClass();
                $rate->start = $constraint->constraintPeriod->wef;
                $rate->end = $constraint->constraintPeriod->unt;
                $rate->rate = $constraint->normalRate + $constraint->pendingRate + $constraint->equipmentRate;
                array_push($rates, $rate);
            }
            $rates_str = json_encode($rates);

            $id = null;
            // la regul existe-t-elle dans la BDD
            foreach($table_reg as $treg) {
                // regul trouvée
                if ($treg["regId"] === $regId) {
                    $exist_in_bdd = true;
                    $id = $treg["id"];
                    $update_obj = $treg["updates"]; 
                } 
            }  

            if ($exist_in_bdd) {
                // la regul peut exister et les données récupérées indiquent toujours une CREATION, donc les données sont identiques sauf que les delay et vols impactés, doivent être mis à jour
                if ($last_update === "CREATION") {
                    // Vérif que la regul est bien du jour et non de la veille (Si c'est une regul débutant la veille, il ne faut pas mettre à jour les delay et les vols impactés)
                    if ($jour === $day) {
                        $req = "UPDATE $table SET debut = '$debut', fin= '$fin', rates = JSON_COMPACT('$rates_str'), delay = '$delay', impactedFlights = '$impactedFlights' WHERE id = '$id'";
                        $stmt = Mysql::getInstance()->prepare($req);
                        $stmt->execute();
                    } 
                }
                if ($last_update === "DELETION") {
                    // Vérif que la regul est bien du jour et non de la veille. Si c'est une regul débutant la veille, il ne faut pas mettre à jour les délais
                    if ($jour === $day) {
                        $deletion_time = $last_update_time;
                        $req = "UPDATE $table SET debut = '$debut', fin= '$fin', deletion = '$deletion_time', rates = JSON_COMPACT('$rates_str'), delay = '$delay', impactedFlights = '$impactedFlights' WHERE id = '$id'";
                        $stmt = Mysql::getInstance()->prepare($req);
                        $stmt->execute();
                    } else {
                        $deletion_time = $last_update_time;
                        $req = "UPDATE $table SET debut = '$debut', fin= '$fin', deletion = '$deletion_time', rates = JSON_COMPACT('$rates_str') WHERE id = '$id'";
                        $stmt = Mysql::getInstance()->prepare($req);
                        $stmt->execute();
                    }
                }
                // pour un UPDATE, les heures de debut et de fin peuvent avoir été modifiées en plus du reste
                if ($last_update === "UPDATE") {
                    $upd = json_decode($update_obj); // array d'objets : update_obj de la BDD 
                    $trouve = false;
                    foreach($upd as $up) {
                        // last update time identique au précédent : c'est le même update que la fois d'avant
                        if ($last_update_time === $up->time) {
                            $trouve = true;
                        }
                    }
                    // Vérif que la regul est bien du jour et non de la veille. Si c'est une regul débutant la veille, on ne met rien à jour car de toute façon NM impute delay et vols impactés à la veille (et ne met plus à jour) et ces données ont été récupérées à 23h58 UTC.
                    if ($jour === $day) {
                        // Si c'est un premier update
                        if ($trouve === false) {
                            $new_obj = new stdClass();
                            $new_obj->time = $last_update_time;
                            $new_obj->debut = $debut;
                            $new_obj->fin = $fin;
                            $new_obj->rates = $rates;
                            array_push($upd, $new_obj);
                            $obj_upd = json_encode($upd);
                            $req = "UPDATE $table SET debut = '$debut', fin= '$fin', rates = JSON_COMPACT('$rates_str'), updates = JSON_COMPACT('$obj_upd'), delay = '$delay', impactedFlights = '$impactedFlights' WHERE id = '$id'";
                            $stmt = Mysql::getInstance()->prepare($req);
                            $stmt->execute();
                        }  else { // un update identique existait déjà dans la BDD, on ne met à jour que les delay et les vols impactés
                            $new_obj = new stdClass();
                            $new_obj->time = $last_update_time;
                            $new_obj->debut = $debut;
                            $new_obj->fin = $fin;
                            $new_obj->rates = $rates;
                            array_push($upd, $new_obj);
                            $obj_upd = json_encode($upd);
                            $req = "UPDATE $table SET delay = '$delay', impactedFlights = '$impactedFlights' WHERE id = '$id'";
                            $stmt = Mysql::getInstance()->prepare($req);
                            $stmt->execute();
                        }
                    } 
                } 
            } else {
                if ($last_update === "CREATION") {
                    $creation_time = '[{"time":"'.$last_update_time.'","debut":"'.$debut.'","fin":"'.$fin.'","rates":'.$rates_str.'}]';
                    $update_obj = '[]';
                    $deletion_time = '';
                    $req = "INSERT INTO $table VALUES (null, '$day', '$jour_semaine', '$week_year', '$week_number', '$regId', '$tv', '$debut', '$fin', '$delay', '$reason', '$impactedFlights', JSON_COMPACT('$creation_time'), JSON_COMPACT('$update_obj'), '$deletion_time', JSON_COMPACT('$rates_str'))";
                    $stmt = Mysql::getInstance()->prepare($req);
                    $stmt->execute();
                }
                if ($last_update === "DELETION") {
                    $deletion_time = $last_update_time;
                    $update_obj = '[]';
                    $creation_time = '{}';
                    $req = "INSERT INTO $table VALUES (null, '$day', '$jour_semaine', '$week_year', '$week_number', '$regId', '$tv', '$debut', '$fin', '$delay', '$reason', '$impactedFlights', JSON_COMPACT('$creation_time'), JSON_COMPACT('$update_obj'), '$deletion_time', JSON_COMPACT('$rates_str'))";
                    $stmt = Mysql::getInstance()->prepare($req);
                    $stmt->execute();
                }
                if ($last_update === "UPDATE") {
                    $deletion_time = '';
                    $update_obj = '[{"time":"'.$last_update_time.'","debut":"'.$debut.'","fin":"'.$fin.'","rates":'.$rates_str.'}]';
                    $creation_time = '{}';
                    $req = "INSERT INTO $table VALUES (null, '$day', '$jour_semaine', '$week_year', '$week_number', '$regId', '$tv', '$debut', '$fin', '$delay', '$reason', '$impactedFlights', JSON_COMPACT('$creation_time'), JSON_COMPACT('$update_obj'), '$deletion_time', JSON_COMPACT('$rates_str'))";
                    $stmt = Mysql::getInstance()->prepare($req);
                    $stmt->execute();
                }
            }
           
        }
    }

    public function set_h20_occ_crna(string $zone, string $jour, string $h20, string $occ) {
        $table = "h20_occ_$zone";
        $req = "INSERT INTO $table VALUES ('$jour', '$h20', '$occ')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function update_week(string $day, string $year, string $week, string $month, string $table) {
        $req = "UPDATE $table SET week_year = '$year', week = '$week', month = '$month' WHERE jour = '$day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

}

?>