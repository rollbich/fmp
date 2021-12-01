<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor</title>
    <script type="text/javascript" src="../js/tds-name.js"></script>
    <script type="text/javascript" src="../js/utils.js"></script>
    <script type="text/javascript" src="../js/tds_editor.js"></script>
    <link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
    <script>
		document.addEventListener('DOMContentLoaded', (event) => { 	
      affiche_tds();
      $('button_validate').addEventListener('click', e => {
        const zone = $('zone').value;
        if (zone === "est") {
          for (z of document.querySelectorAll('.est')) {
            z.classList.remove('off');
          }
          for (z of document.querySelectorAll('.ouest')) {
            z.classList.add('off');
          }
        }
        if (zone === "ouest") {
          for (z of document.querySelectorAll('.ouest')) {
            z.classList.remove('off');
          }
          for (z of document.querySelectorAll('.est')) {
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
  <div id="selection">
  <select id="zone" class="select">
      <option selected value="est">Zone EST</option>
      <option value="ouest">Zone WEST</option>
  </select>
  <button id="button_validate">Validate</button>
  </div>
  <button id="button_save">Save</button>
  <span><a href="./">back to TDS</a></span>
  <div id="plage_est" class="est off"></div>
  <div id="plage_ouest" class="ouest off"></div>
  <div id="result_h_est" class="est off"></div>
  <div id="result_msb_est" class="est off"></div>
  <div id="result_msh_est" class="est off"></div>
  <div id="result_e_est" class="est off"></div>
  <div id="result_h_ouest" class="ouest off"></div>
  <div id="result_msb_ouest" class="ouest off"></div>
  <div id="result_msh_ouest" class="ouest off"></div>
  <div id="result_e_ouest" class="ouest off"></div>

<div id="popup-wrap" class="off" >
  <div class="popup-box">
    <h2></h2>
    <h3></h3>
    <a class="close-btn popup-close" href="#">x</a>
  </div>
</div>
</body>
</html>