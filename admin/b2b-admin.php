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
	<title>Administration B2B</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/schema.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
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
			
			$('arrow_left').addEventListener('click', async e => {
				$('start').value = addDays_toString($('start').value,-1);
				
			});

			$('arrow_right').addEventListener('click', async e => {
				$('start').value = addDays_toString($('start').value,1);
			});

			$('bouton_feuille').addEventListener('click', async e => {
				
			});
			
		});		
	</script>
</head>
<body id="drag-container">

<header>

<?php include("../php/nav.inc.php"); ?>

<h1>Admin B2B</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>B2B</span> :<br>Cliquez sur ce bouton pour chargermanuellement les données B2B</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_feuille" class="pointer"><span>AAA</span></li>
	<li class="feuille"><a href="./b2b-admin.php">BBB</a></li>
	<li class="feuille"><a href="./b2b-admin.php">CCC</a></li>
	<li>
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