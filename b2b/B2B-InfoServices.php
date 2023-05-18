<?php

class InfoServices extends Service {
	
	public function get_certif_info() {
        
        $now = new \DateTime('now');

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s')
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveUserInformation', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_user_info : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_user_info: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_user_info");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    public function get_NM_info() {
        
        $now = new \DateTime('now');

        $params = array(
            'sendTime' => $now->format('Y-m-d H:i:s')
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveNMReleaseInformation', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_NM_info : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_NM_info: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_NM_info");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

}
?>