<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Créneaux Instruction</title>
    <script type="text/javascript" src="../js/utils.js"></script>
    <script type="text/javascript" src="../js/cute-alert.js"></script>
    <script type="text/javascript" src="../js/instruction.js"></script>
    <script src="../js/sortable.min.js"></script>
    <link rel="stylesheet" type="text/css" href="../css/sortable.css" />
    <link rel="stylesheet" type="text/css" href="../css/style.css" />
    <link rel="stylesheet" type="text/css" href="../css/style-capa.css" />
    <link rel="stylesheet" type="text/css" href="../css/cute-style.css" />
    <script>
		document.addEventListener('DOMContentLoaded', (event) => {
            inst("result");

            $('button_ajout').addEventListener('click', (event) => {
                const ajout = { 
                    "date": $('date_in').value,
                    "debut": $('debut_in').value,
                    "fin": $('fin_in').value,
                    "zone": $('zone_in').value.toLowerCase(),
                    "type": $('type_in').value,
                    "comm": $('com_in').value
                }
                cuteAlert({
                    type: "question",
                    title: "Heures UTC",
                    message: "Je confirme que les heures ont été converties en UTC",
                    confirmText: "Okay",
                    cancelText: "Annuler"
                }).then((e)=>{
                    if ( e == ("confirm")){
                        ajoute_sql("result",ajout);
                    } else {
                    }
                })
            });

        });
    </script>
</head>
<body>

<header class="instr">
    <h1>Créneaux/Absences Supplémentaires : HEURES UTC</h1>
    <span class="back"><a href="./">back to TDS</a></span>
</header>
<div id="filtre"><span>Filtre:</span>
    <select id="zone" class="select">
    <option selected="" value="est">Zone EST</option>
    <option value="ouest">Zone WEST</option>
    </select>
</div>
<div class="glob">
    <div id="result"></div>
    <div id="cont">
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
                <option value="Inst1">1 Instru</option>
                <option value="Inst">2 Instrus</option>
                <option value="Asa">Asa</option>
                <option value="Simu1PC">Simu 1 PC</option>
                <option value="Simu2PC">Simu 2 PC</option>
                <option value="-1PC">-1 PC</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="com_in">Comm:</label>
            <input class="form-control" id="com_in" name="com_in" placeholder="Secteur / Commentaire" type="texte" size="22" maxlength="22">
        </div>
        <button id='button_ajout' type='button' class="btn">Ajouter</button>
    </form>
    </div>
    </div>
</div>

</body>
</html>