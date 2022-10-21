<?php
  session_start();
  if (!(isset($_SESSION['login_bureau'])) || $_SESSION['login_bureau'] === false) die("Interdit");
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>Administration Confs</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/tri-config.js"></script>
	<script type="text/javascript" src="../js/tri.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/schema.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script type="text/javascript" src="../js/confs_class.js"></script>
	<script type="text/javascript" src="../js/stats_confs.js"></script>
	<script src="../js/echarts.min.js"></script>
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {
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

			$('bouton_check_doublons').addEventListener('click', async e => {
				const clean = new conf();
				await clean.init();
				await clean.init_b2b();
				clean.affiche_doublon_confs("result");
			});

			$('bouton_show_bdd').addEventListener('click', async e => {
				const bdd = new conf(null, $('zone').value);
				await bdd.init();
				bdd.show_bdd_confs("result");
			});
			
			$('bouton_export_salto').addEventListener('click', async e => {
				const zone = $('zone').value === "AE" ? "est" : "ouest";
				const c = new conf(convertDate(new Date()), zone);
				await c.init_b2b();
				console.log(c.b2b_sorted_confs);
				c.export_salto(zone);
			});
		});		
	</script>
</head>
<body id="drag-container">

<header>

<?php include("../php/nav.inc.php"); ?>

<h1>Admin Confs</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Show BDD</span> :<br>Ce bouton permet d'afficher les confs virtuelles de la BDD locale</p>
	<p><span>Check Doublons</span> :<br>Ce bouton permet d'enlever les doublons de la BDD locale/NM</p>
	<p><span>Export SALTO</span> :<br>Ce bouton permet de générer le fichier de paramétrage SALTO</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_show_bdd" class="pointer"><span>Show bdd</span></li>
	<li id="bouton_check_doublons" class="pointer"><span>Check Doublons</span></li>
	<li id="bouton_export_salto" class="pointer"><span>Export Salto</span></li>
	<li>
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</li>
	<li><button class="help_button">Help</button></li>
</ul>
</header>

<div id="glob_container">
	<div id='result'>
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