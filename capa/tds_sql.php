<?php

require_once("../php/bdd.class.php");

/*  --------------------------------------------------------------
		sauvegarde la saison du tds dans la BDD SQL
			@param {object} $json - 
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
    $content = json_decode($content);
    $fonction = $content->fonction;
    $bdd = new bdd("", $content->zone);
    switch($fonction){
        case "save_tds":
            $bdd->set_tds($content->saison, $content->tds);
            break;
        case "add_tds":
            $bdd->add_tds($content->saison);
            break;
        case "delete_tds":
            $bdd->delete_tds($content->saison);
            break;
        case "duplicate_tds":
            $bdd->duplicate_tds($content->tds_to_copy, $content->new_tds_name);
            break;
        case "delete_sousvac":
            $bdd->remove_sous_vac($content->saison, $content->vac, $content->sousvac);
            break;
        case "add_sousvac":
            $bdd->add_sous_vac($content->saison, $content->vac, $content->sousvac);
            break;
        case "change_cds":
            $bdd->change_cds($content->saison, $content->vac, (int) $content->nbcds);
            break;
        case "save_uceso":
            $bdd->save_uceso($content->day, $content->typejour, (int) $content->i1, $content->uceso, $content->realise, (int) $content->maxsecteurs, $content->tvh, $content->nbpc);
            break;
        case "add_plage":
            $bdd->add_plage($content->debut, $content->fin, $content->tds);
            break;
        case "save_plage":
            $bdd->save_plage($content->id, $content->saison, $content->debut, $content->fin);
            break;
        case "supprime_plage":
            $bdd->supprime_plage($content->id);
            break;
        case "add_tds_supp":
            $bdd->add_tds_supp($content->nom_tds);
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
            $bdd->set_repartition($content->nom_tds, $content->vac, $content->json);
            break;
        default: 
            echo "";
    }
    /*
	echo "<pre>";
    var_dump($content);
    echo "</pre>";
    */
} else { 
    echo "Erreur : données non json<br/>"; 
}

?>