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
	<title>Trafic</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/data.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/graph.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script type="text/javascript" src="../js/vols_bdd_class.js"></script>
	<script type="text/javascript" src="../js/trafic_class.js"></script>
	<script type="text/javascript" src="../js/stats-period.js"></script>
	<script src="../js/dragger.js"></script>
	<script src="../js/echarts.min.js"></script>
	<script src="../js/sortable.min.js"></script>
	<link rel="stylesheet" href="../css/bulma.css"> 
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/sortable.css" />
	<link rel="stylesheet" type="text/css" href="../css/custom-checkbox.css" />
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {
			<?php include("../php/nav.js.inc.php"); ?>
			
			document.getElementById('start').addEventListener('change', function (e) {
				let start_date = Date.parse(this.value);
				let end_date = Date.parse(document.getElementById('end').value);
				//if (start_date > end_date) { document.getElementById('end').value = this.value; }
				document.getElementById('end').value = this.value;
			});
			
			$$('.help_close_button').addEventListener('click', e => {
				$("help_frame").classList.add('off');
			});
			
			<?php include("../php/upload.js.php"); ?>
			
			document.querySelector('.help_button').addEventListener('click', e => {
				document.getElementById("help_frame").classList.remove('off');
			});
			
			document.querySelector('.popup-close').addEventListener('click', e => {
				document.querySelector('.popup-box').classList.remove('transform-in');
				document.querySelector('.popup-box').classList.add('transform-out');
				e.preventDefault();
			});

			new period_vols_bdd();
			
		});		
	</script>
</head>
<body id="drag-container">

<header>
<?php include("../php/nav.inc.php"); ?>
<h1>Trafic</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Origine des données vols</span> :<br>Elles sont récupérées quotidiennement en B2B sur le serveur du NM et stockées sous forme de fichiers.</p>
	<p><span>Le bouton "Nombre de Vols"</span> :<br>Il affiche le nombre de vols sur la plage sélectionnée<br>Le vol total APP prend en compte tous les AD, même ceux non cochés</p>
	<p><span>Le bouton "Graph année"</span> :<br>Il permet d'afficher le nombre de vols de la p&eacute;riode.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li><label for="start" class="dates">D&eacute;but:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2024-01-01"></li>
	<li><label for="end" class="dates">Fin:</label>
	<input type="date" id="end" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>"></li>
	<li>
	  <select id="zone" class="select">
	  	<option selected value="crna">CRNA</option>
		<option value="app">Approche</option>
	  </select>
	</li>
	<li><button class="help_button">Help</button></li>
</ul>
</header>
<div id='traffic_menu'></div>
<div id="glob_container" class="off">

	<div id='result'>
	</div>
	
	<div>
		<div id="graph-container">		
		</div>
		<div id="graph-container2">		
		</div>
		<div id="graph-container3">		
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
<div style="display: flex; justify-content: center;">
	<div id="res"></div>
</div>
</body>
</html>