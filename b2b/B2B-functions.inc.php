<?php
/*  -----------------------------------------------------------------------
		instanciation soap FLOW Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]

		TrafficType : 
        	DEMAND : Traffic demand ("FTFM": Filed Tactical Flight Model).
	        REGULATED_DEMAND : Regulated traffic demand ("RTFM": Regulated Tactical Flight Model).
        	LOAD : Traffic load ("CTFM": Current Tactical Flight Model).

	----------------------------------------------------------------------- */
 
$soapFlow = new B2B("flow");
$soapClientFlow = $soapFlow->get_client();

/*  ---------------------------------------------------------
					Appel b2b
		récupère le nbre de vols d'une journée d'un airspace
		(marche aussi pour un TV en changeant la requete par
		queryTrafficCountsByTrafficVolume et en remplacant
		airspace par trafficVolume)
		Utilisé pour LFMMCTA, LFMMCTAE et LFMMCTAW
	--------------------------------------------------------- */
function query_entry_day_count($airspace, $trafficType) {
	
	global $soapClientFlow;
	global $wef_flights;
	global $unt_flights;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>$trafficType),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef_flights,'unt'=>$unt_flights),
		'countsInterval'=>array('duration'=>'2400','step'=>'2400'),
		'airspace'=>$airspace,
		'subTotalComputeMode'=>'NO_SUB_TOTALS',
		'calculationType'=>'ENTRY'
	);
	
	try {
		$output = $soapClientFlow->__soapCall('queryTrafficCountsByAirspace', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  --------------------------------------------------
					Appel b2b
		récupère le H20 (duration 60, step 20)
		dans la plage horaire $wef-$unt en heure UTC
	-------------------------------------------------- */
function query_entry_count($tv, $wef, $unt, $trafficType) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>$trafficType),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'subTotalComputeMode'=>'NO_SUB_TOTALS',
		'countsInterval'=>array('duration'=>'0060','step'=>'0020'),
		'trafficVolume'=>$tv,
		'calculationType'=>'ENTRY'
	);
	
	try {
		$output = $soapClientFlow->__soapCall('queryTrafficCountsByTrafficVolume', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ------------------------------------------------------------
					Appel b2b
		récupère l'occ (duration en fonction du TV, step 1)
		dans la plage horaire $wef-$unt en heure UTC
	------------------------------------------------------------ */
function query_occ_count($tv, $tv_duration, $wef, $unt, $trafficType) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficTypes'=>array('item'=>$trafficType),
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'subTotalComputeMode'=>'NO_SUB_TOTALS',
		'countsInterval'=>array('duration'=>$tv_duration,'step'=>'0001'),
		'trafficVolume'=>$tv,
		'calculationType'=>'OCCUPANCY'
	);
							
	try {
		$output = $soapClientFlow->__soapCall('queryTrafficCountsByTrafficVolume', array('parameters'=>$params));
		return $output;
	}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
	
}

/*  --------------------------------------------------------------------
			récupère le H20 de la zone "est" ou "west"
		dans la plage horaire $wef-$unt en heure UTC
		@return [ ["TV", "yyyy-mm-dd", "hh:mm", MV, H/20], [...], ... ]
	-------------------------------------------------------------------- */
function get_entry($zone, $wef, $unt, $trafficType) {
	
	global $tvs_est;
	global $tvs_west;
	global $tve;
	global $tvw;
	
	$arr = array();
	
	if ($zone !== "est" && $zone !== "west") throw new Exception("La zone doit être \"est\" ou \"west\" !");
	
	if ($zone === "est") {
		$tv_group = $tvs_est;
		$tv_prefix = $tve;
	} 
	if ($zone === "west") {
		$tv_group = $tvs_west;
		$tv_prefix = $tvw;
	}

	foreach($tv_group as $tv) {
		
		if (isset($tv_prefix[$tv]["MV"])) { $tv_mv = $tv_prefix[$tv]["MV"]; } else { throw new Exception("Le TV ".$tv." a une MV non defini dans MV.json"); }
		
		$date = new DateTime($wef);
		$timestamp = $date->getTimestamp();
		$result = query_entry_count("LFM".$tv, $wef, $unt, $trafficType);

		for ($i=0; $i<count($result->data->counts->item); $i++) {
			  $date->setTimestamp($timestamp+$i*60*20);
			  array_push($arr, array($tv, $date->format('Y-m-d'), $date->format('H:i'), $tv_mv, $result->data->counts->item[$i]->value->item->value->totalCounts));
		}
	}
	return $arr;
}

/*  -------------------------------------------------------------------------------
			récupère l'occ de la zone "est" ou "west"
		dans la plage horaire $wef-$unt en heure UTC
		@return [ ["TV", "yyyy-mm-dd", "hh:mm", peak, sustain, H/20], [...], ... ]
	------------------------------------------------------------------------------- */

function get_occ($zone, $wef, $unt, $trafficType) {
	
	global $tvs_est;
	global $tvs_west;
	global $tve;
	global $tvw;
	$tv_duration = 0;
	
	$arr = array();
	
	if ($zone !== "est" && $zone !== "west") throw new Exception("La zone doit être \"est\" ou \"west\" !");
	
	if ($zone === "est") {
		$tv_group = $tvs_est;
		$tv_prefix = $tve;
	} 
	if ($zone === "west") {
		$tv_group = $tvs_west;
		$tv_prefix = $tvw;
	}

	foreach($tv_group as $tv) {
		
		if (isset($tv_prefix[$tv]["peak"])) { $tv_peak = $tv_prefix[$tv]["peak"]; } else { throw new Exception("Le TV ".$tv." a un peak non defini dans MV.json"); }
		if (isset($tv_prefix[$tv]["sustain"])) { $tv_sustain = $tv_prefix[$tv]["sustain"]; } else { throw new Exception("Le TV ".$tv." a un sustain non defini dans MV.json"); }
		if (isset($tv_prefix[$tv]["duration"])) { $tv_duration = str_pad($tv_prefix[$tv]["duration"], 4, '0', STR_PAD_LEFT); } else { throw new Exception("Le TV ".$tv." a une duration non defini dans MV.json"); }
		
		$date = new DateTime($wef);
		$timestamp = $date->getTimestamp();
		$result = query_occ_count("LFM".$tv, $tv_duration, $wef, $unt, $trafficType);
	
		for ($i=0; $i<count($result->data->counts->item); $i++) {
			  $date->setTimestamp($timestamp+$i*60);
			  array_push($arr, array($tv, $date->format('Y-m-d'), $date->format('H:i'), $tv_peak, $tv_sustain, $result->data->counts->item[$i]->value->item->value->totalCounts));
		}
	}
	return $arr;
}

/*  ----------------------------------------------------------------------
		récupère les reguls d'une zone définie par un trigramme
				$area : 3 premières lettres (ex : LFM)
				$wef-$unt : plage en heure UTC
		Note :  queryRegulations ne récupère pas les delais des TV
				c'est pourquoi, on effectue une requete atfcm_situation
				
		On récupère un tableau pour sauvegarde simple en xls et csv
		On créé un objet global json plus complet $json_reg
		pour la sauvegarde json
	---------------------------------------------------------------------- */
function get_regulations($area, $wef, $unt) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'requestedRegulationFields'=>array('item'=>array('applicability', 'initialConstraints', 'delayTVSet', 'reason', 'location', 'lastUpdate')),
		'queryPeriod'=>array('wef'=>$wef,'unt'=>$unt),
		'tvs'=>array($area."*")
	);
	
	$reg = [];
	$reg["LFMMFMPE"] = array();
	$reg["LFMMFMPW"] = array();
	$reg["LFMMAPP"] = array();
	
	$reg["LFBBFMP"] = array();
	$reg["LFBBAPP"] = array();
	
	$reg["LFEEFMP"] = array();
	$reg["LFEEAPP"] = array();
	
	$reg["LFFFFMPE"] = array();
	$reg["LFFFFMPW"] = array();
	$reg["LFFFAD"] = array();
	
	$reg["LFRRFMP"] = array();
	$reg["LFRRAPP"] = array();
	
	$reg["LFDSNA"] = array();
	
	global $json_reg;
	
	try {
		$output = $soapClientFlow->__soapCall('queryRegulations', array('parameters'=>$params));
		$situation_ATFCM = get_ATFCM_situation();
		$situation = get_area_situation($situation_ATFCM, $area);
		for ($i=0; $i<count($output->data->regulations->item); $i++) {
			$r = $output->data->regulations->item[$i];
			$id = $r->regulationId;
			$lastUpdateDate = substr($r->lastUpdate->userUpdateEventTime, 0, 10);
			$lastUpdateTime = substr($r->lastUpdate->userUpdateEventTime, 11, 5);
			$delay = 0;
			$nbrImpactedFlight = 0;
			foreach ($situation as $regul) {
				if ($regul[0] == $id) {
					$delay = (int) $regul[1];
					$nbrImpactedFlight = (int) $regul[2];
				}
			}
			$tvset = $r->delayTVSet;
			$c = $r->initialConstraints;
			if (is_array($c)) {
				// pour export Excel
				for($j=0; $j<count($c); $j++) {
					$date = substr($r->initialConstraints[$j]->constraintPeriod->wef, 0, 10);
					$hdeb = substr($r->initialConstraints[$j]->constraintPeriod->wef, -5);
					$hfin = substr($r->initialConstraints[$j]->constraintPeriod->unt, -5);
					array_push($reg[$tvset], array($r->regulationId, $r->location->id, $date, $hdeb, $hfin, $r->reason, $r->initialConstraints[$j]->normalRate, $r->initialConstraints[$j]->pendingRate, $r->initialConstraints[$j]->equipmentRate, $delay, $nbrImpactedFlight, $r->delayTVSet, $r->lastUpdate->userUpdateType, $lastUpdateDate, $lastUpdateTime));
				}
				// pour export json
				$obj = new stdClass();
				$obj->regId = $r->regulationId;
				$obj->tv = $r->location->id;
				$obj->lastUpdate = $r->lastUpdate;
				$obj->applicability = $r->applicability;
				$obj->constraints = $r->initialConstraints;
				$obj->reason = $r->reason;
				$obj->delay = $delay;
				$obj->impactedFlights = $nbrImpactedFlight;
				$obj->TVSet = $r->delayTVSet;
				array_push($json_reg->$tvset, $obj);
			} else {
				// pour export Excel
				$init_c = array($r->initialConstraints->constraintPeriod, $r->initialConstraints->normalRate, $r->initialConstraints->pendingRate, $r->initialConstraints->equipmentRate);
				$date = substr($r->initialConstraints->constraintPeriod->wef, 0, 10);
				$hdeb = substr($r->initialConstraints->constraintPeriod->wef, -5);
				$hfin = substr($r->initialConstraints->constraintPeriod->unt, -5);
				array_push($reg[$tvset], array($r->regulationId, $r->location->id, $date, $hdeb, $hfin, $r->reason, $r->initialConstraints->normalRate, $r->initialConstraints->pendingRate, $r->initialConstraints->equipmentRate, $delay, $nbrImpactedFlight, $r->delayTVSet, $r->lastUpdate->userUpdateType, $lastUpdateDate, $lastUpdateTime));
				// pour export json
				$obj = new stdClass();
				$obj->regId = $r->regulationId;
				$obj->tv = $r->location->id;
				$obj->lastUpdate = $r->lastUpdate;
				$obj->applicability = $r->applicability;
				$obj->constraints = array($r->initialConstraints);
				$obj->reason = $r->reason;
				$obj->delay = $delay;
				$obj->impactedFlights = $nbrImpactedFlight;
				$obj->TVSet = $r->delayTVSet;
				array_push($json_reg->$tvset, $obj);
			}
			
		}
		return $reg;
	}
	
	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
		
}

/*  -----------------------------------------------------------------------------------
		récupère la situation ATFCM en europe
		- delai, nbre vols (landed, suspendus...), reason globaux europe
		- reguls europe avec delai de chaque TV (format string HHMM), vols impactés
	----------------------------------------------------------------------------------- */

function get_ATFCM_situation($day = "today") {

    global $soapClientFlow;

    if ($day === "yesterday") $day = gmdate('Y-m-d', strtotime("yesterday")); else $day = gmdate('Y-m-d');

    $params = array(
        'sendTime'=>gmdate("Y-m-d H:i:s"),
        'dataset'=>array('type'=>'OPERATIONAL'),
        'day'=>$day
    );
                        
    try {
        $output = $soapClientFlow->__soapCall('retrieveATFCMSituation', array('parameters'=>$params));
        return $output;
    }

    catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}	
}

/*  -------------------------------------------------------------------------
		Extrait de la situation ATFCM europe une zone précise d'europe
		-> reguls de la zone avec delai de chaque TV, vols impactés
            @param (objet ATFCM_situation) 
            @param (string) - bigramme de l'area (ex : "LF" pour la France)
	------------------------------------------------------------------------- */
function get_area_situation($output, $area) {
	$arr = array();
	
	for ($i=0; $i<count($output->data->regulations->item); $i++) {
		$r = $output->data->regulations->item[$i];
		$delay_h = null;
		if (strlen($r->delay) === 5) $delay_h = (int) substr($r->delay, 0, 3); else $delay_h = (int) substr($r->delay, 0, 2);
		$delay_mn = (int) substr($r->delay, -2);
		$delay = $delay_h*60 + $delay_mn;
		if (substr($r->trafficVolumeId, 0, 2) == $area) {
			array_push($arr, array($r->regulationId, $delay, $r->nrImpactedFlights));
		}
	}
	return $arr;
}

/* -----------------------------------------------------------------
	Récupère les confs déclarés
	@param {string} $airspace - "LFMMCTAE"
	@param {gmdate} $day - gmdate('Y-m-d', strtotime("tomorrow"));
		possible : yesterday, today, tomorrow 
   -----------------------------------------------------------------*/
function get_atc_conf($airspace, $day) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'day'=> $day,
		'airspace' => $airspace
	);
						
	try {
		$output = $soapClientFlow->__soapCall('retrieveSectorConfigurationPlan', array('parameters'=>$params));
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ---------------------------------------------------------------------
		Nombre de vols d'un TV par jour : FlightService
	--------------------------------------------------------------------- */

function get_nb_vols_TV($tv, $wef, $unt) {

	global $soapClientFlight;
	global $receptionTime;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficType'=>'LOAD',
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'requestedFlightFields'=>array('timeAtReferenceLocationEntry','aircraftType','aircraftOperator','actualTakeOffTime','actualTimeOfArrival'),
		'trafficVolume'=>$tv,
		'calculationType'=>'ENTRY'
	);
						
	try {
		$output = $soapClientFlight->__soapCall('queryFlightsByTrafficVolume', array('parameters'=>$params));
		$receptionTime = $output->requestReceptionTime;
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ---------------------------------------------------------------------
		Nombre de vols d'un AD par jour : FlightService
	--------------------------------------------------------------------- */
function get_nb_vols_AD($ad, $wef, $unt) {

	global $soapClientFlight;
	global $receptionTime;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'trafficType'=>'LOAD',
		'includeProposalFlights'=>false,
		'includeForecastFlights'=>false,
		'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
		'requestedFlightFields'=>array('timeAtReferenceLocationEntry','aircraftType','aircraftOperator','actualTakeOffTime','actualTimeOfArrival'),
		'aerodrome'=>$ad,
		'aerodromeRole'=>'BOTH'
	);
						
	try {
		$output = $soapClientFlight->__soapCall('queryFlightsByAerodrome', array('parameters'=>$params));
		$receptionTime = $output->requestReceptionTime;
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}
?>