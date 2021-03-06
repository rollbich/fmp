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
        <p class="intro">Tous les navigateurs poss??dent un cache pour stocker des fichiers jug??s 'statiques' localement afin d'??viter leurs t??l??chargements : cela permet l'acc??l??ration de l'affichage de la page.</p>
        <p class="intro">Sur le site lfmm-fmp.fr, le cache est d??sactiv??. Par cons??quent, lorsque des mises ?? jour sur le site sont effectu??es, elles sont syst??matiquement t??l??charg??es.<br>Ainsi l'affichage du site est toujours ?? jour au moment o?? la page s'affiche. (attention : si des donn??es changent par la suite, il faut rafraichir la page normalement pour mettre ?? jour)</p>
        <p class="intro">Cela peut ne pas ??tre le cas pour d'autres sites o?? peut ??tre affich??e une page stock??e localement alors que sa version internet a chang??.</p>
        <p class="intro">Pour forcer Firefox ?? utiliser les fichiers ?? jour, il faut vider le cache avant de recharger la page ou bien le d??sactiver.</p>
        <p class="intro">Ce 1er tuto permet d'effacer les fichiers stock??s localement. Par cons??quent le navigateur va aller les r??cup??rer sur internet.</p>
        <p class="intro">Vous pouvez cliquer sur le lien 'Inhiber le cache' pour aller vers le 2?? tuto si vous souhaitez garder le cache des autres pages et seulement d??sactiver le cache d'une page.</p>
        <p>Vous avez un bouton ascenseur en bas ?? droite de la page qui permet de remonter vers le haut de cette page.<br><br></p>
        </div>
</article>
<article class="center">
    <div>
    <h2 id="titre2" class="center">Vider le cache du navigateur Firefox</h2>
    <p class="intro">Tous les fichiers du cache seront supprim??s</p>
    <hr>
    <p>En haut ?? droite, cliquer sur le menu hamburger puis sur Param??tres</p>
    <img src='../images/cache/parametres-navigateur.png'/>
    <p>Cliquer sur 'Vie priv??e', scrollez vers le bas et cliquez sur 'Effacer les donn??es'</p>
    <img src='../images/cache/vie-privee.png'/>
    <p>Cocher uniquement 'Contenu web en cache' et cliquez sur 'Effacer'</p>
    <img src='../images/cache/vider-cache.png'/>
    </div>
</article>
<article class="center">
    <div>
    <h2 id="titre1" class="center">Inhiber le cache du navigateur Firefox</h2>
    <p>C'est ce que d??crit la manipulation ci-dessous. Celle-ci permet de ne pas toucher au cache des autres pages.</p>
    <hr>
    <p>Appuyez sur <span>Ctrl + Shift + I </span>&nbsp;afin d'afficher la fen??tre de d??veloppement.<br>En haut ?? droite de cette fen??tre, cliquez sur les 3 points puis sur param??tres</p>
    <img src='../images/cache/parametres.png'/>
    <p>Cochez 'd??sactiver le cache http' et laissez la fen??tre de d??veloppement ouverte.</p>
    <img src='../images/cache/cache_http.png'/>
    <p>Rafra??chissez la page</p>
    <img src='../images/cache/rafraichir.png'/>
    <p>Fermez la boite ?? outils de d??veloppement en cliquant sur la croix.</p>
    <img src='../images/cache/fermer_outils.png'/>
    </div>
</article>
<?php include("../php/upload.inc.php"); ?>
<div id="scroll_to_top">
    <a href="#top"><img src="../images/bouton-scroll-top.jpg" alt="Retourner en haut"></a>
</div>
</body>
</html>