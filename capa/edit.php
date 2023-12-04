<?php
session_start();
require("../php/check_ok.inc.php");
if (!(isset($_SESSION['login_bureau'])) || $_SESSION['login_bureau'] === false) header("Location: index.php");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Editor</title>
    <script type="text/javascript" src="../js/tds-name.js"></script>
    <script type="text/javascript" src="../js/utils.js"></script>
    <script type="text/javascript" src="../js/cute-alert.js"></script>
    <script type="text/javascript" src="../js/tds_editor_class.js"></script>
    <script src="../js/sortable.min.js"></script>
    <link rel="stylesheet" type="text/css" href="../css/style.css" />
    <link rel="stylesheet" type="text/css" href="../css/sortable.css" />
    <link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
    <link rel="stylesheet" type="text/css" href="../css/custom-checkbox.css" />
    <link rel="stylesheet" type="text/css" href="../css/cute-style.css" />

    <script>
	  document.addEventListener('DOMContentLoaded', async (event) => { 	
      new tds_editor("main");
		
      document.querySelector('#popup-wrap a.popup-close').addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('#popup-wrap div.popup-box').classList.remove('transform-in');
        document.querySelector('#popup-wrap div.popup-box').classList.add('transform-out');
      });
	  });
	</script>
</head>
<body class="editor">
<div id="main"></div>
<div id="modal_popup" class="modal fade" tabindex="-1" role="dialog"></div>
<div id="modal_tds" class="off" role="dialog"></div>
<div id="modal_tds_supp" class="off" role="dialog"></div>
<div id="modal_repartition" class="off" role="dialog"></div>
<div id="popup-wrap" class="off" >
  <div class="popup-box">
    <h2></h2>
    <h3></h3>
    <a class="close-btn popup-close" href="#">x</a>
  </div>
</div>
<div id="date_frame"></div>
</body>
</html>