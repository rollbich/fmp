<?php

require_once("../php/bdd.class.php");

/*  --------------------------------------------------------------
		gère le tds dans la BDD SQL
			
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
    try {
        $content = trim(file_get_contents("php://input"));
        $content = json_decode($content);
        $fonction = $content->fonction;
        $bdd = new bdd_tds("", $content->zone);
        switch($fonction){
            case "save_tds":
                $bdd->set_tds($content->saison, $content->tds, (bool) $content->greve);
                break;
            case "add_tds":
                $bdd->add_tds($content->saison, (bool) $content->greve);
                break;
            case "delete_tds":
                $bdd->delete_tds($content->saison, (bool) $content->greve);
                break;
            case "duplicate_tds":
                $bdd->duplicate_tds($content->tds_to_copy, $content->new_tds_name, (bool) $content->greve);
                break;
            case "delete_sousvac":
                $bdd->remove_sous_vac($content->saison, $content->vac, $content->sousvac, (bool) $content->greve);
                break;
            case "add_sousvac":
                $bdd->add_sous_vac($content->saison, $content->vac, $content->sousvac, (bool) $content->greve);
                break;
            case "change_cds":
                $bdd->change_cds($content->saison, $content->vac, (int) $content->nbcds, (bool) $content->greve);
                break;
            case "add_plage":
                $bdd->add_plage($content->debut, $content->fin, $content->tds, $content->greve);
                break;
            case "save_plage":
                $bdd->save_plage($content->id, $content->saison, $content->debut, $content->fin);
                break;
            case "supprime_plage":
                $bdd->supprime_plage($content->id);
                break;
            case "add_tds_supp":
                $bdd->add_tds_supp($content->nom_tds, $content->tds_associe);
                break;
            case "delete_tds_supp":
                $bdd->delete_tds_supp($content->nom_tds);
                break;
            case "save_tds_supp":
                $bdd->save_tds_supp($content->nom_tds, $content->arr_json);
                break;
            case "insert_realise":
                $bdd->insert_realise($content->day, $content->realise);
                break;
            case "set_repartition":
                $bdd->set_repartition($content->nom_tds, $content->vac, $content->json, (bool) $content->greve);
                break;
            case "change_type_repartition":
                $bdd->change_type_repartition($content->nom_tds, $content->vac, $content->type, (bool) $content->greve);
                break;
            case "save_uceso":
                $bdd->save_uceso($content->day, $content->typejour, (int) $content->i1, $content->uceso, $content->realise, (int) $content->maxsecteurs, $content->tvh, $content->nbpc, (int) $content->minutes_ucesa);
                break;
            case "get_ucesa":
                $bdd->get_ucesa($content->start_day, $content->end_day);
                break;
            case "set_minutes_ucesa":
                $bdd->set_minutes_ucesa($content->day, $content->minutes_ucesa);
                break;
            case "get_clean_cycle":
                $bdd->get_clean_cycle($content->zone); // "est" ou "ouest"
                break;
            case "get_clean_cycle_json":
                $bdd->get_clean_cycle_json($content->zone); // "est" ou "ouest"
                break;
            case "add":
                $bdd->add_creneau_supp($content->date, $content->debut, $content->fin, $content->zone, $content->type, $content->comm);
                break;
            case "add_greve":
                $bdd->add_creneau_supp_greve($content->date, $content->vac, $content->sousvac, $content->zone, $content->type, $content->comm);
                break;
            case "delete":
                $bdd->delete_creneau_supp($content->id);
                break;
            case "get_all_creneaux": // get_all
                echo json_encode($bdd->get_creneaux_supp($content->zone));
                break;
            case "save_g":
                $bdd->save_g($content->zone, $content->day, $content->g);
                break;
            default: 
                echo "";
        }
    }
    catch(Exception $e) {
        echo 'Erreur : ' .$e->getMessage();
        echo '<br>';
        echo 'Code erreur : ' .$e->getCode();
    }
} else { 
    echo "Erreur : données non json<br/>"; 
}

?>