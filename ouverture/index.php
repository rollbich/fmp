<?php
  session_start();
  require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html>
<head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="robots" content="noindex">
        <title>Capa</title>
		<link rel="icon" href="favicon.ico" />
		<script type="text/javascript" src="../js/base.js"></script>
		<script type="text/javascript" src="../js/tds-name.js"></script>
		<script type="text/javascript" src="../js/utils.js"></script>
		<script type="text/javascript" src="../js/list-component.js"></script>
		<script type="text/javascript" src="../js/graph.js"></script>
		<script type="text/javascript" src="../js/ouverture.js"></script>
		<script type="text/javascript" src="../js/upload.js"></script>
		<script type="text/javascript" src="../js/olaf.js"></script>
		<script type="text/javascript" src="../js/capa.js"></script>
		<script src="../js/dragger.js"></script>
		<script src="../js/echarts.min.js"></script>
		<link rel="stylesheet" type="text/css" href="../css/font.css" />
		<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
		<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
		<link rel="stylesheet" type="text/css" href="../css/style.css" />
		<link rel="stylesheet" type="text/css" href="../css/upload.css" />
		<script>
			document.addEventListener('DOMContentLoaded', (event) => {
				new dragger('graph-container-h20', 'drag-container');
				new dragger('graph-container-occ', 'drag-container');

				const z = document.querySelector('#zone');
				z.addEventListener('change', (e) => {
					$('result').innerHTML = "";
					$('graph-container-h20').classList.add('off');
					$('graph-container-occ').classList.add('off');
				});
				
				$('close_button').addEventListener('click', e => {
					$("help_frame").classList.add('off');
				});
				
				<?php include("../php/upload.js.php"); ?>
				
				document.querySelector('.help_button').addEventListener('click', e => {
					$("help_frame").classList.remove('off');
				});
				
				$('bouton_ouverture').addEventListener('click', e => {
					$('graph-container-h20').classList.add('off');
					$('graph-container-occ').classList.add('off');
					let zone = $('zone').value;
					let start_day = $('start').value;
					show_ouverture('result', start_day, zone);	
				});
				
				$('bouton_h20occ').addEventListener('click', e => {
					show_popup("Graph", "Cette fonctionnalité n'est pas encore implémentée");
				});
				
				$('bouton_uceso').addEventListener('click', async e => {
					let zone = $('zone').value;
					let day = $('start').value;
					//show_feuille_capa("feuille_capa_tour", "feuille_capa_uceso", start_day, zone);
					const pc = await get_nbpc_dispo(day, zone);
					show_courage_graph("courage_container", day, zone, pc["pc_total_dispo_15mn"]);
				});
				
				document.querySelector('.popup-close').addEventListener('click', e => {
					e.preventDefault();
					document.querySelector('.popup-box').classList.remove('transform-in');
					document.querySelector('.popup-box').classList.add('transform-out');
					
				});
				
			});		
		</script>
</head>
<body id="drag-container">

<header>
<?php include("../php/nav.inc.php"); ?>
<h1>OUVERTURE</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Le bouton "Ouverture"</span> :<br>Il permet d'afficher graphiquement le fichier schéma réalisé de Courage. On peut ensuite cliquer sur un TV pour afficher la courbe de H20 et l'Occupancy pendant la période d'ouverture.<br>Si le TV n'est pas resté ouvert assez longtemps, le graphique H20 ne sera pas affiché.</p>
	<p><span>Le bouton "Graph"</span> :<br>Il permet d'afficher les courbes H20/Occ d'une date pendant la plage horaire choisie.</p>
	<p><span>Le bouton Capa</span> :<br>Il affiche la feuille de capa. Une latence de 4 à 5s est posible le temps du chargement des données.<br>Le nombre de pc tient compte du cds travaillant sur position en S2.<br>Il se peut donc que le total du nbre de pc affiché ne soit pas égal dans ce cas au total des 2 lignes de la vacation</p>
	<button id="close_button" class="pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_ouverture" class="pointer"><span>Ouverture</span></li>
	<li id="bouton_uceso" class="pointer"><span>UCESO</span></li>
	<li id="bouton_h20occ" class="pointer"><span>Graph</span></li>
	<li><button class="help_button">Help</button></li>
</ul>

<div id="dates">
	<label for="start" class="dates">Date:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2019-01-01">
	<label for="start_h" class="dates">H Déb:</label>
	<input type="time" id="start_h" class="time" value="04:00" min="04:00" max="23:30">
	<label for="end_h" class="dates">H Fin:</label>
	<input type="time" id="end_h" class="time" value="04:30" min="04:30" max="23:59">
	<span>
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</span>
</div>

</header>
<div id='feuille_capa_tour'>
</div>
<div id="courage_container" style="height: 400px">
</div>
<div id='feuille_capa_uceso'>
</div>
<div id="glob_container">
	<div id='result'>
	</div>
	
	<div id="graph-container">
		<div id="graph-container-h20" draggable="true" class="off">
		Drag me
		<div id="graph_h20" class=""></div>
		</div>

		<div id="graph-container-occ" draggable="true" class="off">
		Drag me
		<div id="graph_occ" class=""></div>
		</div>
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