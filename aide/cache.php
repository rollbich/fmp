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

            $('cache1').addEventListener('click', e => {
                e.preventDefault();
                const t = $('titre1').getBoundingClientRect().top - 90;
                console.log("top");
                console.log(t);
                window.scrollTo({
                top: t,
                behavior: 'smooth'
                });
            })

            $('cache2').addEventListener('click', e => {
                e.preventDefault();
                const t = $('titre2').getBoundingClientRect().top - 90;
                console.log("top");
                console.log(t);
                window.scrollTo({
                top: t,
                behavior: 'smooth'
                });
            })
			
      	});
    </script>
</head>
<body class="aide">
<?php include("../php/nav.inc.php"); ?>
<h1>LFMM-FMP - Aide et Tutos</h1>
<h2 class="center"><a href='' id='cache2'>Supprimer le cache</a> - <a href='' id='cache1'>Inhiber le cache</a></h2>
<article class="center">
    <div>
        <h2 id="intro" class="center">Introduction</h2>
        <p class="intro">Tous les navigateurs possèdent un cache pour stocker des fichiers jugés 'statiques' localement afin d'éviter leurs téléchargements : cela permet l'accélération de l'affichage de la page.</p>
        <p class="intro">Sur le site lfmm-fmp.fr, le cache est désactivé. Par conséquent, lorsque des mises à jour sur le site sont effectuées, elles sont systématiquement téléchargées.<br>Ainsi l'affichage du site est toujours à jour au moment où la page s'affiche. (attention : si des données changent par la suite, il faut rafraichir la page normalement pour mettre à jour)</p>
        <p class="intro">Cela peut ne pas être le cas pour d'autres sites où peut être affichée une page stockée localement alors que sa version internet a changé.</p>
        <p class="intro">Pour forcer Firefox à utiliser les fichiers à jour, il faut vider le cache avant de recharger la page ou bien le désactiver.</p>
        <p class="intro">Ce 1er tuto permet d'effacer les fichiers stockés localement. Par conséquent le navigateur va aller les récupérer sur internet.</p>
        <p class="intro">Vous pouvez cliquer sur le lien 'Inhiber le cache' pour aller vers le 2è tuto si vous souhaitez garder le cache des autres pages et seulement désactiver le cache d'une page.</p>
        <p>Vous avez un bouton ascenseur en bas à droite de la page qui permet de remonter vers le haut de cette page.<br><br></p>
        </div>
</article>
<article class="center">
    <div>
    <h2 id="titre2" class="center">Vider le cache du navigateur Firefox</h2>
    <p class="intro">Tous les fichiers du cache seront supprimés</p>
    <hr>
    <p>En haut à droite, cliquer sur le menu hamburger puis sur Paramètres</p>
    <img src='../images/cache/parametres-navigateur.png'/>
    <p>Cliquer sur 'Vie privée', scrollez vers le bas et cliquez sur 'Effacer les données'</p>
    <img src='../images/cache/vie-privee.png'/>
    <p>Cocher uniquement 'Contenu web en cache' et cliquez sur 'Effacer'</p>
    <img src='../images/cache/vider-cache.png'/>
    </div>
</article>
<article class="center">
    <div>
    <h2 id="titre1" class="center">Inhiber le cache du navigateur Firefox</h2>
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
<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut"></a>
</div>
</body>
</html>