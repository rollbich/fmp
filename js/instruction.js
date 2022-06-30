async function inst(containerId) {
    let instr = await loadJson("../instruction.json");
    
    affiche(containerId, instr);

    const supp = document.querySelectorAll('.supprime');
    for (const elem of supp) {
        elem.addEventListener('click', e => {
            const id = elem.dataset.id;
            const day = elem.dataset.date;
            const zone = elem.dataset.zone.toLowerCase();
            const parent = elem.parentNode;
            cuteAlert({
                type: "question",
                title: "Suppression",
                message: `Confirmez la suppression du créneau du ${parent.firstChild.innerHTML} à ${parent.firstChild.nextSibling.innerHTML}<br>${parent.firstChild.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML} zone ${parent.firstChild.nextSibling.nextSibling.nextSibling.innerHTML}`,
                confirmText: "Okay",
                cancelText: "Annuler"
            }).then((e)=>{
                if ( e == ("confirm")){
                    let ind;
                    instr[zone][day].forEach( (el, index) => {
                        if (id == el["id"]) ind = index;
                    })
                    parent.parentNode.removeChild(parent);
                    instr[zone][day].splice(ind,1);
                    const data = {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(instr)
                    };
                    fetch("export_inst_to_json.php", data);
                } else {
                }
            })
        });
    }
}

function compare(a, b) {
    if (a["date"] < b["date"])
       return -1;
    if (a["date"] > b["date"])
       return 1;
    // a doit être égal à b
    return 0;
  }
  

function affiche(containerId, instr) {
    let res = `
    <table class="creneaux sortable">
        <caption>Créneaux</caption>
        <thead>
            <tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Date</th><th class="top_2px bottom_2px right_1px">Début</th><th class="top_2px bottom_2px right_1px">Fin</th><th class="top_2px right_1px bottom_2px">Secteur</th><th class="top_2px bottom_2px right_1px">Type</th><th class="top_2px bottom_2px right_1px">Comment</th><th class="top_2px bottom_2px right_2px">Supprime</th></tr>
        </thead>
        <tbody>`;
    const cles_est = Object.keys(instr["est"]);
    // On affiche que les dates > à day-2
    const d = new Date().addDays(-2);
    console.log("DD: "+d);
    for (const dat of cles_est) {
        instr["est"][dat].forEach(elem => {
            if (new Date(dat) > d) {
                const debut = elem["debut"];
                const fin = elem["fin"];
                const d = elem["date"];
                const zone = elem["zone"];
                const type = elem["type"];
                const comm = elem["comm"];
                const id = elem["id"];
                res += `<tr><td>${d}</td><td>${debut}</td><td>${fin}</td><td>${zone}</td><td>${type}</td><td>${comm}</td><td class="supprime" data-zone="${zone}" data-date="${d}" data-id="${id}">x</td></tr>`;
            }
        });
    }
    const cles_ouest = Object.keys(instr["ouest"]);
    for (const dat of cles_ouest) {
        instr["ouest"][dat].forEach(elem => {
            if (new Date(dat) > d) {
                const debut = elem["debut"];
                const fin = elem["fin"];
                const d = elem["date"];
                const zone = elem["zone"];
                const type = elem["type"];
                const comm = elem["comm"];
                const id = elem["id"];
                res += `<tr><td>${d}</td><td>${debut}</td><td>${fin}</td><td>${zone}</td><td>${type}</td><td>${comm}</td><td class="supprime" data-zone="${zone}" data-date="${d}" data-id="${id}">x</td></tr>`;
            }
        });
    }
    res += '</tbody></table>';
    $(containerId).innerHTML = res;
    $$('.titre').firstChild.click();
    $$('.titre').firstChild.click();
} 

async function ajoute(containerId, ajout) {
    let instr = await loadJson("../instruction.json");
    let id = 1;
    const zone = ajout["zone"].toLowerCase();
    const day = ajout["date"];
    if (typeof instr[zone][day] === 'undefined') {
        instr[zone][day] = [];
    } else {
        for(let i=1;i<99;i++) {
            const k = instr[zone][day].every( elem => elem["id"] != i );
            if (k == true) { id = i; break; }
        }
    }
    ajout["id"] = id;
    instr[zone][day].push(ajout);
    const data = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instr)
    };
    fetch("export_inst_to_json.php", data).then(function(response) {
        inst(containerId);
    })
    
}
