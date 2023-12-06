<?php
// remplit la base de données avec le contenu du fichier json

require_once("bdd.class.php");

$instr = json_decode(file_get_contents("../instruction.json"));

/*
$elem = $instr->est->{"2022-03-21"}[0];
$debut = $elem->debut;
$fin = $elem->fin;
$d = $elem->date;
$zone = $elem->zone;
$type = $elem->type;
$comm = $elem->comm;
$table = "creneaux_supp";
$req = "INSERT INTO $table VALUES (NULL, '$d', '$debut', '$fin', '$zone', '$type', '$comm')"; 
$stmt = Mysql::getInstance()->prepare($req);
$stmt->execute();
*/

foreach (get_object_vars($instr->est) as $arr) {
    foreach($arr as $index=>$elem) {
        $debut = $elem->debut;
        $fin = $elem->fin;
        $d = $elem->date;
        $zone = strtolower($elem->zone);
        $type = $elem->type;
        $comm = $elem->comm;
        $table = "creneaux_supp";
        $req = "INSERT INTO $table VALUES (NULL, '$d', '$debut', '$fin', '$zone', '$type', '$comm')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    };
}

foreach (get_object_vars($instr->ouest) as $arr) {
    foreach($arr as $index=>$elem) {
        $debut = $elem->debut;
        $fin = $elem->fin;
        $d = $elem->date;
        $zone = strtolower($elem->zone);
        $type = $elem->type;
        $comm = $elem->comm;
        $table = "creneaux_supp";
        $req = "INSERT INTO $table VALUES (NULL, '$d', '$debut', '$fin', '$zone', '$type', '$comm')"; 
        $stmt = Mysql::getInstance()->prepare($req);
        $stmt->execute();
    };
}
 

?>