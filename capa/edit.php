<?php
session_start();
require("../php/check_ok.inc.php");
if (!(isset($_SESSION['login_bureau'])) || $_SESSION['login_bureau'] === false) header("Location: index.php");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor</title>
    <script type="text/javascript" src="../js/tds-name.js"></script>
    <script type="text/javascript" src="../js/utils.js"></script>
    <script type="text/javascript" src="../js/tds_editor_class.js"></script>
    <link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
    <script>
	  document.addEventListener('DOMContentLoaded', async (event) => { 	
      new tds_editor();
      $('button_validate').addEventListener('click', e => {
            const zone = $('zone').value;
            if (zone === "est") {
            for (const z of document.querySelectorAll('.est')) {
                z.classList.remove('off');
            }
            for (const z of document.querySelectorAll('.ouest')) {
                z.classList.add('off');
            }
            }
            if (zone === "ouest") {
            for (const z of document.querySelectorAll('.ouest')) {
                z.classList.remove('off');
            }
            for (const z of document.querySelectorAll('.est')) {
                z.classList.add('off');
            }
            }
		});

    document.querySelector('.popup-close').addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('.popup-box').classList.remove('transform-in');
      document.querySelector('.popup-box').classList.add('transform-out');
	  });
	});
	</script>
</head>
<body class="editor">
  <header>TDS Editor</header>
  <div id="tds_glob">
<ul class="menu_tds_editor">
	<li>
	  <select id="zone" class="select">
		<option selected value="est">Zone EST</option>
		<option value="ouest">Zone WEST</option>
	  </select>
    <button id="button_validate" class="button_tour">Show TDS</button>
	</li>
</ul>
<ul class="menu_tds_editor">
	<li>
  <label for="cree_name">Nom vac:</label>
  <input type="text" id="cree_name" name="cree_name" required minlength="2" maxlength="4" size="6" />
  <button id="button_cree_supp" class="button_tour">Créer Vac Supp</button>
  </li>
</ul>
<ul class="menu_tds_editor">
  <li><input type="date" id="start" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2021-09-14" max="2030-12-31"></li>
  <li class="feuille"><button id="button_show_supp" class="button_tour">Voir Vac Supp</button></li>
</ul>
<ul class="menu_tds_editor">
  <li class="feuille"><button id="button_save">Save</button></li>
  <li class="feuille"><span><a href="./">back to TDS</a></span></li>
</ul>
</div>
  <div id="plage_est" class="est off"></div>
  <div id="plage_ouest" class="ouest off"></div>
  <div id="cree_supp" class="off"></div>
  <div id="result_supp_est" class="est off"></div>
  <div id="result_supp_ouest" class="ouest off"></div>
  <div id="result_hiver_est" class="est off"></div>
  <div id="result_mi-saison-basse_est" class="est off"></div>
  <div id="result_mi-saison-haute_est" class="est off"></div>
  <div id="result_ete_est" class="est off"></div>
  <div id="result_supp_ouest" class="ouest off"></div>
  <div id="result_hiver_ouest" class="ouest off"></div>
  <div id="result_mi-saison-basse_ouest" class="ouest off"></div>
  <div id="result_mi-saison-haute_ouest" class="ouest off"></div>
  <div id="result_ete_ouest" class="ouest off"></div>

<div id="popup-wrap" class="off" >
  <div class="popup-box">
    <h2></h2>
    <h3></h3>
    <a class="close-btn popup-close" href="#">x</a>
  </div>
</div>
</body>
</html>