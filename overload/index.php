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
	<title>Overload</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/tri-config.js"></script>
	<script type="text/javascript" src="../js/tri.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/mixin.js"></script>
	<script type="text/javascript" src="../js/schema.js"></script>
	<script type="text/javascript" src="../js/graph.js"></script>
	<script type="text/javascript" src="../js/overload_class.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script src="../js/dragger.js"></script>
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
			let depassement = undefined;

			new dragger('graph-container-h20', 'drag-container');
			new dragger('graph-container-occ', 'drag-container');

			const z = document.querySelector('#zone');
			z.addEventListener('change', (e) => {
				$('result').innerHTML = "";
				$('graph-container-h20').classList.add('off');
				$('graph-container-occ').classList.add('off');
			});
			
			$('start').addEventListener('change', function (e) {
				let start_date = Date.parse(this.value);
				let end_date = Date.parse($('end').value);
				if (start_date > end_date) { $('end').value = this.value; }
			});
			
			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});
			
			<?php include("../php/upload.js.php"); ?>
			
			document.querySelector('.help_button').addEventListener('click', e => {
				$("help_frame").classList.remove('off');
			});
			
			$('bouton_capa').addEventListener('click', e => {
				$('graph-container-h20').classList.add('off');
				$('graph-container-occ').classList.add('off');
				//result_h20 = {};
				let zone = $('zone').value;
				let start_day = $('start').value; // yyyy-mm-dd
				let end_day = $('end').value; // yyyy-mm-dd
				let sel_percent = parseInt($('selection').value);
				depassement = new overload('result', "H20", start_day, end_day, zone, sel_percent);
				//show_result_capa('result', "H20", start_day, end_day, zone, sel_percent);
			});
			
			$('bouton_export').addEventListener('click', e => {
				if (isObjEmpty(depassement.result_capa) === false) {
					export_json_to_xls('php/export_to_excel.php', depassement.result_capa);
				} else {
					show_popup("Il n'y a rien à exporter", "Il faut cliquer sur le bouton CAPA avant");
				}
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
<h1>OVERLOAD</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Origine des données H20 et Occ</span> :<br>Elles sont récupérées quotidiennement en B2B sur le serveur du NM et stockées sous forme de fichiers. <br>La période de récupération des données se situe entre 4h UTC et 22h00 UTC. Par conséquent, il n'est pas possible de visualiser les graphes en dehors de cette plage horaire.<br>D'autre part, comme tous les TV ne sont pas récupérés, certains graphiques (principalement les TV très peu ouverts) ne peuvent pas être affichés.</p>
	<p><span>Le bouton "Overload"</span> :<br>Il permet d'afficher dans un tableau les dépassements de capacité sur la plage de dates choisie. On peut ensuite cliquer sur un TV pour afficher la courbe de H20 et l'Occupancy.</p>
	<p><span>Le bouton "XLS Export"</span> :<br>Il permet d'exporter au format Excel le tableau des dépassements de capa.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_capa" class="pointer"><span>Overload</span></li>
	<li id="bouton_export" class="pointer"><span>XLS Export</span></li>
	<li><button class="help_button">Help</button></li>
	<div class="animation start-home"></div>
</ul>

<div id="dates">
	<label for="start" class="dates">D&eacute;but:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2021-06-21" max="2030-12-31">
	<label for="end" class="dates">Fin:</label>
	<input type="date" id="end" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2021-06-21" max="2030-12-31">
	<span>
		<select id="selection" class="select">
		  <option value="180">180%</option>
		  <option value="170">170%</option>
		  <option value="160">160%</option>
		  <option value="150">150%</option>
		  <option selected value="140">140%</option>
		  <option value="130">130%</option>
		  <option value="120">120%</option>
		  <option value="110">110%</option>
		  <option value="100">100%</option>
		  <option value="90">90%</option>
		  <option value="0">Tous</option>
		</select>
	</span>
	<span>
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</span>
</div>

</header>

<div id="glob_container">
	<div id='result' class='tv'>
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