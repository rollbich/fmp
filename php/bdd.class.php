<?php
require_once("configsql.inc.php");
require_once("pdo.class.php");

// JSON_COMPACT(json_string)
// ex ajout avec json
// $req = "INSERT INTO $table (JX) VALUES ('$nom', '{\"category\": \"Landmark\", \"lastVisitDate\": \"11/10/2019\"}')";

class bdd_tds {

    private $client;

    // est ou ouest
    public function __construct(string $day = "", string $zone = "est") {
        $this->day = $day;
        if (strcmp($day, "") === 0) $this->day = date("Y-m-d");
        $this->zone = $zone;
        $this->saison = $this->get_current_tds();
    }

    // @return JSON string - ["JX","J1","J3","S2","","","J2","S1","N","","",""]
    public function get_cycle() {
        $table_cycle = "cycle_$this->zone";
        $req = "SELECT * FROM $table_cycle"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $arr = [];
        foreach($resultat as $key=>$value) {
            array_push($arr, $value["vacation"]);
        }
        return $arr;
    }

    // @param string $type - "normal" ou "greve"
    // @return string - "nom de la saison" actuelle
    public function get_current_tds(string $type = "normal") {
        try {
            $req = "SELECT nom_tds FROM `dates_saisons_$this->zone` WHERE debut <= '$this->day' AND fin >= '$this->day' AND type = '$type'"; 
            $stmt = Mysql::getInstance()->prepare($req);
            $stmt->execute();
            $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $resultat[0]["nom_tds"];
        }
        catch(Exception $e){
            echo "Day: $this->day<br>";
            echo "Resultat:<br>";
            var_dump($resultat[0]);
            echo "<br>";
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
        if (strcmp($saison, "") === 0) $saison = $this->saison;
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

    public function add_tds(string $nom) {
        $table = "tds_$this->zone";
        $req = "INSERT INTO $table (nom_tds) VALUES ('$nom')"; // simple quote autour de $nom obligatoire
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $table2 = "tds_repartition_$this->zone";
        $req2 = "INSERT INTO $table2 (nom_tds) VALUES ('$nom')"; 
        $stmt2 = Mysql::getInstance()->prepare($req2);
        $stmt2->execute();
        $table3 = "tds_greve_$this->zone";
        $req3 = "INSERT INTO $table3 (nom_tds) VALUES ('$nom')"; 
        $stmt3 = Mysql::getInstance()->prepare($req3);
        $stmt3->execute();
        $table4 = "tds_repartition_greve_$this->zone";
        $req4 = "INSERT INTO $table4 (nom_tds) VALUES ('$nom')"; 
        $stmt4 = Mysql::getInstance()->prepare($req4);
        $stmt4->execute();
    }

    public function delete_tds(string $nom) {
        $table = "tds_$this->zone";
        $req = "DELETE FROM $table WHERE nom_tds = '$nom'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $table2 = "tds_repartition_$this->zone";
        $req2 = "DELETE FROM $table2 WHERE nom_tds = '$nom'";
        $stmt2 = Mysql::getInstance()->prepare($req2);
        $stmt2->execute();
        $table3 = "tds_greve_$this->zone";
        $req3 = "DELETE FROM $table3 WHERE nom_tds = '$nom'";
        $stmt3 = Mysql::getInstance()->prepare($req3);
        $stmt3->execute();
        $table4 = "tds_repartition_greve_$this->zone";
        $req4 = "DELETE FROM $table4 WHERE nom_tds = '$nom'"; 
        $stmt4 = Mysql::getInstance()->prepare($req4);
        $stmt4->execute();
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

    public function duplicate_tds(string $nom, string $new_name) {
        $tds = $this->get_tds($nom);
        $tds_greve = $this->get_tds($nom, true);
        $this->add_tds($new_name);
        $this->set_tds($new_name, $tds);
        $this->set_tds($new_name, $tds_greve, true);
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
    public function get_saisons($all = true) {
        $req = "SELECT * FROM `dates_saisons_$this->zone`"; 
        if ($all === false) $req = "SELECT * FROM `dates_saisons_$this->zone` WHERE fin >= '$this->day'"; 
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

    public function add_plage(string $debut, string $fin, string $tds) {
        $table = "dates_saisons_$this->zone";
        $req = "INSERT INTO $table VALUES(null, '$debut', '$fin', '$tds')";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function save_plage(string $id, string $saison, string $debut, string $fin) {
        $table = "dates_saisons_$this->zone";
        $req = "UPDATE $table SET debut = '$debut', fin = '$fin', nom_tds = '$saison' WHERE id = '$id'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function supprime_plage(string $id) {
        $table = "dates_saisons_$this->zone";
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

    public function get_all_repartition() {
        $cycle = $this->get_cycle();
        $table = "tds_repartition_$this->zone";
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
    public function change_type_repartition(string $saison, string $vac, string $value) {
        if (strcmp($value, "standard") !== 0 && strcmp($value, "fixe") !== 0) return;
        $table = "tds_repartition_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_SET($vac, '$.type_repartition', '$value') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function set_repartition(string $saison, string $vac, string $json) {
        $table = "tds_repartition_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_COMPACT('$json') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // lorsqu'un nouveau tds est créé, il faut créer une ligne dans la table de répartition
    public function create_tds_repartition(string $saison) {
        $table = "tds_repartition_$this->zone";
        $req = "INSERT IGNORE INTO $table (nom_tds) VALUES ('$saison')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  ---------------------------------------------------------------
           uceso / Realise / i1
        --------------------------------------------------------------- */

    public function save_uceso(string $day, string $typejour, int $i1, string $uceso, string $realise, int $maxsecteurs, string $tvh, string $nbpc, int $minutes_ucesa) {
        $table = "i1_$this->zone";
        $req = "INSERT IGNORE INTO $table (jour, typejour, uceso, realise, i1, maxsecteurs, tvh, nbpc, minutes_ucesa) VALUES ('$day', '$typejour', JSON_COMPACT('$uceso'), JSON_COMPACT('$realise'), '$i1', '$maxsecteurs', JSON_COMPACT('$tvh'), JSON_COMPACT('$nbpc'), '$minutes_ucesa')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function get_ucesa(string $start_day, string $end_day) {
        $table = "i1_$this->zone";
        $req = "SELECT jour, typejour, realise, i1, maxsecteurs, tvh, nbpc, minutes_ucesa FROM $table WHERE jour <= '$end_day' AND jour >= '$start_day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function set_minutes_ucesa(string $day, int $minutes) {
        $table = "i1_$this->zone";
        $req = "UPDATE $table SET minutes_ucesa = '$minutes' WHERE jour = '$day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // pour Laurent Martinelli
    public function get_ucesa_daily(string $day) {
        $table = "i1_$this->zone";
        $req = "SELECT jour, realise, nbpc, minutes_ucesa FROM $table WHERE jour = '$day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

}

class bdd_instr {

    public function add_creneau_supp(string $day, string $debut, string $fin, string $zone, string $type, string $comm) {
        $table = "creneaux_supp";
        $req = "INSERT INTO $table VALUES (NULL, '$day', '$debut', '$fin', '$zone', '$type', '$comm')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
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
            $req .= " FROM $table WHERE jour >= '$start_day' && jour <= '$end_day'"; 
        }
        if ($zone === "est") {
            $req = "SELECT jour, typejour, LFMMCTAE_regdemand, RAE, SBAM, GY, AB ,EK";
            if ($vols === true) $req .= ", vols_RAE";
            $req .= " FROM $table WHERE jour >= '$start_day' && jour <= '$end_day'"; 
        }
        if ($zone === "ouest") {
            $req = "SELECT jour, typejour, LFMMCTAW_regdemand, RAW, MALY, WW, MF, DZ";
            if ($vols === true) $req .= ", vols_RAW";
            $req .= " FROM $table WHERE jour >= '$start_day' && jour <= '$end_day'"; 
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
        $req = "SELECT * FROM $table WHERE jour >= '$start_day' && jour <= '$end_day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($resultat);
    }

    public function set_vols_crna(string $day, int $LFMMCTA_regdemand, int $LFMMCTA_load, int $LFMMCTA_demand, int $LFMMCTAE_regdemand, int $LFMMCTAE_load, int $LFMMCTAE_demand, int $LFMMCTAW_regdemand, int $LFMMCTAW_load, int $LFMMCTAW_demand, int $RAE, int $SBAM, int $EK, int $AB, int $GY, int $RAW, int $MALY, int $WW, int $MF, int $DZ, string $vols_RAE, string $vols_RAW) {
        $date = new DateTime($day);
        $js = $date->format('w');
        $tab_jour = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
        $jour_semaine = $tab_jour[$js];
        $table = "vols_crna";
        $req = "INSERT INTO $table VALUES ('$day', '$jour_semaine', '$LFMMCTA_regdemand', '$LFMMCTA_load', '$LFMMCTA_demand', '$LFMMCTAE_regdemand', '$LFMMCTAE_load', '$LFMMCTAE_demand', '$LFMMCTAW_regdemand', '$LFMMCTAW_load', '$LFMMCTAW_demand', '$RAE', '$SBAM', '$EK', '$AB', '$GY', '$RAW', '$MALY', '$WW', '$MF', '$DZ', JSON_COMPACT('$vols_RAE'), JSON_COMPACT('$vols_RAW'))"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // $LFMMAPP = {"flights": nb_total_vol_app, "LFKJ": vols, "ad": nb, ...}
    public function set_vols_app(string $day, stdClass $LFMMAPP) {
        $date = new DateTime($day);
        $js = $date->format('w');
        $tab_jour = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
        $jour_semaine = $tab_jour[$js];
        $table = "vols_app";
        $keys = array_keys(get_object_vars($LFMMAPP));
        $nb_flights = $LFMMAPP->flights;
        $req = "INSERT INTO $table VALUES ('$day', '$jour_semaine', '$nb_flights'";
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

    // $tvset : LFMMFMPE, LFMMFMPW, LFMMAPP, (LFMMAPPE, LFMMAPPW ??)
    public function get_reguls(string $day, string $tvset = "LFMMAPP") {
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
        ---------------------------------------------------------------------------------------------------------------- */
    
    public function set_reguls(string $jour, stdClass $reguls, string $tvset = "LFMMAPP") {
        if ($tvset === "LFMMFMPE") $table = "reguls_est";
        if ($tvset === "LFMMFMPW") $table = "reguls_west";
        if ($tvset === "LFMMAPP") $table = "reguls_app";

        $yesterday = new DateTime($jour);
        $yesterday->modify('-1 day');
        $veille = $yesterday->format('Y-m-d');
        
        $table_reg_jour = $this->get_reguls($jour, $tvset); // [ ["id"=>nb, ...], ..., ["id"=>nb, ...] ]
        $table_reg_veille = $this->get_reguls($veille, $tvset);

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
                    $req = "INSERT INTO $table VALUES (null, '$day', '$jour_semaine', '$regId', '$tv', '$debut', '$fin', '$delay', '$reason', '$impactedFlights', JSON_COMPACT('$creation_time'), JSON_COMPACT('$update_obj'), '$deletion_time', JSON_COMPACT('$rates_str'))";
                    $stmt = Mysql::getInstance()->prepare($req);
                    $stmt->execute();
                }
                if ($last_update === "DELETION") {
                    $deletion_time = $last_update_time;
                    $update_obj = '[]';
                    $creation_time = '{}';
                    $req = "INSERT INTO $table VALUES (null, '$day', '$jour_semaine', '$regId', '$tv', '$debut', '$fin', '$delay', '$reason', '$impactedFlights', JSON_COMPACT('$creation_time'), JSON_COMPACT('$update_obj'), '$deletion_time', JSON_COMPACT('$rates_str'))";
                    $stmt = Mysql::getInstance()->prepare($req);
                    $stmt->execute();
                }
                if ($last_update === "UPDATE") {
                    $deletion_time = '';
                    $update_obj = '[{"time":"'.$last_update_time.'","debut":"'.$debut.'","fin":"'.$fin.'","rates":'.$rates_str.'}]';
                    $creation_time = '{}';
                    $req = "INSERT INTO $table VALUES (null, '$day', '$jour_semaine', '$regId', '$tv', '$debut', '$fin', '$delay', '$reason', '$impactedFlights', JSON_COMPACT('$creation_time'), JSON_COMPACT('$update_obj'), '$deletion_time', JSON_COMPACT('$rates_str'))";
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

}

?>