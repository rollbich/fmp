async function get_instr_sql(zone) {
    
    const obj = {"fonction": "get_all", "zone": zone};

    const data = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj)
    };

   const result = await fetch("inst_sql.php", data);
   return result.json();
    
}

async function inst(containerId) {
    const zone = document.getElementById('zone').value;
    let instr = await get_instr_sql(zone);
    console.log(instr);
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
            }).then(async(e)=>{
                if ( e == ("confirm")){
                    /*
                    let ind;
                    instr[zone][day].forEach( (el, index) => {
                        if (id == el["id"]) ind = index;
                    })
                    */
                    parent.parentNode.removeChild(parent);
                    //instr[zone][day].splice(ind,1);
                    const content = {"fonction": "delete", "id": id};
                    const data = {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(content)
                    };
                    const result = await fetch("inst_sql.php", data);
                    inst(containerId);
                } else {
                }
            })
        });
    }
}

function affiche(containerId, instr) {
    let res = `
    <table class="creneaux sortable">
        <caption>Créneaux</caption>
        <thead>
            <tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Date</th><th class="top_2px bottom_2px right_1px">Début</th><th class="top_2px bottom_2px right_1px">Fin</th><th class="top_2px right_1px bottom_2px">Secteur</th><th class="top_2px bottom_2px right_1px">Type</th><th class="top_2px bottom_2px right_1px">Comment</th><th class="top_2px bottom_2px right_2px">Supprime</th></tr>
        </thead>
        <tbody>`;
    
    instr.forEach(elem => {
        const debut = elem["debut"];
        const fin = elem["fin"];
        const d = elem["day"];
        const zone = elem["zone"];
        const type = elem["type"];
        const comm = elem["comment"];
        const id = elem["id"];
        res += `<tr><td>${d}</td><td>${debut}</td><td>${fin}</td><td>${zone}</td><td>${type}</td><td>${comm}</td><td class="supprime" data-zone="${zone}" data-date="${d}" data-id="${id}">x</td></tr>`;
    });
    res += '</tbody></table>';
    $(containerId).innerHTML = res;
    $('zone').addEventListener('change', (e) => {
        inst(containerId);
    })
    $$('.titre').firstChild.click();
    $$('.titre').firstChild.click();
} 

async function ajoute_sql(containerId, ajout) {
    
    ajout["zone"] = ajout["zone"].toLowerCase();
    ajout["fonction"] = "add";
    
    const data = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ajout)
    };

    fetch("inst_sql.php", data).then(function(response) {
        inst(containerId);
    })
    
}
