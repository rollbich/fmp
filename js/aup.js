class aup {

    /*  -----------------------------------------------
        @param {string} day - "yyyy-mm-dd"
    ----------------------------------------------- */

    constructor(day) {
        this.day = day;
    }

    async init_aup() {
        this.result = await this.get_aup();
        this.show_aup("result");
    }

    // get aup (LITSA72 + LIR64 + LFMM RSA)
    // récupère l'AUP à partir de l'heure de la demande
    // les données précédant l'heure la requête ne sont fournies
    async get_direct_aup() { 
        try {
            let response = await fetch("../b2b/get_aup.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "day": this.day})
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
    // ex : 20230525-05h-aup.json
    async get_aup() { 
        const d = this.day.split("-");
        try {
            let aup = await loadJson(`../b2b/json/${d[0]}/${d[1]}/${d[0]}${d[1]}${d[2]}-05h-aup.json`);
            console.log(aup);
            return aup;
        }
        
        catch (err) {
            show_popup("Erreur", `L'AUP de la date ${reverse_date(this.day)} n'existe pas`);
            console.log('Get AUP json error: '+err.message);
        }
    }

    show_aup(containerId) {
        if (typeof this.result !== 'undefined') {
            let res = "<div>";
            res += `
            <table class="sortable conf">
                <caption>AUP LFMM France du ${reverse_date(this.day)} <br><span style="font-size:1rem">06:00 UTC au lendemain 06:00 UTC</span></caption>
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
                if (name.substr(0,2) === "LF") {
                    res += `<tr>`;
                    res += `<td>${name}</td><td><span style="font-size:1.2rem; font-weight:bold">${debut}</span>  (${date_debut})</td><td><span style="font-size:1.2rem; font-weight:bold">${fin}</span>  (${date_fin})</td><td>${lower_limit}</td><td>${upper_limit}</td>`
                    res += `</tr>`;
                }
            })
            res += '</tbody></table>';

            res += `
            <table class="sortable conf">
                <caption>AUP LFMM Italie du ${reverse_date(this.day)} <br><span style="font-size:1rem">06:00 UTC au lendemain 06:00 UTC</span></caption>
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
                if (name.substr(0,2) === "LI") {
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