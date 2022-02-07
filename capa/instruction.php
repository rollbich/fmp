<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Créneaux Instruction</title>
    <script type="text/javascript" src="../js/utils.js"></script>
    <script type="text/javascript" src="../js/instruction.js"></script>
    <link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
    <script>
		document.addEventListener('DOMContentLoaded', (event) => {
            inst("result");

            $('button_ajout').addEventListener('click', (event) => {
                const ajout = { 
                    "date": $('date_in').value,
                    "debut": $('debut_in').value,
                    "fin": $('fin_in').value,
                    "zone": $('zone_in').value,
                    "type": $('type_in').value
                }
                ajoute("result", ajout);
            });
        });
    </script>
</head>
<body>

<header><h1>Créneaux/Absences Supplémentaires</h1></header>
<span class="back"><a href="./">back to TDS</a></span>
<div class="glob">
    <div id="result"></div>
    <div class="formu">     
    <form action="" method="post">                   
        <div class="form-group">
            <label class="form-label" for="date_in">Date:</label>
            <input class="form-control" id="date_in" name="date_in" placeholder="Date" type="date">
        </div>      
        <div class="form-group">
            <label class="form-label" for="debut_in">Début:</label>
            <input class="form-control" id="debut_in" name="debut_in" placeholder="Debut" type="time">
        </div>
        <div class="form-group">
            <label class="form-label" for="fin_in">Fin:</label>
            <input class="form-control" id="fin_in" name="fin_in" placeholder="Fin" type="time">
        </div>
        <div class="form-group">
            <label class="form-label" for="zone_in">Zone:</label>
            <select id="zone_in" class="form-control">
                <option selected value="Est">Zone EST</option>
                <option value="Ouest">Zone WEST</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="type_in">Type:</label>
            <select id="type_in" class="form-control">
                <option selected value="Eleve">Eleves</option>
                <option value="Inst">Instrus</option>
                <option value="Asa">Asa</option>
                <option value="Simu1PC">Simu 1 PC</option>
                <option value="Simu2PC">Simu 2 PC</option>
            </select>
        </div>
        <button id='button_ajout' type='button' class="btn">Ajouter</button>
    </form>
    </div>
</div>
</body>
</html>