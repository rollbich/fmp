/*  ----------------------------------------------------------------------------------
		Stat weekly : 
			@param {string} year - "yyyy"
			@param {integer} week - numero de la semaine à afficher
	-------------------------------------------------------------------------------------*/

class weekly_briefing {

    #tab_CRSTMP = ["ATC_CAPACITY", "ATC_ROUTINGS", "ATC_STAFFING", "ATC_EQUIPMENT", "AIRSPACE_MANAGEMENT", "SPECIAL_EVENT"];

    constructor(year, week, containerId_vols, containerId_reguls, containerId_causes) {
        this.container_vols = $(containerId_vols);
        this.container_reguls = $(containerId_reguls);
        this.container_causes = $(containerId_causes);
        this.year = year;
        this.week = week;
    }

    async init() {
        this.ini_week = getPreviousWeekNumber(new Date());
        this.lastweek_year = this.get_last_week()[0];
        this.lastweek_week = this.get_last_week()[1];
        this.start_date = convertDate(weekDateToDate(this.year, this.week, 1)); // jour du lundi "yyyy-mm-dd"
        this.end_date = convertDate(weekDateToDate(this.year, this.week, 1).addDays(6));
        this.data_dates = yearly_dates_semaine(weekDateToDate(this.year, this.week, 1));
        this.dates_array = get_dates_array(new Date(this.start_date), new Date(this.end_date));
        
        this.flights_crna = new period_vols_bdd("crna", this.start_date, this.end_date);
        this.flights_crna_lastyear = new period_vols_bdd("crna", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.flights_crna_lastweek = new period_vols_bdd("crna", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.flights_crna.init();
        await this.flights_crna_lastyear.init();
        await this.flights_crna_lastweek.init();

        this.flights_app = new period_vols_bdd("app", this.start_date, this.end_date);
        this.flights_app_lastyear = new period_vols_bdd("app", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.flights_app_lastweek = new period_vols_bdd("app", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.flights_app.init();
        await this.flights_app_lastyear.init();
        await this.flights_app_lastweek.init();

        this.reguls_crnae = new period_regul_bdd("est", this.start_date, this.end_date);
        this.reguls_crnae_lastyear = new period_regul_bdd("est", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.reguls_crnae_lastweek = new period_regul_bdd("est", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.reguls_crnae.init();
        await this.reguls_crnae_lastyear.init();
        await this.reguls_crnae_lastweek.init();

        this.reguls_crnaw = new period_regul_bdd("west", this.start_date, this.end_date);
        this.reguls_crnaw_lastyear = new period_regul_bdd("west", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.reguls_crnaw_lastweek = new period_regul_bdd("west", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.reguls_crnaw.init();
        await this.reguls_crnaw_lastyear.init();
        await this.reguls_crnaw_lastweek.init();

        this.reguls_app = new period_regul_bdd("app", this.start_date, this.end_date);
        this.reguls_app_lastyear = new period_regul_bdd("app", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.reguls_app_lastweek = new period_regul_bdd("app", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.reguls_app.init();
        await this.reguls_app_lastyear.init();
        await this.reguls_app_lastweek.init();

        this.yearly_reguls_year_est = await this.get_reguls_by_interval_reason("est", this.year, "week");
        this.yearly_reguls_lastyear_est = await this.get_reguls_by_interval_reason("est", this.year-1, "week");
        this.yearly_reguls_year_west = await this.get_reguls_by_interval_reason("west", this.year, "week");
        this.yearly_reguls_lastyear_west = await this.get_reguls_by_interval_reason("west", this.year-1, "week");
        this.yearly_reguls_year_app = await this.get_reguls_by_interval_reason("app", this.year, "week");
        this.yearly_reguls_lastyear_app = await this.get_reguls_by_interval_reason("app", this.year-1, "week");

        const nb = Math.max(this.data_dates.nb_week_year_until_now, this.data_dates.nb_week_lastyear);
        this.yearly_reguls_year_cta = {};
        this.yearly_reguls_lastyear_cta = {};
        for (let i=1;i<nb+1;i++) {
            this.yearly_reguls_year_cta[i.toString()] = {};
            const regul_causes_est = this.yearly_reguls_year_est[i.toString()];
            const regul_causes_west = this.yearly_reguls_year_west[i.toString()];
            for(let [cause, value] of Object.entries(regul_causes_est)) {
                this.yearly_reguls_year_cta[i.toString()][cause] = 0;
            }
            for(let [cause, value] of Object.entries(regul_causes_west)) {
                this.yearly_reguls_year_cta[i.toString()][cause] = 0;
            }
            Object.keys(this.yearly_reguls_year_cta[i.toString()]).forEach(cause => {
                if (regul_causes_est.hasOwnProperty(cause)) {
                    this.yearly_reguls_year_cta[i.toString()][cause] += regul_causes_est[cause];
                }
                if (regul_causes_west.hasOwnProperty(cause)) {
                    this.yearly_reguls_year_cta[i.toString()][cause] += regul_causes_west[cause];
                }
            })
        }
        for (let i=1;i<nb+1;i++) {
            this.yearly_reguls_lastyear_cta[i.toString()] = {};
            const regul_causes_est_lastyear = this.yearly_reguls_lastyear_est[i.toString()];
            const regul_causes_west_lastyear = this.yearly_reguls_lastyear_west[i.toString()];
            for(let [cause, value] of Object.entries(regul_causes_est_lastyear)) {
                this.yearly_reguls_lastyear_cta[i.toString()][cause] = 0;
            }
            for(let [cause, value] of Object.entries(regul_causes_west_lastyear)) {
                this.yearly_reguls_lastyear_cta[i.toString()][cause] = 0;
            }
            Object.keys(this.yearly_reguls_lastyear_cta[i.toString()]).forEach(cause => {
                if (regul_causes_est_lastyear.hasOwnProperty(cause)) {
                    this.yearly_reguls_lastyear_cta[i.toString()][cause] += regul_causes_est_lastyear[cause];
                }
                if (regul_causes_west_lastyear.hasOwnProperty(cause)) {
                    this.yearly_reguls_lastyear_cta[i.toString()][cause] += regul_causes_west_lastyear[cause];
                }
            })
        }
        this.yearly_reguls =  this.get_weekly_reg();
    }

    get_last_week() {
        return getPreviousWeekNumber(weekDateToDate(this.year, this.week, 1));
    }

    show_data() {
        let sel =  `<select id="year" class="select">`;
        for(let i=2024;i<(this.year+1);i++) {
            if (i === this.year) { sel += `<option selected value="${i}">Year ${i}</option>`; } else 
            { sel += `<option value="${i}">Year ${i}</option>`; }
        }
        sel += '</select>';
        sel +=  `<select id="semaine" class="select">`;
        const nbw = isoWeeksInYear(this.year);
        for(let i=1;i<(nbw+1);i++) {
            if (i === this.week) { sel += `<option selected value="${i}">Sem ${i}</option>`; } else 
            { sel += `<option value="${i}">Sem ${i}</option>`; }
        }
        sel += '</select>';
        sel += '<button id="validate_week">Ok</button>';
        sel += '<br><br>';
        const change_div = document.createElement('div');
        change_div.setAttribute("id", "bilan_changeWeek");
        this.container_vols.insertAdjacentElement('beforebegin', change_div);
        $('bilan_changeWeek').innerHTML = sel;

        this.show_yearly_week_vols();
        this.show_yearly_week_reguls();
        this.show_data_vols();
        this.show_data_reguls();
        this.change_week();
        this.show_data_vols_jour();
    }

    show_data_vols() {
        let v = this.data_vols();
        this.container_vols.innerHTML = v;
    }

    show_data_vols_jour() {
        let w = this.data_vols_jour();
        $('bilan_jour').innerHTML = w;
    }

    show_data_reguls() {
        let r = this.data_reguls();
        let c = this.bilan_causes_crna() + this.bilan_causes_app();
        let t = this.data_reguls_CRSTMP();
        this.container_reguls.innerHTML = r;
        
        this.container_causes.innerHTML = c;
        
        $("bilan_causes_CRSTMP").innerHTML = t;
        
        show_delay_graph_week_par_causes("accueil_causes_cta", this.year, this.week, this.yearly_reguls_year_cta[this.week], "LFMM CTA");
        show_delay_graph_week_par_causes("accueil_causes_app", this.year, this.week, this.yearly_reguls_year_app[this.week], "LFMM APP");
        show_delay_graph_week_par_causes("accueil_causes_est", this.year, this.week, this.yearly_reguls_year_est[this.week], "LFMM Est");
        show_delay_graph_week_par_causes("accueil_causes_west", this.year, this.week, this.yearly_reguls_year_west[this.week], "LFMM West");
        
        show_delay_graph_week_cumule("accueil_cumule_cta", this.year, this.yearly_reguls['cumul_cta'], this.yearly_reguls['cumul_cta_lastyear'], null, "LFMM CTA");
        show_delay_graph_week_cumule("accueil_cumule_app", this.year, this.yearly_reguls['cumul_app'], this.yearly_reguls['cumul_app_lastyear'], null, "LFMM APP");
        show_delay_graph_week_cumule("accueil_cumule_est", this.year, this.yearly_reguls['cumul_est'], this.yearly_reguls['cumul_est_lastyear'], null, "LFMM Est");
        show_delay_graph_week_cumule("accueil_cumule_west", this.year, this.yearly_reguls['cumul_west'], this.yearly_reguls['cumul_west_lastyear'], null, "LFMM West");
        
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_cta", this.year, this.yearly_reguls['cumul_CRSTMP_cta'], this.yearly_reguls['cumul_CRSTMP_cta_lastyear'], null, "LFMM CTA", "CRSTMP");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_app", this.year, this.yearly_reguls['cumul_CRSTMP_app'], this.yearly_reguls['cumul_CRSTMP_app_lastyear'], null, "LFMM APP", "CRSTMP");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_est", this.year, this.yearly_reguls['cumul_CRSTMP_est'], this.yearly_reguls['cumul_CRSTMP_est_lastyear'], null, "LFMM Est", "CRSTMP");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_west", this.year, this.yearly_reguls['cumul_CRSTMP_west'], this.yearly_reguls['cumul_CRSTMP_west_lastyear'], null, "LFMM West", "CRSTMP");
        
        // Fusion des objets reg_est et reg_west
        const reg_cta = {...this.reguls_crnae.reg_by_tv, ...this.reguls_crnaw.reg_by_tv};
       
        show_delay_graph_week_par_tvs("accueil_tvs_cta", this.year, this.week, reg_cta, "LFMMCTA");
        show_delay_graph_week_par_tvs("accueil_tvs_est", this.year, this.week, this.reguls_crnae.reg_by_tv, "Zone EST");
        show_delay_graph_week_par_tvs("accueil_tvs_west", this.year, this.week, this.reguls_crnaw.reg_by_tv, "Zone WEST");
        show_delay_graph_week_par_tvs("accueil_tvs_app", this.year, this.week, this.reguls_app.reg_by_tv, "Approches");
        
    }

    change_week() {
        $('validate_week').addEventListener('click', async (e) => {
            const current_year = new Date().getFullYear();
            const val = $('year').value;
            const val2 = $('semaine').value;
            this.year = parseInt(val);
            this.week = parseInt(val2);
            // pour empecher de demander une week supérieur à la semaine précédente
            if (this.week > this.ini_week && this.year === current_year) {
                $('semaine').value = this.ini_week;
            }
           await this.init();
           this.show_data();
        })
    }

    async get_vols_crna_by_week(year, week_max) {
        const cles = {
            "year": year,
            "week_max": week_max,
            "fonction": "get_vols_crna_by_week"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            const result = await response.json();
            return result;
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
    }

    async show_yearly_week_vols() {
        const nb = Math.max(this.data_dates.nb_week_year_until_now, this.data_dates.nb_week_lastyear);
        const listWeek = [];
        for (let k=1;k<nb+1;k++) { listWeek.push(k);}

        const yearly_traffic_year = await this.get_vols_crna_by_week(this.year, this.week);
        const yearly_traffic_lastyear = await this.get_vols_crna_by_week(this.year-1, weeksInYear(this.year-1));

        const week_arr_year_cta = [];
        const week_arr_lastyear_cta = [];
        const week_arr_year_ctae = [];
        const week_arr_lastyear_ctae = [];
        const week_arr_year_ctaw = [];
        const week_arr_lastyear_ctaw = [];

        yearly_traffic_year.forEach(obj => {
            week_arr_year_cta.push(obj.total_LFMMCTA_regdemand);
            week_arr_year_ctae.push(obj.total_LFMMCTAE_regdemand);
            week_arr_year_ctaw.push(obj.total_LFMMCTAW_regdemand);
        })

        yearly_traffic_lastyear.forEach(obj => {
            week_arr_lastyear_cta.push(obj.total_LFMMCTA_regdemand);
            week_arr_lastyear_ctae.push(obj.total_LFMMCTAE_regdemand);
            week_arr_lastyear_ctaw.push(obj.total_LFMMCTAW_regdemand);
        })

        $('glob_container').classList.remove('off');
        show_traffic_graph("accueil_vols", this.data_dates.last_week_year, listWeek, week_arr_year_cta, week_arr_lastyear_cta, null, "LFMMCTA");
		show_traffic_graph("vols_est", this.data_dates.last_week_year, listWeek, week_arr_year_ctae, week_arr_lastyear_ctae, null, "LFMM Est");
		show_traffic_graph("vols_ouest", this.data_dates.last_week_year, listWeek, week_arr_year_ctaw, week_arr_lastyear_ctaw, null, "LFMM West");
    }

    // "est", "ouest" ou "app"
    async get_reguls_by_interval_reason(zone, year, interval) {
        const cles = {
            "year": year,
            "zone": zone,
            "interval": interval,
            "fonction": "get_reguls_by_interval_reason"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            const result = await response.json();
            return result;
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
    }

    async show_yearly_week_reguls() {
        
        const nb = Math.max(this.data_dates.nb_week_year_until_now, this.data_dates.nb_week_lastyear);
        const listWeek = [];
        for (let k=1;k<nb+1;k++) { listWeek.push(k);}

        show_delay_graph("accueil_reguls", this.data_dates.last_week_year, listWeek, this.yearly_reguls.cta, this.yearly_reguls.cta_lastyear, null, "LFMMCTA");
        show_delay_graph("reguls_est", this.data_dates.last_week_year, listWeek, this.yearly_reguls.est, this.yearly_reguls.est_lastyear, null, "LFMMCTAE");
        show_delay_graph("reguls_ouest", this.data_dates.last_week_year, listWeek, this.yearly_reguls.west, this.yearly_reguls.west_lastyear, null, "LFMMCTAW");
    }

    data_vols() {
        const vols_crna = this.flights_crna.get_period_vols_crna();
        const vols_app = this.flights_app.get_period_vols_app();
        const vols_crna_lastweek = this.flights_crna_lastweek.get_period_vols_crna();
        const vols_app_lastweek = this.flights_app_lastweek.get_period_vols_app();
        const vols_crna_lastyear = this.flights_crna_lastyear.get_period_vols_crna();
        const vols_app_lastyear = this.flights_app_lastyear.get_period_vols_app();
        let result = `<h2 class='h2_bilan'>Nombre de vols : semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${vols_crna["cta"]} vols</span><span class="rect">Est : ${vols_crna["est"]} vols</span><span class="rect">West : ${vols_crna["west"]} vols</span><span class="rect">App : ${vols_app["app"]} vols</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${vols_crna["cta"]}</td>
            <td>${MyFormat.format((vols_crna["cta"]/vols_crna_lastweek["cta"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_crna["cta"]/vols_crna_lastyear["cta"] - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${vols_crna["est"]}</td>
            <td>${MyFormat.format((vols_crna["est"]/vols_crna_lastweek["est"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_crna["est"]/vols_crna_lastyear["est"] - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${vols_crna["west"]}</td>
            <td>${MyFormat.format((vols_crna["west"]/vols_crna_lastweek["west"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_crna["west"]/vols_crna_lastyear["west"] - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${vols_app["app"]}</td>
            <td>${MyFormat.format((vols_app["app"]/vols_app_lastweek["app"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_app["app"]/vols_app_lastyear["app"] - 1)*100)} %</td>
            `;
            res += '</tr>';	
        res += '</tbody></table>';
        
        result += "</div>";
        result += res;
        return result;
    }

    data_reguls() {
        const reguls_crnae = this.reguls_crnae.tot_delay;
        const reguls_crnaw = this.reguls_crnaw.tot_delay;
        const reguls_crna = reguls_crnae + reguls_crnaw;
        const reguls_app = this.reguls_app.tot_delay;
        const reguls_crnae_lastweek = this.reguls_crnae_lastweek.tot_delay;
        const reguls_crnaw_lastweek = this.reguls_crnaw_lastweek.tot_delay;
        const reguls_crna_lastweek = reguls_crnae_lastweek + reguls_crnaw_lastweek;
        const reguls_app_lastweek = this.reguls_app_lastweek.tot_delay;
        const reguls_crnae_lastyear = this.reguls_crnae_lastyear.tot_delay;
        const reguls_crnaw_lastyear = this.reguls_crnaw_lastyear.tot_delay;
        const reguls_crna_lastyear = reguls_crnae_lastyear + reguls_crnaw_lastyear;
        const reguls_app_lastyear = this.reguls_app_lastyear.tot_delay;
        
        let result = `<h2>Régulations : semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${reguls_crna} min</span><span class="rect">Est : ${reguls_crnae} min</span><span class="rect">West : ${reguls_crnaw} min</span><span class="rect">App : ${reguls_app} min</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${reguls_crna} min</td>
            <td>${MyFormat.format((reguls_crna/reguls_crna_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crna/reguls_crna_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${reguls_crnae} min</td>
            <td>${MyFormat.format((reguls_crnae/reguls_crnae_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crnae/reguls_crnae_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${reguls_crnaw} min</td>
            <td>${MyFormat.format((reguls_crnaw/reguls_crnaw_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crnaw/reguls_crnaw_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${reguls_app} min</td>
            <td>${MyFormat.format((reguls_app/reguls_app_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_app/reguls_app_lastyear - 1)*100)} %</td>
           `;
            res += '</tr>';	
        res += '</tbody></table>';
        result += "</div>";
        result += res;
        return result;
    }
    
    /*  ---------------------------------------------------------------------
            CRSTMP causes : 
            ATC_CAPACITY (C), ATC_ROUTINGS (R), ATC_STAFFING (S), 
		    ATC_EQUIPMENT (T), AIRSPACE_MANAGEMENT (M) and SPECIAL_EVENTS (P)

            Grève : ATC_INDUSTRIAL_ACTION
        --------------------------------------------------------------------- */
    data_reguls_CRSTMP() {
        const reguls_CRSTMP_crnae = this.reguls_crnae.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw = this.reguls_crnaw.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna = reguls_CRSTMP_crnae + reguls_CRSTMP_crnaw;
        const reguls_CRSTMP_app = this.reguls_app.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnae_lastweek = this.reguls_crnae_lastweek.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw_lastweek = this.reguls_crnaw_lastweek.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna_lastweek = reguls_CRSTMP_crnae_lastweek + reguls_CRSTMP_crnaw_lastweek;
        const reguls_CRSTMP_app_lastweek = this.reguls_app_lastweek.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnae_lastyear = this.reguls_crnae_lastyear.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw_lastyear = this.reguls_crnaw_lastyear.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna_lastyear = reguls_CRSTMP_crnae_lastyear + reguls_CRSTMP_crnaw_lastyear;
        const reguls_CRSTMP_app_lastyear = this.reguls_app_lastyear.tot_CRSTMP_delay;
        
        let result = `<h2>Régulations CRSTMP: semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${reguls_CRSTMP_crna} min</span><span class="rect">Est : ${reguls_CRSTMP_crnae} min</span><span class="rect">West : ${reguls_CRSTMP_crnaw} min</span><span class="rect">App : ${reguls_CRSTMP_app} min</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${reguls_CRSTMP_crna} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crna/reguls_CRSTMP_crna_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crna/reguls_CRSTMP_crna_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${reguls_CRSTMP_crnae} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnae/reguls_CRSTMP_crnae_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnae/reguls_CRSTMP_crnae_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${reguls_CRSTMP_crnaw} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnaw/reguls_CRSTMP_crnaw_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnaw/reguls_CRSTMP_crnaw_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${reguls_CRSTMP_app} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_app/reguls_CRSTMP_app_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_app/reguls_CRSTMP_app_lastyear - 1)*100)} %</td>
            `;
            res += '</tr>';	
        res += '</tbody></table>';
        result += "</div>";
        result += res;
        return result;
    }

    data_vols_jour() {
        let result = `<h2 class='h2_bilan'>Nombre de vols : semaine ${this.week} - Année ${this.year}</h2><br>`;
        let res = `
        <table class="table_bilan regulation sortable">
            <thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>Flights CTA</th><th>Flights Est</th><th>Flights West</th><th>Flights App</th><th>Delay CTA</th><th>Delay Est</th><th>Delay West</th><th>Delay App</th></tr></thead>
            <tbody>`;

        this.dates_array.forEach(day => {
            res += '<tr>'; 
            const cl = (this.flights_crna.vols_by_day[day].typejour === "Vendredi" || this.flights_crna.vols_by_day[day].typejour === "Samedi" || this.flights_crna.vols_by_day[day].typejour === "Dimanche") ? "red" : "";
            res += `<td>${reverse_date(this.flights_crna.vols_by_day[day].jour)}</td><td class='${cl}'>${this.flights_crna.vols_by_day[day].typejour}</td><td>${this.flights_crna.vols_by_day[day]['LFMMCTA_regdemand']}</td><td>${this.flights_crna.vols_by_day[day]['LFMMCTAE_regdemand']}</td><td>${this.flights_crna.vols_by_day[day]['LFMMCTAW_regdemand']}</td><td>${this.flights_app.vols_by_day[day]['flights']}</td>`;
            let delay_ctae = 0;
            let delay_ctaw = 0;
            let delay_app = 0;
            if (this.reguls_crnae.reguls_by_day.hasOwnProperty(day)) {
                this.reguls_crnae.reguls_by_day[day].forEach(regul => {
                    delay_ctae += regul.delay;
                });
            }
            if (this.reguls_crnaw.reguls_by_day.hasOwnProperty(day)) {
                this.reguls_crnaw.reguls_by_day[day].forEach(regul => {
                    delay_ctaw += regul.delay;
                });
            }
            if (this.reguls_app.reguls_by_day.hasOwnProperty(day)) {
                this.reguls_app.reguls_by_day[day].forEach(regul => {
                    delay_app += regul.delay;
                });
            }
            const delay_cta = delay_ctae + delay_ctaw;
            res +=`<td>${delay_cta}</td><td>${delay_ctae}</td><td>${delay_ctaw}</td>`;
            res +=`<td>${delay_app}</td>`;
            res += '</tr>';	
        })
            
        res += '</tbody></table>';
        result += "</div>";
        result += res;
        return result;
    }

    get_cumul_cause(cause) {
        let cumul_greve = {"cta":0, "est":0, "west":0, "app":0};
        for (let i=1;i<this.week;i++) {
            cumul_greve["cta"] += this.reguls.cause['cta'][i][cause] ?? 0;
            cumul_greve["est"] += this.reguls.cause['est'][i][cause] ?? 0;
            cumul_greve["west"] += this.reguls.cause['west'][i][cause] ?? 0;
            cumul_greve["app"] += this.reguls.cause['app'][i][cause] ?? 0;
        }
        return cumul_greve;
    }

    bilan_causes_crna() {
        let res = `<h2>Délais par causes CRNA: semaine ${this.week} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>Causes</th><th>CTA</th><th>Est</th><th>West</th></tr></thead>
            <tbody>`;

        const cause_obj_crnae = this.reguls_crnae.get_total_period_delay_by_cause();
        const cause_obj_crnaw = this.reguls_crnaw.get_total_period_delay_by_cause();
        // @return array - merge les causes des 2 objets crna
        let causes_obj_crna = [...Object.keys(cause_obj_crnae), ...Object.keys(cause_obj_crnaw)];
        // enlève les doubons
        causes_obj_crna = [...new Set(causes_obj_crna)];
        causes_obj_crna.forEach(cause => {
            res += '<tr>';
            res += `<td>${cause}</td>`;
            let tot_crna = (cause_obj_crnae[cause] ?? 0) + (cause_obj_crnaw[cause] ?? 0);
            res += `<td>${tot_crna} min</td><td>${cause_obj_crnae[cause] ?? 0} min</td><td>${cause_obj_crnaw[cause] ?? 0} min</td>`;
            res += '</tr>';	
        })
        
        res += '</tbody></table></div>';
        return res;
    }

    bilan_tv_crna() {
        let res = `<h2>Délais par TVs CRNA: semaine ${this.week} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>TVs</th><th>CTA</th><th>Est</th><th>West</th></tr></thead>
            <tbody>`;

        const tv_obj_crnae = this.reguls_crnae.reg_by_tv;
        const tv_obj_crnaw = this.reguls_crnaw.reg_by_tv;
        // merge les tvs des 2 objets crna
        let tvs_obj_crna = [...Object.keys(tv_obj_crnae), ...Object.keys(tv_obj_crnaw)];
        tvs_obj_crnae.forEach(tv => {
            res += '<tr>'; 
            res += `<td>${tv}</td>`;
            let tot_crna = (tv_obj_crnae[tv] ?? 0) + (tv_obj_crnaw[tv] ?? 0);
            res += `<td>${tot_crna} min</td><td>${tv_obj_crnae[cause] ?? 0} min</td><td>${cause_obj_crnaw[cause] ?? 0} min</td>`;
            res += '</tr>';	
        })
        
        res += '</tbody></table></div>';
        return res;
    }

    bilan_causes_app() {
        let res = `<h2>Délais par causes APP: semaine ${this.week} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>Causes</th><th>App</th></tr></thead>
            <tbody>`;
        const cause_obj_app = this.reguls_app.get_total_period_delay_by_cause();
        Object.keys(cause_obj_app).forEach(cause => {
            res += '<tr>';
            res += `<td>${cause}</td>`;
            res += `<td>${cause_obj_app[cause] ?? 0} min</td>`;
            res += '</tr>';	
        })
        res += '</tbody></table></div>';
        return res;
    }

    get_weekly_reg() {
        const obj = {};

        const arr_cta = [];
        const arr_cta_lastyear = [];
        const arr_est = [];
        const arr_est_lastyear = [];
        const arr_west = [];
        const arr_west_lastyear = [];
        const arr_app = [];
        const arr_app_lastyear = [];

        const arr_cumul_cta = [];
        const arr_cumul_cta_lastyear = [];
        const arr_cumul_est = [];
        const arr_cumul_est_lastyear = [];
        const arr_cumul_west = [];
        const arr_cumul_west_lastyear = [];
        const arr_cumul_app = [];
        const arr_cumul_app_lastyear = [];

        const arr_cumul_CRSTMP_cta = [];
        const arr_cumul_CRSTMP_cta_lastyear = [];
        const arr_cumul_CRSTMP_est = [];
        const arr_cumul_CRSTMP_est_lastyear = [];
        const arr_cumul_CRSTMP_west = [];
        const arr_cumul_CRSTMP_west_lastyear = [];
        const arr_cumul_CRSTMP_app = [];
        const arr_cumul_CRSTMP_app_lastyear = [];

        const nb = Math.max(this.data_dates.nb_week_year_until_now, this.data_dates.nb_week_lastyear);

        let cumul_est = 0;
        let cumul_est_lastyear = 0;
        let cumul_west = 0;
        let cumul_west_lastyear = 0;
        let cumul_app = 0;
        let cumul_app_lastyear = 0;

        let cumul_CRSTMP_est = 0;
        let cumul_CRSTMP_est_lastyear = 0;
        let cumul_CRSTMP_west = 0;
        let cumul_CRSTMP_west_lastyear = 0;
        let cumul_CRSTMP_app = 0;
        let cumul_CRSTMP_app_lastyear = 0;

        let temp_est = 0;
        let temp_west = 0;
        let temp_est_lastyear = 0;
        let temp_west_lastyear = 0;

        for (let k=1;k<nb+1;k++) {
            temp_est = 0;
            temp_est_lastyear = 0;
            temp_west = 0;
            temp_west_lastyear = 0;
            if (this.yearly_reguls_year_est.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_year_est[k])) {
                    temp_est += delay;
                    cumul_est += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_est += delay;
                }
                arr_est.push(temp_est);
                arr_cumul_est.push(cumul_est);
                arr_cumul_CRSTMP_est.push(cumul_CRSTMP_est);
            } else {
                arr_est.push(0);
                arr_cumul_est.push(cumul_est);
                arr_cumul_CRSTMP_est.push(cumul_CRSTMP_est);
            }
            if (this.yearly_reguls_lastyear_est.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_lastyear_est[k])) {
                    temp_est_lastyear += delay;
                    cumul_est_lastyear += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_est_lastyear += delay;
                }
                arr_est_lastyear.push(temp_est_lastyear);
                arr_cumul_est_lastyear.push(cumul_est_lastyear);
                arr_cumul_CRSTMP_est_lastyear.push(cumul_CRSTMP_est_lastyear);
            } else {
                arr_est_lastyear.push(0);
                arr_cumul_est_lastyear.push(cumul_est_lastyear);
                arr_cumul_CRSTMP_est_lastyear.push(cumul_CRSTMP_est_lastyear);
            }

            if (this.yearly_reguls_year_west.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_year_west[k])) {
                    temp_west += delay;
                    cumul_west += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_west += delay;
                }
                arr_west.push(temp_west);
                arr_cumul_west.push(cumul_west);
                arr_cumul_CRSTMP_west.push(cumul_CRSTMP_west);
            } else {
                arr_west.push(0);
                arr_cumul_west.push(cumul_west);
                arr_cumul_CRSTMP_west.push(cumul_CRSTMP_west);
            }
            if (this.yearly_reguls_lastyear_west.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_lastyear_west[k])) {
                    temp_west_lastyear += delay;
                    cumul_west_lastyear += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_west_lastyear += delay;
                }
                arr_west_lastyear.push(temp_west_lastyear);
                arr_cumul_west_lastyear.push(cumul_west_lastyear);
                arr_cumul_CRSTMP_west_lastyear.push(cumul_CRSTMP_west_lastyear);
            } else {
                arr_west_lastyear.push(0);
                arr_cumul_west_lastyear.push(cumul_west_lastyear);
                arr_cumul_CRSTMP_west_lastyear.push(cumul_CRSTMP_west_lastyear);
            }
            
            arr_cta.push(temp_est + temp_west);
            arr_cta_lastyear.push(temp_est_lastyear + temp_west_lastyear);
            arr_cumul_cta.push(cumul_est + cumul_west);
            arr_cumul_cta_lastyear.push(cumul_est_lastyear + cumul_west_lastyear);
            arr_cumul_CRSTMP_cta.push(cumul_CRSTMP_est + cumul_CRSTMP_west);
            arr_cumul_CRSTMP_cta_lastyear.push(cumul_CRSTMP_est_lastyear + cumul_CRSTMP_west_lastyear);

            if (this.yearly_reguls_year_app.hasOwnProperty(k)) {
                let temp = 0;
                for (const [cause, delay] of Object.entries(this.yearly_reguls_year_app[k])) {
                    temp += delay;
                    cumul_app += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_app += delay;
                }
                arr_app.push(temp);
                arr_cumul_app.push(cumul_app);
                arr_cumul_CRSTMP_app.push(cumul_CRSTMP_app);
            } else {
                arr_app.push(0);
                arr_cumul_app.push(cumul_app);
                arr_cumul_CRSTMP_app.push(cumul_CRSTMP_app);
            }
            if (this.yearly_reguls_lastyear_app.hasOwnProperty(k)) {
                let temp = 0;
                for (const [cause, delay] of Object.entries(this.yearly_reguls_lastyear_app[k])) {
                    temp += delay;
                    cumul_app_lastyear += delay;
                    if (this.#tab_CRSTMP.includes(cause)) {
                        cumul_CRSTMP_app_lastyear += delay;
                    } 
                }
                arr_app_lastyear.push(temp);
                arr_cumul_app_lastyear.push(cumul_app_lastyear);
                arr_cumul_CRSTMP_app_lastyear.push(cumul_CRSTMP_app_lastyear);
            } else {
                arr_cumul_app_lastyear.push(0);
                arr_cumul_app_lastyear.push(cumul_app_lastyear);
                arr_cumul_CRSTMP_app_lastyear.push(cumul_CRSTMP_app_lastyear);
            }
        }

        obj.cta = arr_cta;
        obj.cta_lastyear = arr_cta_lastyear;
        obj.est = arr_est;
        obj.est_lastyear = arr_est_lastyear;
        obj.west = arr_west;
        obj.west_lastyear = arr_west_lastyear;
        obj.app = arr_app;
        obj.app_lastyear = arr_app_lastyear;

        obj.cumul_cta = arr_cumul_cta;
        obj.cumul_cta_lastyear = arr_cumul_cta_lastyear;
        obj.cumul_est = arr_cumul_est;
        obj.cumul_est_lastyear = arr_cumul_est_lastyear;
        obj.cumul_west = arr_cumul_west;
        obj.cumul_west_lastyear = arr_cumul_west_lastyear;
        obj.cumul_app = arr_cumul_app;
        obj.cumul_app_lastyear = arr_cumul_app_lastyear;

        obj.cumul_CRSTMP_cta = arr_cumul_CRSTMP_cta;
        obj.cumul_CRSTMP_cta_lastyear = arr_cumul_CRSTMP_cta_lastyear;
        obj.cumul_CRSTMP_est = arr_cumul_CRSTMP_est;
        obj.cumul_CRSTMP_est_lastyear = arr_cumul_CRSTMP_est_lastyear;
        obj.cumul_CRSTMP_west = arr_cumul_CRSTMP_west;
        obj.cumul_CRSTMP_west_lastyear = arr_cumul_CRSTMP_west_lastyear;
        obj.cumul_CRSTMP_app = arr_cumul_CRSTMP_app;
        obj.cumul_CRSTMP_app_lastyear = arr_cumul_CRSTMP_app_lastyear;

        console.log("obj regul");
        console.log(obj);
        return obj;
    }

}

class monthly_briefing {

    #tab_CRSTMP = ["ATC_CAPACITY", "ATC_ROUTINGS", "ATC_STAFFING", "ATC_EQUIPMENT", "AIRSPACE_MANAGEMENT", "SPECIAL_EVENT"];

    constructor(year, month, containerId_vols, containerId_reguls, containerId_causes) {
        this.container_vols = $(containerId_vols);
        this.container_reguls = $(containerId_reguls);
        this.container_causes = $(containerId_causes);
        this.year = year;
        this.month = month;
    }

    async init() {
        this.ini_month = this.month;
        this.lastmonth_year = this.get_last_month()[0];
        this.lastmonth_week = this.get_last_month()[1];
        this.start_date = this.year+"-"+String(this.month).padStart(2, '0')+"-01"; // 1er jour du mois
        console.log("start_date: "+this.start_date);
        this.end_date = this.year+"-"+String(this.month).padStart(2, '0')+"-"+lastDayOfMonth(this.year, this.month);
        this.data_dates = yearly_dates_semaine(this.start_date);
        this.dates_array = get_dates_array(new Date(this.start_date), new Date(this.end_date));
        /*
        this.flights_crna = new period_vols_bdd("crna", this.start_date, this.end_date);
        this.flights_crna_lastyear = new period_vols_bdd("crna", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.flights_crna_lastweek = new period_vols_bdd("crna", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.flights_crna.init();
        await this.flights_crna_lastyear.init();
        await this.flights_crna_lastweek.init();

        this.flights_app = new period_vols_bdd("app", this.start_date, this.end_date);
        this.flights_app_lastyear = new period_vols_bdd("app", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.flights_app_lastweek = new period_vols_bdd("app", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.flights_app.init();
        await this.flights_app_lastyear.init();
        await this.flights_app_lastweek.init();

        this.reguls_crnae = new period_regul_bdd("est", this.start_date, this.end_date);
        this.reguls_crnae_lastyear = new period_regul_bdd("est", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.reguls_crnae_lastweek = new period_regul_bdd("est", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.reguls_crnae.init();
        await this.reguls_crnae_lastyear.init();
        await this.reguls_crnae_lastweek.init();

        this.reguls_crnaw = new period_regul_bdd("west", this.start_date, this.end_date);
        this.reguls_crnaw_lastyear = new period_regul_bdd("west", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.reguls_crnaw_lastweek = new period_regul_bdd("west", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.reguls_crnaw.init();
        await this.reguls_crnaw_lastyear.init();
        await this.reguls_crnaw_lastweek.init();

        this.reguls_app = new period_regul_bdd("app", this.start_date, this.end_date);
        this.reguls_app_lastyear = new period_regul_bdd("app", this.data_dates.equi_monday_of_this_week_lastyear, this.data_dates.equi_sunday_of_this_week_lastyear);
        this.reguls_app_lastweek = new period_regul_bdd("app", this.data_dates.monday_of_lastweek_year, this.data_dates.sunday_of_lastweek_year);
        await this.reguls_app.init();
        await this.reguls_app_lastyear.init();
        await this.reguls_app_lastweek.init();
        */
        this.yearly_reguls_year_est = await this.get_reguls_by_interval_reason("est", this.year, "month");
        this.yearly_reguls_lastyear_est = await this.get_reguls_by_interval_reason("est", this.year-1, "month");
        this.yearly_reguls_year_west = await this.get_reguls_by_interval_reason("west", this.year, "month");
        this.yearly_reguls_lastyear_west = await this.get_reguls_by_interval_reason("west", this.year-1, "month");
        this.yearly_reguls_year_app = await this.get_reguls_by_interval_reason("app", this.year, "month");
        this.yearly_reguls_lastyear_app = await this.get_reguls_by_interval_reason("app", this.year-1, "month");

        this.yearly_reguls_year_cta = {};
        this.yearly_reguls_lastyear_cta = {};
        for (let i=1;i<13;i++) {
            this.yearly_reguls_year_cta[i.toString()] = {};
            const regul_causes_est = this.yearly_reguls_year_est[i.toString()];
            const regul_causes_west = this.yearly_reguls_year_west[i.toString()];
            for(let [cause, value] of Object.entries(regul_causes_est)) {
                this.yearly_reguls_year_cta[i.toString()][cause] = 0;
            }
            for(let [cause, value] of Object.entries(regul_causes_west)) {
                this.yearly_reguls_year_cta[i.toString()][cause] = 0;
            }
            Object.keys(this.yearly_reguls_year_cta[i.toString()]).forEach(cause => {
                if (regul_causes_est.hasOwnProperty(cause)) {
                    this.yearly_reguls_year_cta[i.toString()][cause] += regul_causes_est[cause];
                }
                if (regul_causes_west.hasOwnProperty(cause)) {
                    this.yearly_reguls_year_cta[i.toString()][cause] += regul_causes_west[cause];
                }
            })
        }
        for (let i=1;i<13;i++) {
            this.yearly_reguls_lastyear_cta[i.toString()] = {};
            const regul_causes_est_lastyear = this.yearly_reguls_lastyear_est[i.toString()];
            const regul_causes_west_lastyear = this.yearly_reguls_lastyear_west[i.toString()];
            for(let [cause, value] of Object.entries(regul_causes_est_lastyear)) {
                this.yearly_reguls_lastyear_cta[i.toString()][cause] = 0;
            }
            for(let [cause, value] of Object.entries(regul_causes_west_lastyear)) {
                this.yearly_reguls_lastyear_cta[i.toString()][cause] = 0;
            }
            Object.keys(this.yearly_reguls_lastyear_cta[i.toString()]).forEach(cause => {
                if (regul_causes_est_lastyear.hasOwnProperty(cause)) {
                    this.yearly_reguls_lastyear_cta[i.toString()][cause] += regul_causes_est_lastyear[cause];
                }
                if (regul_causes_west_lastyear.hasOwnProperty(cause)) {
                    this.yearly_reguls_lastyear_cta[i.toString()][cause] += regul_causes_west_lastyear[cause];
                }
            })
        }
        this.yearly_reguls =  this.get_weekly_reg();
    }

    get_last_month() {
        return this.month === 1 ? [this.year-1, 12] : [this.yeary, this.month-1];
    }

    show_data() {
        let sel =  `<select id="year" class="select">`;
        for(let i=2024;i<(this.year+1);i++) {
            if (i === this.year) { sel += `<option selected value="${i}">Year ${i}</option>`; } else 
            { sel += `<option value="${i}">Year ${i}</option>`; }
        }
        sel += '</select>';
        sel +=  `<select id="semaine" class="select">`;
        const nbw = isoWeeksInYear(this.year);
        for(let i=1;i<(nbw+1);i++) {
            if (i === this.week) { sel += `<option selected value="${i}">Sem ${i}</option>`; } else 
            { sel += `<option value="${i}">Sem ${i}</option>`; }
        }
        sel += '</select>';
        sel += '<button id="validate_week">Ok</button>';
        sel += '<br><br>';
        const change_div = document.createElement('div');
        change_div.setAttribute("id", "bilan_changeWeek");
        this.container_vols.insertAdjacentElement('beforebegin', change_div);
        $('bilan_changeWeek').innerHTML = sel;

        this.show_yearly_week_vols();
        this.show_yearly_month_reguls();
        this.show_data_vols();
        this.show_data_reguls();
        this.change_month();
    }

    show_data_vols() {
        let v = this.data_vols();
        this.container_vols.innerHTML = v;
    }

    show_data_reguls() {
        let r = this.data_reguls();
        let c = this.bilan_causes_crna() + this.bilan_causes_app();
        let t = this.data_reguls_CRSTMP();
        this.container_reguls.innerHTML = r;
        
        this.container_causes.innerHTML = c;
        
        $("bilan_causes_CRSTMP").innerHTML = t;
        
        show_delay_graph_mois_par_causes("accueil_causes_cta", this.year, this.month, this.yearly_reguls_year_cta[this.month], "LFMM CTA");
        show_delay_graph_mois_par_causes("accueil_causes_app", this.year, this.month, this.yearly_reguls_year_app[this.month], "LFMM APP");
        show_delay_graph_mois_par_causes("accueil_causes_est", this.year, this.month, this.yearly_reguls_year_est[this.month], "LFMM Est");
        show_delay_graph_mois_par_causes("accueil_causes_west", this.year, this.month, this.yearly_reguls_year_west[this.month], "LFMM West");
        
        show_delay_graph_mois_cumule("accueil_cumule_cta", this.year, this.yearly_reguls['cumul_cta'], this.yearly_reguls['cumul_cta_lastyear'], null, "LFMM CTA");
        show_delay_graph_mois_cumule("accueil_cumule_app", this.year, this.yearly_reguls['cumul_app'], this.yearly_reguls['cumul_app_lastyear'], null, "LFMM APP");
        show_delay_graph_mois_cumule("accueil_cumule_est", this.year, this.yearly_reguls['cumul_est'], this.yearly_reguls['cumul_est_lastyear'], null, "LFMM Est");
        show_delay_graph_mois_cumule("accueil_cumule_west", this.year, this.yearly_reguls['cumul_west'], this.yearly_reguls['cumul_west_lastyear'], null, "LFMM West");
        
        show_delay_graph_mois_cumule("accueil_cumule_CRSTMP_cta", this.year, this.yearly_reguls['cumul_CRSTMP_cta'], this.yearly_reguls['cumul_CRSTMP_cta_lastyear'], null, "LFMM CTA", "CRSTMP");
        show_delay_graph_mois_cumule("accueil_cumule_CRSTMP_app", this.year, this.yearly_reguls['cumul_CRSTMP_app'], this.yearly_reguls['cumul_CRSTMP_app_lastyear'], null, "LFMM APP", "CRSTMP");
        show_delay_graph_mois_cumule("accueil_cumule_CRSTMP_est", this.year, this.yearly_reguls['cumul_CRSTMP_est'], this.yearly_reguls['cumul_CRSTMP_est_lastyear'], null, "LFMM Est", "CRSTMP");
        show_delay_graph_mois_cumule("accueil_cumule_CRSTMP_west", this.year, this.yearly_reguls['cumul_CRSTMP_west'], this.yearly_reguls['cumul_CRSTMP_west_lastyear'], null, "LFMM West", "CRSTMP");
        
        // Fusion des objets reg_est et reg_west
        const reg_cta = {...this.reguls_crnae.reg_by_tv, ...this.reguls_crnaw.reg_by_tv};
       
       /*
        regs['cta'].push(r_cta);
        regs['est'].push(r_est);
        regs['west'].push(r_west);
        regs['app'].push(r_app);
        */
       
        show_delay_graph_mois_par_tvs("accueil_tvs_cta", this.year, this.month, reg_cta, "LFMMCTA");
        show_delay_graph_mois_par_tvs("accueil_tvs_est", this.year, this.month, this.reguls_crnae.reg_by_tv, "Zone EST");
        show_delay_graph_mois_par_tvs("accueil_tvs_west", this.year, this.month, this.reguls_crnaw.reg_by_tv, "Zone WEST");
        show_delay_graph_mois_par_tvs("accueil_tvs_app", this.year, this.month, this.reguls_app.reg_by_tv, "Approches");
        
    }

    change_month() {
        $('mois').addEventListener('change', async (e) => {
            const current_year = new Date().getFullYear();
            const val = $('year').value;
            const val2 = $('mois').value;
            this.year = parseInt(val);
            this.month = parseInt(val2);
            // pour empecher de demander un mois supérieur au précédent
            if (this.month > this.ini_month && this.year === current_year) {
                this.month = this.ini_month;
                $('semaine').value = this.ini_month;
            }
           await this.init();
           this.show_data();
        })
    }

    async get_vols_crna_by_month(year, month_max) {
        const cles = {
            "year": year,
            "week_max": month_max,
            "fonction": "get_vols_crna_by_month"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            const result = await response.json();
            return result;
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
    }

    async show_yearly_week_vols() {
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}

        const yearly_traffic_year = await this.get_vols_crna_by_month(this.year, this.month);
        const yearly_traffic_lastyear = await this.get_vols_crna_by_month(this.year-1, weeksInYear(this.year-1));

        const week_arr_year_cta = [];
        const week_arr_lastyear_cta = [];
        const week_arr_year_ctae = [];
        const week_arr_lastyear_ctae = [];
        const week_arr_year_ctaw = [];
        const week_arr_lastyear_ctaw = [];

        yearly_traffic_year.forEach(obj => {
            week_arr_year_cta.push(obj.total_LFMMCTA_regdemand);
            week_arr_year_ctae.push(obj.total_LFMMCTAE_regdemand);
            week_arr_year_ctaw.push(obj.total_LFMMCTAW_regdemand);
        })

        yearly_traffic_lastyear.forEach(obj => {
            week_arr_lastyear_cta.push(obj.total_LFMMCTA_regdemand);
            week_arr_lastyear_ctae.push(obj.total_LFMMCTAE_regdemand);
            week_arr_lastyear_ctaw.push(obj.total_LFMMCTAW_regdemand);
        })

        $('glob_container').classList.remove('off');
        show_traffic_graph("accueil_vols", this.data_dates.last_month_year, listMonth, week_arr_year_cta, week_arr_lastyear_cta, null, "LFMMCTA");
		show_traffic_graph("vols_est", this.data_dates.last_week_year, listMonth, week_arr_year_ctae, week_arr_lastyear_ctae, null, "LFMM Est");
		show_traffic_graph("vols_ouest", this.data_dates.last_week_year, listMonth, week_arr_year_ctaw, week_arr_lastyear_ctaw, null, "LFMM West");
    }

    // "est", "ouest" ou "app"
    async get_reguls_by_interval_reason(zone, year, interval) {
        const cles = {
            "year": year,
            "zone": zone,
            "interval": interval,
            "fonction": "get_reguls_by_interval_reason"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            const result = await response.json();
            return result;
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
    }

    async show_yearly_month_reguls() {
        
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}

        show_delay_graph("accueil_reguls", this.data_dates.last_week_year, listMonth, this.yearly_reguls.cta, this.yearly_reguls.cta_lastyear, null, "LFMMCTA");
        show_delay_graph("reguls_est", this.data_dates.last_week_year, listMonth, this.yearly_reguls.est, this.yearly_reguls.est_lastyear, null, "LFMMCTAE");
        show_delay_graph("reguls_ouest", this.data_dates.last_week_year, listMonth, this.yearly_reguls.west, this.yearly_reguls.west_lastyear, null, "LFMMCTAW");
    }

    data_vols() {
        const vols_crna = this.flights_crna.get_period_vols_crna();
        const vols_app = this.flights_app.get_period_vols_app();
        const vols_crna_lastweek = this.flights_crna_lastweek.get_period_vols_crna();
        const vols_app_lastweek = this.flights_app_lastweek.get_period_vols_app();
        const vols_crna_lastyear = this.flights_crna_lastyear.get_period_vols_crna();
        const vols_app_lastyear = this.flights_app_lastyear.get_period_vols_app();
        let result = `<h2 class='h2_bilan'>Nombre de vols : semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${vols_crna["cta"]} vols</span><span class="rect">Est : ${vols_crna["est"]} vols</span><span class="rect">West : ${vols_crna["west"]} vols</span><span class="rect">App : ${vols_app["app"]} vols</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${vols_crna["cta"]}</td>
            <td>${MyFormat.format((vols_crna["cta"]/vols_crna_lastweek["cta"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_crna["cta"]/vols_crna_lastyear["cta"] - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${vols_crna["est"]}</td>
            <td>${MyFormat.format((vols_crna["est"]/vols_crna_lastweek["est"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_crna["est"]/vols_crna_lastyear["est"] - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${vols_crna["west"]}</td>
            <td>${MyFormat.format((vols_crna["west"]/vols_crna_lastweek["west"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_crna["west"]/vols_crna_lastyear["west"] - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${vols_app["app"]}</td>
            <td>${MyFormat.format((vols_app["app"]/vols_app_lastweek["app"] - 1)*100)} %</td>
            <td>${MyFormat.format((vols_app["app"]/vols_app_lastyear["app"] - 1)*100)} %</td>
            `;
            res += '</tr>';	
        res += '</tbody></table>';
        
        result += "</div>";
        result += res;
        return result;
    }

    data_reguls() {
        const reguls_crnae = this.reguls_crnae.tot_delay;
        const reguls_crnaw = this.reguls_crnaw.tot_delay;
        const reguls_crna = reguls_crnae + reguls_crnaw;
        const reguls_app = this.reguls_app.tot_delay;
        const reguls_crnae_lastweek = this.reguls_crnae_lastweek.tot_delay;
        const reguls_crnaw_lastweek = this.reguls_crnaw_lastweek.tot_delay;
        const reguls_crna_lastweek = reguls_crnae_lastweek + reguls_crnaw_lastweek;
        const reguls_app_lastweek = this.reguls_app_lastweek.tot_delay;
        const reguls_crnae_lastyear = this.reguls_crnae_lastyear.tot_delay;
        const reguls_crnaw_lastyear = this.reguls_crnaw_lastyear.tot_delay;
        const reguls_crna_lastyear = reguls_crnae_lastyear + reguls_crnaw_lastyear;
        const reguls_app_lastyear = this.reguls_app_lastyear.tot_delay;
        
        let result = `<h2>Régulations : mois ${this.month} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${reguls_crna} min</span><span class="rect">Est : ${reguls_crnae} min</span><span class="rect">West : ${reguls_crnaw} min</span><span class="rect">App : ${reguls_app} min</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${reguls_crna} min</td>
            <td>${MyFormat.format((reguls_crna/reguls_crna_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crna/reguls_crna_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${reguls_crnae} min</td>
            <td>${MyFormat.format((reguls_crnae/reguls_crnae_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crnae/reguls_crnae_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${reguls_crnaw} min</td>
            <td>${MyFormat.format((reguls_crnaw/reguls_crnaw_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crnaw/reguls_crnaw_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${reguls_app} min</td>
            <td>${MyFormat.format((reguls_app/reguls_app_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_app/reguls_app_lastyear - 1)*100)} %</td>
           `;
            res += '</tr>';	
        res += '</tbody></table>';
        result += "</div>";
        result += res;
        return result;
    }
    
    /*  ---------------------------------------------------------------------
            CRSTMP causes : 
            ATC_CAPACITY (C), ATC_ROUTINGS (R), ATC_STAFFING (S), 
		    ATC_EQUIPMENT (T), AIRSPACE_MANAGEMENT (M) and SPECIAL_EVENTS (P)

            Grève : ATC_INDUSTRIAL_ACTION
        --------------------------------------------------------------------- */
    data_reguls_CRSTMP() {
        const reguls_CRSTMP_crnae = this.reguls_crnae.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw = this.reguls_crnaw.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna = reguls_CRSTMP_crnae + reguls_CRSTMP_crnaw;
        const reguls_CRSTMP_app = this.reguls_app.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnae_lastweek = this.reguls_crnae_lastweek.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw_lastweek = this.reguls_crnaw_lastweek.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna_lastweek = reguls_CRSTMP_crnae_lastweek + reguls_CRSTMP_crnaw_lastweek;
        const reguls_CRSTMP_app_lastweek = this.reguls_app_lastweek.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnae_lastyear = this.reguls_crnae_lastyear.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw_lastyear = this.reguls_crnaw_lastyear.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna_lastyear = reguls_CRSTMP_crnae_lastyear + reguls_CRSTMP_crnaw_lastyear;
        const reguls_CRSTMP_app_lastyear = this.reguls_app_lastyear.tot_CRSTMP_delay;
        
        let result = `<h2>Régulations CRSTMP: mois ${this.month} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${reguls_CRSTMP_crna} min</span><span class="rect">Est : ${reguls_CRSTMP_crnae} min</span><span class="rect">West : ${reguls_CRSTMP_crnaw} min</span><span class="rect">App : ${reguls_CRSTMP_app} min</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${reguls_CRSTMP_crna} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crna/reguls_CRSTMP_crna_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crna/reguls_CRSTMP_crna_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${reguls_CRSTMP_crnae} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnae/reguls_CRSTMP_crnae_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnae/reguls_CRSTMP_crnae_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${reguls_CRSTMP_crnaw} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnaw/reguls_CRSTMP_crnaw_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnaw/reguls_CRSTMP_crnaw_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${reguls_CRSTMP_app} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_app/reguls_CRSTMP_app_lastweek - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_app/reguls_CRSTMP_app_lastyear - 1)*100)} %</td>
            `;
            res += '</tr>';	
        res += '</tbody></table>';
        result += "</div>";
        result += res;
        return result;
    }

    get_cumul_cause(cause) {
        let cumul_greve = {"cta":0, "est":0, "west":0, "app":0};
        for (let i=1;i<this.month;i++) {
            cumul_greve["cta"] += this.reguls.cause['cta'][i][cause] ?? 0;
            cumul_greve["est"] += this.reguls.cause['est'][i][cause] ?? 0;
            cumul_greve["west"] += this.reguls.cause['west'][i][cause] ?? 0;
            cumul_greve["app"] += this.reguls.cause['app'][i][cause] ?? 0;
        }
        return cumul_greve;
    }

    bilan_causes_crna() {
        let res = `<h2>Délais par causes CRNA: mois ${this.month} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>Causes</th><th>CTA</th><th>Est</th><th>West</th></tr></thead>
            <tbody>`;

        const cause_obj_crnae = this.reguls_crnae.get_total_period_delay_by_cause();
        const cause_obj_crnaw = this.reguls_crnaw.get_total_period_delay_by_cause();
        // @return array - merge les causes des 2 objets crna
        let causes_obj_crna = [...Object.keys(cause_obj_crnae), ...Object.keys(cause_obj_crnaw)];
        // enlève les doubons
        causes_obj_crna = [...new Set(causes_obj_crna)];
        causes_obj_crna.forEach(cause => {
            res += '<tr>';
            res += `<td>${cause}</td>`;
            let tot_crna = (cause_obj_crnae[cause] ?? 0) + (cause_obj_crnaw[cause] ?? 0);
            res += `<td>${tot_crna} min</td><td>${cause_obj_crnae[cause] ?? 0} min</td><td>${cause_obj_crnaw[cause] ?? 0} min</td>`;
            res += '</tr>';	
        })
        
        res += '</tbody></table></div>';
        return res;
    }

    bilan_tv_crna() {
        let res = `<h2>Délais par TVs CRNA: mois ${this.month} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>TVs</th><th>CTA</th><th>Est</th><th>West</th></tr></thead>
            <tbody>`;

        const tv_obj_crnae = this.reguls_crnae.reg_by_tv;
        const tv_obj_crnaw = this.reguls_crnaw.reg_by_tv;
        // merge les tvs des 2 objets crna
        let tvs_obj_crna = [...Object.keys(tv_obj_crnae), ...Object.keys(tv_obj_crnaw)];
        tvs_obj_crnae.forEach(tv => {
            res += '<tr>'; 
            res += `<td>${tv}</td>`;
            let tot_crna = (tv_obj_crnae[tv] ?? 0) + (tv_obj_crnaw[tv] ?? 0);
            res += `<td>${tot_crna} min</td><td>${tv_obj_crnae[cause] ?? 0} min</td><td>${cause_obj_crnaw[cause] ?? 0} min</td>`;
            res += '</tr>';	
        })
        
        res += '</tbody></table></div>';
        return res;
    }

    bilan_causes_app() {
        let res = `<h2>Délais par causes APP: mois ${this.month} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>Causes</th><th>App</th></tr></thead>
            <tbody>`;
        const cause_obj_app = this.reguls_app.get_total_period_delay_by_cause();
        Object.keys(cause_obj_app).forEach(cause => {
            res += '<tr>';
            res += `<td>${cause}</td>`;
            res += `<td>${cause_obj_app[cause] ?? 0} min</td>`;
            res += '</tr>';	
        })
        res += '</tbody></table></div>';
        return res;
    }

    get_weekly_reg() {
        const obj = {};

        const arr_cta = [];
        const arr_cta_lastyear = [];
        const arr_est = [];
        const arr_est_lastyear = [];
        const arr_west = [];
        const arr_west_lastyear = [];
        const arr_app = [];
        const arr_app_lastyear = [];

        const arr_cumul_cta = [];
        const arr_cumul_cta_lastyear = [];
        const arr_cumul_est = [];
        const arr_cumul_est_lastyear = [];
        const arr_cumul_west = [];
        const arr_cumul_west_lastyear = [];
        const arr_cumul_app = [];
        const arr_cumul_app_lastyear = [];

        const arr_cumul_CRSTMP_cta = [];
        const arr_cumul_CRSTMP_cta_lastyear = [];
        const arr_cumul_CRSTMP_est = [];
        const arr_cumul_CRSTMP_est_lastyear = [];
        const arr_cumul_CRSTMP_west = [];
        const arr_cumul_CRSTMP_west_lastyear = [];
        const arr_cumul_CRSTMP_app = [];
        const arr_cumul_CRSTMP_app_lastyear = [];

        let cumul_est = 0;
        let cumul_est_lastyear = 0;
        let cumul_west = 0;
        let cumul_west_lastyear = 0;
        let cumul_app = 0;
        let cumul_app_lastyear = 0;

        let cumul_CRSTMP_est = 0;
        let cumul_CRSTMP_est_lastyear = 0;
        let cumul_CRSTMP_west = 0;
        let cumul_CRSTMP_west_lastyear = 0;
        let cumul_CRSTMP_app = 0;
        let cumul_CRSTMP_app_lastyear = 0;

        let temp_est = 0;
        let temp_west = 0;
        let temp_est_lastyear = 0;
        let temp_west_lastyear = 0;

        for (let k=1;k<13;k++) {
            temp_est = 0;
            temp_est_lastyear = 0;
            temp_west = 0;
            temp_west_lastyear = 0;
            if (this.yearly_reguls_year_est.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_year_est[k])) {
                    temp_est += delay;
                    cumul_est += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_est += delay;
                }
                arr_est.push(temp_est);
                arr_cumul_est.push(cumul_est);
                arr_cumul_CRSTMP_est.push(cumul_CRSTMP_est);
            } else {
                arr_est.push(0);
                arr_cumul_est.push(cumul_est);
                arr_cumul_CRSTMP_est.push(cumul_CRSTMP_est);
            }
            if (this.yearly_reguls_lastyear_est.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_lastyear_est[k])) {
                    temp_est_lastyear += delay;
                    cumul_est_lastyear += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_est_lastyear += delay;
                }
                arr_est_lastyear.push(temp_est_lastyear);
                arr_cumul_est_lastyear.push(cumul_est_lastyear);
                arr_cumul_CRSTMP_est_lastyear.push(cumul_CRSTMP_est_lastyear);
            } else {
                arr_est_lastyear.push(0);
                arr_cumul_est_lastyear.push(cumul_est_lastyear);
                arr_cumul_CRSTMP_est_lastyear.push(cumul_CRSTMP_est_lastyear);
            }

            if (this.yearly_reguls_year_west.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_year_west[k])) {
                    temp_west += delay;
                    cumul_west += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_west += delay;
                }
                arr_west.push(temp_west);
                arr_cumul_west.push(cumul_west);
                arr_cumul_CRSTMP_west.push(cumul_CRSTMP_west);
            } else {
                arr_west.push(0);
                arr_cumul_west.push(cumul_west);
                arr_cumul_CRSTMP_west.push(cumul_CRSTMP_west);
            }
            if (this.yearly_reguls_lastyear_west.hasOwnProperty(k)) {
                for (const [cause, delay] of Object.entries(this.yearly_reguls_lastyear_west[k])) {
                    temp_west_lastyear += delay;
                    cumul_west_lastyear += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_west_lastyear += delay;
                }
                arr_west_lastyear.push(temp_west_lastyear);
                arr_cumul_west_lastyear.push(cumul_west_lastyear);
                arr_cumul_CRSTMP_west_lastyear.push(cumul_CRSTMP_west_lastyear);
            } else {
                arr_west_lastyear.push(0);
                arr_cumul_west_lastyear.push(cumul_west_lastyear);
                arr_cumul_CRSTMP_west_lastyear.push(cumul_CRSTMP_west_lastyear);
            }
            
            arr_cta.push(temp_est + temp_west);
            arr_cta_lastyear.push(temp_est_lastyear + temp_west_lastyear);
            arr_cumul_cta.push(cumul_est + cumul_west);
            arr_cumul_cta_lastyear.push(cumul_est_lastyear + cumul_west_lastyear);
            arr_cumul_CRSTMP_cta.push(cumul_CRSTMP_est + cumul_CRSTMP_west);
            arr_cumul_CRSTMP_cta_lastyear.push(cumul_CRSTMP_est_lastyear + cumul_CRSTMP_west_lastyear);

            if (this.yearly_reguls_year_app.hasOwnProperty(k)) {
                let temp = 0;
                for (const [cause, delay] of Object.entries(this.yearly_reguls_year_app[k])) {
                    temp += delay;
                    cumul_app += delay;
                    if (this.#tab_CRSTMP.includes(cause)) cumul_CRSTMP_app += delay;
                }
                arr_app.push(temp);
                arr_cumul_app.push(cumul_app);
                arr_cumul_CRSTMP_app.push(cumul_CRSTMP_app);
            } else {
                arr_app.push(0);
                arr_cumul_app.push(cumul_app);
                arr_cumul_CRSTMP_app.push(cumul_CRSTMP_app);
            }
            if (this.yearly_reguls_lastyear_app.hasOwnProperty(k)) {
                let temp = 0;
                for (const [cause, delay] of Object.entries(this.yearly_reguls_lastyear_app[k])) {
                    temp += delay;
                    cumul_app_lastyear += delay;
                    if (this.#tab_CRSTMP.includes(cause)) {
                        cumul_CRSTMP_app_lastyear += delay;
                    } 
                }
                arr_app_lastyear.push(temp);
                arr_cumul_app_lastyear.push(cumul_app_lastyear);
                arr_cumul_CRSTMP_app_lastyear.push(cumul_CRSTMP_app_lastyear);
            } else {
                arr_cumul_app_lastyear.push(0);
                arr_cumul_app_lastyear.push(cumul_app_lastyear);
                arr_cumul_CRSTMP_app_lastyear.push(cumul_CRSTMP_app_lastyear);
            }
        }

        obj.cta = arr_cta;
        obj.cta_lastyear = arr_cta_lastyear;
        obj.est = arr_est;
        obj.est_lastyear = arr_est_lastyear;
        obj.west = arr_west;
        obj.west_lastyear = arr_west_lastyear;
        obj.app = arr_app;
        obj.app_lastyear = arr_app_lastyear;

        obj.cumul_cta = arr_cumul_cta;
        obj.cumul_cta_lastyear = arr_cumul_cta_lastyear;
        obj.cumul_est = arr_cumul_est;
        obj.cumul_est_lastyear = arr_cumul_est_lastyear;
        obj.cumul_west = arr_cumul_west;
        obj.cumul_west_lastyear = arr_cumul_west_lastyear;
        obj.cumul_app = arr_cumul_app;
        obj.cumul_app_lastyear = arr_cumul_app_lastyear;

        obj.cumul_CRSTMP_cta = arr_cumul_CRSTMP_cta;
        obj.cumul_CRSTMP_cta_lastyear = arr_cumul_CRSTMP_cta_lastyear;
        obj.cumul_CRSTMP_est = arr_cumul_CRSTMP_est;
        obj.cumul_CRSTMP_est_lastyear = arr_cumul_CRSTMP_est_lastyear;
        obj.cumul_CRSTMP_west = arr_cumul_CRSTMP_west;
        obj.cumul_CRSTMP_west_lastyear = arr_cumul_CRSTMP_west_lastyear;
        obj.cumul_CRSTMP_app = arr_cumul_CRSTMP_app;
        obj.cumul_CRSTMP_app_lastyear = arr_cumul_CRSTMP_app_lastyear;

        console.log("obj regul");
        console.log(obj);
        return obj;
    }

}

/*  ----------------------------------------------------------------------------------
        Stat monthly : 
            @param {string} year - "yyyy"
            @param {integer} month - numero du mois à afficher
    -------------------------------------------------------------------------------------*/

class monthly_vols {
    constructor(year) {
        this.year = year;
    }

    async init() {
        this.monthly_vols = await this.get_data_monthly_vols();
        this.nbre_vols = this.get_monthly_vols();
    }

    /*  ----------------------------------------------------------------------------------
        Lit le fichier json des vols monthly
            @param {string} day - "yyyy-mm-dd"
            @returns {
                "year":2022,
                "cta":{"1":0,"2":142,...},
                "est":{"1":0,"2":0,...},
                "west":{"1":0,"2":142,...},
                "app":{"1":10,...}
            } = this.nbre_vols
    -------------------------------------------------------------------------------------*/
    async get_data_monthly_vols() {
        const url = `${this.year}/${this.year}-monthly-flights.json`;	
        const resp = await get_data(url);
        return resp;
    }

    /*  ----------------------------------------------------------------------------------
        Retourne l'objet des vols mensuels
            @returns {
                "year":2022,
                "cta":[vols_janv, vols fev, ...]
                "est":[vols_janv, vols fev, ...],
                "west":[vols_janv, vols fev, ...],
                "app":[vols_janv, vols fev, ...]
            } 
    -------------------------------------------------------------------------------------*/
    get_monthly_vols() {
        const vols = {};
        vols['year'] = parseInt(this.monthly_vols['year']);
        vols['cta'] = [];
        vols['est'] = [];
        vols['west'] = [];
        vols['app'] = [];
      
        for(let i=1;i<13;i++) { 
            if (typeof this.monthly_vols['cta'][i] !== 'undefined') vols['cta'].push(this.monthly_vols['cta'][i]);
            if (typeof this.monthly_vols['est'][i] !== 'undefined') vols['est'].push(this.monthly_vols['est'][i]);
            if (typeof this.monthly_vols['west'][i] !== 'undefined') vols['west'].push(this.monthly_vols['west'][i]);
            if (typeof this.monthly_vols['app'] !== 'undefined') if (typeof this.monthly_vols['app'][i] !== 'undefined') vols['app'].push(this.monthly_vols['app'][i]);
        }
        return vols;
    }
}

class monthly_briefing_old {
    constructor(year, month, containerId) {
        this.container = $(containerId);
        this.nom_mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
        this.year = year;
        this.month = month;
        this.lastmonth_year = this.get_last_month()[0];
        this.lastmonth_month = this.get_last_month()[1];
        this.init();
    }

    async init() {
        this.flights = new monthly_vols(this.year);
        this.flights_lastyear = new monthly_vols(this.year-1);
        await this.flights.init();
        await this.flights_lastyear.init();
        this.reguls = new monthly_regs(this.year);
        this.reguls_lastyear = new monthly_regs(this.year-1);
        await this.reguls.init();
        await this.reguls_lastyear.init();
    }

    get_last_month() {
        let m = this.month === 1 ? [this.year-1, 12] : [this.year, this.month-1]; 
        return m;
    }

/*  ----------------------------------------------------------------------------------
        Retourne l'objet des vols mensuels cumulés depuis le début de l'année
            @returns {
                "year":2022,
                "cta": [vols_cumulés janvier, fev...],
                "est": [vols_cumulés janv, fev, ...],
                "west": [vols_cumulés janv, fev, ...],
                "app": [vols_cumulés janv, fev, ...]
            } 
    -------------------------------------------------------------------------------------*/
    get_monthly_cumules(type) {
        let obj = null;
        const result = {};
        switch (type) {
            case 'lastyear':
                    obj = this.flights_lastyear;
                result['year'] = this.year - 1;
                break;
            case '2019':
                obj = this.flights_2019;
                result['year'] = 2019;
                    break;
            default:
                obj = this.flights;
                result['year'] = this.year;
        }
        
        let cta = 0, est = 0, west = 0, app = 0;
        result['cta'] = [];
        result['est'] = [];
        result['west'] = [];
        result['app'] = [];
        for(let i=0;i<this.month;i++) { 
            cta += obj['nbre_vols']['cta'][i];
            result['cta'].push(cta);
            est += obj['nbre_vols']['est'][i];
            result['est'].push(est);
            west += obj['nbre_vols']['west'][i];
            result['west'].push(west);
            app += obj['nbre_vols']['app'][i];
            result['app'].push(app);
        }
        return result;
    }

    get_monthly_reg_cumules(type) {
        let obj = null;
        const result = {};
        switch (type) {
            case 'lastyear':
                    obj = this.reguls_lastyear;
                result['year'] = this.year - 1;
                break;
            case '2019':
                obj = this.reguls_2019;
                result['year'] = 2019;
                    break;
            default:
                obj = this.reguls;
                result['year'] = this.year;
        }
        let cta = 0, est = 0, west = 0, app = 0;
        result['cta'] = [];
        result['est'] = [];
        result['west'] = [];
        result['app'] = [];
        for(let i=0;i<this.month;i++) { 
            cta += obj['delay']['cta'][i];
            result['cta'].push(cta);
            est += obj['delay']['est'][i];
            result['est'].push(est);
            west += obj['delay']['west'][i];
            result['west'].push(west);
            app += obj['delay']['app'][i];
            result['app'].push(app);
        }
        return result;
    }

    show_data() {
        let sel =  `<select id="year" class="select">`;
        const current_year = new Date().getFullYear();
        for(let i=2022;i<(current_year+1);i++) {
            if (i === this.year) { sel += `<option selected value="${i}">Year ${i}</option>`; } else 
            { sel += `<option value="${i}">Year ${i}</option>`; }
        }
        sel += '</select>';
        sel +=  `<select id="mois" class="select">`;
        for(let i=1;i<13;i++) {
            if (i === this.month) { sel += `<option selected value="${i}">${this.nom_mois[i-1]}</option>`; } else 
            { sel += `<option value="${i}">${this.nom_mois[i-1]}</option>`; }
        }
        sel += `</select><br><br>`;
        let v = this.data_vols();
        let r = this.data_reguls();
        this.container.innerHTML = sel+v+r;
        this.show_data_graphs();
        this.show_data_graphs_annee();
        this.change_month();
    }

    change_month() {
        $('year').addEventListener('change', async (e) => {
            const current_year = new Date().getFullYear();
            const current_month = new Date().getMonth(); // january = 0
            const val = $('year').value;
            const val2 = $('mois').value;
            this.year = parseInt(val);
            this.month = parseInt(val2); // de 1 à 12
            if (this.month > current_month && this.year === current_year) {
                this.month = current_month;
            }
            this.lastmonth_month = this.get_last_month()[1];
            this.lastmonth_year = this.get_last_month()[0];
            await this.init();
            this.show_data();
        })
        $('mois').addEventListener('change', (e) => {
            const current_year = new Date().getFullYear();
            const current_month = new Date().getMonth(); // january = 0
            const val = $('year').value;
            const val2 = $('mois').value;
            this.year = parseInt(val);
            this.month = parseInt(val2);
            if (this.month > current_month && this.year === current_year) {
                this.month = current_month;
            }
            this.lastmonth_month = this.get_last_month()[1];
            this.lastmonth_year = this.get_last_month()[0];
            this.show_data();
        })
    }

    data_vols() {
        let result = `<h2 class='h2_bilan'>Nombre de vols : mois ${this.nom_mois[this.month-1]} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${this.flights.nbre_vols['cta'][this.month-1]} vols</span><span class="rect">Est : ${this.flights.nbre_vols['est'][this.month-1]} vols</span><span class="rect">West : ${this.flights.nbre_vols['west'][this.month-1]} vols</span><span class="rect">App : ${this.flights.nbre_vols['app'][this.month-1]} vols</span>`;
        result += "<div class='delay'>";
        const lastmonth_flights = this.year === this.lastmonth_year ? this.flights : this.flights_lastyear; 
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} );
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Month</th><th>Last year</th><th>Cumuls</th><th>Cumuls Y-1</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.flights.nbre_vols['cta'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/lastmonth_flights.nbre_vols['cta'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/this.flights_lastyear.nbre_vols['cta'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['cta'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['cta'][this.month-1]/this.get_monthly_cumules("lastyear")['cta'][this.month-1] - 1)*100)} %</td>
            </tr>
            <tr><td>Est</td><td>${this.flights.nbre_vols['est'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/lastmonth_flights.nbre_vols['est'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/this.flights_lastyear.nbre_vols['est'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['est'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['est'][this.month-1]/this.get_monthly_cumules("lastyear")['est'][this.month-1] - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${this.flights.nbre_vols['west'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/lastmonth_flights.nbre_vols['west'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/this.flights_lastyear.nbre_vols['west'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['west'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['west'][this.month-1]/this.get_monthly_cumules("lastyear")['west'][this.month-1] - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${this.flights.nbre_vols['app'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/lastmonth_flights.nbre_vols['app'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/this.flights_lastyear.nbre_vols['app'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['app'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['app'][this.month-1]/this.get_monthly_cumules("lastyear")['app'][this.month-1] - 1)*100)} %</td>
            `;
            res += '</tr>';	
        res += '</tbody></table>';
        
        result += "</div>";
        result += res;
        return result;
    }

    data_reguls() {
        let result = `<h2>Régulations : mois ${this.nom_mois[this.month-1]} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${this.reguls.delay['cta'][this.month-1]} min</span><span class="rect">Est : ${this.reguls.delay['est'][this.month-1]} min</span><span class="rect">West : ${this.reguls.delay['west'][this.month-1]} min</span><span class="rect">App : ${this.reguls.delay['app'][this.month-1]} min</span>`;
        result += "<div class='delay'>";
        const lastmonth_reguls = this.year === this.lastmonth_year ? this.reguls : this.reguls_lastyear; 
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Month</th><th>Last year</th><th>Cumuls</th><th>Cumuls Y-1</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.reguls.delay['cta'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/lastmonth_reguls.delay['cta'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/this.reguls_lastyear.delay['cta'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['cta'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['cta'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['cta'][this.month-1] - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${this.reguls.delay['est'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/lastmonth_reguls.delay['est'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/this.reguls_lastyear.delay['est'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['est'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['est'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['est'][this.month-1] - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${this.reguls.delay['west'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/lastmonth_reguls.delay['west'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/this.reguls_lastyear.delay['west'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['west'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['west'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['west'][this.month-1] - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${this.reguls.delay['app'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/lastmonth_reguls.delay['app'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/this.reguls_lastyear.delay['app'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['app'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['app'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['app'][this.month-1] - 1)*100)} %</td>`;
            res += '</tr>';	
        res += '</tbody></table>';
        
        result += "</div>";
        result += res;
        return result;
    }

    show_data_graphs_annee() {
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}
        show_traffic_graph_mois_cumule("accueil_vols", this.year, listMonth, this.get_monthly_cumules()['cta'], this.get_monthly_cumules("lastyear")['cta'], null, "LFMMCTA");
        show_delay_graph_mois_cumule("accueil_reguls", this.year, listMonth, this.get_monthly_reg_cumules()['cta'], this.get_monthly_reg_cumules("lastyear")['cta'], null, "LFMMCTA");
        show_delay_graph_mois_cumule("accueil_reguls_cumul_app", this.year, listMonth, this.get_monthly_reg_cumules()['app'], this.get_monthly_reg_cumules("lastyear")['app'], null, "Approches");
        show_traffic_graph_mois_cumule("accueil_trafic_cumul_app", this.year, listMonth, this.get_monthly_cumules()['app'], this.get_monthly_cumules("lastyear")['app'], null, "Approches");
        show_traffic_graph_mois("accueil_trafic_mois_cta", this.year, listMonth, this.flights.nbre_vols['cta'], this.flights_lastyear.nbre_vols['cta'], null, "LFMMCTA");
        show_delay_graph_month("accueil_reguls_mois_cta", this.year, listMonth, this.reguls.delay['cta'], this.reguls_lastyear.delay['cta'], null, "LFMMCTA",800000);
        show_delay_graph_month("accueil_reguls_mois_est", this.year, listMonth, this.reguls.delay['est'], this.reguls_lastyear.delay['est'], null, "Zone EST",500000);
        show_delay_graph_month("accueil_reguls_mois_west", this.year, listMonth, this.reguls.delay['west'], this.reguls_lastyear.delay['west'], null, "Zone WEST",500000);
    }

    show_data_graphs() {
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}
        show_delay_graph_mois_par_causes("accueil_causes_cta", this.year, this.month, this.reguls.delay_par_cause['cta'][this.month-1], "LFMM CTA");
        show_delay_graph_mois_par_causes("accueil_causes_est", this.year, this.month, this.reguls.delay_par_cause['est'][this.month-1], "LFMM Est");
        show_delay_graph_mois_par_causes("accueil_causes_west", this.year, this.month, this.reguls.delay_par_cause['west'][this.month-1], "LFMM West");
        show_delay_graph_mois_par_causes("accueil_causes_app", this.year, this.month, this.reguls.delay_par_cause['app'][this.month-1], "Approches");
        show_traffic_graph_mois("accueil_trafic_mois_app", this.year, listMonth, this.flights.nbre_vols['app'], this.flights_lastyear.nbre_vols['app'], null, "Approches");
        show_delay_graph_mois_par_tvs("accueil_tvs_cta", this.year, this.month, this.reguls.delay_par_tvs['cta'][this.month-1], "LFMMCTA");
        show_delay_graph_mois_par_tvs("accueil_tvs_est", this.year, this.month, this.reguls.delay_par_tvs['est'][this.month-1], "Zone EST");
        show_delay_graph_mois_par_tvs("accueil_tvs_west", this.year, this.month, this.reguls.delay_par_tvs['west'][this.month-1], "Zone WEST");
        show_delay_graph_mois_par_tvs("accueil_tvs_app", this.year, this.month, this.reguls.delay_par_tvs['app'][this.month-1], "Approches");
    }

}