<?php
require_once("configsql.inc.php");
require_once("pdo.class.php");

class bdd {

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

    // @return string - "nom de la saison" actuelle
    public function get_current_tds() {
        $req = "SELECT nom_tds FROM `dates_saisons_$this->zone` WHERE debut <= '$this->day' AND fin >= '$this->day'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $resultat[0]["nom_tds"];
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

    public function get_tds(string $saison = "") {
        if (strcmp($saison, "") === 0) $saison = $this->saison;
        $table = "tds_$this->zone";
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
    public function get_all_tds() {
        $table = "tds_$this->zone";
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
       // $req = "INSERT INTO $table (JX) VALUES ('$nom', '{\"category\": \"Landmark\", \"lastVisitDate\": \"11/10/2019\"}')";
        $req = "INSERT INTO $table (nom_tds) VALUES ('$nom')"; // simple quote autour de $nom obligatoire
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function delete_tds(string $nom) {
        $table = "tds_$this->zone";
       // $req = "INSERT INTO $table (JX) VALUES ('$nom', '{\"category\": \"Landmark\", \"lastVisitDate\": \"11/10/2019\"}')";
        $req = "DELETE FROM $table WHERE nom_tds = '$nom'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  ------------------------------------------------------------------------------------------------------------
            sauve une saison avec toutes les vacs
            @param $tds_json - Object { "JX": {"nb_cds": 0, "cds", [...], "A": [...]...}, "J1": ...,...} }
        ------------------------------------------------------------------------------------------------------------ */
    public function set_tds(string $saison, $tds_obj) {
        $table = "tds_$this->zone";
        $vacs = array_keys(get_object_vars($tds_obj)); // array des vacs
        /*
        echo "<pre>";
        var_dump($vacs);
        var_dump($tds_obj);
        echo "</pre>";
        */
       foreach($vacs as $vac) {
            $this->set_vac($saison, $vac, $tds_obj);
       }

    }

    public function duplicate_tds(string $nom, string $new_name) {
        $tds = $this->get_tds($nom);
        $this->add_tds($new_name);
        $table = "tds_$this->zone";
        $this->set_tds($new_name, $tds);
    }

   /*  ------------------------------------------------------------------------------------------------------------
        sauve une vac d'une saison
        @param $tds_json - Object { zone: "est", saison: "hiver_2024", tds_local: {"JX": ..., "J1": ...,...} }
    ------------------------------------------------------------------------------------------------------------ */
    private function set_vac(string $saison, string $vac, $tds_obj) {
        $table = "tds_$this->zone";
        
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
        echo "$req<br>";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();

    }

    public function add_sous_vac(string $saison, string $vac, string $nom_sous_vac) {
        $table = "tds_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_COMPACT(JSON_INSERT($vac,'$.$nom_sous_vac',JSON_ARRAY(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0))) WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    public function remove_sous_vac(string $saison, string $vac, string $nom_sous_vac) {
        $table = "tds_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_REMOVE($vac, '$.$nom_sous_vac') WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // @param $tds_json - Object { zone: "est", saison: "hiver_2024", tds_local: {"JX": ..., "J1": ...,...} }
    //  change only a key whose value is array
    public function set_sousvac(string $saison, string $vac, string $sousvac, $tds_obj) {
        $table = "tds_$this->zone";
        $value = implode(', ', $tds_obj->$vac->$sousvac); // string "0,0,1...,0" 96 valeurs
        $req = "UPDATE $table SET $vac = JSON_COMPACT(JSON_SET($vac, '$.$sousvac', JSON_ARRAY($value))) WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    // @return JSON string - {nb_cds: 1}
    public function get_nb_cds(string $vac) {
        $table = "tds_$this->zone";
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
    public function change_cds(string $saison, string $vac, int $value) {
        $table = "tds_$this->zone";
        $req = "UPDATE $table SET $vac = JSON_COMPACT(JSON_SET($vac, '$.nb_cds', $value)) WHERE nom_tds = '$saison'";
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    }

    /*  --------------------------------------------------------------------------
            @return  :
            object(stdClass)#26 (3) {
                "RDJ1-ms-2023": [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
                ...
            }
        -------------------------------------------------------------------------- */

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
    
    // pour sélecter un tds supp associé à une saison
    public function get_tds_supp(string $saison = "") {
        if (strcmp($saison, "") === 0) $saison = $this->saison;
        $table = "tds_supp_$this->zone";
        $req = "SELECT * FROM $table WHERE nom_tds = '$saison'"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
        $resultat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $obj = new stdClass();
        foreach($resultat as $value) {
            //$prop = substr($value["Renfort"], 0, -5); // pour enlever -2023
            $obj->{$value["Renfort"]} = json_decode($value["tds"]);
        }
        return $obj;
    }

    public function add_tds_supp(string $nom) {
        $table = "tds_supp_$this->zone";
        $req = "INSERT INTO $table (Renfort) VALUES ('$nom')"; 
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

    public function save_uceso(string $day, string $typejour, int $i1, string $uceso, string $realise, int $maxsecteurs, string $tvh, string $nbpc) {
        $table = "i1_$this->zone";
        $req = "INSERT IGNORE INTO $table (jour, typejour, uceso, realise, i1, maxsecteurs, tvh, nbpc) VALUES ('$day', '$typejour', JSON_COMPACT('$uceso'), JSON_COMPACT('$realise'), '$i1', '$maxsecteurs', JSON_COMPACT('$tvh'), JSON_COMPACT('$nbpc'))"; 
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
    
    public function get_repartition(string $saison = "") {
        if (strcmp($saison, "") === 0) $saison = $this->saison;
        $cycle = $this->get_cycle();
        $table = "tds_repartition_$this->zone";
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
        echo "change_type_repartition $saison $vac = $value : OK";
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

?>