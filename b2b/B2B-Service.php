<?php

class Service {

    private $client;

    public function __construct($wsdl, $params)
    {
        $this->client = new SoapClient($wsdl, $params);
    }

    public function getFullErrorMessage($message) {
        $text = $message."\n<br>";
        $text .= "Last Request Header :\n<br>";
        $text .= $this->getSoapClient()->__getLastRequestHeaders()."\n<br><br>";
        $text .= "Last Request :\n<br>";
        $text .= $this->getSoapClient()->__getLastRequest()."\n<br><br>";
        $text .= "Last Response Header :\n<br>";
        $text .= $this->getSoapClient()->__getLastResponseHeaders()."\n<br><br>";
        $text .= "Last Response :\n<br>";
        $text .= $this->getSoapClient()->__getLastResponse()."\n<br><br>";
        return $text;
    }

    public function send_mail($erreur) {
        $heure = date('Y-m-d H:i');
        $from = "error@lfmm-fmp.fr";
        $to = "christophe.rolland@aviation-civile.gouv.fr";
        $to2 = "adonis.koffi-d-almeida@aviation-civile.gouv.fr";
        $sujet = "B2B Error : $heure";
        $message = "Verifiez vos fichiers B2B \n et regardez le fichier de log \n<br>";
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