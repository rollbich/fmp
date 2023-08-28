<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require("PHPMailer/PHPMailer.php");
require("PHPMailer/SMTP.php");

//Create an instance; passing `true` enables exceptions
$mail = new PHPMailer(true);

try {
    //Server settings
    $mail->SMTPDebug = 0;                     							//1 : error and message 2 : message only, 0 : rien
    $mail->isSMTP();                                            		//Send using SMTP
    $mail->Host       = 'email-smtp.eu-west-3.amazonaws.com';   		//Set the SMTP server to send through
    $mail->SMTPAuth   = true;                                   		//Enable SMTP authentication
    $mail->Username   = 'AKIAQS3HTHPYMXBCDG6V';                 	   				//SMTP username
    $mail->Password   = 'BMOK/1TncML5lnCTeVukm9XHWEPzzikVMyRnGYzmLigB'; 										//SMTP password
    $mail->SMTPSecure = 'tls';           								//Enable implicit TLS encryption
    $mail->Port       = 587;                           			        //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

    //Recipients
    $mail->setFrom('rollbichou@gmail.com', 'Error LFMM-FMP');
    //$mail->addAddress('lfmm-fmp@aviation-civile.gouv.fr', 'LFMM-FMP');  //Add a recipient
    $mail->addAddress('rollbich2@yahoo.fr');              				//Name is optional
    //$mail->addReplyTo('info@example.com', 'Information');
    //$mail->addCC('cc@example.com');
    //$mail->addBCC('bcc@example.com');

    //Attachments
    //$mail->addAttachment('/var/tmp/file.tar.gz');        				//Add attachments
    //$mail->addAttachment('/tmp/image.jpg', 'new.jpg');  				//Optional name

    //Content
    $mail->isHTML(true);                                				//Set email format to HTML
    $mail->Subject = 'Test email3 - Amazon Web Service';
    $mail->Body    = "Le grand ragout a encore parl&eacute; <b>depuis l'hyper espace</b>";
    $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
}
?>