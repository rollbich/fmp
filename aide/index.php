<?php
session_start();
require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Aide et tutos</title>
    <link rel="stylesheet" type="text/css" href="../css/font.css" />
	<link rel="stylesheet" type="text/css" href="../css/list-component.css" />
	<link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css" />
	<link rel="stylesheet" type="text/css" href="../css/upload.css" />
	<link rel="stylesheet" href="../css/bulma.css">
	<link rel="stylesheet" href="../css/style.css"> 
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.ico">
    <script type="text/javascript" src="../js/utils.js"></script>
	<script type="text/javascript" src="../js/list-component.js"></script>
	<script type="text/javascript" src="../js/upload.js"></script>
    
    <script>
      	document.addEventListener('DOMContentLoaded', async event => {

			<?php include("../php/nav.js.inc.php"); ?>
			<?php include("../php/upload.js.php"); ?>
			
      	});
    </script>
</head>
<body class="aide">
<?php include("../php/nav.inc.php"); ?>
<h1>LFMM-FMP - Aide et Tutos</h1>
<!--blog--><!--blog_options_json--><!--{"source":""}--><!--/blog_options_json-->
<div class="card_container"><!--blog_post-->
    <div class="card">
        <div class="im"><a href="cache.php"><img src="photo-cache.jpg" alt="logo firefox"></a></div>
        <div class="content">
            <h2><a href="cache.php">Vider le cache</a></h2>
            <p>A faire en cas de doute sur une page web qui ne semble pas à jour lors de l'affichage.<br>
            Sur le site lfmm-fmp.fr, le cache est désactivé et donc les pages sont à jour à l'instant où elles sont affichées.</p>
            <footer>Vendredi 17 juin 2022</footer>
        </div>
    </div>
    <div class="card">
        <div class="im"><a href="regulsName.php"><img src="nommage.jpg" alt="logo nommage"></a></div>
        <div class="content">
            <h2><a href="regulsName.php">Nom des réguls</a></h2>
            <p>Un petit rappel concernant les règles de nommage des réguls NM. Ceci dans le cadre de l'utilisation des fonctionnalités NMP FLow (simulation, création de réguls).</p>
            <footer>Mercredi 05 octobre 2022</footer>
        </div>
    </div>
</div>
      
<?php include("../php/upload.inc.php"); ?>
</body>
</html>