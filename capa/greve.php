<?php
  session_start();
  require("../php/check_ok.inc.php");
  if (!(isset($_SESSION['login_encadrement']) && $_SESSION['login_encadrement'] === true)) header("Location: index.php");
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>Gestion Capa Greve</title>
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
			
			$('arrow_left').addEventListener('click', async e => {
				$('start').value = addDays_toString($('start').value,-1);
				
			});

			$('arrow_right').addEventListener('click', async e => {
				$('start').value = addDays_toString($('start').value,1);
			});

			$('bouton_feuille').addEventListener('click', e => {
				let zone = $('zone').value;
				let day = $('start').value;
				const capa = new feuille_capa("feuille_capa_tour", day, zone);
			});
			
			if ($('bouton_simucapa')) {
				$('bouton_simucapa').addEventListener('click', async e => {
					let zone = $('zone').value;
					let day = $('start').value;
					const simu = new simu_capa("feuille_capa_simu", day, zone);
				});
			}

			document.addEventListener('keydown', function(event) {
			if (event.ctrlKey && event.key === 'y') {
				event.preventDefault();
				const td_masque = document.querySelectorAll('.details');
				td_masque.forEach(td_el => {
					td_el.classList.toggle('masque');
				});
			}
			}, true);
			
			let capa;
            $('bouton_tag_greve').addEventListener('click', async e => {
				let zone = $('zone').value;
				let day = $('start').value;
				capa = await new feuille_capa("feuille_capa_tour", day, zone);
                await capa.show_tab_personnels('tag_personnels');
				$('extract').classList.remove('off');
			});

		});		
	</script>
</head>
<body id="drag-container">

<header>

<?php include("../php/nav.inc.php"); ?>

<h1>GESTION CAPA GREVE</h1>
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
	<li id="bouton_feuille" class="pointer"><span>Feuille</span></li>
	<li id="bouton_simucapa" class="pointer"><span>Simu</span></li>
    <li id="bouton_tag_greve" class="pointer"><span>Greve</span></li>
	<li>
	<!--<label for="start" class="dates">Date:</label>-->
	<button id="arrow_left"><</button>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2021-09-14" max="2030-12-31">
	<button id="arrow_right">></button>
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

<div id='tag_personnels'>
</div>

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