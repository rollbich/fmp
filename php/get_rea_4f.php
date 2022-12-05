<?php
header('content-type:application/json');

/* ----------------------------------------------------------------------------------------------------------------------------------------
	    @param {string} - zone = "E" ou "W"
   ---------------------------------------------------------------------------------------------------------------------------------------- */

function get_rea_4f($year, $month, $day, $zone) {
	$fichier = "../Realise/$year/$month/$year$month$day"."_000000_LFMM-$zone.xml";
    $contenu = simplexml_load_file($fichier);
      
    $res = new stdClass();
    $res->date = "$day-$month-$year";
    $res->zone = $zone;
    $res->mapping = [];
    
    foreach ($contenu->mapping as $mapping) {
        $heure_debut = substr($mapping->attributes()['time'], 11, 5);
        $obj = new StdClass();
        $obj->start_time = $heure_debut;
        $obj->pos = [];

        $nbr_pos = count($mapping->pos);
        $objet = new StdClass();
        
        $objet->pos_name = substr($mapping->pos[0]->attributes()['name'], 0, 3);
        $objet->pos_resps = (string) $mapping->pos[0]->attributes()['resps'];
        $objet->pos_regroup = (string) $mapping->pos[0]->attributes()['regroup'];
        array_push($obj->pos, $objet);
        
        for($i=1;$i<$nbr_pos-1;$i++) {
            $objet = new StdClass();
            $objet->pos_name = substr($mapping->pos[$i+1]->attributes()['name'], 0, 3);
            $objet->pos_resps = (string) $mapping->pos[$i+1]->attributes()['resps'];
            $objet->pos_regroup = (string) $mapping->pos[$i+1]->attributes()['regroup'];
            if (strcmp($objet->pos_regroup, $mapping->pos[$i]->attributes()['regroup']) != 0) {
                array_push($obj->pos, $objet);
            }
        }
        array_push($res->mapping, $obj);
    }
    
    return $res;
}

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	
	$zone = $decoded["zone"];
	$date = $decoded["day"];

    $d = explode("-", $date);
	$year = $d[0];
	$month = $d[1];
	$day = $d[2];

	$resultat = get_rea_4f($year, $month, $day, $zone);
	echo json_encode($resultat);
	
} else { 
    $arr = array('erreur' => 'pas json');
    echo json_encode($arr);
}

?>