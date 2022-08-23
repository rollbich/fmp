<?php
// --------------------------------------------
//			Serveur OVH lfmm-fmp.fr
//			Tâche CRON 05:30 local - 07:00
// --------------------------------------------

// dernier dimanche d'octobre => heure d'hiver
// dernier dimanche de mars => heure d'été
$date_hiver = get_hiver();
$date_ete = get_ete();
$dat = new DateTime();

// date.timezone = "Europe/Paris" sur le serveur
// On donne l'heure (locale puisque le serveur est sur le fuseau Paris) et on récupère $wef_counts et $unt_counts en UTC
// 	ex : today 04:00 = 4h locale
//		date   => 04:00 (date du serveur)
//		gmdate => 02:00 (heure transformée en UTC)
// si le serveur est configuré date.timezone = "UTC" alors date et gmdate donne la même heure qui est l'heure UTC
//
// en php pas scope dans if
if ($dat <= $date_ete || $dat > $date_hiver) {
	echo "Heure hiver<br/>";
	// Plage horaire de récupération du H20 et Occ (now loc à now+6h loc)
    $wef_counts = gmdate('Y-m-d H:i', strtotime("now"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("+6 hours"));

    // Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	$wef_regs = gmdate('Y-m-d H:i', strtotime("today 01:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("tomorrow 00:59"));
} else {
	echo "Heure ete<br/>";
	// Plage horaire de récupération du H20 et Occ (now loc à now+6h loc)
    $wef_counts = gmdate('Y-m-d H:i', strtotime("now"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("+6 hours"));

    // Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	$wef_regs = gmdate('Y-m-d H:i', strtotime("today 02:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("tomorrow 01:59"));
}

// 	---------------------------------------------------------
// 		@return (DateTime) jour de passage à l'heure hiver
// 	---------------------------------------------------------
function get_hiver() {
	$year = date('Y');
	$d = new DateTime("$year-10-31"); 
	$dayofweek = date('w', strtotime("$year-10-31")); //(0=sunday,1=monday...,6=sat)
	$requete = "P".$dayofweek."D";
	$inter = new DateInterval($requete);
	echo "Dernier dimanche octobre : <br>";
	echo $d->sub($inter)->format('Y-m-d');
	echo "<br><br>";
	return $d;
}

// 	---------------------------------------------------------
// 		@return (DateTime) jour de passage à l'heure été
// 	---------------------------------------------------------
function get_ete() {
	$year = date('Y');
	$d = new DateTime("$year-03-31"); 
	$dayofweek = date('w', strtotime("$year-03-31"));
	$requete = "P".$dayofweek."D";
	$inter = new DateInterval($requete);
	echo "Dernier dimanche mars : <br>";
	echo $d->sub($inter)->format('Y-m-d');
	echo "<br><br>";
	return $d;
}
?>