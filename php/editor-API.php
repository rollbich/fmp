<?php
header('Content-type: application/json');
ini_set('memory_limit', '1G');
require_once("manage_editor_class.php");

/*  -------------------------------------------------------------------------------------------- */
/* 						début du programme
        @param zone : string "est" ou "ouest"

        @returns {object} : 
			  { "cycle": ["J2","S1","N","","","","JX","J1","J3","S2","",""],
                "tds_local": ...,
				"tds_supp_local": {...},
				"saisons": [ nom_saison: {"id":..., "debut":..., "fin": ...},...]
                "zone": "est" ou "ouest"
			  }
/*  -------------------------------------------------------------------------------------------- */

try {	
    if (isset($_GET["zone"])) {
        $zone = $_GET["zone"]; // "est" ou "ouest"
        if ($zone !== "est" && $zone !== "ouest") {
            $error = new StdClass();
            $error->msg = "La zone doit être 'est' ou 'ouest'"; 
            echo json_encode($error);
            exit();
        }
    } else {
        $error = new StdClass();
        $error->msg = "Il manque la donnée GET de zone en entrée"; 
        echo json_encode($error);
        exit();
    }

	$c = new editor($zone);
	$result = $c->get_editor_data();
	echo json_encode($result);
}

catch (Exception $e) {
    $err = new stdClass();
	$err->msg = "Erreur : Exception reçue : ".$e->getMessage();
	echo json_encode($err);
}

?>