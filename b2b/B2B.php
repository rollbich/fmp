<?php

class B2B {
	
	//Paramètres d'accès au B2B
	private $version = '25.0.0';
	private $passphrase_MM = "1234";
	private $wsdl_flow_services_MM;
	private $wsdl_airspace_services_MM;
	private $wsdl_flight_services_MM;
	private $Location_MM;
	private $local_cert_MM;
	private $params;
	
	private $context_param = 
		array(
			'ssl' => array(
			'verify_peer' => false,
			'verify_peer_name' => false,
			'allow_self_signed' => true)
			);

	// @param {string} $service - "flow" ou "airspace" ou "flight"
	public function __construct($service)
    {
		$this->service = $service;
		$this->wsdl_flow_services_MM = __DIR__."/B2B/FlowServices_OPS_".$this->version.".wsdl";
	 	$this->wsdl_airspace_services_MM = __DIR__."/B2B/AirspaceServices_OPS_".$this->version.".wsdl";
		$this->wsdl_flight_services_MM = __DIR__."/B2B/FlightServices_OPS_".$this->version.".wsdl";
		$this->Location_MM = "https://www.b2b.nm.eurocontrol.int/B2B_OPS/gateway/spec/".$this->version;
		//Certificat OPS LFMM
		$this->local_cert_MM = __DIR__."/B2B/certif2021.pem";
		$this->params = array(
			'cache_wsdl'   => WSDL_CACHE_NONE,
			'wsdl_cache' => 0,
			'local_cert' => $this->local_cert_MM,
			'passphrase'=> $this->passphrase_MM,
			'stream_context' => stream_context_create($this->context_param),
			'trace'=>1,
			//'proxy_host' => '100.78.176.201', 	// proxy
			//'proxy_port' => 8001,				// 
			'exceptions'=>1,
			'location' => $this->Location_MM
		);
    }

	public function get_client()
	{
		$service_name = "wsdl_".$this->service."_services_MM";
		return new SoapClient($this->{$service_name}, $this->params);
	}
}

?>