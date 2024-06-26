<?php
session_start();
require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Accueil FMP</title>
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
			
			const wn = getPreviousWeekNumber(new Date());
			console.log("current week: "+wn);
			const year = wn[0];
			const week_number = wn[1];
			const tabl = new weekly_briefing(year, week_number, "bilan_vols", "bilan_reguls", "bilan_causes");
			await tabl.init();
			tabl.show_data();
			//tabl.change_week();
			//await tabl.init_jour();
      	});
    </script>
</head>
<body>
<?php include("../php/nav.inc.php"); ?>
<h1>LFMM-FMP - Briefing semaine dernière</h1>
<p class="center">Source trafic : données FPL (B2B)</p>
<div id="glob_container">
	<div id='accueil' style="display: flex; flex-wrap: wrap">
		<div id="accueil_left">
		<div id="accueil_vols"></div>
		<div id="accueil_reguls"></div>
		</div>
		<div id="accueil_bilan" class="accueil_bilan">
		<div id="bilan_vols"></div>
		<div id="bilan_reguls"></div>
		</div>
	</div>
	<h2 class="delimiter">Vols par zone</h2>
	<div id="vols_est" class="accueil_bilan"></div>
	<div id="vols_ouest" class="accueil_bilan"></div>
	<h2 class="delimiter">Delay par zone</h2>
	<div id="reguls_est" class="accueil_bilan"></div>
	<div id="reguls_ouest" class="accueil_bilan"></div>
	<h2 class="delimiter">Données par causes</h2>
	<div id="bilan_causes" class="accueil_bilan"></div>
	<h2 class="delimiter">Données journalières</h2>
	<div id="bilan_jour" class="accueil_bilan"></div>
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
<?php include("../php/upload.inc.php"); ?>
</body>
</html>