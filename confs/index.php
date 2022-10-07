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
	<title>Confs</title>
	<link rel="icon" href="../favicon.ico" />
	<link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<link rel="stylesheet" type="text/css" href="../css/sortable.css" />
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" type="text/css" href="../css/style.css" />
	<script type="text/javascript" src="../js/base.js"></script>
	<script type="text/javascript" src="../js/tds-name.js"></script>
	<script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/tri.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script src="../js/sortable.min.js"></script>
	<script type="text/javascript" src="../js/graph.js"></script>
	<script type="text/javascript" src="../js/schema.js"></script>
	<script type="text/javascript" src="../js/ouverture_class.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
	<script type="text/javascript" src="../js/olaf.js"></script>
	<script type="text/javascript" src="../js/capa_class.js"></script>
	<script type="text/javascript" src="../js/confs_class.js"></script>
	<script type="text/javascript" src="../js/stats_confs.js"></script>
	<script src="../js/dragger.js"></script>
	<script src="../js/echarts.min.js"></script>
	
		
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
			
			$('bouton_stat_confs').addEventListener('click', async e => {
				const el = $('dates_stats_confs');
				el.classList.remove('content');
				const pos = $('bouton_stat_confs').getBoundingClientRect();
				el.style.position = 'absolute';
				el.style.left = pos.left + 'px';
				const click_ok = (ev) => {
					let zone = $('zone').value;
					let start = $('start').value;
					let end = $('end').value;
					new stat_confs("result",start,end,zone);
					el.classList.add('content');
					document.querySelector('.ok').removeEventListener('click', click_ok);
					document.querySelector('.no').removeEventListener('click', click_no);
				}
				const click_no = (ev) => {
					el.classList.add('content');
					document.querySelector('.ok').removeEventListener('click', click_ok);
					document.querySelector('.no').removeEventListener('click', click_no);
				}
				document.querySelector('.ok').addEventListener('click', click_ok);
				document.querySelector('.no').addEventListener('click', click_no);
				//show_popup("Stat confs", "Cette fonctionnalité n'est pas encore disponible");
			});

			$('bouton_conf').addEventListener('click', async e => {
				const zone = $('zone').value === "AE" ? "est" : "ouest";
				const c = new conf($('day').value, zone);
				await c.init();
				await c.init_b2b();
				c.show_result_confs("result");
			});

            $('bouton_confs_existantes').addEventListener('click', async e => {
                const zone = $('zone').value === "AE" ? "est" : "ouest";
				const c = new conf(convertDate(new Date()), zone);
				await c.init_b2b();
				c.show_existing_confs("result");
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
<h1>CONFS</h1>
<div id="help_frame" class="off">
	<h2>Help</h2>
    <p><span>Le bouton "Confs NM"</span> :<br>Il permet d'afficher les confs NM existantes. Les données affichées sont à jour puisqu'une requête B2B a lieu en temps réel.</p>
	<p><span>Le bouton "Prep jour"</span> :<br>Il permet d'afficher les préps déclarées au NM</p>
	<button class="help_close_button pointer">Close</button>
</div>
<ul class="menu">
    <li id="bouton_confs_existantes" class="pointer"><span>Confs NM</span></li>
	<li class="pointer"><span id="bouton_conf">Prép jour :</span><input type="date" id="day" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2018-12-31"></li>
	<li class="pointer"><span id="bouton_stat_confs">Stats Confs</span></li>
	<span>
		<select id="zone" class="select">
			<option selected value="AE">Zone EST</option>
			<option value="AW">Zone WEST</option>
		</select>
	</span>
	<li><button class="help_button">Help</button></li>
</ul>
<div id="dates_stats_confs" class="content">
	<label for="start" class="dates one">D&eacute;but:</label>
	<input type="date" id="start" class="two" value="<?php $t = new DateTime(); $year = $t->format('Y'); echo $year."-01-01"; ?>" min="2018-12-31"><div></div>
	<label for="end" class="dates three">Fin:</label>
	<input type="date" id="end" class="four" value="<?php echo date("Y-m-d", strtotime("yesterday"));  ?>" min="2018-12-31"><div></div>
	<div></div><button class="ok five">Ok</button><button class="no six">No</button>
</div>
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