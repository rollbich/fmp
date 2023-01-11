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
			foreach($aup_chain->data->chains as $chains) {
				$amcID = $chains->amcId;
				if(is_array($chains->aups)) {
					$aup_id = $chains->aups[0]->id;
				} else {
					$aup_id = $chains->aups->id;
				}
                //echo "aupId : $aup_id<br><br>";
				$params = array(
					'sendTime' => $now->format('Y-m-d H:i:s'),
					'aupId' => $aup_id
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

    public function get_EAUP_rsa(DateTime $chainDate, Int $seqNumber) {
        
        $now = new \DateTime('now');

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s'),
            //'implicit' => true,
            //'explicit' => true,
            //'rsaDesignators' => array('LF*'),
            'eaupId' => array('chainDate' => $chainDate->format('Y-m-d'), 'sequenceNumber' => $seqNumber) 
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveEAUPRSAs', array('parameters'=>$params));
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

}
?>