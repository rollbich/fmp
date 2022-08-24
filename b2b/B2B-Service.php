<?php

class Service {

    private $client;

    public function __construct($wsdl, $params)
    {
        $this->client = new SoapClient($wsdl, $params);
    }

    public function getFullErrorMessage($message) {
        $text = $message."<br>\n";
        $text .= "Last Request Header :<br>\n";
        $text .= $this->getSoapClient()->__getLastRequestHeaders()."<br><br>\n";
        $text .= "Last Request :<br>\n";
        $text .= $this->getSoapClient()->__getLastRequest()."<br><br>\n";
        $text .= "Last Response Header :<br>\n";
        $text .= $this->getSoapClient()->__getLastResponseHeaders()."<br><br>\n";
        $text .= "Last Response :<br>\n";
        $text .= $this->getSoapClient()->__getLastResponse()."<br><br>\n";
        return $text;
    }

    public function send_mail($erreur) {
        $heure = date('Y-m-d H:i');
        $from = "error@lfmm-fmp.fr";
        $to = "christophe.rolland@aviation-civile.gouv.fr";
        $to2 = "adonis.koffi-d-almeida@aviation-civile.gouv.fr";
        $sujet = "B2B Error : $heure";
        $message = "Verifiez vos fichiers B2B <br>\n\n";
        $message .= $erreur."<br><br>";
        $header  = "From: $from \n";
        $header .= "MIME-Version: 1.0 \n";
        $header .= "Content-Type: text/plain \n";
        mail($to, $sujet, $message, $header);
        //mail($to2, $sujet, $message, $header);
    }

    public function getSoapClient() {
        return $this->client;
    }

}