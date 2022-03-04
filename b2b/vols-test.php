<?php
$version = '25.0.0'; 
//Paramètres d'accès au B2B

$wsdl_flow_services_MM = __DIR__."/B2B/FlowServices_OPS_".$version.".wsdl";
$wsdl_airspace_services_MM = __DIR__."/B2B/AirspaceServices_OPS_".$version.".wsdl";
$wsdl_flight_services_MM = __DIR__."/B2B/FlightServices_OPS_".$version.".wsdl";

$vLocation_MM = "https://www.b2b.nm.eurocontrol.int/B2B_OPS/gateway/spec/".$version;
$local_cert_MM = __DIR__."/B2B/certif2021.pem";
$passphrase_MM ="1234";

//instanciation soap
$context = stream_context_create(
	array(
		'ssl' => array(
			'verify_peer' => false,
			'verify_peer_name' => false,
			'allow_self_signed' => true
		)
	)
);

$soapClient = new SoapClient(
	$wsdl_flight_services_MM,
	array(
		'cache_wsdl' => WSDL_CACHE_NONE,
		'wsdl_cache' => 0,
        'local_cert' => $local_cert_MM,
		'passphrase'=>$passphrase_MM,
		'stream_context' => $context,
		'trace'=>1,
		//'proxy_host' => '100.78.176.201', 	// proxy DGAC LFMM
		//'proxy_port' => 8001,				// 
		'exceptions'=>1,
		'location' => $vLocation_MM
	)
);

$tv1 = "LFMYY";
$wef = gmdate('Y-m-d H:i', strtotime("today 07:00"));
$unt = gmdate('Y-m-d H:i', strtotime("today 08:00"));

function get_vols($tv, $wef, $unt) {
	
	global $soapClient;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficType'=>'LOAD',
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'requestedFlightFields'=>array('timeAtReferenceLocationEntry','aircraftType'),
		'trafficVolume'=>$tv,
		'calculationType'=>'ENTRY'
	);
						
	try {
		$output = $soapClient->__soapCall('queryFlightsByTrafficVolume', array('parameters'=>$params));
		//echo $soapClient->__getLastResponse();
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

$vols_rae = get_vols($tv1, $wef, $unt);
$nbr_vols_rae = count($vols_rae->data->flights);
$date_str = substr($vols_rae->requestReceptionTime, 0, 10);
$heure_str = substr($vols_rae->requestReceptionTime, 11, 5);

$req_vols = "requete VOLS recue le ".$date_str." a ".$heure_str." UTC pour la date du ".$wef." UTC a ".$unt."UTC<br/>";
echo $req_vols;
var_dump($vols_rae);

?>