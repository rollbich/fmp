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
	<title>Regulations</title>
	<link rel="icon" href="../favicon.ico" />
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/data.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/graph.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script type="text/javascript" src="../js/regulations_bdd_class.js"></script>
	<script src="../js/dragger.js"></script>
	<script src="../js/echarts.min.js"></script>
	<script src="../js/sortable.min.js"></script>
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/sortable.css" />
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {
			<?php include("../php/nav.js.inc.php"); ?>
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
			
			document.getElementById('bouton_regul').addEventListener('click', async e => {
				let zone = document.getElementById('zone').value;
				let start_day = document.getElementById('start').value; // yyyy-mm-dd
				let end_day = document.getElementById('end').value; // yyyy-mm-dd
				const reg = new period_regul_bdd(zone, start_day, end_day);
				await reg.init();
				reg.show_result_reg("result");
				$('glob_container').classList.remove('off');
			});
			
			document.getElementById('bouton_year_regul').addEventListener('click', async e => {
				let day = document.getElementById('start').value; // yyyy-mm-dd
				let zone = document.getElementById('zone').value;
				const data = {};
				const year = parseInt(new Date(day).getFullYear());
				const lastyear = parseInt(new Date(day).getFullYear()) - 1;
				
				const nb_week = weeksInYear(new Date(day).getFullYear());
				const nb_week_lastyear = weeksInYear(new Date(day).getFullYear() - 1);
				const nb_week_2019 = weeksInYear(2019);
				const nb = Math.max(nb_week, nb_week_lastyear, nb_week_2019);
				console.log("Nb week: "+nb_week);
				const listWeek = [];
				for (let k=1;k<nb+1;k++) { listWeek.push(k);}
						
				const data_2019 = new weekly_regs(2019);
				await data_2019.init();
				const data_lastyear = new weekly_regs(lastyear);
				await data_lastyear.init();		
				const data_year = new weekly_regs(year);
				await data_year.init();	
				console.log(listWeek);
				show_delay_graph("res", year, listWeek, data_year.delay[zon], data_lastyear.delay[zon], data_2019.delay[zon], "LFMM-"+zon);
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
	<p><span>Origine des données de régulation</span> :<br>Elles sont récupérées quotidiennement en B2B sur le serveur du NM et stockées sous forme de fichiers.</p>
	<p><span>Le bouton "Regulation"</span> :<br>Il permet d'afficher un récapitulatif des regulations de la date choisie.</p>
	<p><span>Le bouton "Graph Année"</span> :<br>Il affiche les reguls par semaine sur l'année</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_regul" class="pointer"><span>Regulations</span></li>
	<li id="bouton_year_regul" class="pointer"><span>Graph Année</span></li>
	<li><button class="help_button">Help</button></li>
</ul>
<div id="dates">
	<label for="start" class="dates">D&eacute;but:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2018-12-31">
	<label for="end" class="dates">Fin:</label>
	<input type="date" id="end" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2018-12-31">
	<span>
	  <select id="zone" class="select">
		<option selected value="est">Zone EST</option>
		<option value="west">Zone WEST</option>
        <option value="app">Approches</option>
	  </select>
	</span>
</div>


</header>
<div id="glob_container" class="off">
	<div id='result'>
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
<div style="display: flex; justify-content: center;">
	<div id="res"></div>
</div>
</body>
</html>