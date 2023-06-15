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
	<script type="text/javascript" src="../js/upload.js"></script>
        <script type="text/javascript" src="nmir/reg/nmir_reg_to_json.js"></script>
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

			$('bouton_save_reg').addEventListener('click', async e => {
				new nmir_reg();
			});
			
		});		
	</script>
</head>
<body id="drag-container">

<header>

<?php include("../php/nav.inc.php"); ?>

<h1>Admin B2B</h1>
<h2 class="center">Pour les REG Nmir : serveur localhost uniquement </h2>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Save NMIR Reg</span> :<br>Sauvegarde les données Reguls B2B à partir d'un fichier NMIR (with_Applied_Rate) Regulations.csv placé dans admin/nmir/reg</p>
	<p><span>H20/Occ D-1</span> :<br>Récupère en B2B les données H20/Occ de la veille de la date sélectée</p>
	<p><span>Confs D-1</span> :<br>Récupère en B2B les données Confs de la veille</p>
	<p><span>Flights D-1</span> :<br>Récupère en B2B les données LOAD, REG, REG_DEMAND de LFMMCTA, CTAE, CTAW et la liste des vols de RAE et RAW de la veille</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_save_reg" class="pointer"><span>Save NMIR Reg</span></li>
	<li id="bouton_get_counts_est"><a href="../b2b/counts-fmp-yesterday-est.php" target="_blank">H20/Occ D-1 Est</a></li>
	<li id="bouton_get_counts_west"><a href="../b2b/counts-fmp-yesterday-west.php" target="_blank">H20/Occ D-1 West</a></li>
	<li id="bouton_get_yesterdaycounts_est"><a href="../b2b/counts-fmp-yesterday-confs.php" target="_blank">Confs D-1</a></li>
	<li id="bouton_get_yesterdaycounts_west"><a href="../b2b/counts-fmp-yesterday-flights.php" target="_blank">Flights D-1</a></li>
	<li>
		<button id="arrow_left"><</button>
		<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2021-09-14" max="2030-12-31">
		<button id="arrow_right">></button>
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