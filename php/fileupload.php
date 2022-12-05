<?php

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------
	$_FILES['userfile'], $_FILES['userfile']['name'], et $_FILES['userfile']['size'] seront initialisés.

	Par exemple, supposons que les fichiers /home/test/review.html et /home/test/xwp.out ont été téléchargés. 
	Dans ce cas, $_FILES['userfile']['name'][0] contient review.html et $_FILES['userfile']['name'][1] contient xwp.out. 
	Similairement, $_FILES['userfile']['size'][0] va contenir la taille du fichier review.html, etc.

	$_FILES['userfile']['name'][0], $_FILES['userfile']['tmp_name'][0], $_FILES['userfile']['size'][0] et $_FILES['userfile']['type'][0] sont aussi créées. 
   --------------------------------------------------------------------------------------------------------------------------------------------------------- */

$fichiers = $_FILES['fichier'];
$arr = [];

function check($fichier) {
	$ok = true;
	
	//check php (strpos retourne false si occurence non trouvée)
	$lower = strtolower($fichier ?? '');
	$pos = strpos($lower,'php');
	if(!($pos === false)) {
		$ok = false;
	}
	
	// check extension
	if ($ok === true) {
		$info = pathinfo($fichier);
		$extension = $info['extension'];
		$extensionsAutorisees = array("rea", "xml");
		if (!(in_array($extension, $extensionsAutorisees))) {
			$ok = false;
		}	
	}
		
	//check COUR 
	if ($ok === true) {
		$pos = strpos($fichier,'COUR') || strpos($fichier,'000000');
		if(($pos === false)) {
			$ok = false;
		}
	}
	
	return $ok;	
}

function check_type(string $nom_fichier) {
	$type = "4F";
	if (strpos($nom_fichier,'000000') === false) $type = "courage";
	return $type;
}

if(!empty($fichiers)) {
	header('Content-type: application/json');
	$fic_desc = reArrayFiles($fichiers);
   
    foreach($fic_desc as $val) {
        $nomOrigine = $val['name'];
		$error = check($nomOrigine);
		
		if ($error === false) {
			$val["error"] = "Upload Interdit";
			array_push($arr, $val);
		} else { 
			$nomDestination = $nomOrigine;
			$type = check_type($nomOrigine);
			if ($type === "courage") {
				$n = explode("COUR-", $nomOrigine);
				$year = substr($n[1],0,4);
				$month = substr($n[1],4,2);
				$day = substr($n[1],6,2);
			} else {
				$year = substr($nomOrigine,0,4);
				$month = substr($nomOrigine,4,2);
				$day = substr($nomOrigine,6,2);
			}
			$uploadFolder = dirname(__FILE__)."/../Realise/".$year."/".$month."/";
			
			if (!file_exists($uploadFolder)) {
				mkdir($uploadFolder, 0777, true);
			}
			
			if (move_uploaded_file($val["tmp_name"], $uploadFolder.$nomDestination)) {
				array_push($arr, $val);
			} else {
				$val["error"] = json_last_error_msg();
				array_push($arr, $val);
			}
		}
    }
}

$json = json_encode($arr);
if ($json === false) {
	// Avoid echo of empty string (which is invalid JSON), and
	// JSONify the error message instead:
	$json = json_encode(["jsonError" => json_last_error_msg()]);
	// Set HTTP response status code to: 500 - Internal Server Error
	http_response_code(500);
}
echo $json;

/*
Réarrange le tableau $_FILES
Array(
    [name] => Array([0] => foo.txt, [1] => bar.txt)
    [type] => Array([0] => text/plain, [1] => text/plain)
    [tmp_name] => Array([0] => /tmp/phpYzdqkD, [1] => /tmp/phpeEwEWG)
    [error] => Array([0] => 0, [1] => 0)
    [size] => Array([0] => 123, [1] => 456)
     )
	 
en 

Array(
    [0] => Array([name] => foo.txt, [type] => text/plain, [tmp_name] => /tmp/phpYzdqkD, [error] => 0, [size] => 123 )
    [1] => Array([name] => bar.txt, [type] => text/plain, [tmp_name] => /tmp/phpeEwEWG, [error] => 0, [size] => 456 )
)
*/

function reArrayFiles($file) {
    $file_ary = array();
    $file_count = count($file['name']);
    $file_key = array_keys($file);
   
    for($i=0;$i<$file_count;$i++)
    {
        foreach($file_key as $val)
        {
            $file_ary[$i][$val] = $file[$val][$i];
        }
    }
    return $file_ary;
}

?>
