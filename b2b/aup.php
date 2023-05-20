<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("Airspace.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-InfoServices.php");
include_once("config.inc.php");
//include_once("hour_config".$config.".inc.php");

/*  -------------------------------------------
		Ecriture du fichier générique json
		$arr : tableau contenant les données
		$zone : est ou west
		$type : H20, Occ, Reg
		$wef : pour la date du jour
		ex : 20210621-H20-est.csv
	------------------------------------------- */
function write_json($arr, $zone, $type, $wef) {
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = dirname(__FILE__)."/json/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone."-test.json", 'w');
	fwrite($fp, json_encode($arr));
	fclose($fp);

}
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>AUP Test</title>
</head>
<body>
<h1>B2B Soap AUP Test</h1>
<span>
<form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="get" style="display: inline">
	<input type="date" name="day" id="day" value="<?php echo date("Y-m-d", strtotime("today"));  ?>" min="2023-01-01" max="2030-12-31">
    <select id="request" name="request" class="select">
		<option selected value="get AUP chain">Get AUP chain</option>
		<option value="get AUP">Get AUP</option>
		<option value="get EAUP chain">get EAUP chain</option>
		<option value="get EAUP rsa">get EAUP rsa</option>
	</select> 
	<input type="submit" value="Go" style="margin-left: 15px; font-size: 14px">
</form>
</span>

<?php 
/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */
if (isset($_GET) && !empty($_GET['day'])) {
	$day = $_GET['day'];
	$request = $_GET['request'];
	echo "<br><br>Requested date: ".$day."<br>";
	$soapClient = new B2B();
	$date = new DateTime($day);
	if ($request == "get AUP chain") {
		echo "Request: $request<br><br>";
		//$aup_chain = $soapClient->airspaceServices()->get_AUP_chain($date, array("LFFAZAMC","LIRRZAMC"));
		$aup_chain = $soapClient->airspaceServices()->get_AUP_chain($date, array("LFFAZAMC"));
		var_dump($aup_chain);
	}
	if ($request == "get AUP") {
		echo "Request: $request<br><br>";
		//$aup = $soapClient->airspaceServices()->get_AUP($date, array("LFFAZAMC","LIRRZAMC"));
		$aup = $soapClient->airspaceServices()->get_AUP($date, array("LFFAZAMC"));
		var_dump($aup);
	}
	if ($request == "get EAUP chain") {
		echo "Request: $request<br><br>";
		$eaup_chain = $soapClient->airspaceServices()->get_EAUP_chain($date);
		if ($eaup_chain->status == "OK") {
			if (is_array($eaup_chain->data->chain->eaups)) {
				$seqNumber = count($eaup_chain->data->chain->eaups);
			} else {
				$seqNumber = 1;
			}
		}
		echo "Sequence number: ".$seqNumber."<br><br>";
		echo(json_encode($eaup_chain));
	}
	if ($request == "get EAUP rsa") {
		echo "Request: $request<br><br>";
		$eaup_rsa = $soapClient->airspaceServices()->get_RSA($date, array('LF*','LI*'));
		echo json_encode($eaup_rsa);
	}
	
	//header("Content-type:application/json");
	//echo(json_encode($aup));
}

?>

</body>
</html>