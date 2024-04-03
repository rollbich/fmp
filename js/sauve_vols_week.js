class sauve_vols_week {

    constructor(containerId, zone, start_day, end_day) {
        this.containerId = containerId;
        this.zone = zone;
        this.start_day = start_day;
        this.end_day = end_day;
        this.init();
    }

    async init() {
        this.arr_dates = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        for(let day of this.arr_dates) {
            const d = new Date(day);
            const w = getWeekNumber(d);
            const year = w[0];
            const week = w[1];
            const m = d.getMonth() + 1;
            await this.update_vols_week(day, year, week, m, this.zone);
        }
    }

    // sauv les vols APP dans la BDD
    async update_vols_week(day, year, week, m, zone) {
        
        const cles = {
            "year": year,
            "week": week,
            "month": m,
            "day": day, 
            "table": zone,
            "fonction": "update_week"
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