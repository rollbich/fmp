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
		document.addEventListener('DOMContentLoaded', async (event) => {
            
            await inst("result");

            let zone_elem = $('zone');

            async function change_option() {
                let cycle = await get_clean_cycle(zone_elem.value);
                let opt = "";
                cycle.forEach(vac => {
                    opt += `<option value=${vac}>${vac}</option>`;
                })
                $('vac_in').innerHTML = opt;
            }

            change_option();

            const checkbox_greve = $('checkbox_greve');
            if (checkbox_greve.checked) checkbox_greve.click();

            zone_elem.addEventListener('change', async (event) => {
                change_option();
            })
            
            checkbox_greve.addEventListener( "change", () => {
                if ( checkbox_greve.checked ) {
                    $('com_in').value = "Greve";
                    $('type_in').value = "-1PC";
                    $('vac_div').classList.remove('off');
                    $('sousvac_div').classList.remove('off');
                    $('debut_in').parentNode.classList.add('off');
                    $('fin_in').parentNode.classList.add('off');
                } else {
                    $('com_in').value = "";
                    $('vac_div').classList.add('off');
                    $('sousvac_div').classList.add('off');
                    $('debut_in').parentNode.classList.remove('off');
                    $('fin_in').parentNode.classList.remove('off');
                }
            });

            $('button_ajout').addEventListener('click', (event) => {
                event.preventDefault();
                let ajout;
                if (checkbox_greve.checked) {
                    const day = $('date_in').value;
                    const vac = $('vac_in').value;
                    const sousvac = $('sousvac_in').value;
                    console.log(day);
                    
                    if ( day === "") {
                        show_popup("Le champ date est vide", "V&eacute;rifiez les bordures rouges...");
                        return;
                    }
                    
                    ajout = { 
                        "date": day,
                        "vac": vac,
                        "sousvac": sousvac,
                        "zone": $('zone_in').value.toLowerCase(),
                        "type": $('type_in').value,
                        "comm": $('com_in').value
                    }
                    cuteAlert({
                        type: "question",
                        title: "Date et Vac",
                        message: "Je confirme la date et la vac",
                        confirmText: "Okay",
                        cancelText: "Annuler"
                        }).then((e)=>{
                        if ( e == ("confirm")){
                            ajoute_sql("result", ajout, true);
                        } 
                    })
                } else {
                    const day = $('date_in').value;
                    const debut =  $('debut_in').value;
                    const fin =  $('fin_in').value;
                    console.log(day);
                    console.log(debut);
                    console.log(fin);

                    if ( day === "" || debut === "" || fin === "") {
                        show_popup("Un des champ est vide", "V&eacute;rifiez les bordures rouges...");
                        return;
                    }
                    
                    ajout = { 
                        "date": day,
                        "debut": debut,
                        "fin": fin,
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
                            ajoute_sql("result", ajout, false);
                        } 
                    })
                }
                
            });

            document.querySelector('#popup-wrap a.popup-close').addEventListener('click', e => {
                e.preventDefault();
                document.querySelector('#popup-wrap div.popup-box').classList.remove('transform-in');
                document.querySelector('#popup-wrap div.popup-box').classList.add('transform-out');
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
        <div id="div_checkbox_greve">
            <label for="checkbox_greve">Greve:</label>
            <input id="checkbox_greve" name="checkbox_greve" type="checkbox">
        </div>
        <div class="formu"> 
        <form id="instr_form" action="">                   
            <div class="form-group">
                <label class="form-label" for="date_in">Date:</label>
                <input class="form-control" id="date_in" name="date_in" placeholder="Date" type="date" required>
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
            <div id="vac_div" class="form-group off">
                <label class="form-label" for="vac_in">Vac:</label>
                <select id="vac_in"></select>
            </div>
            <div id="sousvac_div" class="form-group off">
                <label class="form-label" for="sousvac_in">Sous-vac:</label>
                <select id="sousvac_in">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>
            </div>
            <button id='button_ajout' type='submit' class="btn">Ajouter</button>
        </form>
        </div>
    </div>
</div>

<div id="popup-wrap" class="off" >
  <div class="popup-box">
    <h2></h2>
    <h3></h3>
    <a class="close-btn popup-close" href="#">x</a>
  </div>
</div>

</body>
</html>