<?php
// dernier dimanche d'octobre => heure d'hiver
$date_hiver = get_hiver();
$date_ete = get_ete();
$dat = new DateTime();

// On donne l'heure du serveur et on récupère $wef_counts, regs, flights et $unt_counts, regs, flights en UTC
// en php pas scope dans if
if ($dat <= $date_ete || $dat > $date_hiver) {
	echo "Heure hiver<br/>\n";
	// Plage horaire de récupération du H20 et Occ (6h loc à minuit loc)
	// Tâche CRON effectuée le lendemain => query pour la veille
	$wef_counts = date('Y-m-d H:i', strtotime("yesterday 05:00"));
	$unt_counts = date('Y-m-d H:i', strtotime("yesterday 22:59"));

	// Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	// Tâche CRON effectuée le jour même vers 23:55 UTC
	$wef_regs = date('Y-m-d H:i', strtotime("today 00:00"));
	$unt_regs = date('Y-m-d H:i', strtotime("today 23:59"));

	// Plage horaire de récupération du nombre de vol par TV (minuit UTC à minuit UTC)
	// Tâche CRON effectuée le lendemain => query pour la veille
	$wef_flights = date('Y-m-d H:i', strtotime("yesterday 00:00"));
	$unt_flights = date('Y-m-d H:i', strtotime("yesterday 23:59"));
} else {
	echo "Heure ete<br/>\n";
	// Plage horaire de récupération du H20 et Occ (6h loc à 2h loc)
	// Tâche CRON effectuée le lendemain => query pour la veille
	$wef_counts = date('Y-m-d H:i', strtotime("yesterday 04:00"));
	$unt_counts = date('Y-m-d H:i', strtotime("yesterday 21:59"));

	// Plage horaire de récupération des reguls (minuit UTC à minuit UTC)
	// Tâche CRON effectuée le jour même vers 23:55 UTC
	$wef_regs = date('Y-m-d H:i', strtotime("today 00:00"));
	$unt_regs = date('Y-m-d H:i', strtotime("today 23:59"));

	// Plage horaire de récupération du nombre de vol par TV (minuit UTC à minuit UTC)
	// Tâche CRON effectuée le lendemain => query pour la veille
	$wef_flights = date('Y-m-d H:i', strtotime("yesterday 00:00"));
	$unt_flights = date('Y-m-d H:i', strtotime("yesterday 23:59"));
}

echo "wef/unt counts: $wef_counts - $unt_counts<br>\n";
echo "wef/unt regs: $wef_regs - $unt_regs<br>\n";
echo "wef/unt flights: $wef_flights - $unt_flights<br>\n";

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