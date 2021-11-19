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
      let zone = $('zone').value;
			affiche_tds(zone);
		});
	</script>
</head>
<body>
<div id="selection">
<select id="zone" class="select">
		<option selected value="est">Zone EST</option>
		<option value="ouest">Zone WEST</option>
</select>
<button id="button_save">Save</button>
</div>
<div id="result"></div>

</body>
</html>