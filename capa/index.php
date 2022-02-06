<?php
  session_start();
  require("../php/check_ok.inc.php");
?>
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
		<script type="text/javascript" src="../js/schema.js"></script>
		<script type="text/javascript" src="../js/olaf.js"></script>
		<script type="text/javascript" src="../js/capa_class.js"></script>
		<script src="../js/echarts.min.js"></script>
		<link rel="stylesheet" type="text/css" href="../css/font.css" />
		<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
		<link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
		<link rel="stylesheet" type="text/css" href="../css/upload.css" />
		<script>
			document.addEventListener('DOMContentLoaded', (event) => {
				$$('.upload_button').style.display = 'none';
				$('close_button').addEventListener('click', e => {
					$("help_frame").classList.add('off');
				});
				
				document.querySelector('.help_button').addEventListener('click', e => {
					$("help_frame").classList.remove('off');
				});
				
				$('bouton_feuille').addEventListener('click', async e => {
					let zone = $('zone').value;
					let day = $('start').value;
                    const capa = new feuille_capa("feuille_capa_tour", day, zone);
					capa.show_feuille_capa();
				});

				$('bouton_simucapa').addEventListener('click', async e => {
					let zone = $('zone').value;
					let day = $('start').value;
					/*
					const cap = new capa(day, zone);
					show_popup("Patientez !", "Chargement en cours...");
					const pc = await cap.get_nbpc_dispo();
					document.querySelector('.popup-close').click();
					show_capa_graph("feuille_capa_uceso", day, zone, pc);
					*/
					const simu = new simu_capa("feuille_capa_uceso", day, zone);
					simu.show_simu_capa();
					//simu.go();
                    //alert("Fonctionnalité en développement");
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
<h1>FEUILLE CAPA v1.1</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Feuille</span> :<br>Cliquez sur ce bouton pour afficher la feuille de capa correspondante à la date et la zone choisie</p>
	<p><span>Modification de l'effectif</span> :<br>Cliquez sur le nombre de pc dans la colonne PC afin de mettre à jour localement ce nombre. La case est alors surlignée pour montrer que l'effectif est différent de l'effectif OLAF</p>
	<p><span>Edit TDS</span> :<br>Ce bouton permet de modifier le tour de service ainsi que sa plage d'utilisation</p>
	<button id="close_button" class="pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_feuille" class="pointer"><span>Feuille</span></li>
	<li id="bouton_simucapa" class="pointer"><span>Simu</span></li>
	<li><label for="start" class="dates">Date:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2021-09-14" max="2030-12-31">
	</li>
	<li class="feuille">
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</li>
	<?php
	if ($_SESSION['login_bureau'] === true) {
		echo '<li class ="feuille"><a href="./edit.php">Edit TDS</a></li>';
	}
	?>
	<li class="feuille"><button class="help_button">Help</button></li>
</ul>
</header>

<div id='feuille_capa_tour'>
</div>
<div id='feuille_capa_uceso'>
</div>

<div id="popup-wrap" class="off" >
    <div class="popup-box">
      <h2></h2>
      <h3></h3>
      <a class="close-btn popup-close" href="#">x</a>
    </div>
</div>

<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut" /></a>
</div>
</body>
</html>