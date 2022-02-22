<?php

// Nettoie les données POST
function clean($data) {
    $data = trim($data);
    $data = htmlspecialchars($data);
    return $data;
}
  
$_SESSION['loginOK'] = false;
$_SESSION['login_bureau'] = false;
$_SESSION['login_encadrement'] = false;
  
if (isset($_POST) && (!empty($_POST['pwd']))) {
	$pwd = clean($_POST['pwd']);
	if (password_verify($pwd, $hash_general)) {
		$_SESSION['loginOK'] = true; 
	} 
	if (password_verify($pwd, $hash_bureau)) {
		$_SESSION['loginOK'] = true;
		$_SESSION['login_bureau'] = true; 
	}
	if (password_verify($pwd, $hash_encadrement)) {
		$_SESSION['loginOK'] = true;
		$_SESSION['login_encadrement'] = true; 
	}
}
?>