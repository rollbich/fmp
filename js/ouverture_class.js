class ouverture extends schema_rea {

// on ne compte pas les ouvertures techniques < x minutes
    constructor(containerId, day, zone) {
        super(day, zone);
        this.container = $(containerId);
        this.ouv_tech = 4;
        this.show_ouverture();
    }

/*  --------------------------------------------------------------------------------------------- 
	  Lit le schema réalisé, affiche le tableau des ouvertures et ajoute les 'clicks' sur les TV
	    @param {string} containerId - Id du conteneur
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE ou "AW"
	--------------------------------------------------------------------------------------------- */
// 
    async show_ouverture() {
        this.schema = await this.read_schema_realise();	
        this.show_table_ouverture();
        this.add_ouverture_listener();
    }

/*  ------------------------------------------------------------------------------
	  Affiche la table du schema d'ouvertures dans le container
	 	@param {object} schema - objet schéma
		@param {HTMLElement} container - HTML Element du conteneur
	------------------------------------------------------------------------------ */
    show_table_ouverture() {
        let res = `<table class="ouverture">
                        <caption>Journée du ${this.schema.date}</caption>
                        <thead>
                        <tr class="titre"><th>Début</th><th>Fin</th><th>Nb sect.</th><th class="colspan">Confs</th></tr>
                    </thead>
                    <tbody>`;
                            
        this.schema.ouverture.forEach(row => {
                                
            res += '<tr>'; 
            for(let j=1;j<4;j++) { res += `<td>${row[j]}</td>`; }					
            row[4].forEach(tv => {
                let r = this.get_ouverture_totale(tv, time_to_min(row[1]), time_to_min(row[2]));
                res += `<td class="tv" data-tv="${tv}" data-deb="${r[0]}" data-fin="${r[1]}">${tv}</td>`;
            });
            res += '</tr>';
                                    
        });
        res += '</tbody></table>';
        res += `<div class="max">Max secteurs : ${this.schema.max_secteurs}</div>`;
                            
        this.container.innerHTML = res;
    }

/*  -------------------------------------------------------------------------------- 
		Ajoute le click event pour afficher H20/Occ sur les cellules possédant :
		- la class "tv"
		- la propriété data-tv
		- la propriété data-deb
		- la propriété data-fin
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE" ou "AW"
		
	ex : <td class="tv" data-tv="RAEE" data-deb="04:33" data-fin="07:30">RAEE</td>
	-------------------------------------------------------------------------------- */

    async add_ouverture_listener() {
        try {	
            const tds = document.querySelectorAll('.tv');
            
            let reg;
            const h20 = await get_h20_b2b(this.day, this.zone, this.schema); //  {	date: { tv: [ ["heure:min": trafic], ... ] } }
            const occ = await get_occ_b2b(this.day, this.zone, this.schema);
            const h = h20[this.day];
            const o = occ[this.day];

            for (const td of tds) {
                let deb = td.dataset.deb;
                let fin = td.dataset.fin;
                let tv = td.dataset.tv;
                            
                td.addEventListener('click', function(event) {
                    let data = [];
                    let dataAxis = [];	
                    let data_occ = [];
                    let dataAxis_occ = [];
                    //try {
                        h[tv].forEach(value => {
                            if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
                                dataAxis.push(value[0]);
                                data.push(value[1]);
                            }
                        });	
                        o[tv].forEach(value => {
                            if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
                                dataAxis_occ.push(value[0]);
                                data_occ.push(value[1]);
                            }
                        });	
                        
                        let peak = o[tv][0][2];
                        let sustain = o[tv][0][3];			
                        if (data.length === 0) { 
                            if (data_occ.length === 0) {
                                document.getElementById('graph-container-h20').classList.add('off');
                                document.getElementById('graph-container-occ').classList.add('off');
                                show_popup("Pas de données","La plage horaire est indisponible");
                            } else {
                                document.getElementById('graph-container-occ').classList.remove('off');
                                show_popup("Le H20 n'est pas calculable","Le TV n'a ouvert assez longtemps et/ou n'est dans la plage horaire disponible ou n'est pas récupéré"); 
                                show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
                                show_h20_graph('graph_h20', dataAxis, data, 0, "NO DATA");
                            }
                        } else {
                            document.getElementById('graph-container-h20').classList.remove('off');
                            document.getElementById('graph-container-occ').classList.remove('off');
                            let mv = h[tv][0][2];
                            show_h20_graph('graph_h20', dataAxis, data, mv, tv);
                            show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
                        }
                    //}
                    /*
                    catch (err) {
                        show_popup("Attention ! ", "Les données du TV: "+tv+" n'ont pas été récupérées en B2B.");
                    }
                    */
                })
            }
        }
        catch (err) {
            const tds = document.querySelectorAll('.tv');
            for (const td of tds) {
                td.classList.remove('tv');
            }
            show_popup("Accès aux graphes impossible", "Les données n'ont pas été récupérées en B2B.");
        }
    }

/*  ------------------------------------------------------------------------------
	  Récupère la plage maximale d'ouverture d'un TV
	 	@param {object} schema - objet schéma
		@param {string} tv - nom du TV
		@param {string} deb - heure de début
		@param {string} fin - heure de fin
		@returns {array} - [heure 1ère ouverture du TV, heure de fermeture du TV]
	------------------------------------------------------------------------------ */
// ex : le nbre de secteur vient de passer à 6 et AB était ouvert entre 10:14 (deb) et 10:35 (fin)
// mais AB était déjà ouvert depuis 08:00 et restera ouvert jusqu'à 17:35 => on récupère ["08:00", "17:35"] 
    get_ouverture_totale(tv, deb, fin) {
        let datad = "", dataf =  "";
        for(let j=0;j<this.schema["tv_h"][tv].length;j++) {
            if (deb >= this.schema["tv_h"][tv][j][0]-this.ouv_tech && fin <= this.schema["tv_h"][tv][j][1]+this.ouv_tech) {
                datad = min_to_time(this.schema["tv_h"][tv][j][0]);
                dataf = min_to_time(this.schema["tv_h"][tv][j][1]);
                break;
            } 																		
        }
        return [datad, dataf];
    }

}