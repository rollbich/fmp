<?php
  session_start();
  require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>Export UCESOs to XLS</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/tds-name.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/tri-config.js"></script>
	<script type="text/javascript" src="../js/tri.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/schema.js"></script>
	<script type="text/javascript" src="../js/olaf.js"></script>
	<script type="text/javascript" src="../js/capa_class.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script src="../js/echarts.min.js"></script>
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<script>
		document.addEventListener('DOMContentLoaded', async (event) => {
			<?php include("../php/nav.js.inc.php"); ?>

			document.querySelector('.help_button').addEventListener('click', e => {
				$("help_frame").classList.remove('off');
			});

			<?php include("../php/upload.js.php"); ?>

			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});

			document.querySelector('.popup-close').addEventListener('click', e => {
				e.preventDefault();
				document.querySelector('.popup-box').classList.remove('transform-in');
				document.querySelector('.popup-box').classList.add('transform-out');
			});

			$('bouton_xls').addEventListener('click', async e => {
				let zone = $('zone').value;
				let start_day = $('start').value;
				let end_day = $('end').value;
				/* code sans utiliser PHP
				const capa = new feuille_capa("feuille_capa_tour", day, zone, false)
				.then( (value) => {
					console.log("RESULT UCESOS");
					console.log(value.compacted);
					console.log(value.quarter);
				});
				*/
				const obj = {"zone": zone, "startDay": start_day, "endDay": end_day};
				const url = "../php/steph_xls.php";
				const data = {
					method: "post",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(obj)
				};
				fetch(url, data)
				.then(function(response) {
					return response.text().then(function(texte) {
						show_popup("Export XLS réussi", `Cliquer pour télécharger le fichier<br><a href='download_capa_file.php?filename=${texte}'>${texte}</a>`); 
					});
				});
			});
			
		});		
	</script>
</head>
<body id="drag-container">

<header>

<?php include("../php/nav.inc.php"); ?>

<h1>Export Ucesos to XLS</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Feuille</span> :<br>Cliquez sur ce bouton pour afficher la feuille de capa correspondante à la date et la zone choisie<br>Cliquez sur le nombre de pc dans la colonne PC afin de visualiser les effectifs par équipes. Cette case est surlignée lorsque l'effectif est différent de l'effectif OLAF</p>
	<?php
	if ($_SESSION['login_bureau'] === true || $_SESSION['login_encadrement'] === true) {
		echo "<p><span>Simu</span> : Ce bouton permet de simuler un changement de BV ou de nombre de PC et de voir le résultat graphiquement.</p>";
	}
	?>
	<p><span>Edit TDS</span> :<br>Ce bouton permet de modifier le tour de service ainsi que sa plage d'utilisation</p>
	<p><span>Instr</span> :<br>Ce bouton permet de modifier une plage horaire en ajoutant ou enlevant de l'effectif, par exemple lors d'un recyclage instructeur, une ASA ou une simu remontée de trafic.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_xls" class="pointer"><span>Export</span></li>
	<li>
	<label for="start" class="dates">D&eacute;but:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2018-12-31">
	<label for="end" class="dates">Fin:</label>
	<input type="date" id="end" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2018-12-31">
	</li>
	<li class="feuille">
	  <select id="zone" class="select">
		<option selected value="est">Zone EST</option>
		<option value="ouest">Zone WEST</option>
	  </select>
	</li>
	<li class="feuille"><button class="help_button">Help</button></li>
</ul>
</header>

<div id="glob_container">
	<div id='feuille_capa_tour'>
	</div>
	<div id='feuille_capa_simu'>
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