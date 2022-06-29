<?php
// --------------------------------------------
//			Serveur OVH lfmm-fmp.fr
//			Tâche CRON 01:55 local
// --------------------------------------------

// dernier dimanche d'octobre => heure d'hiver
$date_hiver = new DateTime('2021-10-31');
$date_ete = new DateTime('2022-03-27');
$dat = new DateTime();

// date.timezone = "Europe/Paris" sur le serveur
// On donne l'heure (locale puisque le serveur est sur le fuseau Paris) et on récupère $wef_counts et $unt_counts en UTC
// 	ex : today 04:00 = 4h locale
//		date   => 04:00 (date du serveur)
//		gmdate => 02:00 (heure transformée en UTC)
// si le serveur est configuré date.timezone = "UTC" alors date et gmdate donne la même heure qui est l'heure UTC
//
// en php pas scope dans if
if ($dat < $date_hiver || $dat >= $date_ete) {
	echo "Heure ete<br/>";
	// Plage horaire de récupération du H20 et Occ (6h loc à 2h loc)
	$wef_counts = gmdate('Y-m-d H:i', strtotime("yesterday 06:00"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("today 00:00"));

	// Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	$wef_regs = gmdate('Y-m-d H:i', strtotime("yesterday 02:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("today 01:59"));

	// Plage horaire de récupération du nombre de vol par TV (minuit UTC à minuit UTC)
	$wef_flights = gmdate('Y-m-d H:i', strtotime("yesterday 02:00"));
	$unt_flights = gmdate('Y-m-d H:i', strtotime("today 01:59"));
} else {
	echo "Heure hiver<br/>";
	// Plage horaire de récupération du H20 et Occ (6h loc à minuit loc)
	$wef_counts = gmdate('Y-m-d H:i', strtotime("today 06:00"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("today 23:59"));

	// Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	$wef_regs = gmdate('Y-m-d H:i', strtotime("today 01:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("tomorrow 00:59"));

	// Plage horaire de récupération du nombre de vol par TV (minuit UTC à minuit UTC)
	$wef_flights = gmdate('Y-m-d H:i', strtotime("today 01:00"));
	$unt_flights = gmdate('Y-m-d H:i', strtotime("tomorrow 00:59"));
}
?>