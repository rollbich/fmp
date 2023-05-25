<?php

class AirspaceServices extends Service {
	
	public function get_AUP_chain(DateTime $chainDate, array $amcIds) {
        
        $now = new \DateTime('now');

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s'),
            'chainDate' => $chainDate->format('Y-m-d'),
			'amcIds' => $amcIds
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveAUPChain', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_AUP : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_AUP: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_AUP");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }
	
	public function get_AUP(DateTime $chainDate, array $amcIds) {
        
        $now = new \DateTime('now');
                       
        try {
			$aup = new stdClass();
			$aup_chain = $this->get_AUP_chain($chainDate, $amcIds);
            if(is_array($aup_chain->data->chains)) {
                foreach($aup_chain->data->chains as $chains) {
                    $amcID = $chains->amcId;
                    if(is_array($chains->aups)) {
                        $aup_id = $chains->aups[0]->id;
                    } else {
                        $aup_id = $chains->aups->id;
                    }
                    echo "aupId : $aup_id<br><br>";
                    $params = array(
                        'sendTime' => $now->format('Y-m-d H:i:s'),
                        'aupId' => $aup_id,
                        'returnComputed' => false
                    );
                    $output = $this->getSoapClient()->__soapCall('retrieveAUP', array('parameters'=>$params));
                    if ($output->status !== "OK") {
                        $erreur = $this->getFullErrorMessage("Erreur get_AUP : ".$output->reason);
                        echo $erreur."\n<br>";
                        $this->send_mail($erreur);
                    }
                    $aup->$amcID = $output;
                }	
            } else {
                $chains = $aup_chain->data->chains;
                $amcID = $chains->amcId;
                if(is_array($chains->aups)) {
                    $aup_id = $chains->aups[0]->id;
                } else {
                    $aup_id = $chains->aups->id;
                }
                echo "aupId : $aup_id<br><br>";
                $params = array(
                    'sendTime' => $now->format('Y-m-d H:i:s'),
                    'aupId' => $aup_id,
                    'returnComputed' => false
                );
                $output = $this->getSoapClient()->__soapCall('retrieveAUP', array('parameters'=>$params));
                if ($output->status !== "OK") {
                    $erreur = $this->getFullErrorMessage("Erreur get_AUP : ".$output->reason);
                    echo $erreur."\n<br>";
                    $this->send_mail($erreur);
                }
                $aup->$amcID = $output;
            }
            return $aup;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_AUP: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_AUP");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }
	
	public function get_EAUP_chain(DateTime $chainDate) {
        
        $now = new \DateTime('now');

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s'),
            'chainDate' => $chainDate->format('Y-m-d')
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveEAUPChain', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_AUP : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_AUP: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_AUP");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    public function get_last_sequence_number(DateTime $chainDate) {

        $eaup_chain = $this->get_EAUP_chain($chainDate);
        if ($eaup_chain->status == "OK") {
			if (is_array($eaup_chain->data->chain->eaups)) {
				$seqNumber = count($eaup_chain->data->chain->eaups);
			} else {
				$seqNumber = 1;
			}
		} else {$seqNumber = null;};
        return $seqNumber;

    }

    public function get_EAUP(DateTime $chainDate, Int $seqNumber) {
        
        $now = new \DateTime('now');

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s'),
            'implicit' => true,
            'explicit' => true,
            'rsaDesignators' => array('LF*','LI*'),
            'eaupId' => array('chainDate' => $chainDate->format('Y-m-d'), 'sequenceNumber' => $seqNumber) 
        );
                            
        try {
            var_dump($params);
            echo "<br>Ok<br>";
            $output = $this->getSoapClient()->__soapCall('retrieveEAUPRSAs', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_EAUP : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $this->getSoapClient()->__getLastResponse();  // Returns the XML received in the last SOAP response sous forme de string
        }

        catch (Exception $e) {
            echo 'Exception reçue get_EAUP: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_EAUP");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    public function get_EAUP_rsa(DateTime $chainDate, Array $rsaDesignator) {
        
        $now = new \DateTime('now');
        $last_seqNumber = $this->get_last_sequence_number($chainDate);

        //echo "LastSeqNumber : $last_seqNumber<br><br>";

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s'),
            'implicit' => true,
            'explicit' => true,
            'rsaDesignators' => $rsaDesignator, // array('LF*') par ex
            'eaupId' => array('chainDate' => $chainDate->format('Y-m-d'), 'sequenceNumber' => $last_seqNumber) 
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveEAUPRSAs', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_EAUP : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $this->getSoapClient()->__getLastResponse();  // Returns the XML received in the last SOAP response sous forme de string
        }

        catch (Exception $e) {
            echo 'Exception reçue get_EAUP: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_EAUP");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    public function get_RSA(DateTime $chainDate, Array $rsaDesignator) {
               
        $eaup_rsa = $this->get_EAUP_rsa($chainDate, $rsaDesignator);

        /* sauve le fichier xml pour le voir
        $document = new DOMDocument();    
        $document->loadXML($eaup_rsa); 
        $document->save("coucou.xml");
        */

		$xml = new \SimpleXMLElement($eaup_rsa);
		$aixmNS = "http://www.aixm.aero/schema/5.1.1";
		$xml->registerXPathNamespace('adrmsg', "http://www.eurocontrol.int/cfmu/b2b/ADRMessage");
        $xml->registerXPathNamespace('gml', "http://www.opengis.net/gml/3.2");
        $xml->registerXPathNamespace('aixm', $aixmNS);
		
        $airspaces_asXML = [];
        $LI_designators = ["LITSA72", "LIR64"];
        foreach ($LI_designators as $design) {
            array_push($airspaces_asXML, $xml->xpath('//aixm:Airspace//aixm:AirspaceTimeSlice[starts-with(aixm:designator,"' . $design . '")]/../..'));
        }
        $LF_designators = ["LFR138", "LFR108", "LFT42", "LFT43", "LFT44", "LFD54", "LFT24"];
        foreach ($LF_designators as $design) {
            array_push($airspaces_asXML, $xml->xpath('//aixm:Airspace//aixm:AirspaceTimeSlice[starts-with(aixm:designator,"' . $design . '")]/../..'));
        }
       
        $airspaces = array();
		foreach ($airspaces_asXML as $air) {
            foreach ($air as $a) {
                $airspaces[] = new Airspace($a);
            }
        }
        
		$planned_rsa = [];
		foreach ($airspaces as $air) {
            $d = $air->getDesignator();
            if (substr($d, -1) !== "Z") { // supprime les FBZ
                $rsa = new StdClass();
                $rsa->designator = $air->getDesignator();
                $rsa->beginDate = substr($air->getTimeBegin(), 0, 10);
                $rsa->begin = substr($air->getTimeBegin(), 11, 5);
                $rsa->endDate = substr($air->getTimeEnd(), 0, 10);
                $rsa->end = substr($air->getTimeEnd(), 11, 5);
                $rsa->lowerLimit = $air->getLowerLimit();
                if ($rsa->lowerLimit !== "GND") $rsa->lowerLimit = "FL".$rsa->lowerLimit;
                $rsa->upperLimit = $air->getUpperLimit();
                if ($rsa->upperLimit !== "UNL") $rsa->upperLimit = "FL".$rsa->upperLimit;
                array_push($planned_rsa, $rsa);
            }
		}
		return $planned_rsa;
    }

}
?>