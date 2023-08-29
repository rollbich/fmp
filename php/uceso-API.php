<?php
header('Content-type: application/json');
ini_set('memory_limit', '1G');
require_once("capa_class.php");

/*  -------------------------------------------------------------------------------------------- */
/* 						début du programme
        uceso_api.php?day=2023-08-25&zone=est
        @param day  : string contenant la date
        @param zone : string "est" ou "ouest"

        @return json object {
            "day"  : "2023-08-01"
            "zone" : "est" ou "ouest"
            "offsetTime" : 1 ou 2 (decalage entre UTC et heure locale)
            "saison" :  "hiver" ou "mi-saison-basse"
                        "mi-saison-haute" ou "ete"
            "pc_total" : nombre total de PC par 15 minutes [ ["00:00", nb_pc], [...] ...]
            "uceso" : nombre d'ucecos par 15 minutes [ ["00:00", ucesos], [...] ...]
            "compacted_uceso" : nombre d'ucesos [ ["00:00", "02:30", ucesos], ...]
            "pc_total_horsInstrRD_15mn" : PC hors instruction et RD bleus mais avec JX et RD JX
            "pc_instr_15mn" : PC instruction par 15 minutes
            "pc_RD_15mn" : RD bleus hors JX {"RDS1b-ete" : [ ["00:00", nb_pc], ...], ...}
            "pc_total_RD_15mn" : total RD bleus par 15 minutes
            "pc_vac" : données OLAF
        }
/*  -------------------------------------------------------------------------------------------- */

try {	
    if (isset($_GET["zone"]) && isset($_GET["day"])) {
        $zone = $_GET["zone"]; // "est" ou "ouest"
        if ($zone !== "est" && $zone !== "ouest") {
            $error = new StdClass();
            $error->msg = "La zone doit être 'est' ou 'ouest'"; 
            echo json_encode($error);
            exit();
        }
	    $day = $_GET["day"]; // "2023-08-01"
    } else {
        $error = new StdClass();
        $error->msg = "Il manque des données GET en entrée"; 
        echo json_encode($error);
        exit();
    }
    
	$c = new capa($day, $zone);
	$capacite = $c->get_nbpc_dispo();
	echo json_encode($capacite);
}

catch (Exception $e) {
    $err = new stdClass();
	$err->msg = "Erreur : Exception reçue : ".$e->getMessage();
	echo json_encode($err);
}

?>