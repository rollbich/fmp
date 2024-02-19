<?php

require_once("../php/bdd.class.php");

/*  --------------------------------------------------------------
		gère les acces dans la BDD SQL (hors tds)
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
    $content = json_decode($content);
    $fonction = $content->fonction;
    $bdd = new bdd();
    try {
        switch($fonction){
            case "set_vols_crna":
                $bdd->set_vols_crna($content->day, $content->CTA_reg_demand, $content->CTA_load, $content->CTA_demand, $content->CTAE_reg_demand, $content->CTAE_load, $content->CTAE_demand, $content->CTAW_reg_demand, $content->CTAW_load, $content->CTAW_demand, $content->RAE_load, $content->SBAM_load, $content->EK_load, $content->AB_load, $content->GY_load, $content->RAW_load, $content->MALY_load, $content->WW_load, $content->MF_load, $content->DZ_load, $content->vols_RAE, $content->vols_RAW);
                break;
            case "set_vols_app":
                $bdd->set_vols_app($content->day, $content->LFMMAPP);
                break;
            default: 
                echo "default";
        }
    }
    catch (Exception $e) {
        echo 'Exception reçue sauve vols: ',  $e->getMessage(), "\n<br>";
    }
} else { echo "Erreur : données non json<br/>"; }


?>

