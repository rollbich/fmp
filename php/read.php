<?php
/*  -------------------------------------------------------------------------------------
	  Renvoie une liste classée des fichiers presents dans le dossier 
		return json
		{
			"files" : [ nomfichier1, nomfichier2, ...],
			"dossier1": { 
				"files": [fichier1 du sous-dossier1, fichier2 du sous-dossier2, ...]},
				"sousdossier1": { "files": [...], "sous sous-dossier": {} ...},
				"sousdossier2": { "files": [...], "sous sous-dossier": {} ...},
			"2022": {
				"files": [],
				"01" : {
					"files": [ "COUR-20220101.AE.sch.rea", "COUR-20220101.AW.sch.rea", … ]
				},
				"02" : {
					"files": [...]
				},
				....
				"12" : {
					"files": [...]
				}
			}
		}
	------------------------------------------------------------------------------------- */

class Lister {

	public $arr;

	public function __construct() {
		$this->arr = new stdClass();
		$this->arr->files = [];
	}

    public function listdir($dir) {
		
        $dh = opendir($dir);
        
        $s = DIRECTORY_SEPARATOR;

        while (($item = readdir($dh)) !== false) {
            
            $path = "{$dir}{$s}{$item}";
            if (is_dir($path) && (($item == "." || $item == "..") || is_link($path))) {
                continue;
            }

            if (is_dir($path)) {
                if ($this->handleDir($path)) {
                    $this->listdir($path);
                }
            }

            if (! $this->handleFile($path)) {
                // no further iteration of this directory
                return;
            }
        }
        closedir($dh);
    }

    protected function handleDir($dir) {
		// attention en local il y a des antislashs => $p = explode("\\", $file);
        $p = explode("/", $dir);
        // le premier est vide (avant le le 1er / de /opt/bitnami...), on l'enlève
        array_shift($p);
        array_shift($p);
        array_shift($p);
       
		$count = count($p);
		$temp = '$this->arr';
		
		for($i=2;$i<$count;$i++) {
			$temp .= '->{$p['.$i.']}';
		}

		// ex : $this->arr->2019 = new stdClass();
		eval("$temp = new stdClass();");
		// On ajoute la key "files" à cet objet
		$temp .= '->files';
		// on déclare cet clé "files" comme un array
		eval("$temp = [];");

        return true;
    }

    protected function handleFile($file) {
		if (!is_dir($file)) {
            /* attention en local il y a des antislashs => $p = explode("\\", $file);
                E:/xampp/htdocs/fmp/Realise\2023\12\20231208_000000_LFMM-W.xml
                $p : array(4) { 
                    [0]=> string(27) "E:/xampp/htdocs/fmp/Realise" 
                    [1]=> string(4) "2023" 
                    [2]=> string(2) "12" 
                    [3]=> string(26) "20231208_000000_LFMM-W.xml" 
			    }
            */
			// $file : /opt/bitnami/fmp/Realise/2022
            $p = explode("/", $file);
            // le premier est vide (avant le le 1er / de /opt/bitnami...), on l'enlève
            array_shift($p);
			// on enlève opt, bitnami et fmp pour avoir en premier Realise
            array_shift($p);
            array_shift($p);
            array_shift($p);
			$count = count($p);
			$temp = '$this->arr';

            // $p[0] = Realise
            // $p[1] = année
            // Si c'est l'année, on a que 2 
			if ($count === 2) {
				array_push($this->arr->files, $file);
			}

			if ($count > 2) {
				for($i=1;$i<$count-1;$i++) {
					$temp .= '->{$p['.$i.']}';
				}
				$temp .= '->files';
				$c = $count-1;
				$q = $p[$c];
				eval("array_push($temp, '$q');");
			} 
		}
        return true;
    }
}

$lister = new Lister();
$lister->listdir($_SERVER['DOCUMENT_ROOT']."/Realise");
$json = json_encode($lister->arr);
echo $json;
	
?>