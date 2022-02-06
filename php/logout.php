<?php
$_SESSION = array(); //Destroy the variables
session_destroy(); //Destroy the session
setcookie('PHPSESSID', ", time()-3600,'/', ", 0, 0);//Destroy the cookie
header("location:../index.php");
exit();
?>