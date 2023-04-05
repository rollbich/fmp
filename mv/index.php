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
	<title>MV et OTMV</title>
	<link rel="icon" href="../favicon.ico" />
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<link rel="stylesheet" type="text/css" href="../css/sortable.css" />
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script src="../js/sortable.min.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script type="text/javascript" src="../js/confs_class.js"></script>
	<script type="text/javascript" src="../js/mvs_class.js"></script>
	<script type="text/javascript" src="../js/stats_confs.js"></script>
	<script src="../js/dragger.js"></script>
	
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {

			<?php include("../php/nav.js.inc.php"); ?>

			const z = document.querySelector('#zone');
			z.addEventListener('change', (e) => {
				$('result').innerHTML = "";
			});
			
			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});
			
			<?php include("../php/upload.js.php"); ?>
			
			document.querySelector('.help_button').addEventListener('click', e => {
				$("help_frame").classList.remove('off');
			});

            $('bouton_mvs_existantes').addEventListener('click', async e => {
                const zone = $('zone').value === "AE" ? "est" : "ouest";
				const day = $('day').value;
				const mvs = new mv(day, zone);
				mvs.init_mv();
			});

			$('bouton_otmvs_existantes').addEventListener('click', async e => {
                const zone = $('zone').value === "AE" ? "est" : "ouest";
				const day = $('day').value;
				const mvs = new mv(day, zone);
				mvs.init_otmv();
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
<h1>MVs - OTMVs</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
    <p><span>Le bouton "MV NM"</span> :<br>Il permet d'afficher les MVs NM existantes. Les données affichées sont à jour puisqu'une requête B2B a lieu en temps réel.</p>
	<p><span>Le bouton "OTMV NM"</span> :<br>Il permet d'afficher les OTMVs NM existantes. Les données affichées sont à jour puisqu'une requête B2B a lieu en temps réel.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
    <li id="bouton_mvs_existantes" class="pointer"><span>MV NM</span></li>
	<li id="bouton_otmvs_existantes" class="pointer"><span>OTMV NM</span></li>
	<li class="pointer"><span id="bouton_conf">Date :</span><input type="date" id="day" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="<?php echo date("Y-m-d", strtotime("today"));?>" max="<?php echo date("Y-m-d", strtotime("+1 day"));?>"></li>
	<!--<li class="pointer"><span id="bouton_stat_confs">Stats Confs</span></li>-->
	<span>
		<select id="zone" class="select">
			<option selected value="AE">Zone EST</option>
			<option value="AW">Zone WEST</option>
		</select>
	</span>
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