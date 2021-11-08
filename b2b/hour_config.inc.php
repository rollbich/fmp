<?php
// dernier dimanche d'octobre => heure d'hiver
$date_hiver = new DateTime('2021-10-31');
$date_ete = new DateTime('2022-03-27');
$dat = new DateTime();

// en php pas scope dans if
if ($dat < $date_hiver || $dat >= $date_ete) {
	// Plage horaire de récupération du H20 et Occ 
	// On donne l'heure locale et on récupère $wef_counts et $unt_counts en UTC
	$wef_counts = gmdate('Y-m-d H:i', strtotime("today 04:00"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("today 21:59"));

	// Plage horaire de récupération des reguls 
	// On donne l'heure locale et on récupère $wef_counts et $unt_counts en UTC
	$wef_regs = gmdate('Y-m-d H:i', strtotime("today 00:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("today 23:59"));

	// Plage horaire de récupération du nombre de vol par TV
	$wef_flights = gmdate('Y-m-d H:i', strtotime("today 00:00"));
	$unt_flights = gmdate('Y-m-d H:i', strtotime("today 23:59"));
} else {
	// Plage horaire de récupération du H20 et Occ 
	// On donne l'heure locale et on récupère $wef_counts et $unt_counts en UTC
	$wef_counts = gmdate('Y-m-d H:i', strtotime("today 05:00"));
	$unt_counts = gmdate('Y-m-d H:i', strtotime("today 22:59"));

	// Plage horaire de récupération des reguls 
	// On donne l'heure locale et on récupère $wef_counts et $unt_counts en UTC
	$wef_regs = gmdate('Y-m-d H:i', strtotime("today 00:00"));
	$unt_regs = gmdate('Y-m-d H:i', strtotime("today 23:59"));

	// Plage horaire de récupération du nombre de vol par TV
	$wef_flights = gmdate('Y-m-d H:i', strtotime("today 00:00"));
	$unt_flights = gmdate('Y-m-d H:i', strtotime("today 23:59"));
}
?>