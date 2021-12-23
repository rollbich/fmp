<?php
  session_start();
  require("php/config.inc.php");
  require("php/check_login.inc.php");
  if ($_SESSION['loginOK'] === true) {
    header("Location: accueil.php");
  }
?>
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="robots" content="noindex">
  <title>FMP</title>	
  <link rel="stylesheet" href="css/accueil.css"> 
  <link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
  <script>
	document.addEventListener('DOMContentLoaded', (event) => {
		document.querySelector('.form-btn').addEventListener('click', e => {
			document.getElementById('form').submit();
		});
	});
  </script>
</head>

<body>
<div class='accueil'>
 <div class='accueil2'>
  <header>
   <p>
    <span class='lfmm'>LFMM</span>
    <span class='fmp'>FMP</span>
   </p>
  </header>
  <div>
    <?php
    if (isset($_SESSION['loginOK']) && $_SESSION['loginOK'] === false) {
      $s = htmlspecialchars($_SERVER["PHP_SELF"]);
      echo "<p class='body'>BIENVENUE !<br>";
      echo "<form id='form' action='$s' method='post'><input name='pwd' type='password' placeholder='Entrez le password'></form>";
      echo "</p>";
      echo "<p class='body'>";
      echo "<button class='form-btn' type='submit'>Validez</button>";
      echo "</p>"; 
    } 
    ?>
  </div>
 </div>
</div>

</body>
</html>