<?php

require_once("../php/bdd.class.php");

/*  --------------------------------------------------------------
		Gestion default date MV-OTMV
	--------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
    try {
        $content = trim(file_get_contents("php://input"));
        $content = json_decode($content);
        $fonction = $content->fonction;
        $bdd = new bdd_admin();
        switch($fonction){
            case "get_day_MV_OTMV":
                echo json_encode($bdd->get_day_MV_OTMV());
                break;
            case "set_day_MV_OTMV":
                $bdd->set_day_MV_OTMV($content->day);
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
} else { echo "Erreur : données non json<br/>"; }


?>

