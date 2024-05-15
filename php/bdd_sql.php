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
            case "get_vols_crna":
                $bdd->get_vols_crna($content->start_day, $content->end_day, $content->zone);
                break;
            case "get_vols_app":
                $bdd->get_vols_app($content->start_day, $content->end_day);
                break;
            case "set_h20_occ_crna":
                $bdd->set_h20_occ_crna($content->zone, $content->jour, $content->h20, $content->occ);
                break;
            case "get_reguls":
                $bdd->get_reguls($content->zone, $content->start_day, $content->end_day);
                break;
            case "update_week":
                $bdd->update_week($content->day, $content->year, $content->week, $content->month, $content->table);
                break;
            case "get_vols_app_by_week":
                $bdd->get_vols_app_by_week($content->year);
                break;
            case "get_vols_crna_by_week":
                $bdd->get_vols_crna_by_week($content->year, $content->week_max);
                break;
            case "get_vols_app_by_month":
                $bdd->get_vols_app_by_week($content->year);
                break;
            case "get_vols_crna_by_month":
                $bdd->get_vols_crna_by_month($content->year, $content->week_max);
                break;
            case "get_reguls_by_interval_reason":
                $bdd->get_reguls_by_interval_reason($content->zone, $content->year, $content->interval);
                break;
            case "get_reguls_by_week":
                $bdd->get_reguls_by_week($content->zone, $content->year);
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

