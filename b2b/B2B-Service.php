<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require("/opt/bitnami/smtp/PHPMailer/PHPMailer.php");
require("/opt/bitnami/smtp/PHPMailer/SMTP.php");
require("/opt/bitnami/smtp/email-config.inc.php");

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
        //Create an instance; passing `true` enables exceptions
        $mail = new PHPMailer(true);    
        $heure = date('Y-m-d H:i');
        //Server settings
        $mail->SMTPDebug = 0;                     							//1 : error and message 2 : message only, 0 : rien
        $mail->isSMTP();                                            		//Send using SMTP
        $mail->Host       = 'email-smtp.eu-west-3.amazonaws.com';   		//Set the SMTP server to send through
        $mail->SMTPAuth   = true;                                   		//Enable SMTP authentication
        $mail->Username   = SMTP_USERNAME;                 	   				//SMTP username
        $mail->Password   = SMTP_PASSWORD; 										//SMTP password
        $mail->SMTPSecure = 'tls';           								//Enable implicit TLS encryption
        $mail->Port       = 587;                           			        //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

        //Recipients
        $mail->setFrom(CONTACT_FROM, 'Error LFMM-FMP');
        $mail->addAddress(CONTACT_1, 'LFMM-FMP');  //Add a recipient            				//Name is optional
        //$mail->addAddress(CONTACT_2);
        //$mail->addReplyTo('info@example.com', 'Information');
        //$mail->addCC('cc@example.com');
        //$mail->addBCC('bcc@example.com');

        //Attachments
        //$mail->addAttachment('/var/tmp/file.tar.gz');        				//Add attachments
        //$mail->addAttachment('/tmp/image.jpg', 'new.jpg');  				//Optional name

        //Content
        $mail->isHTML(true);                                				//Set email format to HTML
        $mail->Subject = "B2B Error (Test de Christophe) : $heure";
        $mail->Body    = "Le grand ragout a parl&eacute; <b>depuis l'hyper espace</b><br><br>Verifiez vos fichiers B2B <br><br>$erreur<br><br>";
        $mail->AltBody = "Verifiez vos fichiers B2B <br>\n\n<br>$erreur<br><br>";

        $mail->send();
        
    }

    public function getSoapClient() {
        return $this->client;
    }

}