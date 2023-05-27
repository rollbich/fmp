<?php

class B2B {
	
	//Paramètres d'accès au B2B
	private $version = '26.0.0';
	private $passphrase_MM = "1234";
	private $wsdl_flow_services_MM;
	private $wsdl_airspace_services_MM;
	private $wsdl_flight_services_MM;
	private $Location_MM;
	private $local_cert_MM;
	private $params;
	private $wsdl_file;
	
	private $context_param = 
		array(
			'ssl' => array(
			'verify_peer' => false,
			'verify_peer_name' => false,
			'allow_self_signed' => true)
			);

	private $airspaceServices;
	private $flowServices;
	private $flightServices;
	private $infoServices;

	public function __construct() {
		$this->Location_MM = "https://www.b2b.nm.eurocontrol.int/B2B_OPS/gateway/spec/".$this->version;
		//Certificat OPS LFMM
		$this->local_cert_MM = __DIR__."/B2B/certif2021.pem";
		$this->params = array(
			'cache_wsdl'   => WSDL_CACHE_NONE,
			'wsdl_cache' => 0,
			'local_cert' => $this->local_cert_MM,
			'passphrase'=> $this->passphrase_MM,
			'stream_context' => stream_context_create($this->context_param),
			'trace'=>1, // pour pouvoir utiliser SoapClient::__getLastResponse
			//'proxy_host' => '100.78.176.201', 	// proxy
			//'proxy_port' => 8001,				// 
			'exceptions'=>1,
			'location' => $this->Location_MM
		);
    }

	// @param {string} $service - "flow" ou "airspace" ou "flight" ou "info"
	private function get_wsdl_file($service) {
		switch ($service) {
			case "flow":
				return __DIR__."/B2B/FlowServices_OPS_".$this->version.".wsdl";
			case "flight":
				return __DIR__."/B2B/FlightServices_OPS_".$this->version.".wsdl";
			case "airspace":
				return __DIR__."/B2B/AirspaceServices_OPS_".$this->version.".wsdl";
			case "info":
				return __DIR__."/B2B/GeneralinformationServices_OPS_".$this->version.".wsdl";
			default:
				return null;
		}
	}


    //	@return FlightServices
    public function flightServices() : FlightServices
    {
        if($this->flightServices == null) {

			$wsdl_file = $this->get_wsdl_file("flight");

			if(file_exists($wsdl_file)) {
				$this->flightServices = new FlightServices($wsdl_file, $this->params);
			} else {
				throw new Exception('Fichier FlightServices WSDL introuvable.');
			}
          
        }
        return $this->flightServices;
    }

	//	@return AirspaceServices
    public function airspaceServices() : AirspaceServices
    {
        if($this->airspaceServices == null) {

			$wsdl_file = $this->get_wsdl_file("airspace");
           
			if(file_exists($wsdl_file)) {
				$this->airspaceServices = new AirspaceServices($wsdl_file, $this->params);
			} else {
				throw new Exception('Fichier AirspaceServices WSDL introuvable.');
			}
          
        }
        return $this->airspaceServices;
    }

	//	@return FlowServices
    public function flowServices() : FlowServices
    {
        if($this->flowServices == null) {

			$wsdl_file = $this->get_wsdl_file("flow");
           
			if(file_exists($wsdl_file)) {
				$this->flowServices = new FlowServices($wsdl_file, $this->params);
			} else {
				throw new Exception('Fichier FlowServices WSDL introuvable.');
			}
          
        }
        return $this->flowServices;
    }

	//	@return InfoServices
    public function infoServices() : InfoServices
    {
        if($this->infoServices == null) {

			$wsdl_file = $this->get_wsdl_file("info");
           
			if(file_exists($wsdl_file)) {
				$this->infoServices = new InfoServices($wsdl_file, $this->params);
			} else {
				throw new Exception('Fichier InfoServices WSDL introuvable.');
			}
          
        }
        return $this->infoServices;
    }

	public function getCurrentVersion()
    {
		return $this->version;
	}
}

?>