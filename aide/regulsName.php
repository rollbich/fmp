<?php
session_start();
require("../php/check_ok.inc.php");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nommage des réguls</title>
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
<h2 class="center titre">Règles de nommage d'une régulation</h2>
<article class="center">
    <div>
    <h2 class="center">Généralités</h2>
    <p class="intro">Les noms de régulations sont limités à 8 caractères max</p>
    <p class="intro">Le nom de la régulation commence par le "Regulation Id code"</p>
    </div>
</article>
<article class="center">
    <div>
        <h2 id="titre1" class="center">CRNA LFMM</h2>
        <p class="intro">Pour LFMM ACC, le "Regulation Id code" est M.</p>
        <p class="intro">Ensuite il faut mettre le nom du TV.</p>
        <p class="intro">Puis la date du jour. Ex : 30 pour le 30/09/2022</p>
        <p>Pour finir, on peut indiquer la période de la journée, c'est optionnel</p>
        <ul>
            <li>M = Morning</li>
            <li>A = Afternoon</li>
            <li>N = Night</li>
            <li>E = Early morning</li>
            <li>X = Other</li>
        </ul>
        <p class="intro">ex : MGY1215A => GY12 à la date du 15 l'après-midi</p>
    </div>
</article>
<article class="center">
    <div>
    <h2 id="titre2" class="center">Approches</h2>
    <p>La règle générale est de commencer par :</p>
    <ul>
        <li>le code OACI de l'AD (méthode recommandée par NM)</li>
        <li>ou les 2 dernières lettres du code OACI de l'AD lorsque cela est possible <span>*&nbsp;</span></li>
    </ul>
    <p>Ensuite, en fonction du nombre de lettre utilisé pour le début on peut utiliser quelques caractères pour compléter le nom</p>
    <ul>
        <li>LFTHA16M : ici 1 seul caractère en plus (le A)</li>
        <li>LFTHAR16 : ici 2 caractères (AR) pour compléter car on a rogné la période de la journée</li>
        <li>THARR16A : ici 3 caractères (ARR) pour compléter car on a utilisé que 2 lettres pour coder le début</li>
    </ul>
    <p class="intro">Puis on indique la date et la période de la journée (optionnelle)</p>
    <p><span>* </span>: Cette 2è possibilité est faisable lorsque les 2 lettres ne correspondent pas à un "Regulation Id code"</p>
    <p>Codes ne fonctionnant pas chez nous</p>
    <ul>
        <li>Tous les AD commençant par LFM (car M est déjà pris pour le CRNA) <br>&nbsp;ex : MDARR16 est incorrect => LFMDA16 est correct</li>
        <li>LL car affecté à Tel Aviv (LLARR16M n'est donc pas correct => LFLLA16M est correct)</li>
        <li>LY car affecté à la Serbie</li>
        <li>LU car affecté à a Moldavie</li>
        <li>LP car affecté au Portugal</li>
        <li>LB car affecté à la Bulgarie</li>
        <li>LC car affecté à Chypre</li>
    </ul>
    <p class="intro></p>
    </div>
</article>


<?php include("../php/upload.inc.php"); ?>
<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut"></a>
</div>
</body>
</html>