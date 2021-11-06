<?php
$obj = new stdClass();			
$liste_annees = scan_dossier("../Realise/");
foreach($liste_annees as $dossier_annee) {
	$liste_mois = scan_dossier("../Realise/$dossier_annee");
	$obj->$dossier_annee = new stdClass();
	foreach($liste_mois as $dossier_mois) {
		$obj->$dossier_annee->$dossier_mois = scan("../Realise/$dossier_annee/$dossier_mois");
	}
}

$json = json_encode($obj);
echo $json;

function scan_dossier($rep) {
	$arr_files = [];
	$liste_rep = scandir($rep);  
    $i = 0;
    $num = count($liste_rep);
    while($i < $num){
	  if ($liste_rep[$i] != "." && $liste_rep[$i] != "..") {
		if(is_dir($rep.'/'.$liste_rep[$i]))
		array_push($arr_files, $liste_rep[$i]);
	  }
      $i++;
    }
	sort($arr_files);
	return $arr_files;
}

function scan($rep) {
	$arr_files = [];
	$liste_rep = scandir($rep);  
    $i = 0;
    $num = count($liste_rep);
    while($i < $num){
	  if ($liste_rep[$i] != "." && $liste_rep[$i] != "..") {
		array_push($arr_files, $liste_rep[$i]);
	  }
      $i++;
    }
	return $arr_files;
}

?>