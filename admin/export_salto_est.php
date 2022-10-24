<?php
session_start();
if (!(isset($_SESSION['login_bureau'])) || $_SESSION['login_bureau'] === false) die("Interdit");
/*  ----------------------------------------------------------------------------------
		sauvegarde le fichier json des confs supp Est et West
			@param {object} $json - objet json à sauver
			{
				"1": {"E1A": ["RAE"]},
				"2":{"E2A":["GYA","RAEM"],"E2B":["GY","RAES"],"E2C":["GYAB","RAEE"]},
				"3": ...
			}
	-----------------------------------------------------------------------------------  */

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, false); // true = array / false = object
	
	write_xml($decoded);
	
} else { echo "Erreur : données non json<br/>"; }

function write_xml($json) {

    $domtree = new DOMDocument('1.0', 'UTF-8');
	$domtree->formatOutput = true;
	$xmlroot = $domtree->createElement("ParametrageConfigurationCentre");
	$xmlroot->setAttribute("date", "2022-08-31");
	$xmlroot->setAttribute("nom", "LFMME");
	$xmlroot->setAttributeNS('http://www.w3.org/2000/xmlns/' ,'xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
	$xmlroot->setAttributeNS('http://www.w3.org/2001/XMLSchema-instance' ,'xsi:noNamespaceSchemaLocation', 'ParametrageConfigurationCentre.xsd');

	$xmlcluster = $domtree->createElement("ClusterCentre");
	$xmlcluster->setAttribute("nom", "LFMMCTAE");
	
	foreach($json->confs->est as $nbr_sector=>$config) {
		foreach($config as $conf=>$regroup) {
			$xmlconfig = $domtree->createElement("ConfigurationCentre");
			$xmlconfig->setAttribute("nom", $conf);
			foreach($regroup as $tv) {
				$xmlregroup = $domtree->createElement("RegroupementCentre");
				$xmlregroup->setAttribute("nom", $tv);
				$xmlconfig->appendChild($xmlregroup);
			}
			$xmlcluster->appendChild($xmlconfig);
		}

	}

	$xmlroot->appendChild($xmlcluster);

	foreach($json->tvs as $tv) {
		$xmlcorresp = $domtree->createElement("CorrespondanceTrafficVolumeAirspaceCentre");
		$xmlcorresp->setAttribute("nomTrafficVolume", "LFM$tv");
		$xmlcorresp->setAttribute("nomAirspace", "LFMM$tv");
		$xmlroot->appendChild($xmlcorresp);
	}

	$rel = array(["LFMEST1","LFMMEKBTAJ"],["LFMVAMTU","LFMMB34"]);
	foreach($rel as $arr) {
		$xmlcorresp = $domtree->createElement("CorrespondanceTrafficVolumeAirspaceCentre");
		$xmlcorresp->setAttribute("nomTrafficVolume", $arr[0]);
		$xmlcorresp->setAttribute("nomAirspace", $arr[1]);
		$xmlroot->appendChild($xmlcorresp);
	}

	$domtree->appendChild($xmlroot);

	$xml = $domtree->saveXML();
	$nom = 'ConfigurationCentreE.xml';
	$domtree->save($nom);
	echo $nom;
}

?>