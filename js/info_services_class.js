class info_NM {

    constructor() {
    }

    // get certif info
    async get_certif_info() { 
        try {
            let response = await fetch("../b2b/info_services.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "info": "certif"})
            })
            const json = await response.json(); 
            console.log(json);
            return json;
        }
        
        catch (err) {
            show_popup("Erreur", `Information du certificat indisponible`);
            console.log('Get certif info json error: '+err.message);
        }
    }

    // get NM info
    async get_nm_info() { 
        try {
            let response = await fetch("../b2b/info_services.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "info": "nm"})
            })
            const json = await response.json(); 
            console.log(json);
            return json;
        }
        
        catch (err) {
            show_popup("Erreur", `Information concernant NM B2B indisponible`);
            console.log('Get NM info json error: '+err.message);
        }
    }

    async show_certif_info(containerId) {
        const info = await this.get_certif_info();
        const content = info["data"]["textReport"].split("2. Resource Accesses"); 
        const content2 = content[1].split("3. Combined Service");
        let part1 = content[0].split(" ");
        let part2 = content2[0].split(" ");
        let part3 = content2[1].split(" ");
        
        part1 = part1.filter(el => el != "");
        for(let i=1;i<5;i++){part1.shift();}
        part2 = part2.filter(el => el != "");
        for(let i=1;i<5;i++){part2.shift();}
        part3 = part3.filter(el => el != "");
        for(let i=1;i<5;i++){part3.shift();}

        if (typeof info !== 'undefined') {
            let res = "<div>";
            res += "<h2 style='background-color:#777; padding:10px; text-align: center;'><u>Légende :</u><br>x : exécution&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;r : read&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;w : write</h2>";
            res += `
            <table class="sortable conf">
                <caption>Service Accesses - Access</caption>
                <thead><tr class="titre"><th>Requête</th><th>Droit</th></thead>
                <tbody>`.trimStart();
                for(let i=0;i<part1.length-1;i++) {
                    res += `<tr><td>${part1[i]}</td><td>${part1[i+1]} ${part1[i+2]}</td></tr>`;
                    i += 2;
                }
            res += '</tbody></table>';
            res += '</div>';
            res += `<div>
            <table class="sortable conf">
                <caption>Resource Accesses - Operational Forecast Simulation</caption>
                <thead><tr class="titre"><th>Requête</th><th>Droit</th></thead>
                <tbody>`.trimStart();
                for(let i=0;i<part2.length-1;i++) {
                    res += `<tr><td>${part2[i]}</td><td>${part2[i+1]} ${part2[i+2]} ${part2[i+3]} ${part2[i+4]} ${part2[i+5]} ${part2[i+6]}</td></tr>`;
                    i += 6;
                }
            res += '</tbody></table>';
            res += '</div>';
            res += `<div>
            <table class="sortable conf">
                <caption>Combined Service</caption>
                <thead><tr class="titre"><th>Requête</th><th>Droit</th></thead>
                <tbody>`.trimStart();
                for(let i=0;i<part3.length-1;i++) {
                    res += `<tr><td>${part3[i]}</td><td>${part3[i+1]} ${part3[i+2]}</td></tr>`;
                    i += 2;
                }
            res += '</tbody></table>';
            res += '</div>';
            $(containerId).innerHTML = res;
        }
    }

    async show_nm_info(containerId) {
        const info = await this.get_nm_info();
        if (typeof info !== 'undefined') {
            let res = "<div>";
            res += `
            <table class="sortable conf">
                <caption>Info NM B2B</caption>
                <tbody>`.trimStart();
                const currentVersion = info["currentVersion"]; 
                const lastVersion = info["data"]["release"]; 
                const baseline = info["data"]["baseline"];
                const plateforme = info["data"]["platform"]["executionEnvironment"];
                res += `<tr><td>Current B2B Version : </td><td>${currentVersion}</td></tr>`;
                res += `<tr><td>Last B2B Version : </td><td>${lastVersion}</td></tr>`;
                res += `<tr><td>Last Baseline : </td><td>${baseline}</td></tr>`
                res += `<tr><td>Plateforme : </td><td>${plateforme}</td></tr>`;
           
            res += '</tbody></table>';
            res += '</div>';
            $(containerId).innerHTML = res;
        }  
    }

}