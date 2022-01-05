<?php
  session_start();
?>
<!DOCTYPE html>
<html>
<head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="robots" content="noindex">
        <title>Regulations</title>
		<link rel="icon" href="favicon.ico" />
		<script type="text/javascript" src="../js/utils.js"></script>
        <script type="text/javascript" src="nmir_reg_to_json.js"></script>
		<script>
			document.addEventListener('DOMContentLoaded', (event) => {

				document.querySelector('.save_button').addEventListener('click', e => {
					new nmir_reg();
				});
				
			});		
		</script>
</head>
<body id="drag-container">

<header>
<h1>Save Nmir to Json</h1>
</header>

<button class="save_button">Save Nmir to Json</button>

</body>
</html>