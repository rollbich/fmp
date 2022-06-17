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
<article class="center">
    <div>
    <h2 id="cache" class="center">Inhiber le cache du navigateur Firefox</h2>
    <p class="intro">Tous les navigateurs possèdent un cache pour stocker des fichiers jugés 'statiques' localement afin d'éviter leurs téléchargements : cela permet l'accélération de l'affichage de la page.</p>
    <p class="intro">Sur le site lfmm-fmp.fr, le cache est désactivé. Par conséquent, l'affichage du site est toujours à jour.</p>
    <p class="intro">Cela peut ne pas être le cas pour d'autres sites.</p>
    <p class="intro">Pour forcer Firefox à utiliser les fichiers à jour, il faut désactiver le cache le temps de recharger la page.</p>
    <p>C'est ce que décrit la manipulation ci-dessous. Celle-ci permet de ne pas toucher au cache des autres pages.</p>
    <hr>
    <p>Appuyez sur <span>Ctrl + Shift + I </span>&nbsp;afin d'afficher la fenêtre de développement.<br>En haut à droite de cette fenêtre, cliquez sur les 3 points puis sur paramètres</p>
    <img src='../images/cache/parametres.png'/>
    <p>Cochez 'désactiver le cache http' et laissez la fenêtre de développement ouverte.</p>
    <img src='../images/cache/cache_http.png'/>
    <p>Rafraîchissez la page</p>
    <img src='../images/cache/rafraichir.png'/>
    <p>Fermez la boite à outils de développement en cliquant sur la croix.</p>
    <img src='../images/cache/fermer_outils.png'/>
    </div>
</article>
<?php include("../php/upload.inc.php"); ?>
</body>
</html>