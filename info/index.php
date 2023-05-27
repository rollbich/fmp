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
	<title>LFMM B2B Info</title>
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
	<script type="text/javascript" src="../js/info_services_class.js"></script>
	<script src="../js/dragger.js"></script>
	
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {

			<?php include("../php/nav.js.inc.php"); ?>
			
			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});
			
			<?php include("../php/upload.js.php"); ?>
			
			document.querySelector('.help_button').addEventListener('click', e => {
				$("help_frame").classList.remove('off');
			});

            $('bouton_certif').addEventListener('click', async e => {
				const info = new info_NM();
				info.show_certif_info("result");
			});

			$('bouton_nm').addEventListener('click', async e => {
				const info = new info_NM();
				info.show_nm_info("result");
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
<h1>LFMM B2B INFO</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
    <p><span>Le bouton "Certif"</span> :<br>Il permet de donner des infos sur le certificat utilisé.</p>
    <p><span>Le bouton "NM"</span> :<br>Il permet de donner des infos sur NM B2B.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
    <li id="bouton_certif" class="pointer"><span>Certif Info</span></li>
	<li id="bouton_nm" class="pointer"><span>NM Info</span></li>
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