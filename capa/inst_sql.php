<?php

require_once("../php/bdd.class.php");

/*  --------------------------------------------------------------
		gère le tds instruction dans la BDD SQL
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
    $content = json_decode($content);
    $fonction = $content->fonction;
    $bdd_instr = new bdd_instr();
    switch($fonction){
        case "get_clean_cycle":
            $bdd_instr->get_clean_cycle($content->zone); // "est" ou "ouest"
            break;
        case "get_clean_cycle_json":
            $bdd_instr->get_clean_cycle_json($content->zone); // "est" ou "ouest"
            break;
        case "add":
            $bdd_instr->add_creneau_supp($content->date, $content->debut, $content->fin, $content->zone, $content->type, $content->comm);
            break;
        case "add_greve":
            $bdd_instr->add_creneau_supp_greve($content->date, $content->vac, $content->sousvac, $content->zone, $content->type, $content->comm);
            break;
        case "delete":
            $bdd_instr->delete_creneau_supp($content->id);
            break;
        default: // get_all
            echo json_encode($bdd_instr->get_creneaux_supp($content->zone));
    }
} else { echo "Erreur : données non json<br/>"; }


?>

