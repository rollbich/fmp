class aup {

    /*  -----------------------------------------------
        @param {string} day - "yyyy-mm-dd"
    ----------------------------------------------- */

    constructor(day) {
        this.day = day;
    }

    async init_draft() {
        show_popup("Patientez", `Chargement en cours...`);
        this.result = await this.get_draft_aup();
        document.querySelector('#popup-wrap a.popup-close').click();
        this.show_aup("result", "Draft");
    }

    async init_aup() {
        this.result = await this.get_aup();
        this.show_aup("result", "AUP");
    }

    async init_uup() {
        show_popup("Patientez", `Chargement en cours...`);
        this.result = await this.get_direct_aup();
        document.querySelector('#popup-wrap a.popup-close').click();
        this.show_aup("result", "Last UUP");
    }

    // get aup (LITSA72 + LIR64 + LFMM RSA)
    // récupère l'AUP à partir de l'heure de la demande
    // les données précédant l'heure la requête ne sont fournies
    async get_direct_aup() { 
        try {
            let response = await fetch("../b2b/get_aup.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "day": this.day, "type":"actual"})
            })
            const json = await response.json(); 
            console.log(json);
            return json;
        }
        
        catch (err) {
            show_popup("Erreur", `L'AUP de la date ${reverse_date(this.day)} n'existe pas`);
            console.log('Get AUP json error: '+err.message);
        }
    }

    // get aup (LITSA72 + LIR64 + LFMM RSA)
    // récupère l'AUP à partir de l'heure de la demande
    // les données précédant l'heure la requête ne sont fournies
    async get_draft_aup() { 
        try {
            let response = await fetch("../b2b/get_aup.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "day": this.day, "type": "draft"})
            })
            const json = await response.json(); 
            console.log(json);
            return json;
        }
        
        catch (err) {
            show_popup("Erreur", `L'AUP de la date ${reverse_date(this.day)} n'existe pas`);
            console.log('Get AUP json error: '+err.message);
        }
    }

    // lit le fichier json de la date indiquée
    // ex : 20230525-aup.json
    async get_aup() { 
        const d = this.day.split("-");
        let aup = await get_data(`${d[0]}/${d[1]}/${d[0]}${d[1]}${d[2]}-aup.json`);
        if (typeof aup === 'undefined') {
            show_popup("Erreur", `L'AUP de la date ${reverse_date(this.day)} n'existe pas`);
        }
        return aup;
    }

    show_aup(containerId, titre) {
        if (typeof this.result !== 'undefined') {
            let res = `<div><h2>${titre} LFMM du ${reverse_date(this.day)} <br><span style='font-size:1rem'>06:00 UTC au lendemain 06:00 UTC</span></h2>`;
            res += `
            <table class="sortable">
                <thead><tr class="titre"><th class="space">D54</th><th>Début</th><th>Fin</th><th>Lower Limit</th><th>Upper Limit</th></tr></thead>
                <tbody>`.trimStart();
            
            this.result.forEach( rsa => {
                const name = rsa["designator"]; 
                const date_debut = rsa["beginDate"];
                const debut = rsa["begin"];
                const date_fin = rsa["endDate"];
                const fin = rsa["end"];
                const lower_limit = rsa["lowerLimit"];
                const upper_limit = rsa["upperLimit"];
                if (name.substr(0,5) === "LFD54") {
                    res += `<tr>`;
                    res += `<td>${name}</td><td><span style="font-size:1.2rem; font-weight:bold">${debut}</span>  (${date_debut})</td><td><span style="font-size:1.2rem; font-weight:bold">${fin}</span>  (${date_fin})</td><td>${lower_limit}</td><td>${upper_limit}</td>`
                    res += `</tr>`;
                }
            })
            res += '</tbody></table>';
            
            res += `
            <table class="sortable">
                <thead><tr class="titre"><th class="space">RSA</th><th>Début</th><th>Fin</th><th>Lower Limit</th><th>Upper Limit</th></tr></thead>
                <tbody>`.trimStart();
            
            this.result.forEach( rsa => {
                const name = rsa["designator"]; 
                const date_debut = rsa["beginDate"];
                const debut = rsa["begin"];
                const date_fin = rsa["endDate"];
                const fin = rsa["end"];
                const lower_limit = rsa["lowerLimit"];
                const upper_limit = rsa["upperLimit"];
                if (name.substr(0,2) === "LF" && name.substr(0,5) !== "LFT24" && name.substr(0,5) !== "LFD54") {
                    res += `<tr>`;
                    res += `<td>${name}</td><td><span style="font-size:1.2rem; font-weight:bold">${debut}</span>  (${date_debut})</td><td><span style="font-size:1.2rem; font-weight:bold">${fin}</span>  (${date_fin})</td><td>${lower_limit}</td><td>${upper_limit}</td>`
                    res += `</tr>`;
                }
            })
            res += '</tbody></table>';

            res += `
            <table class="sortable">
                <thead><tr class="titre"><th class="space">RSA</th><th>Début</th><th>Fin</th><th>Lower Limit</th><th>Upper Limit</th></tr></thead>
                <tbody>`.trimStart();
            this.result.forEach( rsa => {
                const name = rsa["designator"]; 
                const date_debut = rsa["beginDate"];
                const debut = rsa["begin"];
                const date_fin = rsa["endDate"];
                const fin = rsa["end"];
                const lower_limit = rsa["lowerLimit"];
                const upper_limit = rsa["upperLimit"];
                if (name.substr(0,2) === "LI" || name.substr(0,5) === "LFT24") {
                    res += `<tr>`;
                    res += `<td>${name}</td><td><span style="font-size:1.2rem; font-weight:bold">${debut}</span>  (${date_debut})</td><td><span style="font-size:1.2rem; font-weight:bold">${fin}</span>  (${date_fin})</td><td>${lower_limit}</td><td>${upper_limit}</td>`
                    res += `</tr>`;
                }
            })

            res += '</tbody></table>';
            res += '</div>';
            $(containerId).innerHTML = res;
        }  
    }

}
