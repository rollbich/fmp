<!DOCTYPE html>
<html>
<head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="robots" content="noindex">
        <title>Feuille Capa</title>
		<link rel="icon" href="favicon.ico" />
		<script type="text/javascript" src="../js/base.js"></script>
		<script type="text/javascript" src="../js/tds-name.js"></script>
		<script type="text/javascript" src="../js/utils.js"></script>
		<script type="text/javascript" src="../js/ouverture.js"></script>
		<script type="text/javascript" src="../js/upload.js"></script>
		<script type="text/javascript" src="../js/olaf.js"></script>
		<script type="text/javascript" src="../js/capa.js"></script>
		<link rel="stylesheet" type="text/css" href="../css/font.css" />
		<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
		<link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
		<link rel="stylesheet" type="text/css" href="../css/upload.css" />
		<script>
			document.addEventListener('DOMContentLoaded', (event) => {
				
				$('close_button').addEventListener('click', e => {
					$("help_frame").classList.add('off');
				});
				
				<?php include("../php/upload.js.php"); ?>
				
				document.querySelector('.help_button').addEventListener('click', e => {
					$("help_frame").classList.remove('off');
				});
				
				$('bouton_feuille').addEventListener('click', async e => {
					let zone = $('zone').value;
					let day = $('start').value;
					show_feuille_capa("feuille_capa_tour", day, zone);
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
<h1>FEUILLE CAPA (expé)</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Le bouton "Ouverture"</span> :<br>Il permet d'afficher graphiquement le fichier schéma réalisé de Courage. On peut ensuite cliquer sur un TV pour afficher la courbe de H20 et l'Occupancy pendant la période d'ouverture.<br>Si le TV n'est pas resté ouvert assez longtemps, le graphique H20 ne sera pas affiché.</p>
	<p><span>Le bouton "Graph"</span> :<br>Il permet d'afficher les courbes H20/Occ d'une date pendant la plage horaire choisie.</p>
	<p><span>Le bouton Capa</span> :<br>Il affiche la feuille de capa. Une latence de 4 à 5s est posible le temps du chargement des données.<br>Le nombre de pc tient compte du cds travaillant sur position en S2.<br>Il se peut donc que le total du nbre de pc affiché ne soit pas égal dans ce cas au total des 2 lignes de la vacation</p>
	<button id="close_button" class="pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_feuille" class="pointer"><span>Feuille</span></li>
	<li><label for="start" class="dates">Date:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2021-06-14" max="2030-12-31">
	</li>
	<li class="feuille">
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</li>
	<li class="feuille"><button class="help_button">Help</button></li>
</ul>

</header>
<div id='feuille_capa_tour'>
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