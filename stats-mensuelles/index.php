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
    <script type="text/javascript" src="../js/vols_bdd_class.js"></script>
    <script type="text/javascript" src="../js/regulations_bdd_class.js"></script>
	<script type="text/javascript" src="../js/bilans_class.js"></script>
    <script src="../js/echarts.min.js"></script>
    <script>
      	document.addEventListener('DOMContentLoaded', async event => {

			<?php include("../php/nav.js.inc.php"); ?>
			<?php include("../php/upload.js.php"); ?>
			const lastmonth = get_last_month(new Date()); // [year, month]
			const tabl = new monthly_briefing(lastmonth[0], lastmonth[1], "bilan_vols", "bilan_reguls", "bilan_causes");
			await tabl.init();
			tabl.show_data();
			

      	});
    </script>
</head>
<body>
<?php include("../php/nav.inc.php"); ?>
<h1>LFMM-FMP - Stats Mensuelles</h1>
<p class="center">Source trafic : données FPL (B2B)</p>
<!-- <h2 style="text-align: center; color: yellow; font-size: 48px;">En maintenance</h2> -->
<div id="glob_container">
	<div id='accueil' class='accueil'>
	<div id="accueil_left">
		<div id="accueil_vols"></div>
		<div id="accueil_reguls"></div>
	</div>
	<div id="accueil_bilan" class="accueil_bilan">
		<div id="bilan_vols"></div>
		<div id="bilan_reguls"></div>
	</div>
	<h2 class="delimiter">Vols par zone</h2>
	<div id="vols_est" class="accueil_bilan"></div>
	<div id="vols_ouest" class="accueil_bilan"></div>
	<h2 class="delimiter">Delay par zone</h2>
	<div id="reguls_est" class="accueil_bilan"></div>
	<div id="reguls_ouest" class="accueil_bilan"></div>
	<h2 class="delimiter">Données par causes</h2>
	<div id="bilan_causes" class="accueil_bilan"></div>
	<h2 class="delimiter">Graphiques par causes</h2>
	<div id="accueil_causes_cta" class="mgt"></div>
	<div id="accueil_causes_app" class="mgt"></div>
	<div id="accueil_causes_est" class="mgt"></div>
	<div id="accueil_causes_west" class="mgt"></div>
	<h2 class="delimiter">Graphiques par TVs</h2>
	<div id="accueil_tvs_cta" class="mgt"></div>
	<div id="accueil_tvs_app" class="mgt"></div>
	<div id="accueil_tvs_est" class="mgt"></div>
	<div id="accueil_tvs_west" class="mgt"></div>
	<h2 class="delimiter">Graphiques cumulés</h2>
	<div id="accueil_cumule_cta" class="mgt"></div>
	<div id="accueil_cumule_app" class="mgt"></div>
	<div id="accueil_cumule_est" class="mgt"></div>
	<div id="accueil_cumule_west" class="mgt"></div>
	<div style="display: block">
	<h2 class="delimiter">Données et graphiques CRSTMP</h2>
		<div id="bilan_causes_CRSTMP" class="accueil_bilan"></div>
		<div style="display: flex; flex-wrap: wrap;">
			<div id="accueil_cumule_CRSTMP_cta" class="mgt"></div>
			<div id="accueil_cumule_CRSTMP_app" class="mgt"></div>
			<div id="accueil_cumule_CRSTMP_est" class="mgt"></div>
			<div id="accueil_cumule_CRSTMP_west" class="mgt"></div>
		</div>
	</div>
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