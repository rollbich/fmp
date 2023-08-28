/*  ----------------------------------------------------------------------------------
		Stat weekly : 
			@param {string} year - "yyyy"
			@param {integer} week - numero de la semaine à afficher
	-------------------------------------------------------------------------------------*/

class weekly_briefing {
    constructor(year, week, containerId_vols, containerId_reguls, containerId_causes) {
        this.container_vols = $(containerId_vols);
        this.container_reguls = $(containerId_reguls);
        this.container_causes = $(containerId_causes);
        this.year = year;
        this.week = week;
        this.ini_week = week;
        this.lastweek_year = this.get_last_week()[0];
        this.lastweek_week = this.get_last_week()[1];
        this.start_date = convertDate(weekDateToDate(year, week, 1)); // jour du lundi "yyyy-mm-dd"
        this.end_date = convertDate(weekDateToDate(year, week, 1).addDays(6));
        this.init();
    }

    async init() {
        this.flights = new weekly_vols(this.year);
        this.flights_lastyear = new weekly_vols(this.year-1);
        this.flights_2019 = new weekly_vols(2019);
        await this.flights.init();
        await this.flights_lastyear.init();
        await this.flights_2019.init();
        this.reguls = new weekly_regs(this.year);
        this.reguls_lastyear = new weekly_regs(this.year-1);
        this.reguls_2019 = new weekly_regs(2019);
        await this.reguls.init();
        await this.reguls_lastyear.init();
        await this.reguls_2019.init();
    }

    async init_jour() {
        this.data_vols_par_jour = new period_vols(this.start_date, this.end_date, "AE");
        await this.data_vols_par_jour.init();
        this.data_reguls_par_jour = new period_regul(this.start_date, this.end_date, "AE", false);
        await this.data_reguls_par_jour.init();
        this.show_data_vols_jour();
    }

    get_last_week() {
        console.log("Get las week: "+getPreviousWeekNumber(weekDateToDate(this.year, this.week, 1))[0]+" "+getPreviousWeekNumber(weekDateToDate(this.year, this.week, 1))[1])
        return getPreviousWeekNumber(weekDateToDate(this.year, this.week, 1));
    }

    show_data() {
        let sel =  `<select id="year" class="select">`;
        for(let i=2022;i<(this.year+1);i++) {
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
        sel += `</select><br><br>`;
        const change_div = document.createElement('div');
        change_div.setAttribute("id", "bilan_changeWeek");
        this.container_vols.insertAdjacentElement('beforebegin', change_div);
        $('bilan_changeWeek').innerHTML = sel;
        this.show_data_vols();
        this.show_data_reguls();
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
        show_delay_graph_week_par_causes("accueil_causes_cta", this.year, this.week, this.reguls.cause['cta'][this.week-1], "LFMM CTA");
        show_delay_graph_week_par_causes("accueil_causes_app", this.year, this.week, this.reguls.cause['app'][this.week-1], "LFMM APP");
        show_delay_graph_week_par_causes("accueil_causes_est", this.year, this.week, this.reguls.cause['est'][this.week-1], "LFMM Est");
        show_delay_graph_week_par_causes("accueil_causes_west", this.year, this.week, this.reguls.cause['west'][this.week-1], "LFMM West");
        show_delay_graph_week_cumule("accueil_cumule_cta", this.year, this.get_weekly_reg_cumules()['cta'], this.get_weekly_reg_cumules("lastyear")['cta'], this.get_weekly_reg_cumules("2019")['cta'], "LFMM CTA");
        show_delay_graph_week_cumule("accueil_cumule_app", this.year, this.get_weekly_reg_cumules()['app'], this.get_weekly_reg_cumules("lastyear")['app'], this.get_weekly_reg_cumules("2019")['app'], "LFMM APP");
        show_delay_graph_week_cumule("accueil_cumule_est", this.year, this.get_weekly_reg_cumules()['est'], this.get_weekly_reg_cumules("lastyear")['est'], this.get_weekly_reg_cumules("2019")['est'], "LFMM Est");
        show_delay_graph_week_cumule("accueil_cumule_west", this.year, this.get_weekly_reg_cumules()['west'], this.get_weekly_reg_cumules("lastyear")['west'], this.get_weekly_reg_cumules("2019")['west'], "LFMM West");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_cta", this.year, this.get_weekly_CRSTMP_reg_cumules()['cta'], this.get_weekly_CRSTMP_reg_cumules("lastyear")['cta'], this.get_weekly_CRSTMP_reg_cumules("2019")['cta'], "LFMM CTA", "CRSTMP");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_app", this.year, this.get_weekly_CRSTMP_reg_cumules()['app'], this.get_weekly_CRSTMP_reg_cumules("lastyear")['app'], this.get_weekly_CRSTMP_reg_cumules("2019")['app'], "LFMM APP", "CRSTMP");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_est", this.year, this.get_weekly_CRSTMP_reg_cumules()['est'], this.get_weekly_CRSTMP_reg_cumules("lastyear")['est'], this.get_weekly_CRSTMP_reg_cumules("2019")['est'], "LFMM Est", "CRSTMP");
        show_delay_graph_week_cumule("accueil_cumule_CRSTMP_west", this.year, this.get_weekly_CRSTMP_reg_cumules()['west'], this.get_weekly_CRSTMP_reg_cumules("lastyear")['west'], this.get_weekly_CRSTMP_reg_cumules("2019")['west'], "LFMM West", "CRSTMP");
    }

    change_week() {
        $('year').addEventListener('change', async (e) => {
            const current_year = new Date().getFullYear();
            const val = $('year').value;
            const val2 = $('semaine').value;
            this.year = parseInt(val);
            this.week = parseInt(val2);
            if (this.week > this.ini_week && this.year === current_year) {
                this.week = this.ini_week;
                $('semaine').value = this.ini_week;
            }
            this.lastweek_week = this.get_last_week()[1];
            this.lastweek_year = this.get_last_week()[0];
            await this.init();
            this.show_data_vols();
            this.show_data_reguls();
            this.start_date = convertDate(weekDateToDate(this.year, this.week, 1)); // jour du lundi "yyyy-mm-dd"
            this.end_date = convertDate(weekDateToDate(this.year, this.week, 1).addDays(6));
            await this.init_jour();
            this.show_data_vols_jour();
        })
        $('semaine').addEventListener('change', async (e) => {
            const current_year = new Date().getFullYear();
            const val = $('year').value;
            const val2 = $('semaine').value;
            this.year = parseInt(val);
            this.week = parseInt(val2);
            if (this.week > this.ini_week && this.year === current_year) {
                this.week = this.ini_week;
                $('semaine').value = this.ini_week;
            }
            this.lastweek_week = this.get_last_week()[1];
            this.lastweek_year = this.get_last_week()[0];
            this.show_data_vols();
            this.show_data_reguls();
            this.start_date = convertDate(weekDateToDate(this.year, this.week, 1)); // jour du lundi "yyyy-mm-dd"
            this.end_date = convertDate(weekDateToDate(this.year, this.week, 1).addDays(6));
            await this.init_jour();
            this.show_data_vols_jour();
        })
    }

    data_vols() {
        let result = `<h2 class='h2_bilan'>Nombre de vols : semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${this.flights.nbre_vols['cta'][this.week-1]} vols</span><span class="rect">Est : ${this.flights.nbre_vols['est'][this.week-1]} vols</span><span class="rect">West : ${this.flights.nbre_vols['west'][this.week-1]} vols</span><span class="rect">App : ${this.flights.nbre_vols['app'][this.week-1]} vols</span>`;
        result += "<div class='delay'>";
        const lastweek_flights = this.year === this.lastweek_year ? this.flights : this.flights_lastyear; 
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} );
        console.log("lastweek flights");
        console.log(lastweek_flights);
        console.log("week flights");
        console.log(this.flights);
        const a = this.flights.nbre_vols['cta'][this.week-1];
        const b = lastweek_flights.nbre_vols['cta'][this.lastweek_week-1];
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Week</th><th>${this.year-1}</th><th>2019</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.flights.nbre_vols['cta'][this.week-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.week-1]/lastweek_flights.nbre_vols['cta'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.week-1]/this.flights_lastyear.nbre_vols['cta'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.week-1]/this.flights_2019.nbre_vols['cta'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>Est</td><td>${this.flights.nbre_vols['est'][this.week-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.week-1]/lastweek_flights.nbre_vols['est'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.week-1]/this.flights_lastyear.nbre_vols['est'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.week-1]/this.flights_2019.nbre_vols['est'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>West</td><td>${this.flights.nbre_vols['west'][this.week-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.week-1]/lastweek_flights.nbre_vols['west'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.week-1]/this.flights_lastyear.nbre_vols['west'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.week-1]/this.flights_2019.nbre_vols['west'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>App</td><td>${this.flights.nbre_vols['app'][this.week-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.week-1]/lastweek_flights.nbre_vols['app'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.week-1]/this.flights_lastyear.nbre_vols['app'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.week-1]/this.flights_2019.nbre_vols['app'][this.week-1] - 1)*100)} %</td>`;
            res += '</tr>';	
        res += '</tbody></table>';
        
        result += "</div>";
        result += res;
        return result;
    }

    data_reguls() {
        let result = `<h2>Régulations : semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${this.reguls.delay['cta'][this.week-1]} min</span><span class="rect">Est : ${this.reguls.delay['est'][this.week-1]} min</span><span class="rect">West : ${this.reguls.delay['west'][this.week-1]} min</span><span class="rect">App : ${this.reguls.delay['app'][this.week-1]} min</span>`;
        result += "<div class='delay'>";
        const lastweek_reguls = this.year === this.lastweek_year ? this.reguls : this.reguls_lastyear; 
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th><th>2019</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.reguls.delay['cta'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.week-1]/lastweek_reguls.delay['cta'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.week-1]/this.reguls_lastyear.delay['cta'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.week-1]/this.reguls_2019.delay['cta'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>Est</td><td>${this.reguls.delay['est'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.week-1]/lastweek_reguls.delay['est'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.week-1]/this.reguls_lastyear.delay['est'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.week-1]/this.reguls_2019.delay['est'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>West</td><td>${this.reguls.delay['west'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.week-1]/lastweek_reguls.delay['west'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.week-1]/this.reguls_lastyear.delay['west'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.week-1]/this.reguls_2019.delay['west'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>App</td><td>${this.reguls.delay['app'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.week-1]/lastweek_reguls.delay['app'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.week-1]/this.reguls_lastyear.delay['app'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.week-1]/this.reguls_2019.delay['app'][this.week-1] - 1)*100)} %</td>`;
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
        let result = `<h2>Régulations CRSTMP: semaine ${this.week} - Année ${this.year}</h2><br>`;
        result += `<span class="rect">LFMM CTA : ${this.reguls.CRSTMP['cta'][this.week-1]} min</span><span class="rect">Est : ${this.reguls.CRSTMP['est'][this.week-1]} min</span><span class="rect">West : ${this.reguls.CRSTMP['west'][this.week-1]} min</span><span class="rect">App : ${this.reguls.CRSTMP['app'][this.week-1]} min</span>`;
        result += "<div class='delay'>";
        const lastweek_reguls = this.year === this.lastweek_year ? this.reguls : this.reguls_lastyear; 
        const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
        let res = `
        <table class="table_bilan sortable">
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th><th>2019</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.reguls.CRSTMP['cta'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['cta'][this.week-1]/lastweek_reguls.CRSTMP['cta'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['cta'][this.week-1]/this.reguls_lastyear.CRSTMP['cta'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['cta'][this.week-1]/this.reguls_2019.CRSTMP['cta'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>Est</td><td>${this.reguls.CRSTMP['est'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['est'][this.week-1]/lastweek_reguls.CRSTMP['est'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['est'][this.week-1]/this.reguls_lastyear.CRSTMP['est'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['est'][this.week-1]/this.reguls_2019.CRSTMP['est'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>West</td><td>${this.reguls.CRSTMP['west'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['west'][this.week-1]/lastweek_reguls.CRSTMP['west'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['west'][this.week-1]/this.reguls_lastyear.CRSTMP['west'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['west'][this.week-1]/this.reguls_2019.CRSTMP['west'][this.week-1] - 1)*100)} %</td></tr><tr>
            <td>App</td><td>${this.reguls.CRSTMP['app'][this.week-1]} min</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['app'][this.week-1]/lastweek_reguls.CRSTMP['app'][this.lastweek_week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['app'][this.week-1]/this.reguls_lastyear.CRSTMP['app'][this.week-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.CRSTMP['app'][this.week-1]/this.reguls_2019.delay['app'][this.week-1] - 1)*100)} %</td>`;
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
        for (const date of this.data_vols_par_jour.dates_arr) {
            if (typeof this.data_vols_par_jour.vols[date] !== 'undefined') {
                res += '<tr>'; 
                const cl = (jour_sem(date) === "Vendredi" || jour_sem(date) === "Samedi" || jour_sem(date) === "Dimanche") ? "red" : "";
                res += `<td>${reverse_date(date)}</td><td class='${cl}'>${jour_sem(date)}</td><td>${this.data_vols_par_jour.vols[date]['LFMMCTA'][2]}</td><td>${this.data_vols_par_jour.vols[date]['LFMMCTAE'][2]}</td><td>${this.data_vols_par_jour.vols[date]['LFMMCTAW'][2]}</td><td>${this.data_vols_par_jour.vols[date]['LFMMAPP']['flights']}</td>`;
                const cta = this.data_reguls_par_jour.reguls[date]['LFMMFMPE']['tot_delay'] + this.data_reguls_par_jour.reguls[date]['LFMMFMPW']['tot_delay'];
                res += `<td>${cta}</td><td>${this.data_reguls_par_jour.reguls[date]['LFMMFMPE']['tot_delay']}</td><td>${this.data_reguls_par_jour.reguls[date]['LFMMFMPW']['tot_delay']}</td><td>${this.data_reguls_par_jour.reguls[date]['LFMMAPP']['tot_delay']}</td>`;
                res += '</tr>';	
            }
        }
        res += '</tbody></table>';
        result += "</div>";
        result += res;
        return result;
    }

    get_cumul_cause(cause) {
        let cumul_greve = {"cta":0, "est":0, "west":0, "app":0};
        for (let i=1;i<this.week;i++) {
            cumul_greve["cta"] += this.reguls.cause['cta'][i][cause] || 0;
            cumul_greve["est"] += this.reguls.cause['est'][i][cause] || 0;
            cumul_greve["west"] += this.reguls.cause['west'][i][cause] || 0;
            cumul_greve["app"] += this.reguls.cause['app'][i][cause] || 0;
        }
        return cumul_greve;
    }

    bilan_causes_crna() {
        let res = `<h2>Délais par causes CRNA: semaine ${this.week} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>Causes</th><th>CTA</th><th>Est</th><th>West</th><th>Cumul CTA ${this.year}</th><th>Cumul Est ${this.year}</th><th>Cumul West ${this.year}</th></tr></thead>
            <tbody>`;
        Object.keys(this.reguls.cause['cta'][this.week-1]).forEach(key => {
            res += '<tr>';
            const cumul = this.get_cumul_cause(key);
            res += `<td>${key}</td>`;
            res += `<td>${this.reguls.cause['cta'][this.week-1][key]} min</td><td>${this.reguls.cause['est'][this.week-1][key] || 0} min</td><td>${this.reguls.cause['west'][this.week-1][key] || 0} min</td>`;
            res += `<td>${cumul['cta']} min</td><td>${cumul['est']} min</td><td>${cumul['west']} min</td>`;
            res += '</tr>';	
        })
        
        res += '</tbody></table></div>';
        return res;
    }

    bilan_causes_app() {
        let res = `<h2>Délais par causes APP: semaine ${this.week} - Année ${this.year}</h2>`;
        res += "<div class='delay'>";
        res += `<table class="table_bilan">
            <thead><tr class="titre"><th>Causes</th><th>App</th><th>Cumul App ${this.year}</th></tr></thead>
            <tbody>`;
        Object.keys(this.reguls.cause['app'][this.week-1]).forEach(key => {
            res += '<tr>';
            const cumul = this.get_cumul_cause(key);
            res += `<td>${key}</td>`;
            res += `<td>${this.reguls.cause['app'][this.week-1][key] || 0} min</td><td>${cumul['app']} min</td>`;
            res += '</tr>';	
        })
        
        res += '</tbody></table></div>';
        return res;
    }

    get_weekly_reg_cumules(type) {
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
        for(let i=0;i<this.week;i++) { 
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

    get_weekly_CRSTMP_reg_cumules(type) {
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
        for(let i=0;i<this.week;i++) { 
            cta += obj['CRSTMP']['cta'][i];
            result['cta'].push(cta);
            est += obj['CRSTMP']['est'][i];
            result['est'].push(est);
            west += obj['CRSTMP']['west'][i];
            result['west'].push(west);
            app += obj['CRSTMP']['app'][i];
            result['app'].push(app);
        }
        return result;
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
        console.log("monthly vols");
        console.log(this.monthly_vols);
        for(let i=1;i<13;i++) { 
            if (typeof this.monthly_vols['cta'][i] !== 'undefined') vols['cta'].push(this.monthly_vols['cta'][i]);
            if (typeof this.monthly_vols['est'][i] !== 'undefined') vols['est'].push(this.monthly_vols['est'][i]);
            if (typeof this.monthly_vols['west'][i] !== 'undefined') vols['west'].push(this.monthly_vols['west'][i]);
            if (typeof this.monthly_vols['app'] !== 'undefined') if (typeof this.monthly_vols['app'][i] !== 'undefined') vols['app'].push(this.monthly_vols['app'][i]);
        }
        return vols;
    }
}

class monthly_briefing {
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
        this.flights_2019 = new monthly_vols(2019);
        await this.flights.init();
        await this.flights_lastyear.init();
        await this.flights_2019.init();
        this.reguls = new monthly_regs(this.year);
        this.reguls_lastyear = new monthly_regs(this.year-1);
        this.reguls_2019 = new monthly_regs(2019);
        await this.reguls.init();
        await this.reguls_lastyear.init();
        await this.reguls_2019.init();
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
            <thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Month</th><th>Last year</th><th>2019</th><th>Cumuls</th><th>Cumuls Y-1</th><th>Cumuls 2019</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.flights.nbre_vols['cta'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/lastmonth_flights.nbre_vols['cta'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/this.flights_lastyear.nbre_vols['cta'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/this.flights_2019.nbre_vols['cta'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['cta'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['cta'][this.month-1]/this.get_monthly_cumules("lastyear")['cta'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['cta'][this.month-1]/this.get_monthly_cumules("2019")['cta'][this.month-1] - 1)*100)} %</td></tr>
            <tr><td>Est</td><td>${this.flights.nbre_vols['est'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/lastmonth_flights.nbre_vols['est'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/this.flights_lastyear.nbre_vols['est'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/this.flights_2019.nbre_vols['est'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['est'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['est'][this.month-1]/this.get_monthly_cumules("lastyear")['est'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['est'][this.month-1]/this.get_monthly_cumules("2019")['est'][this.month-1] - 1)*100)} %</td></tr><tr>
            <td>West</td><td>${this.flights.nbre_vols['west'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/lastmonth_flights.nbre_vols['west'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/this.flights_lastyear.nbre_vols['west'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/this.flights_2019.nbre_vols['west'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['west'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['west'][this.month-1]/this.get_monthly_cumules("lastyear")['west'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['west'][this.month-1]/this.get_monthly_cumules("2019")['west'][this.month-1] - 1)*100)} %</td></tr><tr>
            <td>App</td><td>${this.flights.nbre_vols['app'][this.month-1]}</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/lastmonth_flights.nbre_vols['app'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/this.flights_lastyear.nbre_vols['app'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/this.flights_2019.nbre_vols['app'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_cumules()['app'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['app'][this.month-1]/this.get_monthly_cumules("lastyear")['app'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_cumules()['app'][this.month-1]/this.get_monthly_cumules("2019")['app'][this.month-1] - 1)*100)} %</td>`;
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
            <thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Month</th><th>Last year</th><th>2019</th><th>Cumuls</th><th>Cumuls Y-1</th><th>Cumuls 2019</th></tr></thead>
            <tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.reguls.delay['cta'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/lastmonth_reguls.delay['cta'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/this.reguls_lastyear.delay['cta'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/this.reguls_2019.delay['cta'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['cta'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['cta'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['cta'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['cta'][this.month-1]/this.get_monthly_reg_cumules("2019")['cta'][this.month-1] - 1)*100)} %</td></tr><tr>
            <td>Est</td><td>${this.reguls.delay['est'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/lastmonth_reguls.delay['est'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/this.reguls_lastyear.delay['est'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/this.reguls_2019.delay['est'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['est'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['est'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['est'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['est'][this.month-1]/this.get_monthly_reg_cumules("2019")['est'][this.month-1] - 1)*100)} %</td></tr><tr>
            <td>West</td><td>${this.reguls.delay['west'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/lastmonth_reguls.delay['west'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/this.reguls_lastyear.delay['west'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/this.reguls_2019.delay['west'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['west'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['west'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['west'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['west'][this.month-1]/this.get_monthly_reg_cumules("2019")['west'][this.month-1] - 1)*100)} %</td></tr><tr>
            <td>App</td><td>${this.reguls.delay['app'][this.month-1]} min</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/lastmonth_reguls.delay['app'][this.lastmonth_month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/this.reguls_lastyear.delay['app'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/this.reguls_2019.delay['app'][this.month-1] - 1)*100)} %</td>
            <td>${this.get_monthly_reg_cumules()['app'][this.month-1]}</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['app'][this.month-1]/this.get_monthly_reg_cumules("lastyear")['app'][this.month-1] - 1)*100)} %</td>
            <td>${MyFormat.format((this.get_monthly_reg_cumules()['app'][this.month-1]/this.get_monthly_reg_cumules("2019")['app'][this.month-1] - 1)*100)} %</td>`;
            res += '</tr>';	
        res += '</tbody></table>';
        
        result += "</div>";
        result += res;
        return result;
    }

    show_data_graphs_annee() {
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}
        show_traffic_graph_mois_cumule("accueil_vols", this.year, listMonth, this.get_monthly_cumules()['cta'], this.get_monthly_cumules("lastyear")['cta'], this.get_monthly_cumules("2019")['cta'], "LFMMCTA");
        show_delay_graph_mois_cumule("accueil_reguls", this.year, listMonth, this.get_monthly_reg_cumules()['cta'], this.get_monthly_reg_cumules("lastyear")['cta'], this.get_monthly_reg_cumules("2019")['cta'], "LFMMCTA");
        show_delay_graph_mois_cumule("accueil_reguls_cumul_app", this.year, listMonth, this.get_monthly_reg_cumules()['app'], this.get_monthly_reg_cumules("lastyear")['app'], this.get_monthly_reg_cumules("2019")['app'], "Approches");
        show_traffic_graph_mois_cumule("accueil_trafic_cumul_app", this.year, listMonth, this.get_monthly_cumules()['app'], this.get_monthly_cumules("lastyear")['app'], this.get_monthly_cumules("2019")['app'], "Approches");
        show_traffic_graph_mois("accueil_trafic_mois_cta", this.year, listMonth, this.flights.nbre_vols['cta'], this.flights_lastyear.nbre_vols['cta'], this.flights_2019.nbre_vols['cta'], "LFMMCTA");
        show_delay_graph_month("accueil_reguls_mois_cta", this.year, listMonth, this.reguls.delay['cta'], this.reguls_lastyear.delay['cta'], this.reguls_2019.delay['cta'], "LFMMCTA",800000);
        show_delay_graph_month("accueil_reguls_mois_est", this.year, listMonth, this.reguls.delay['est'], this.reguls_lastyear.delay['est'], this.reguls_2019.delay['est'], "Zone EST",500000);
        show_delay_graph_month("accueil_reguls_mois_west", this.year, listMonth, this.reguls.delay['west'], this.reguls_lastyear.delay['west'], this.reguls_2019.delay['west'], "Zone WEST",500000);
    }

    show_data_graphs() {
        const listMonth = [];
        for (let k=1;k<13;k++) { listMonth.push(k);}
        show_delay_graph_mois_par_causes("accueil_causes_cta", this.year, this.month, this.reguls.delay_par_cause['cta'][this.month-1], "LFMM CTA");
        show_delay_graph_mois_par_causes("accueil_causes_est", this.year, this.month, this.reguls.delay_par_cause['est'][this.month-1], "LFMM Est");
        show_delay_graph_mois_par_causes("accueil_causes_west", this.year, this.month, this.reguls.delay_par_cause['west'][this.month-1], "LFMM West");
        show_delay_graph_mois_par_causes("accueil_causes_app", this.year, this.month, this.reguls.delay_par_cause['app'][this.month-1], "Approches");
        show_traffic_graph_mois("accueil_trafic_mois_app", this.year, listMonth, this.flights.nbre_vols['app'], this.flights_lastyear.nbre_vols['app'], this.flights_2019.nbre_vols['app'], "Approches");
        show_delay_graph_mois_par_tvs("accueil_tvs_cta", this.year, this.month, this.reguls.delay_par_tvs['cta'][this.month-1], "LFMMCTA");
        show_delay_graph_mois_par_tvs("accueil_tvs_est", this.year, this.month, this.reguls.delay_par_tvs['est'][this.month-1], "Zone EST");
        show_delay_graph_mois_par_tvs("accueil_tvs_west", this.year, this.month, this.reguls.delay_par_tvs['west'][this.month-1], "Zone WEST");
        show_delay_graph_mois_par_tvs("accueil_tvs_app", this.year, this.month, this.reguls.delay_par_tvs['app'][this.month-1], "Approches");
    }

}