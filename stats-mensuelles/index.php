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
	<script type="text/javascript" src="../js/data.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
    <script type="text/javascript" src="../js/graph.js"></script>
    <script type="text/javascript" src="../js/vols_class.js"></script>
    <script type="text/javascript" src="../js/regulations_class.js"></script>
	<script type="text/javascript" src="../js/bilans_class.js"></script>
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
	<div id="accueil_causes_est" class="mgt"></div>
	<div id="accueil_causes_west" class="mgt"></div>
	<div id="accueil_causes_cta" class="mgt"></div>
	<div id="accueil_tvs_cta" class="mgt"></div>
	<div id="accueil_tvs_est" class="mt3 mgt"></div>
	<div id="accueil_tvs_west" class="mt3 mgt"></div>
</div>
<div class='accueil'>
	<div id="accueil_trafic_mois_app" class="l-30 mgt"></div>
	<div id="accueil_causes_app" class="mgt"></div>
	<div id="accueil_trafic_cumul_app" class="l-30 mt3 mgt"></div>
	<div id="accueil_reguls_cumul_app" class="l-30 mt3 mgt"></div>
	<div id="accueil_tvs_app" class="mgt"></div>
</div>
</div>
<?php include("../php/upload.inc.php"); ?>
<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut" /></a>
</div>
</body>
</html>