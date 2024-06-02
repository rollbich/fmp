/*  ----------------------------------------------------------------------------------
		Stat weekly : 
			@param {string} year - "yyyy"
			@param {integer} week - numero de la semaine à afficher
	-------------------------------------------------------------------------------------*/

class weekly_briefing {

    #tab_CRSTMP = ["ATC_CAPACITY", "ATC_ROUTINGS", "ATC_STAFFING", "ATC_EQUIPMENT", "AIRSPACE_MANAGEMENT", "SPECIAL_EVENT", "OTHERS"];

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

        // dataAxis
	    const listWeek = [];
	    for(let i=1;i<54;i++) {listWeek.push(i)}
        
        show_delay_graph_par_causes("accueil_causes_cta", this.year, this.week, this.yearly_reguls_year_cta[this.week], "LFMM CTA", "Sem");
        show_delay_graph_par_causes("accueil_causes_app", this.year, this.week, this.yearly_reguls_year_app[this.week], "LFMM APP", "Sem");
        show_delay_graph_par_causes("accueil_causes_est", this.year, this.week, this.yearly_reguls_year_est[this.week], "LFMM Est", "Sem");
        show_delay_graph_par_causes("accueil_causes_west", this.year, this.week, this.yearly_reguls_year_west[this.week], "LFMM West", "Sem");
        
        show_delay_graph_cumule("accueil_cumule_cta", this.year, listWeek, this.yearly_reguls['cumul_cta'], this.yearly_reguls['cumul_cta_lastyear'], null, "LFMM CTA", "", "Weeks");
        show_delay_graph_cumule("accueil_cumule_app", this.year, listWeek, this.yearly_reguls['cumul_app'], this.yearly_reguls['cumul_app_lastyear'], null, "LFMM APP", "", "Weeks");
        show_delay_graph_cumule("accueil_cumule_est", this.year, listWeek, this.yearly_reguls['cumul_est'], this.yearly_reguls['cumul_est_lastyear'], null, "LFMM Est", "", "Weeks");
        show_delay_graph_cumule("accueil_cumule_west", this.year, listWeek, this.yearly_reguls['cumul_west'], this.yearly_reguls['cumul_west_lastyear'], null, "LFMM West", "", "Weeks");
        
        show_delay_graph_cumule("accueil_cumule_CRSTMP_cta", this.year, listWeek, this.yearly_reguls['cumul_CRSTMP_cta'], this.yearly_reguls['cumul_CRSTMP_cta_lastyear'], null, "LFMM CTA", "CRSTMP", "Weeks");
        show_delay_graph_cumule("accueil_cumule_CRSTMP_app", this.year, listWeek, this.yearly_reguls['cumul_CRSTMP_app'], this.yearly_reguls['cumul_CRSTMP_app_lastyear'], null, "LFMM APP", "CRSTMP", "Weeks");
        show_delay_graph_cumule("accueil_cumule_CRSTMP_est", this.year, listWeek, this.yearly_reguls['cumul_CRSTMP_est'], this.yearly_reguls['cumul_CRSTMP_est_lastyear'], null, "LFMM Est", "CRSTMP", "Weeks");
        show_delay_graph_cumule("accueil_cumule_CRSTMP_west", this.year, listWeek, this.yearly_reguls['cumul_CRSTMP_west'], this.yearly_reguls['cumul_CRSTMP_west_lastyear'], null, "LFMM West", "CRSTMP", "Weeks");
        
        // Fusion des objets reg_est et reg_west
        const reg_cta = {...this.reguls_crnae.reg_by_tv, ...this.reguls_crnaw.reg_by_tv};

        // converti en array pour trier par delay et limite à 29 valeurs pour éviter un pb d'affichage
        const sortable = Object.entries(reg_cta).sort(([,a],[,b]) => b-a);
        let tot_autre = 0;
        for (let i=30;i<sortable.length;i++) {
            tot_autre += sortable[i][1];
        }
        sortable.length = 29;
        sortable.push(["autre", tot_autre]);
        console.log(sortable);
        
        // recréé un objet
        let sorted_reg_cta = {};
        sortable.forEach(item => {
            sorted_reg_cta[item[0]]=item[1];
        })
       
        show_delay_graph_par_tvs("accueil_tvs_cta", this.year, this.week, sorted_reg_cta, "LFMMCTA", "Sem");
        show_delay_graph_par_tvs("accueil_tvs_est", this.year, this.week, this.reguls_crnae.reg_by_tv, "Zone EST", "Sem");
        show_delay_graph_par_tvs("accueil_tvs_west", this.year, this.week, this.reguls_crnaw.reg_by_tv, "Zone WEST", "Sem");
        show_delay_graph_par_tvs("accueil_tvs_app", this.year, this.week, this.reguls_app.reg_by_tv, "Approches", "Sem");
        
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
        show_traffic_graph("accueil_vols", this.data_dates.last_week_year, listWeek, week_arr_year_cta, week_arr_lastyear_cta, null, "LFMMCTA", "Weeks");
		show_traffic_graph("vols_est", this.data_dates.last_week_year, listWeek, week_arr_year_ctae, week_arr_lastyear_ctae, null, "LFMM Est", "Weeks");
		show_traffic_graph("vols_ouest", this.data_dates.last_week_year, listWeek, week_arr_year_ctaw, week_arr_lastyear_ctaw, null, "LFMM West", "Weeks");
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

        show_delay_graph("accueil_reguls", this.data_dates.last_week_year, listWeek, this.yearly_reguls.cta, this.yearly_reguls.cta_lastyear, null, "LFMMCTA", "Weeks");
        show_delay_graph("reguls_est", this.data_dates.last_week_year, listWeek, this.yearly_reguls.est, this.yearly_reguls.est_lastyear, null, "LFMMCTAE", "Weeks");
        show_delay_graph("reguls_ouest", this.data_dates.last_week_year, listWeek, this.yearly_reguls.west, this.yearly_reguls.west_lastyear, null, "LFMMCTAW", "Weeks");
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

    #tab_CRSTMP = ["ATC_CAPACITY", "ATC_ROUTINGS", "ATC_STAFFING", "ATC_EQUIPMENT", "AIRSPACE_MANAGEMENT", "SPECIAL_EVENT", "OTHERS"];
    #tab_mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

    constructor(year, month, containerId_vols, containerId_reguls, containerId_causes) {
        this.container_vols = $(containerId_vols);
        this.container_reguls = $(containerId_reguls);
        this.container_causes = $(containerId_causes);
        this.year = year;
        this.month = month; // de 1 à 12
        this.ini_month = this.month;
    }

    async init() {
        this.start_date = this.year+"-"+String(this.month).padStart(2, '0')+"-01"; // 1er jour du mois
        console.log("start_date: "+this.start_date);
        this.end_date = this.year+"-"+String(this.month).padStart(2, '0')+"-"+lastDayOfMonth(this.year, this.month);
        console.log("end_date: "+this.end_date);
        this.data_dates = yearly_dates_semaine(this.start_date);
        this.dates_array = get_dates_array(new Date(this.start_date), new Date(this.end_date));

        const lm = get_last_month(new Date(this.start_date));

        this.start_date_lastmonth = lm[0]+"-"+String(lm[1]).padStart(2, '0')+"-01"; // 1er jour du mois
        this.end_date_lastmonth = lm[0]+"-"+String(lm[1]).padStart(2, '0')+"-"+lastDayOfMonth(lm[0], lm[1]);

        this.start_date_lastyear = (this.year-1)+"-"+String(this.month).padStart(2, '0')+"-01"; // 1er jour du mois
        this.end_date_lastyear = (this.year-1)+"-"+String(this.month).padStart(2, '0')+"-"+lastDayOfMonth(this.year-1, this.month);
        
        this.flights_crna = new period_vols_bdd("crna", this.start_date, this.end_date);
        this.flights_crna_lastyear = new period_vols_bdd("crna", this.start_date_lastyear, this.end_date_lastyear);
        this.flights_crna_lastmonth = new period_vols_bdd("crna", this.start_date_lastmonth, this.end_date_lastmonth);
        await this.flights_crna.init();
        await this.flights_crna_lastyear.init();
        await this.flights_crna_lastmonth.init();

        this.flights_app = new period_vols_bdd("app", this.start_date, this.end_date);
        this.flights_app_lastyear = new period_vols_bdd("app", this.start_date_lastyear, this.end_date_lastyear);
        this.flights_app_lastmonth = new period_vols_bdd("app", this.start_date_lastmonth, this.end_date_lastmonth);
        await this.flights_app.init();
        await this.flights_app_lastyear.init();
        await this.flights_app_lastmonth.init();

        this.reguls_crnae = new period_regul_bdd("est", this.start_date, this.end_date);
        this.reguls_crnae_lastyear = new period_regul_bdd("est", this.start_date_lastyear, this.end_date_lastyear);
        this.reguls_crnae_lastmonth = new period_regul_bdd("est", this.start_date_lastmonth, this.end_date_lastmonth);
        await this.reguls_crnae.init();
        await this.reguls_crnae_lastyear.init();
        await this.reguls_crnae_lastmonth.init();

        this.reguls_crnaw = new period_regul_bdd("west", this.start_date, this.end_date);
        this.reguls_crnaw_lastyear = new period_regul_bdd("west", this.start_date_lastyear, this.end_date_lastyear);
        this.reguls_crnaw_lastmonth = new period_regul_bdd("west", this.start_date_lastmonth, this.end_date_lastmonth);
        await this.reguls_crnaw.init();
        await this.reguls_crnaw_lastyear.init();
        await this.reguls_crnaw_lastmonth.init();

        this.reguls_app = new period_regul_bdd("app", this.start_date, this.end_date);
        this.reguls_app_lastyear = new period_regul_bdd("app", this.start_date_lastyear, this.end_date_lastyear);
        this.reguls_app_lastmonth = new period_regul_bdd("app", this.start_date_lastmonth, this.end_date_lastmonth);
        await this.reguls_app.init();
        await this.reguls_app_lastyear.init();
        await this.reguls_app_lastmonth.init();
        
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
        this.yearly_reguls =  this.get_monthly_reg();
    }

    show_data() {
        let sel =  `<br><br><select id="year" class="select">`;
        for(let i=2024;i<(this.year+1);i++) {
            if (i === this.year) { sel += `<option selected value="${i}">Year ${i}</option>`; } else 
            { sel += `<option value="${i}">Year ${i}</option>`; }
        }
        sel += '</select>';
        sel +=  `<select id="mois" class="select">`;
        for(let i=1;i<13;i++) {
            if (i === this.month) { sel += `<option selected value="${i}">${this.#tab_mois[i-1]}</option>`; } else 
            { sel += `<option value="${i}">${this.#tab_mois[i-1]}</option>`; }
        }
        sel += '</select>';
        sel += '<button id="validate_button">Ok</button>';
        sel += '<br><br>';
        const change_div = document.createElement('div');
        change_div.setAttribute("id", "bilan_changeMonth");
        $('bilan_vols').insertAdjacentElement('beforebegin', change_div);
        $('bilan_changeMonth').innerHTML = sel;

        this.show_yearly_month_vols();
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
        console.log("accueil_causes_cta");
        console.log(this.year+" "+this.month);
        console.log(this.yearly_reguls_year_cta[this.month]);

        show_delay_graph_par_causes("accueil_causes_cta", this.year, this.month, this.yearly_reguls_year_cta[this.month], "LFMM CTA", "Mois");
        show_delay_graph_par_causes("accueil_causes_app", this.year, this.month, this.yearly_reguls_year_app[this.month], "LFMM APP", "Mois");
        show_delay_graph_par_causes("accueil_causes_est", this.year, this.month, this.yearly_reguls_year_est[this.month], "LFMM Est", "Mois");
        show_delay_graph_par_causes("accueil_causes_west", this.year, this.month, this.yearly_reguls_year_west[this.month], "LFMM West", "Mois");

        // dataAxis
	    const listMonth = [];
	    for(let i=1;i<13;i++) {listMonth.push(i)}
        
        show_delay_graph_cumule("accueil_cumule_cta", this.year, listMonth, this.yearly_reguls['cumul_cta'], this.yearly_reguls['cumul_cta_lastyear'], null, "LFMM CTA", "", "Months");
        show_delay_graph_cumule("accueil_cumule_app", this.year, listMonth, this.yearly_reguls['cumul_app'], this.yearly_reguls['cumul_app_lastyear'], null, "LFMM APP", "", "Months");
        show_delay_graph_cumule("accueil_cumule_est", this.year, listMonth, this.yearly_reguls['cumul_est'], this.yearly_reguls['cumul_est_lastyear'], null, "LFMM Est", "", "Months");
        show_delay_graph_cumule("accueil_cumule_west", this.year, listMonth, this.yearly_reguls['cumul_west'], this.yearly_reguls['cumul_west_lastyear'], null, "LFMM West", "", "Months");
        
        show_delay_graph_cumule("accueil_cumule_CRSTMP_cta", this.year, listMonth, this.yearly_reguls['cumul_CRSTMP_cta'], this.yearly_reguls['cumul_CRSTMP_cta_lastyear'], null, "LFMM CTA", "CRSTMP", "Months");
        show_delay_graph_cumule("accueil_cumule_CRSTMP_app", this.year, listMonth, this.yearly_reguls['cumul_CRSTMP_app'], this.yearly_reguls['cumul_CRSTMP_app_lastyear'], null, "LFMM APP", "CRSTMP", "Months");
        show_delay_graph_cumule("accueil_cumule_CRSTMP_est", this.year, listMonth, this.yearly_reguls['cumul_CRSTMP_est'], this.yearly_reguls['cumul_CRSTMP_est_lastyear'], null, "LFMM Est", "CRSTMP", "Months");
        show_delay_graph_cumule("accueil_cumule_CRSTMP_west", this.year, listMonth, this.yearly_reguls['cumul_CRSTMP_west'], this.yearly_reguls['cumul_CRSTMP_west_lastyear'], null, "LFMM West", "CRSTMP", "Months");
        
        // Fusion des objets reg_est et reg_west
        const reg_cta = {...this.reguls_crnae.reg_by_tv, ...this.reguls_crnaw.reg_by_tv};
        
        // converti en array pour trier par delay et limite à 29 valeurs pour éviter un pb d'affichage
        const sortable = Object.entries(reg_cta).sort(([,a],[,b]) => b-a);
        let tot_autre = 0;
        for (let i=30;i<sortable.length;i++) {
            tot_autre += sortable[i][1];
        }
        sortable.length = 29;
        sortable.push(["autre", tot_autre]);
        console.log(sortable);
        
        // recréé un objet
        let sorted_reg_cta = {};
        sortable.forEach(item => {
            sorted_reg_cta[item[0]]=item[1];
        })

        show_delay_graph_par_tvs("accueil_tvs_cta", this.year, this.month, sorted_reg_cta, "LFMMCTA", "Mois");
        show_delay_graph_par_tvs("accueil_tvs_est", this.year, this.month, this.reguls_crnae.reg_by_tv, "Zone EST", "Mois");
        show_delay_graph_par_tvs("accueil_tvs_west", this.year, this.month, this.reguls_crnaw.reg_by_tv, "Zone WEST", "Mois");
        show_delay_graph_par_tvs("accueil_tvs_app", this.year, this.month, this.reguls_app.reg_by_tv, "Approches", "Mois");
        
    }

    change_month() {
        $('validate_button').addEventListener('click', async (e) => {
            const current_year = new Date().getFullYear();
            this.year = parseInt($('year').value);
            this.month = parseInt($('mois').value);
            // pour empecher de demander un mois supérieur au précédent
            if (this.month > this.ini_month && this.year === current_year) {
                this.month = this.ini_month;
                $('mois').value = this.ini_month;
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

    async show_yearly_month_vols() {
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}

        const yearly_traffic_year = await this.get_vols_crna_by_month(this.year, this.month);
        console.log("yty");
        console.log(yearly_traffic_year);
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
        show_traffic_graph("accueil_vols", this.data_dates.last_month_year, listMonth, week_arr_year_cta, week_arr_lastyear_cta, null, "LFMMCTA", "Months");
		show_traffic_graph("vols_est", this.data_dates.last_week_year, listMonth, week_arr_year_ctae, week_arr_lastyear_ctae, null, "LFMM Est", "Months");
		show_traffic_graph("vols_ouest", this.data_dates.last_week_year, listMonth, week_arr_year_ctaw, week_arr_lastyear_ctaw, null, "LFMM West", "Months");
    }

    // "est", "ouest" ou "app"
    // interval : "week" ou "month"
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

        show_delay_graph("accueil_reguls", this.data_dates.last_week_year, listMonth, this.yearly_reguls.cta, this.yearly_reguls.cta_lastyear, null, "LFMMCTA", "Months");
        show_delay_graph("reguls_est", this.data_dates.last_week_year, listMonth, this.yearly_reguls.est, this.yearly_reguls.est_lastyear, null, "LFMMCTAE", "Months");
        show_delay_graph("reguls_ouest", this.data_dates.last_week_year, listMonth, this.yearly_reguls.west, this.yearly_reguls.west_lastyear, null, "LFMMCTAW", "Months");
    }

    data_vols() {
        const vols_crna = this.flights_crna.get_period_vols_crna();
        const vols_app = this.flights_app.get_period_vols_app();
        const vols_crna_lastweek = this.flights_crna_lastmonth.get_period_vols_crna();
        const vols_app_lastweek = this.flights_app_lastmonth.get_period_vols_app();
        const vols_crna_lastyear = this.flights_crna_lastyear.get_period_vols_crna();
        const vols_app_lastyear = this.flights_app_lastyear.get_period_vols_app();
        let result = `<h2 class='h2_bilan'>Nombre de vols : ${this.#tab_mois[this.month-1]} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${vols_crna["cta"]} vols</span><span class="rect">Est : ${vols_crna["est"]} vols</span><span class="rect">West : ${vols_crna["west"]} vols</span><span class="rect">App : ${vols_app["app"]} vols</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Month</th><th>${this.year-1}</th></tr></thead>
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
        const reguls_crnae_lastmonth = this.reguls_crnae_lastmonth.tot_delay;
        const reguls_crnaw_lastmonth = this.reguls_crnaw_lastmonth.tot_delay;
        const reguls_crna_lastmonth = reguls_crnae_lastmonth + reguls_crnaw_lastmonth;
        const reguls_app_lastmonth = this.reguls_app_lastmonth.tot_delay;
        const reguls_crnae_lastyear = this.reguls_crnae_lastyear.tot_delay;
        const reguls_crnaw_lastyear = this.reguls_crnaw_lastyear.tot_delay;
        const reguls_crna_lastyear = reguls_crnae_lastyear + reguls_crnaw_lastyear;
        const reguls_app_lastyear = this.reguls_app_lastyear.tot_delay;
        
        let result = `<h2>Régulations : ${this.#tab_mois[this.month-1]} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${reguls_crna} min</span><span class="rect">Est : ${reguls_crnae} min</span><span class="rect">West : ${reguls_crnaw} min</span><span class="rect">App : ${reguls_app} min</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${reguls_crna} min</td>
            <td>${MyFormat.format((reguls_crna/reguls_crna_lastmonth - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crna/reguls_crna_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${reguls_crnae} min</td>
            <td>${MyFormat.format((reguls_crnae/reguls_crnae_lastmonth - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crnae/reguls_crnae_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${reguls_crnaw} min</td>
            <td>${MyFormat.format((reguls_crnaw/reguls_crnaw_lastmonth - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_crnaw/reguls_crnaw_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${reguls_app} min</td>
            <td>${MyFormat.format((reguls_app/reguls_app_lastmonth - 1)*100)} %</td>
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
        const reguls_CRSTMP_crnae_lastmonth = this.reguls_crnae_lastmonth.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw_lastmonth = this.reguls_crnaw_lastmonth.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna_lastmonth = reguls_CRSTMP_crnae_lastmonth + reguls_CRSTMP_crnaw_lastmonth;
        const reguls_CRSTMP_app_lastmonth = this.reguls_app_lastmonth.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnae_lastyear = this.reguls_crnae_lastyear.tot_CRSTMP_delay;
        const reguls_CRSTMP_crnaw_lastyear = this.reguls_crnaw_lastyear.tot_CRSTMP_delay;
        const reguls_CRSTMP_crna_lastyear = reguls_CRSTMP_crnae_lastyear + reguls_CRSTMP_crnaw_lastyear;
        const reguls_CRSTMP_app_lastyear = this.reguls_app_lastyear.tot_CRSTMP_delay;
        
        let result = `<h2>Régulations CRSTMP: mois ${this.#tab_mois[this.month-1]} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${reguls_CRSTMP_crna} min</span><span class="rect">Est : ${reguls_CRSTMP_crnae} min</span><span class="rect">West : ${reguls_CRSTMP_crnaw} min</span><span class="rect">App : ${reguls_CRSTMP_app} min</span>`;
        result += "<div class='delay'>";
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${reguls_CRSTMP_crna} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crna/reguls_CRSTMP_crna_lastmonth - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crna/reguls_CRSTMP_crna_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>Est</td><td>${reguls_CRSTMP_crnae} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnae/reguls_CRSTMP_crnae_lastmonth - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnae/reguls_CRSTMP_crnae_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>West</td><td>${reguls_CRSTMP_crnaw} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnaw/reguls_CRSTMP_crnaw_lastmonth - 1)*100)} %</td>
            <td>${MyFormat.format((reguls_CRSTMP_crnaw/reguls_CRSTMP_crnaw_lastyear - 1)*100)} %</td>
            </tr><tr>
            <td>App</td><td>${reguls_CRSTMP_app} min</td>
            <td>${MyFormat.format((reguls_CRSTMP_app/reguls_CRSTMP_app_lastmonth - 1)*100)} %</td>
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
        let res = `<h2>Délais par causes CRNA: mois ${this.#tab_mois[this.month-1]} - Année ${this.year}</h2>`;
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
        let res = `<h2>Délais par TVs CRNA: ${this.#tab_mois[this.month-1]} - Année ${this.year}</h2>`;
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
        let res = `<h2>Délais par causes APP: ${this.#tab_mois[this.month-1]} - Année ${this.year}</h2>`;
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

    get_monthly_reg() {
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
