<?php
  session_start();
  require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html>
<head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="robots" content="noindex">
        <title>Regulations</title>
		<link rel="icon" href="favicon.ico" />
		<script type="text/javascript" src="../js/base.js"></script>
		<script type="text/javascript" src="../js/utils.js"></script>
		<script type="text/javascript" src="../js/list-component.js"></script>
		<script type="text/javascript" src="../js/graph.js"></script>
		<script type="text/javascript" src="../js/upload.js"></script>
        <script type="text/javascript" src="../js/regulations.js"></script>
		<script src="../js/dragger.js"></script>
		<script src="../js/echarts.min.js"></script>
		<script src="../js/sortable.min.js"></script>
		<link rel="stylesheet" type="text/css" href="../css/font.css" />
		<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
		<link rel="stylesheet" type="text/css" href="../css/sortable.css" />
		<link rel="stylesheet" type="text/css" href="../css/style.css" />
		<link rel="stylesheet" type="text/css" href="../css/regulation.css" />
		<link rel="stylesheet" type="text/css" href="../css/upload.css" />
		<script>
			document.addEventListener('DOMContentLoaded', (event) => {
				new dragger('graph-container-h20', 'drag-container');
				new dragger('graph-container-occ', 'drag-container');

				const z = document.querySelector('#zone');
				z.addEventListener('change', (e) => {
					document.getElementById('result').innerHTML = "";
					document.getElementById('graph-container-h20').classList.add('off');
					document.getElementById('graph-container-occ').classList.add('off');
				});
				
				document.getElementById('start').addEventListener('change', function (e) {
					let start_date = Date.parse(this.value);
					let end_date = Date.parse(document.getElementById('end').value);
					if (start_date > end_date) { document.getElementById('end').value = this.value; }
				});
				
				document.getElementById('close_button').addEventListener('click', e => {
					document.getElementById("help_frame").classList.add('off');
				});
				
				<?php include("../php/upload.js.php"); ?>
				
				document.querySelector('.help_button').addEventListener('click', e => {
					document.getElementById("help_frame").classList.remove('off');
				});
				
				
				document.getElementById('bouton_regul').addEventListener('click', e => {
					result_h20 = {};
					let zone = document.getElementById('zone').value;
					let start_day = document.getElementById('start').value; // yyyy-mm-dd
					let end_day = document.getElementById('end').value; // yyyy-mm-dd
					show_result_reg('result', start_day, end_day, zone);
					$('glob_container').classList.remove('off');
				});
				
				document.querySelector('.popup-close').addEventListener('click', e => {
					document.querySelector('.popup-box').classList.remove('transform-in');
					document.querySelector('.popup-box').classList.add('transform-out');
					e.preventDefault();
				});
				
			});		
		</script>
</head>
<body id="drag-container">

<header>
<?php include("../php/nav.inc.php"); ?>
<h1>Regulations</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Origine des données H20 et Occ</span> :<br>Elles sont récupérées quotidiennement en B2B sur le serveur du NM et stockées sous forme de fichiers. <br>La période de récupération des données se situe entre 4h UTC et 22h00 UTC. Par conséquent, il n'est pas possible de visualiser les graphes en dehors de cette plage horaire.<br>D'autre part, comme tous les TV ne sont pas récupérés, certains graphiques (principalement les TV très peu ouverts) ne peuvent pas être affichés.</p>
	<p><span>Le bouton "Regulation"</span> :<br>Il permet d'afficher un récapitulatif des reulations de la date choisie.</p>
	<p><span>Le bouton "--------"</span> :<br>Il ne fait rien pour l'instant</p>
	<button id="close_button" class="pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_regul" class="pointer"><span>Regulations</span></li>
	<li id="bouton_regul2" class="pointer"><span>-------</span></li>
	<li><button class="help_button">Help</button></li>
</ul>
<div id="dates">
	<label for="start" class="dates">D&eacute;but:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2021-07-22" max="2030-12-31">
	<label for="end" class="dates">Fin:</label>
	<input type="date" id="end" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2021-07-22" max="2030-12-31">
	<span>
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</span>
</div>


</header>
<div id="glob_container" class="off">
	<div id='result' class='result'>
	</div>
	
	<div id="graph-container">
		<div id="graph-container-h20" draggable="true" class="off">
		Drag me
		<div id="graph_h20" class=""></div>
		</div>

		<div id="graph-container-occ" draggable="true" class="off">
		Drag me
		<div id="graph_occ" class=""></div>
		</div>
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