class stats_rea {

    constructor(containerId, zone, start_day, end_day) {
        this.containerId = containerId;
        this.zone = zone;
        this.start_day = start_day;
        this.end_day = end_day;
        this.init();
    }

    async init() {
        this.data = await this.get_ucesa();
        this.show_stat_ucesa();
        console.log(this.data);
    }

    async get_ucesa() {
        const that = this;
        const cles = {
            "zone": that.zone, 
            "start_day": that.start_day, 
            "end_day": that.end_day,
            "fonction": "get_ucesa"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        const response = await fetch("../capa/tds_sql.php", data);
        if (response.ok) { // entre 200 et 300
            return Promise.resolve(response.json())
          } else {
            return Promise.reject(new Error('Erreur: '+response.statusText))
        } 

    }

    async show_stat_ucesa() {
        let result = `<h2>Stats : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2><br>`;
        result += "<div class='delay'>";
      result += `
        <table class="regulation sortable">
            <thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>Max secteurs</th><th>i1</th><th>Heures ctrl</th><th>Nb PC</th></tr></thead>
            <tbody>`;
        
        this.data.forEach(obj => {
            result += '<tr>';
            let heures_ucesa = Math.floor(obj.minutes_ucesa/60);
		    let reste_minutes = obj.minutes_ucesa%60;
            let nbpc = 0;
            const pc = JSON.parse(obj.nbpc);
            Object.keys(pc).forEach(key => {
                if (key != "N-1") {
                    nbpc += pc[key];
                }
            });
            result +=`<td>${reverse_date(obj.jour)}</td><td>${obj.typejour}</td><td>${obj.maxsecteurs}</td><td>${obj.i1}%</td><td>${obj.minutes_ucesa} min / ${heures_ucesa}h${reste_minutes}</td><td>${nbpc}</td>`;
            result += '</tr>';	
        }); 
        result += '</tbody></table>';
        result += "</div>";
    
        $(this.containerId).innerHTML = result;
        
    }   
    

/*  ---------------------------------------------------------------------
            Remplissage bdd avec la donnée minutes_ucesa
            nombre d'heures de ctrl totales réalisées sur la journée
    --------------------------------------------------------------------- */

    async sauv_minutes_ctrl() {
        
        for(const obj of this.data) {
            const day = obj.jour;
            const ucesa = JSON.parse(obj.realise);
            console.log(ucesa);
            let minutes_ucesa = 0;
            const rl = ucesa.length;
            for(let i=0;i<rl-1;i++) {
                minutes_ucesa += (time_to_min(ucesa[i+1][0]) - time_to_min(ucesa[i][0]))*ucesa[i][1];
            }
            minutes_ucesa += (time_to_min("23:59") - time_to_min(ucesa[rl-1][0]))*ucesa[rl-1][1];
            minutes_ucesa *= 2; // 2 contrôleurs par position
            await this.set_minutes_ucesa(day, minutes_ucesa);
        }
    }

    // sauv les minutes_ucesa dans la BDD
    async set_minutes_ucesa(day, minutes_ucesa) {
        
        const that = this;
        const cles = {
            "zone": that.zone, 
            "day": day, 
            "minutes_ucesa": minutes_ucesa,
            "fonction": "set_minutes_ucesa"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        const response = await fetch("../capa/tds_sql.php", data);
        
    }

}