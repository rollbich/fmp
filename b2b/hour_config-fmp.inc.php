<?php
// --------------------------------------------
//			Serveur OVH lfmm-fmp.fr
//			Tâche CRON 01:55 local
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
	// Plage horaire de récupération du H20 et Occ (6h loc à minuit loc)
	$wef_counts = gmdate('Y-m-d H:i', strtotime("yesterday 06:00"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("today 00:01"));

	// Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	$wef_regs = gmdate('Y-m-d H:i', strtotime("yesterday 01:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("today 00:59"));

	// Plage horaire de récupération du nombre de vol par TV (minuit UTC à minuit UTC)
	$wef_flights = gmdate('Y-m-d H:i', strtotime("yesterday 01:00"));
	$unt_flights = gmdate('Y-m-d H:i', strtotime("today 00:59"));
} else {
	echo "Heure ete<br/>";
	// Plage horaire de récupération du H20 et Occ (6h loc à 2h loc)
	$wef_counts = gmdate('Y-m-d H:i', strtotime("yesterday 06:00"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("today 00:01"));

	// Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	$wef_regs = gmdate('Y-m-d H:i', strtotime("yesterday 02:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("today 01:59"));

	// Plage horaire de récupération du nombre de vol par TV (minuit UTC à minuit UTC)
	$wef_flights = gmdate('Y-m-d H:i', strtotime("yesterday 02:00"));
	$unt_flights = gmdate('Y-m-d H:i', strtotime("today 01:59"));
}

echo "wef/unt counts: $wef_counts - $unt_counts<br>";
echo "wef/unt regs: $wef_regs - $unt_regs<br>";
echo "wef/unt flights: $wef_flights - $unt_flights<br>";

// 	---------------------------------------------------------
// 		@return (DateTime) jour de passage à l'heure hiver
// 	---------------------------------------------------------
function get_hiver() {
	$year = date('Y');
	$d = new DateTime("$year-10-31"); 
	$dayofweek = date('w', strtotime("$year-10-31")); //(0=sunday,1=monday...,6=sat)
	$requete = "P".$dayofweek."D";
	$inter = new DateInterval($requete);
	$d->sub($inter)->format('Y-m-d');
	//echo "Dernier dimanche octobre : <br>";
	//echo $d;
	//echo "<br><br>";
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
	$d->sub($inter)->format('Y-m-d');
	//echo "Dernier dimanche mars : <br>";
	//echo $d;
	//echo "<br><br>";
	return $d;
}
?>