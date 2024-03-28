class sauve_h20_occ {

    // zone : est ou west
    constructor(containerId, zone, start_day, end_day) {
        this.containerId = containerId;
        this.zone = zone;
        this.start_day = start_day;
        this.end_day = end_day;
        this.init();
    }

    async init() {
        this.dates = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        for (const day of this.dates) {
            const h20 = await this.get_h20(day, this.zone);
            const occ = await this.get_occ(day, this.zone);
            await this.set_h20_occ_crna(day, h20, occ);
        }
    }

    async get_h20(day, zone) {

        const date = day.replace(/-/g, ''); // yyyymmdd
        const year = day.substring(0,4);
        const month = date.substring(4,6);
        const url = `${year}/${month}/${date}-H20-${this.zone}.json`;	
        const resp = await loadJsonB2B(url, "H20", zone);
        let result; 
        if (resp !== 404) {
            result = resp;
            console.log(`Get H20 ${day} : OK`);
        } else {
            result = 404;
        } 
        return result;
    }

    async get_occ(day, zone) {

        const date = day.replace(/-/g, ''); // yyyymmdd
        const year = day.substring(0,4);
        const month = date.substring(4,6);
        const url = `${year}/${month}/${date}-Occ-${this.zone}.json`;	
        const resp = await loadJsonB2B(url, "OCC", zone);
        let result;
        if (resp !== 404) {
            result = resp;
            console.log(`Get Occ ${day} : OK`);
        } else {
            result = 404;
        }
        return result;
        
    }

/*  ----------------------------------------------------------------------------------
            Remplissage bdd avec les données h20-occ
            H20: [ [TV, yyyy-mm-dd, hh:mm, mv, load_h20, demand_h20], ...]
            Occ: [ [TV, yyyy-mm-dd, hh:mm, peak, sustain, load, demand], ...]

            BDD : jour, h20, occ
    ---------------------------------------------------------------------------------- */

    // sauv les vols CRNA dans la BDD
    async set_h20_occ_crna(jour, h20, occ) {
        
        const cles = {
            "zone": this.zone,
            "jour": jour, 
            "h20": JSON.stringify(h20), 
            "occ": JSON.stringify(occ),
            "fonction": "set_h20_occ_crna"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        try {
            const response = await fetch("../php/bdd_sql.php", data);
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
        
    }

}