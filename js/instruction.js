async function inst(containerId) {
    let instr = await loadJson("../instruction.json");
    
    affiche(containerId, instr);

    const supp = document.querySelectorAll('.supprime');
    for (const elem of supp) {
        elem.addEventListener('click', e => {
            const id = elem.dataset.id;
            let ind;
            instr.forEach( (el, index) => {
                if (id == el["id"]) ind = index;
            })
            const parent = elem.parentNode;
            parent.parentNode.removeChild(parent);
            instr.splice(ind,1);
            const data = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(instr)
            };
            fetch("export_inst_to_json.php", data);
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
    <table class="creneaux">
        <caption>Créneaux</caption>
        <thead>
            <tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Date</th><th class="top_2px bottom_2px right_1px">Début</th><th class="top_2px bottom_2px right_1px">Fin</th><th class="top_2px right_1px bottom_2px">Secteur</th><th class="top_2px bottom_2px right_1px">Type</th><th class="top_2px bottom_2px right_2px">Supprime</th></tr>
        </thead>
        <tbody>`;
    instr.sort(compare).forEach( (elem, index) => {
        const debut = elem["debut"];
        const fin = elem["fin"];
        const d = elem["date"];
        const zone = elem["zone"];
        const type = elem["type"];
        const id = elem["id"];
        res += `<tr><td>${d}</td><td>${debut}</td><td>${fin}</td><td>${zone}</td><td>${type}</td><td class="supprime" data-id="${id}">x</td></tr>`;
    });
    res += '</tbody></table>';
    $(containerId).innerHTML = res;
} 

async function ajoute(containerId, ajout) {
    let instr = await loadJson("../instruction.json");
    let id;
    for(let i=1;i<100;i++) {
        const k = instr.every( elem => elem["id"] != i );
        if (k == true) { id = i; break; }
    }
    ajout["id"] = id;
    instr.push(ajout);
    //affiche(containerId, instr);
    const data = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instr)
    };
    fetch("export_inst_to_json.php", data).then(function(response) {
        inst(containerId);
    })
    
}
