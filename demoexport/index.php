<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>Demo Export Salto</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/tri-config.js"></script>
	<script type="text/javascript" src="../js/tri.js"></script>
	<script type="text/javascript" src="../js/confs_class.js"></script>
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {

			document.querySelector('.help_button').addEventListener('click', e => {
				$("help_frame").classList.remove('off');
			});

			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});

			document.querySelector('.popup-close').addEventListener('click', e => {
				e.preventDefault();
				document.querySelector('.popup-box').classList.remove('transform-in');
				document.querySelector('.popup-box').classList.add('transform-out');
			});
			
			$('bouton_export_salto').addEventListener('click', async e => {
				const zone = $('zone').value === "AE" ? "est" : "ouest";
				const c = new conf(convertDate(new Date()), zone);
				await c.init_b2b();
				c.export_salto(zone);
			});
		});		
	</script>
</head>
<body id="drag-container">

<header>

<h1>Export Auto Fichier param SALTO - LFMM</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Export SALTO</span> :<br>Ce bouton permet de générer le fichier de paramétrage SALTO</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
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

<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut" /></a>
</div>
</body>
</html>