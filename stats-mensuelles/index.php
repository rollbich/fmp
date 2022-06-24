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
      	});
    </script>
</head>
<body>
<?php include("../php/nav.inc.php"); ?>
<h1>LFMM-FMP - Stats Mensuelles</h1>
<p class="center">Source trafic : données FPL (B2B)</p>
<div id="glob_container">
<div id='accueil'>
	<div id="accueil_bilan"></div>
  	<div id="accueil_left">
	  <div id="accueil_vols"></div>
	  <div id="accueil_reguls"></div>
	</div>
	<div id="accueil_causes_cta"></div>
	<div id="accueil_causes_app"></div>
</div>
</div>
<?php include("../php/upload.inc.php"); ?>
</body>
</html>