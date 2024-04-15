/*  ----------------------------------------------------
	  		tableau des TVset
	---------------------------------------------------- */
const lfmm_tvset = ["LFMMFMPE", "LFMMFMPW", "LFMMAPP"];
const lfbb_tvset = ["LFBBFMP", "LFBBAPP"];
const lfee_tvset = ["LFEEFMP", "LFEEAPP"];
const lfff_tvset = ["LFFFFMPE", "LFFFFMPW", "LFFFAD"];
const lfrr_tvset = ["LFRRFMP", "LFRRAPP"];
const dsna_tvset = ["LFDSNA"];


/*  -------------------------------------------------------------------------
		{
			"ATC_STAFFING": 318,
			"WEATHER": 728
		}
		CRSTMP causes : ATC capacity (C), Routeing (R), Staffing (S), 
		Equipment (T), Airspace management (M) and Special events (P)
	------------------------------------------------------------------------- */


class period_regul_bdd {
	/*  -------------------------------------------------------------------------------------------------	
			@param {string} start_day - "yyyy-mm-dd"
			@param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "est", "west" ou "app"
		------------------------------------------------------------------------------------------------- */
        
	#tab_CRSTMP = ["ATC_CAPACITY", "ATC_ROUTINGS", "ATC_STAFFING", "ATC_EQUIPMENT", "AIRSPACE_MANAGEMENT", "SPECIAL_EVENT"];

	constructor(zone, start_day, end_day) {
		this.start_day = start_day;
		this.end_day = end_day;
		this.zone = zone;
        this.dates_arr = get_dates_array(new Date(start_day), new Date(end_day));
	}
	
    async init() {
		this.reguls = await this.get_reguls();
		this.reguls_by_day = this.get_reguls_by_day();
		this.tot_delay = this.get_total_period_delay();
		this.tot_CRSTMP_delay = this.get_total_period_CRSTMP_delay();
		this.delay_by_cause = this.get_total_period_delay_by_cause();
		this.reg_by_tv = this.get_regbytv();
	}

	/*	------------------------------------------------------------------------------------------------------
			@return	[{
				"id": 2139,
				"jour": "2023-09-01",
				"typejour": "Vendredi",
				"regId": "ME301",
				"tv": "LFME3",
				"debut": "2023-09-01 07:20",
				"fin": "2023-09-01 11:40",
				"delay": 201,
				"reason": "ATC_CAPACITY",
				"impactedFlights": 103,
				"creation": "[{"time":"2023-09-01 04:56","debut":"2023-09-01 07:20","fin":"2023-09-01 11:40","rates":[{"start":"2023-09-01 07:20","end":"2023-09-01 11:40","rate":32}]}]",
				"updates": "[]",
				"deletion": "",
				"rates": "[{"start":"2023-09-01 07:20","end":"2023-09-01 11:40","rate":32}]"
				}, {...}]
		------------------------------------------------------------------------------------------------------ */
    async get_reguls() {
        const cles = {
            "start_day": this.start_day, 
            "end_day": this.end_day,
            "zone": this.zone,
            "fonction": "get_reguls"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            if (!response.ok) { // pas entre 200 et 300
                throw new Error("Network response was not OK");
            }
            return await response.json();
        }
        catch (err) {
            console.error(err);
            alert(err);
        }
	}

	/*  --------------------------------------------------------------------------------------
        idem que prédemmant mais classé par date
        S'il n'y a aucune regul un jour alors la clé de ce jour n'existe pas
        @return {
            "jour1": [{regul1}, {regul2}, ...],
            "jour2": ...
        }
    ------------------------------------------------------------------------------------------ */
	get_reguls_by_day() {
		const result = {};
		for (let regul of this.reguls) {
			if (result.hasOwnProperty(regul.jour)) {
				result[regul.jour].push(regul);
			} else {
				result[regul.jour] = [];
				result[regul.jour].push(regul);
			}
		}
		return result;
	}

	get_total_period_delay() {
		let delay = 0;
		for (let regul of this.reguls) {
			delay += regul.delay;
		}
		return delay;
	}

	get_total_period_CRSTMP_delay() {
		let delay = 0;
		for (let regul of this.reguls) {
			const reason = regul.reason;
			if (this.#tab_CRSTMP.includes(reason)) {
				delay += regul.delay;
			}
		}
		return delay;
	}

	/*	-------------------------------------------------------
			@return {
				"cause1": minutes,
				"cause2": minutes
				...
			}
		------------------------------------------------------- */
	get_total_period_delay_by_cause() {
		let delay_by_cause = {};
		for (const regul_arr of Object.values(this.reguls_by_day)) {
			for (let regul of regul_arr) {
				const reason = regul.reason;
				const delay = parseInt(regul.delay);
				if (delay_by_cause.hasOwnProperty(reason)) {
					delay_by_cause[reason] += delay;
				} else {
					delay_by_cause[reason] = delay;
				}
			}
		}
		return delay_by_cause;
	}

	/*	-------------------------------------------------------
			@return {
				"tv1": minutes,
				"tv2": minutes
				...
			}
		------------------------------------------------------- */
	get_regbytv() {
        const regbytv = {};
		for (const regul_arr of Object.values(this.reguls_by_day)) {
			for (let regul of regul_arr) {
				let tv = regul.tv;
				const delay = parseInt(regul.delay);
				if (regbytv.hasOwnProperty(tv)) {
					regbytv[tv] += delay;
				} else {
					regbytv[tv] = delay;
				}
			}
		}
		return regbytv;
	}

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	show_result_reg(containerId) {
		let delays = `<h2>Delay : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2><br>`;
		delays += "<div class='delay' style='flex-direction: column'>";
		let res = `
		<table class="sortable">
			<caption>LFMM-${this.zone} : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
		
        for (const regul_arr of Object.values(this.reguls_by_day)) {
			for (let regul of regul_arr) {
				const day = regul.jour;
				const deb = extract_time(regul.debut);
				const fin = extract_time(regul.fin);
				const id = regul.regId;
				const tv = regul.tv;
				const reason = regul.reason;
				const delay = regul.delay;
				const impactedFlights = regul.impactedFlights;
				res += '<tr>'; 
				res +=`<td>${reverse_date(day)}</td><td id='${id}' data-creation='${regul.creation}' data-update='${regul.updates}' data-deletion='${regul.deletion}' data-rates='${regul.rates}' class='hover_reg_id'>${id}</td><td>${tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${delay}</td><td>${reason}</td><td>${impactedFlights}</td>`;
				res += '</tr>';	
			}
            
        }
        res += '</tbody></table>';
		
		delays += `<span class="rect">Total delay : ${this.tot_delay} mn</span>`;
		for (let [cause, minutes] of Object.entries(this.delay_by_cause)) {
			delays += `<div class="cause">${cause} : ${minutes} mn</div>`;
		}
		delays += res;
		$(containerId).innerHTML = delays;
		
		const td_reg_id = document.querySelectorAll('.hover_reg_id');
		td_reg_id.forEach(td_el => {
			td_el.addEventListener('mouseover', (event) => {
				const reg_id = td_el.id;
				const el = document.createElement('div');
				el.setAttribute('id', 'popratereg');
				let contenu = reg_id+"<br>";
				let creation = null;
				let update = null;
				let deletion = td_el.dataset.deletion;
				let rates = null;
				if (td_el.dataset.creation !== "{}") {
					creation = JSON.parse(td_el.dataset.creation)[0];
				}
				if (td_el.dataset.update !== "[]") {
					update = JSON.parse(td_el.dataset.update);
				}
				if (td_el.dataset.rates !== "[]") {
					rates = JSON.parse(td_el.dataset.rates);
				}
				
				if (creation !== null) {
					let r = "";
					creation.rates.forEach(rate => {
						r += " *"+extract_time(rate.start)+"-"+extract_time(rate.end)+" Rate: "+rate.rate+"<br>";
					})
					contenu += "CREATION on " + creation.time + "<br>"+ r +"<br>";
				}
				if (update !== null) {
					update.forEach(obj => {
						let r = "";
						obj.rates.forEach(rate => {
							r += " *"+extract_time(rate.start)+"-"+extract_time(rate.end)+" Rate: "+rate.rate+"<br>";
						})
						contenu += "UPDATE on " + obj.time + "<br>" + r + "<br>";
					})
				}
				if (deletion !== "") {
					contenu += "DELETION on " + deletion + "<br>";
				}
				contenu += "<br>";
				
				const pos = td_el.getBoundingClientRect();
				const tabl = td_el.parentNode.parentNode.parentNode.getBoundingClientRect();
				el.style.position = 'absolute';
				el.style.left = tabl.right + 30 + 'px';
				el.style.top = pos.top - 50 + window.scrollY + 'px';
				el.style.backgroundColor = '#d99';
				el.style.padding = '10px';
				el.style.width = '250px';
				let parentDiv = td_el.parentNode;
				parentDiv.insertBefore(el, $('globalcontainer'));
				el.innerHTML = contenu;
			})
			td_el.addEventListener('mouseleave', (event) => {
				$('popratereg').remove();
			})
		})
		
	}
}

