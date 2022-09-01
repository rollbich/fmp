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
	<title>Visualisation des TVs</title>
	<link rel="icon" href="../favicon.ico" />
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/tds-name.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/tri.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/graph.js"></script>
	<script type="text/javascript" src="../js/schema.js"></script>
	<script type="text/javascript" src="../js/ouverture_class.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script type="text/javascript" src="../js/olaf.js"></script>
	<script type="text/javascript" src="../js/capa_class.js"></script>
	<script type="text/javascript" src="../js/confs_class.js"></script>
	<script type="text/javascript" src="../js/stats_confs.js"></script>
	<script type="text/javascript" src="../js/visu.js"></script>
	<script src="../js/dragger.js"></script>
	<script src="../js/echarts.min.js"></script>
	
		
	<script>
		document.addEventListener('DOMContentLoaded', (event) => {

			<?php include("../php/nav.js.inc.php"); ?>
			
			new dragger('graph-container-h20', 'drag-container');
			new dragger('graph-container-occ', 'drag-container');

			const z = document.querySelector('#zone');
			z.addEventListener('change', (e) => {
				$('result').innerHTML = "";
				$('graph-container-h20').classList.add('off');
				$('graph-container-occ').classList.add('off');
				visu();
			});
			
			document.querySelector('.help_close_button').addEventListener('click', e => {
				e.preventDefault();
				$("help_frame").classList.add('off');
			});
			
			<?php include("../php/upload.js.php"); ?>
			
			document.querySelector('.help_button').addEventListener('click', e => {
				e.preventDefault();
				$("help_frame").classList.remove('off');
			});

			async function get_fichier_confs() {
				const zon = $('zone').value === "AE" ? "est" : "ouest";
				const cf = new conf(new Date(), zon);
				await cf.init_b2b();
				const confs_exist = cf.b2b_sorted_confs;
				
				const url_est =  `../confs-est-supp.json`;	
				const url_west =  `../confs-west-supp.json`;	
				//const url = $('zone').value === "AE" ? url_est : url_west;
				const confs_supp_est = await loadJson(url_est);
				const confs_supp_ouest = await loadJson(url_west);


				// merge les 2 fichiers
				const conf_tot = {"est": {}, "ouest":{}};
				Object.assign(conf_tot["est"], confs_exist["est"]);
				Object.keys(confs_supp_est).forEach( elem => {
					conf_tot["est"][elem] = {...conf_tot["est"][elem], ...confs_supp_est[elem]}
				})
				Object.assign(conf_tot["ouest"], confs_exist["ouest"]);
				Object.keys(confs_supp_ouest).forEach( elem => {
					conf_tot["ouest"][elem] = {...conf_tot["ouest"][elem], ...confs_supp_ouest[elem]}
				})

				console.log("Confs existantes");
				console.log(confs_exist);
				console.log("Confs supp est");
				console.log(confs_supp_est);
				console.log("Confs supp west");
				console.log(confs_supp_ouest);
				console.log("Confs totale mergée est");
				console.log(conf_tot["est"]);
				console.log("Confs totale mergée ouest");
				console.log(conf_tot["ouest"]);
				return conf_tot;
			}
			
			let confs = null;

			$('bouton_ouverture').addEventListener('click', async e => {
				$('graph-container-h20').classList.add('off');
				$('graph-container-occ').classList.add('off');
				let zone = $('zone').value;
				let start_day = $('start').value;
				const zon = $('zone').value === "AE" ? "est" : "ouest";
				// ne prépare le fichier de conf qu'une fois
				if (confs === null) confs = await get_fichier_confs();
				const ouv = new ouverture('result', start_day, zone);
				<?php
				if ($_SESSION['login_bureau'] === true) {
					echo "ouv.show_ouverture(confs[zon], true);";
				} else {
					echo "ouv.show_ouverture(confs[zon], false);";
				}
				?>
			});
			
			$('start').addEventListener('change', async (e) => {
				$('result').innerHTML = "";
				$('graph-container-h20').classList.add('off');
				$('graph-container-occ').classList.add('off');
				$('bouton_visu').click();
			});

			$('bouton_visu').addEventListener('click', e => {
				//const zone = $('zone').value;
				const day = $('start').value;
				const visu_day = new visu(day, "AE");
				visu_day.show_visu();
			})

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
<h1>VISU TVS</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
	<p><span>Le bouton "Ouverture"</span> :<br>Il permet d'afficher graphiquement le fichier schéma réalisé de Courage. On peut ensuite cliquer sur un TV pour afficher la courbe de H20 et l'Occupancy pendant la période d'ouverture.<br>Si le TV n'est pas resté ouvert assez longtemps, le graphique H20 ne sera pas affiché.</p>
	<p><span>Le bouton Visu Est</span> :<br>Il affiche ce qu'a vu l'ACDS à l'heure indiquée.</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
	<li id="bouton_ouverture" class="pointer"><span>Ouverture</span></li>
	<li id="bouton_visu" class="pointer"><span>Visu Est</span></li>
	<li><button class="help_button">Help</button></li>
</ul>
<div id="dates">
	<label for="start" class="dates">Date:</label>
	<input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2019-01-01">
	<span>
	  <select id="zone" class="select">
		<option selected value="AE">Zone EST</option>
		<option value="AW">Zone WEST</option>
	  </select>
	</span>
</div>
</header>
<div class="visu">
	<div id="tvs"></div>
	<div id="timeline">
	</div>
</div>
<div id='feuille_capa_uceso'>
</div>

<div id="glob_container">
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
</body>
</html>