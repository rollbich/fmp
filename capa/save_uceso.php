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
	<title>Save UCESO to BDD</title>
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

			let capa_graph;

			$('bouton_show_uceso').addEventListener('click', async e => {
				let zone = $('zone').value;
				let day = $('start').value;
				const cap = new capa(day, zone);
				show_popup("Patientez !", "Chargement en cours...");
				const pc = await cap.get_nbpc_dispo();
				const details_sv_15mn = pc.details_sv_15mn;
				document.querySelector('.popup-close').click();
				capa_graph = await show_capa_graph("feuille_capa_uceso", day, zone, pc, details_sv_15mn);
			});

            $('bouton_save_uceso').addEventListener('click', async e => {
				console.log(capa_graph);
				// Si pas de donnée réalisé
				if (capa_graph.data_d.length === 0) {
					show_popup("Fichier realis&eacute; absent!", `Jour : ${capa_graph.day}`);
				} else {
					await save_uceso(capa_graph.zone, capa_graph.day, capa_graph.jour, capa_graph.i1, capa_graph.uceso, capa_graph.data_d, capa_graph.max_sect, capa_graph.tvh, capa_graph.nb_pc, capa_graph.minutes_ucesa);
					show_popup("Sauvegarde effectu&eacute;e!", `Jour : ${capa_graph.day}`);
				}
            });
			
		});		
	</script>
</head>
<body id="drag-container">

<header>

<?php include("../php/nav.inc.php"); ?>

<h1>Save Uceso to BDD</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Save Uceso</span> :<br>Cliquez sur ce bouton pour sauver les ucesos, le i1 et le r&eacute;alis&eacute; d'une journ&eacute;e pass&eacute;e</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_show_uceso" class="pointer"><span>Show</span></li>
    <li id="bouton_save_uceso" class="pointer"><span>Save</span></li>
	<li>
	<label for="start" class="dates">Date:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2023-01-01">
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

<div id='feuille_capa_uceso'>
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