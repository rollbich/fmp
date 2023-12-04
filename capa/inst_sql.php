<?php

require_once("../php/bdd.class.php");

/*  --------------------------------------------------------------
		sauvegarde le fichier json du tds
			@param {object} $json - objet json à sauver
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
    $content = json_decode($content);
    $fonction = $content->fonction;
    $bdd_instr = new bdd_instr();
    switch($fonction){
        case "add":
            $bdd_instr->add_creneau_supp($content->date, $content->debut, $content->fin, $content->zone, $content->type, $content->comm);
            break;
        case "delete":
            $bdd_instr->delete_creneau_supp($content->id);
            break;
        case "get_day":
            echo '$x stocke la valeur 3';
            break;
        case 4:
            echo '$x stocke la valeur 4';
            break;
        default: // get_all
            echo json_encode($bdd_instr->get_creneaux_supp($content->zone));
    }
} else { echo "Erreur : données non json<br/>"; }


?>

