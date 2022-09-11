<?php
session_start();
require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Stats</title>
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/sortable.css" />
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
	<script type="text/javascript" src="../js/stats-period.js"></script>
    <script src="../js/echarts.min.js"></script>
    <script>
      	document.addEventListener('DOMContentLoaded', async event => {

			<?php include("../php/nav.js.inc.php"); ?>

			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});

			document.querySelector('.popup-close').addEventListener('click', e => {
				document.querySelector('.popup-box').classList.remove('transform-in');
				document.querySelector('.popup-box').classList.add('transform-out');
				e.preventDefault();
			});

			<?php include("../php/upload.js.php"); ?>
			document.getElementById('bouton_stats').addEventListener('click', async e => {
				//let start_day = document.getElementById('start').value; // yyyy-mm-dd
				//let end_day = document.getElementById('end').value; // yyyy-mm-dd
				//let start_day = "2022-06-13";
				//let end_day = "2022-09-03";
				let start_day = "2022-06-13";
				let end_day = "2022-08-31";
				let zone = document.getElementById('zone').value;
				let d = new Date(end_day);
				let month = d.getMonth();
				let year = d.getFullYear();
				const tabl = new monthly_briefing(year, month, "accueil_bilan");
				await tabl.init();
				const stats = new stats_period(start_day, end_day, zone);
				await stats.init();
				const listMonth = [];
				for (let k=1;k<13;k++) { listMonth.push(k);}
				show_traffic_graph_mois_cumule("accueil_vols", year, listMonth, tabl.get_monthly_cumules()['cta'], tabl.get_monthly_cumules("lastyear")['cta'], tabl.get_monthly_cumules("2019")['cta'], "LFMMCTA");
				show_delay_graph_mois_cumule("accueil_reguls", year, listMonth, tabl.get_monthly_reg_cumules()['cta'], tabl.get_monthly_reg_cumules("lastyear")['cta'], tabl.get_monthly_reg_cumules("2019")['cta'], "LFMMCTA");
				const data = [];
				const dataLastyear = [];
				const data2019 = [];
				const dataAxis = stats.dates_arr;
				for (const date of stats['stats']['year']['vols']['dates_arr']) {
					data.push(stats['stats']['year']['vols']['vols'][date]["LFMMCTA"][2]);
				}
				for (const date of stats['stats']['lastyear']['vols']['dates_arr']) {
					dataLastyear.push(stats['stats']['lastyear']['vols']['vols'][date]["LFMMCTA"][2]);
				}
				for (const date of stats['stats']['2019']['vols']['dates_arr']) {
					data2019.push(stats['stats']['2019']['vols']['vols'][date]["LFMMCTA"][2]);
				}
				console.log(dataAxis);
				console.log(data);
				show_vols_period("accueil_trafic_journalier", dataAxis, data, dataLastyear, data2019, "LFMMCTA");
			});
			
			
			/*
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
			show_delay_graph_mois_par_tvs("accueil_tvs_est", year, month, tabl.reguls.delay_par_tvs['est'][month-1], "Zone EST");
			show_delay_graph_mois_par_tvs("accueil_tvs_west", year, month, tabl.reguls.delay_par_tvs['west'][month-1], "Zone WEST");
			show_delay_graph_mois_par_tvs("accueil_tvs_app", year, month, tabl.reguls.delay_par_tvs['app'][month-1], "Approches");
			*/
      	});
    </script>
</head>
<body>
<header>
<?php include("../php/nav.inc.php"); ?>
<h1>Stats sur période</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Origine des données vols</span> :<br>Elles sont récupérées quotidiennement en B2B sur le serveur du NM et stockées sous forme de fichiers.</p>
	<p><span>Le bouton "Nombre de Vols"</span> :<br>Il affiche le nombre de vols sur la plage sélectionnée</p>
	<p><span>Le bouton "Graph année"</span> :<br>Il permet d'afficher le nombre de vols semaine sur l'année.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_stats" class="pointer"><span>Stats</span></li>
	<li><button class="help_button">Help</button></li>
</ul>
<div id="dates">
	<label for="start" class="dates">D&eacute;but:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2018-12-31">
	<label for="end" class="dates">Fin:</label>
	<input type="date" id="end" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2018-12-31">
	<span>
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</span>
</div>
</header>
<div id="glob_container">
<div id='accueil' class='accueil'>
	<div id="accueil_bilan">
		<div id="accueil_bilan1"></div>
		<div id="accueil_bilan2"></div>
	</div>
  	<div id="accueil_left">
	  <div id="accueil_vols"></div>
	  <div id="accueil_reguls"></div>
	</div>
	<div id="accueil_trafic_journalier" class="l-30 mt3"></div>
	<div id="accueil_reguls_mois_cta" class="l-30"></div>
	<div id="accueil_reguls_mois_est" class="l-30"></div>
	<div id="accueil_reguls_mois_west" class="l-30"></div>
	<div id="accueil_causes_cta"></div>
	<div id="accueil_tvs_cta"></div>
	<div id="accueil_tvs_est" class="mt3"></div>
	<div id="accueil_tvs_west" class="mt3"></div>
</div>
<div class='accueil'>
	<div id="accueil_trafic_mois_app" class="l-30 mt3"></div>
	<div id="accueil_causes_app"></div>
	<div id="accueil_trafic_cumul_app" class="l-30 mt3"></div>
	<div id="accueil_reguls_cumul_app" class="l-30 mt3"></div>
	<div id="accueil_tvs_app"></div>
</div>
</div>
<div id="popup-wrap" class="off" >
    <div class="popup-box">
      <h2></h2>
      <h3></h3>
      <a class="close-btn popup-close" href="#">x</a>
    </div>
</div>
<?php include("../php/upload.inc.php"); ?>
<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut" /></a>
</div>
</body>
</html>