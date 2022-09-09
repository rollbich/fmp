// l'année de départ doit être identique à l'année de fin => pas de stat cross année
class stats_period {

	constructor(start_day, end_day, zone) {
        this.start_day = start_day;
		this.end_day = end_day;
		this.year = this.start_day.substr(0,4);
		this.lastyear = (parseInt(this.start_day.substr(0,4))-1).toString();
		this.zone = zone;
        this.dates_arr = get_dates_array(new Date(start_day), new Date(end_day));
		this.error = false;
    }

	async init() {
		const year_fin = this.end_day.substr(0,4);
		if (year_fin == this.year) {
			const start_day_last_year = get_sameday(this.start_day, parseInt(this.lastyear)).toISOString().split('T')[0];
			const end_day_last_year = get_sameday(this.end_day, parseInt(this.lastyear)).toISOString().split('T')[0];
			const start_day2019 = get_sameday(this.start_day, 2019).toISOString().split('T')[0];
			const end_day2019 = get_sameday(this.end_day, 2019).toISOString().split('T')[0];
			this.period = {
				"year": {
					"start_day" : this.start_day,
					"end_day": this.end_day
				},
				"lastyear": {
					"start_day" : start_day_last_year,
					"end_day": end_day_last_year
				},
				"2019": {
					"start_day" : start_day2019,
					"end_day": end_day2019
				}
			}
			const vols_y = new period_vols(this.start_day, this.end_day, this.zone);
			const vols_yly = new period_vols(start_day_last_year, end_day_last_year, this.zone);
			const vols_y2019 = new period_vols(start_day2019, end_day2019, this.zone);
			const regs_y = new period_regul(this.start_day, this.end_day, this.zone, false);
			const regs_yly = new period_regul(start_day_last_year, end_day_last_year, this.zone, false);
			const regs_y2019 = new period_regul(start_day2019, end_day2019, this.zone, false);
			show_popup("Chargement en cours...", "Cela peut prendre jusqu'à 2mn");
			await vols_y.init();
			await vols_yly.init();
			await vols_y2019.init();
			await regs_y.init();
			await regs_yly.init();
			await regs_y2019.init();
			document.querySelector('.popup-close').click();
			this.stats = {
				"year": {
					"vols": vols_y,
					"regs": regs_y
				},
				"lastyear": {
					"vols": vols_yly,
					"regs": regs_yly
				},
				"2019": {
					"vols": vols_y2019,
					"regs": regs_y2019
				}
			}
			console.log(this.stats);
			this.get_total_vols();
			this.get_total_regs();
			//this.show_result_vols_par_annee("accueil_bilan");
			this.show_result_vols("accueil_bilan1");
			this.show_result_regs("accueil_bilan2");
		} else {
			show_popup('Erreur', "L'année de début doit être la même que celle de fin");
			this.error = true;
		}
		
	}

	get_total_vols() {
		this.total_vols = {
			"year": this.stats['year']['vols'].get_period_vols(),
			"lastyear": this.stats['lastyear']['vols'].get_period_vols(),
			"2019": this.stats['2019']['vols'].get_period_vols()
		}
	}

	// @return {"LFMMFMPE": delay, "LFMMFMPW": delay, "LFMMAPP": delay}
	get_total_regs() {
		this.total_regs = {
			"year": this.stats['year']['regs'].get_total_period_delay(),
			"lastyear": this.stats['lastyear']['regs'].get_total_period_delay(),
			"2019": this.stats['2019']['regs'].get_total_period_delay()
		}
		console.log(this.total_regs);
	}

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	async show_result_vols_par_annee(containerId) {
		let res = `
		<h2>Nombre de vols Year: ${reverse_date(this.period.year.start_day)} au ${reverse_date(this.period.year.end_day)}</h2>
		<h2>Nombre de vols Lastyear: ${reverse_date(this.period.lastyear.start_day)} au ${reverse_date(this.period.lastyear.end_day)}</h2>
		<h2>Nombre de vols 2019: ${reverse_date(this.period[2019].start_day)} au ${reverse_date(this.period[2019].end_day)}</h2><br>
		<div class='delay'>
		<table class="regulation sortable">
			<thead><tr class="titre"><th>Année</th><th>CTA</th><th>Est</th><th>West</th><th>App</th></tr></thead>
			<tbody>`;
                
		res += '<tr>'; 
		res +=`<td>${this.year}</td><td>${this.total_vols['year']['cta']}</td><td>${this.total_vols['year']['est']}</td><td>${this.total_vols['year']['west']}</td><td>${this.total_vols['year']['app']}</td>`;
		res += '</tr><tr>';
		res +=`<td>${this.lastyear}</td><td>${this.total_vols['lastyear']['cta']}</td><td>${this.total_vols['lastyear']['est']}</td><td>${this.total_vols['lastyear']['west']}</td><td>${this.total_vols['lastyear']['app']}</td>`;
		res += '</tr><tr>';
		res +=`<td>2019</td><td>${this.total_vols['2019']['cta']}</td><td>${this.total_vols['2019']['est']}</td><td>${this.total_vols['2019']['west']}</td><td>${this.total_vols['2019']['app']}</td>`;
		res += '</tr>';	
	
        res += '</tbody></table>';
		res += '</div>';

		$(containerId).innerHTML = res;
		
	}

	async show_result_vols(containerId) {
		const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} );
		let res = `
		<h2>Dates sélectionnées : ${reverse_date(this.period.year.start_day)} au ${reverse_date(this.period.year.end_day)}</h2>
		<p>Dates équivalentes Year-1: ${reverse_date(this.period.lastyear.start_day)} au ${reverse_date(this.period.lastyear.end_day)} / 
		Dates équivalentes 2019: ${reverse_date(this.period[2019].start_day)} au ${reverse_date(this.period[2019].end_day)}</p><br>
		<table class="table_bilan sortable">
			<thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Vols Y-1</th><th>Vols 2019</th><th>Last year</th><th>2019</th></tr></thead>
			<tbody>`;
		res += '<tr>'; 
		res +=`<td>CTA</td><td>${this.total_vols['year']['cta']}</td>
		<td>${this.total_vols['lastyear']['cta']}</td>
		<td>${this.total_vols['2019']['cta']}</td>
		<td>${MyFormat.format((this.total_vols['year']['cta']/this.total_vols['lastyear']['cta'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_vols['year']['cta']/this.total_vols['2019']['cta'] - 1)*100)} %</td></tr><tr>
		<td>Est</td><td>${this.total_vols['year']['est']}</td>
		<td>${this.total_vols['lastyear']['est']}</td>
		<td>${this.total_vols['2019']['est']}</td>
		<td>${MyFormat.format((this.total_vols['year']['est']/this.total_vols['lastyear']['est'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_vols['year']['est']/this.total_vols['2019']['est'] - 1)*100)} %</td></tr><tr>
		<td>West</td><td>${this.total_vols['year']['west']}</td>
		<td>${this.total_vols['lastyear']['west']}</td>
		<td>${this.total_vols['2019']['west']}</td>
		<td>${MyFormat.format((this.total_vols['year']['west']/this.total_vols['lastyear']['west'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_vols['year']['west']/this.total_vols['2019']['west'] - 1)*100)} %</td></tr><tr>
		<td>App</td><td>${this.total_vols['year']['app']}</td>
		<td>${this.total_vols['lastyear']['app']}</td>
		<td>${this.total_vols['2019']['app']}</td>
		<td>${MyFormat.format((this.total_vols['year']['app']/this.total_vols['lastyear']['app'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_vols['year']['app']/this.total_vols['2019']['app'] - 1)*100)} %</td>`;
		res += '</tr>';	
		res += '</tbody></table>';

		$(containerId).innerHTML = res;
		
	}

	async show_result_regs(containerId) {
		const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} );
		let res = `
		<table class="table_bilan sortable">
			<thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Delay Y-1</th><th>Delay 2019</th><th>Last year</th><th>2019</th></tr></thead>
			<tbody>`;
		res += '<tr>'; 
		res +=`<td>CTA</td><td>${this.total_regs['year']['cta']}</td>
		<td>${this.total_regs['lastyear']['cta']}</td>
		<td>${this.total_regs['2019']['cta']}</td>
		<td>${MyFormat.format((this.total_regs['year']['cta']/this.total_regs['lastyear']['cta'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_regs['year']['cta']/this.total_regs['2019']['cta'] - 1)*100)} %</td></tr><tr>
		<td>Est</td><td>${this.total_regs['year']['est']}</td>
		<td>${this.total_regs['lastyear']['est']}</td>
		<td>${this.total_regs['2019']['est']}</td>
		<td>${MyFormat.format((this.total_regs['year']['est']/this.total_regs['lastyear']['est'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_regs['year']['est']/this.total_regs['2019']['est'] - 1)*100)} %</td></tr><tr>
		<td>West</td><td>${this.total_regs['year']['west']}</td>
		<td>${this.total_regs['lastyear']['west']}</td>
		<td>${this.total_regs['2019']['west']}</td>
		<td>${MyFormat.format((this.total_regs['year']['west']/this.total_regs['lastyear']['west'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_regs['year']['west']/this.total_regs['2019']['west'] - 1)*100)} %</td></tr><tr>
		<td>App</td><td>${this.total_regs['year']['app']}</td>
		<td>${this.total_regs['lastyear']['app']}</td>
		<td>${this.total_regs['2019']['app']}</td>
		<td>${MyFormat.format((this.total_regs['year']['app']/this.total_regs['lastyear']['app'] - 1)*100)} %</td>
		<td>${MyFormat.format((this.total_regs['year']['app']/this.total_regs['2019']['app'] - 1)*100)} %</td>`;
		res += '</tr>';	
		res += '</tbody></table>';

		$(containerId).innerHTML = res;
		
	}

}