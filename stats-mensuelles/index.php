<?php
session_start();
require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Stats mensuelles</title>
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" href="../css/style.css"> 
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.ico">
    <script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
    <script type="text/javascript" src="../js/graph.js"></script>
    <script type="text/javascript" src="../js/vols_class.js"></script>
    <script type="text/javascript" src="../js/regulations_class.js"></script>
    <script src="../js/echarts.min.js"></script>
    <script>
      	document.addEventListener('DOMContentLoaded', async event => {

			<?php include("../php/nav.js.inc.php"); ?>
			<?php include("../php/upload.js.php"); ?>
			const d = new Date();
			let month = d.getMonth();
			let year = d.getFullYear();
			const tabl = new monthly_briefing(year, month, "accueil_bilan");
			await tabl.init();
			tabl.show_data();

			const listMonth = [];
			for (let k=1;k<13;k++) { listMonth.push(k);}
			show_traffic_graph_mois_cumule("accueil_vols", year, listMonth, tabl.get_monthly_cumules()['cta'], tabl.get_monthly_cumules("lastyear")['cta'], tabl.get_monthly_cumules("2019")['cta'], "LFMMCTA");
			show_delay_graph_mois_cumule("accueil_reguls", year, listMonth, tabl.get_monthly_reg_cumules()['cta'], tabl.get_monthly_reg_cumules("lastyear")['cta'], tabl.get_monthly_reg_cumules("2019")['cta'], "LFMMCTA");
			show_delay_graph_mois_par_causes("accueil_causes_cta", year, month, tabl.reguls.delay_par_cause['cta'][month-1], "LFMM CTA");
			show_delay_graph_mois_par_causes("accueil_causes_app", year, month, tabl.reguls.delay_par_cause['app'][month-1], "Approches");
			show_traffic_graph_mois("accueil_trafic_mois_cta", year, listMonth, tabl.flights.nbre_vols['cta'], tabl.flights_lastyear.nbre_vols['cta'], tabl.flights_2019.nbre_vols['cta'], "LFMMCTA");
			show_delay_graph_month("accueil_reguls_mois_cta", year, listMonth, tabl.reguls.delay['cta'], tabl.reguls_lastyear.delay['cta'], tabl.reguls_2019.delay['cta'], "LFMMCTA",800000);
			show_delay_graph_month("accueil_reguls_mois_est", year, listMonth, tabl.reguls.delay['est'], tabl.reguls_lastyear.delay['est'], tabl.reguls_2019.delay['est'], "Zone EST",500000);
			show_delay_graph_month("accueil_reguls_mois_west", year, listMonth, tabl.reguls.delay['west'], tabl.reguls_lastyear.delay['west'], tabl.reguls_2019.delay['west'], "Zone WEST",500000);
			show_delay_graph_mois_cumule("accueil_reguls_cumul_app", year, listMonth, tabl.get_monthly_reg_cumules()['app'], tabl.get_monthly_reg_cumules("lastyear")['app'], tabl.get_monthly_reg_cumules("2019")['app'], "Approches");
			show_traffic_graph_mois_cumule("accueil_trafic_cumul_app", year, listMonth, tabl.get_monthly_cumules()['app'], tabl.get_monthly_cumules("lastyear")['app'], tabl.get_monthly_cumules("2019")['app'], "Approches");
			show_traffic_graph_mois("accueil_trafic_mois_app", year, listMonth, tabl.flights.nbre_vols['app'], tabl.flights_lastyear.nbre_vols['app'], tabl.flights_2019.nbre_vols['app'], "Approches");
			show_delay_graph_mois_par_tvs("accueil_tvs_cta", year, month, tabl.reguls.delay_par_tvs['cta'][month-1], "LFMMCTA");
			show_delay_graph_mois_par_tvs("accueil_tvs_app", year, month, tabl.reguls.delay_par_tvs['app'][month-1], "Approches");
      	});
    </script>
</head>
<body>
<?php include("../php/nav.inc.php"); ?>
<h1>LFMM-FMP - Stats Mensuelles</h1>
<p class="center">Source trafic : données FPL (B2B)</p>
<div id="glob_container">
<div id='accueil' class='accueil'>
	<div id="accueil_bilan"></div>
  	<div id="accueil_left">
	  <div id="accueil_vols"></div>
	  <div id="accueil_reguls"></div>
	</div>
	<div id="accueil_trafic_mois_cta" class="l-30 mt3"></div>
	<div id="accueil_reguls_mois_cta" class="l-30"></div>
	<div id="accueil_reguls_mois_est" class="l-30"></div>
	<div id="accueil_reguls_mois_west" class="l-30"></div>
	<div id="accueil_causes_cta"></div>
	<div id="accueil_tvs_cta"></div>
</div>
<div class='accueil'>
	<div id="accueil_trafic_mois_app" class="l-30 mt3"></div>
	<div id="accueil_causes_app"></div>
	<div id="accueil_trafic_cumul_app" class="l-30 mt3"></div>
	<div id="accueil_reguls_cumul_app" class="l-30 mt3"></div>
	<div id="accueil_tvs_app"></div>
</div>
</div>
<?php include("../php/upload.inc.php"); ?>
<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut" /></a>
</div>
</body>
</html>