<?php

function send_mail() {
	$heure = date('Y-m-d H:i');
	$from = "error@lfmm-fmp.fr";
	$to = "christophe.rolland@aviation-civile.gouv.fr";
	$to2 = "adonis.koffi-d-almeida@aviation-civile.gouv.fr";
	$sujet = "B2B Error : $heure";
	$message = "Verifiez vos fichiers B2B \n et regardez le fichier de log \n";
	$header  = "From: $from \n";
	$header .= "MIME-Version: 1.0 \n";
	$header .= "Content-Type: text/plain \n";
	mail($to, $sujet, $message, $header);
	mail($to2, $sujet, $message, $header);
	
}

?>
