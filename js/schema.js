class schema_rea {

/*  -----------------------------------------------
        @param type (string) - "cautra" ou "4F"
    ----------------------------------------------- */

    constructor(day, zone) {
        this.day = day;
        this.zone = zone;
        let type = "cautra";
		const d = new Date(this.day);
		const date4f = new Date("2022-12-06");
		if (d >= date4f || this.day === "2022-11-22")  { type = "4F"; }
        this.type = type;
        this.ouv_tech = 4;
    }

/*  ----------------------------------------------------------------------------------------------------------------
	Parse fichier Courage schéma réalisé .rea
 	ouverture en heure UTC, 1440 min = 24h
 	COUR-20210513.AW.sch.rea

	@param {string} day - "yyyy-mm-dd"

	@param {string} zone - "AE" ou "AW"
 	@returns {object} schema
 	  schema = {
		date:  {day: ..., month: ..., year: ... },
		max_secteurs: nbre secteurs max sur la journée,
		ouverture: [ jj-mm-aaaa, heure_début, heure_fin, nbr_secteurs, [noms des TV, position] ]
		tv: [ liste des tv]
        position: { position: [ [heure_deb, heure_fin, TV], ...}
		tv_h: { tv: [ [heure_deb en min, heure_fin en min], [heure_deb, heure_fin] ...] }  = heure ouverture par tv
 	}
	---------------------------------------------------------------------------------------------------------------- */
    
    async read_schema_realise() {
        if (this.type === "4F") return await this.read_schema_realise_4f();
        if (this.type === "cautra") return await this.read_schema_realise_cautra();
    }
    
    async read_schema_realise_cautra() {
        if (this.day === null) throw new Error("Le jour est indéfini");
        const fichier_courage = dir+"Realise/"+this.get_courage_filename(this.day, this.zone);
        const schema = {};
        schema.ouverture = [];
        // tableau des TV ouverts
        schema.tv = [];
        schema.date = get_date_from_courage_file(fichier_courage);
        schema.max_secteurs = 0;
        schema.tv_h = {};
        schema.position = {};
        
        try { 
        const contenu = await fetch(`/${fichier_courage}`).then( async (response) => {
            if (response.ok) { // entre 200 et 300
            return Promise.resolve(response)
            } else {
            const date = get_date_from_courage_file(fichier_courage);
            const z = this.zone === "AE" ? "EST" : "OUEST";
            if (response.status == 404) { 
                //return Promise.reject(new Error(`Le fichier courage ${z} du ${date} n'existe pas`)); 
                show_popup(`Fichier courage ${z}`, `Le fichier du ${date} n'existe pas`);
		        await wait(1000);
		        document.querySelector('.popup-close').click();
                console.log(`Fichier courage ${z} : Le fichier du ${date} n'existe pas`);
            }
            //return Promise.reject(new Error('Erreur'+response.statusText))
            }
        }); 
        const response = await contenu.text();
        // un bloc commencant par 10 est une ouverture/fermeture de secteurs
        const table = response.split("10 ?");
        // enlève les données d'entête
        table.shift();
        
        // récupère l'heure de début et de fin codés en minutes depuis 00h00
        table.forEach(row => {
            const ouverture = row.split('\n'); // retour ligne
            let h = ouverture[0].split(' ');
        // le tableau h contient des valeurs string vides, il faut les supprimer
        removeItemAll(h, '');
            // sert pour tv_h
            const tv_h_d = Math.max(parseInt(h[1]), 0);
            const tv_h_f = parseInt(h[2]);
                
            // si l'heure de fin est une heure ronde, enlève 1 minute
            if (parseInt(h[2]) % 60 === 0) h[2]--;
            let h_debut = parseInt(h[1]) < 0 ? "00:00" : min_to_time(parseInt(h[1]));
            let h_fin = min_to_time(parseInt(h[2])); 
            
            let temp = [schema.date, h_debut, h_fin];
            // enlève le 1er élément du tableau => il ne reste que les ouvertures
            ouverture.shift();
            // enlève le dernier élément vide du tableau s'il existe (à cause des retours ligne)
            ouverture.forEach( el => {
                if (el === '') {
                    //console.log("pop");
                    ouverture.pop();
                }
            });
            // ajoute le nb de secteurs ouverts
            temp.push(ouverture.length);
            
            // extrait les TVs ouverts
            let ouv = [];
            let pos = '';
            // on peut avoir des tv = ????? dans ce cas on met isok à false pour ne pas ajouter temp dans les ouverture
            let isOk = true;
            ouverture.forEach( el => {
                if (el != '') {
                    pos = el.substr(3,3);
                    let sub_tv = el.substr(7,5).trimStart();
                    // Correctif il peut arriver que la position s'apelle P10 et le TV = ????
                    // dans ce cas on 10 ???? alors que ce n'est pas une nouvelle ligne et une ouverture et h[1] = '-1'
                    if (sub_tv === '?????' || (h[1] === '-1' && parseInt(h[2]) < 27)) { isOk = false; } 
                    else { // ajoute dans la liste des tv
                        schema.tv.push(sub_tv);
                        // remplit les heures ouverts pour chaque TV et chaque position
                        if (!(schema["tv_h"].hasOwnProperty(sub_tv))) { 
                            schema["tv_h"][sub_tv] = [];
                        }
                        if (!(schema["position"].hasOwnProperty(pos))) { 
                            schema["position"][pos] = [];
                        }
                        if (isOk == true) {
                            schema["tv_h"][sub_tv].push([tv_h_d, tv_h_f]);
                            schema["position"][pos].push([tv_h_d, tv_h_f,sub_tv]);
                        }
                        ouv.push([sub_tv, pos]);
                    }
                    
                }
            });
                
                // on teste aussi si c'est pas une manip ou erreur (ouverture < x minute)
                if (isOk != false) {
                    // calcul du nbre max de secteurs
                    schema.max_secteurs = Math.max(schema.max_secteurs, ouverture.length);
                    // trier temp par ordre alphabétique
                    let arr_ouv = this.zone === "AE" ? tri_salto(ouv, "est") : tri_salto(ouv, "ouest");
                    temp.push(arr_ouv);
                    schema.ouverture.push(temp);
                }
        })
       
        // parfois on a le même TV 2 fois de suite => concaténer les 2 lignes en 1 en étendant l'heure de la 1ère ligne, à faire 2 fois car parfois il y a 3 fois le même TV
        // le faire uniquement si la position est inchangée
        this.doublon(schema);
        this.doublon(schema);
        this.correct_technical_opening(schema);
        this.correct_technical_opening(schema);
        this.doublon(schema);
        // enlève les doublons du tableau des TV
        schema.tv = [...new Set(schema.tv)];
        console.log("Schema");
        console.log(schema);
        return schema;
        }
        
        catch (err) {
            //alert(err.message);
        }
        
    }

    async get_4f(day, zone) { 
        try {
            let response = await fetch("../php/get_rea_4f.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "zone": zone, "day": day})
            })
            return response;
        }
        
        catch (err) {
            alert('Get 4F Load json error: '+err.message);
        }
    }

    async read_schema_realise_4f() {
        if (this.day === null) throw new Error("Le jour est indéfini");
        const schema = {};
        schema.ouverture = [];
        // tableau des TV ouverts
        schema.tv = [];
        schema.date = reverse_date(this.day);
        schema.max_secteurs = 0;
        schema.tv_h = {};
        schema.position = {};
        
        try { 
            const z = this.zone.substring(1,2);
            const json_4f = await this.get_4f(this.day, z).then( async (response) => {
                if (response.ok) { // entre 200 et 300
                    return Promise.resolve(response.json())
                } else {
                    if (response.status == 404) { 
                        show_popup(`Fichier courage ${z}`, `Le fichier du ${schema.date} n'existe pas`);
                        await wait(1000);
                        document.querySelector('.popup-close').click();
                        console.log(`Fichier courage ${z} : Le fichier du ${schema.date} n'existe pas`);
                    }
                }
            }); 
            console.log("Contenu 4F");
            // force le démarrage à minuit
            json_4f["mapping"][0]['start_time'] = '00:00';
            // ajout des heures de fin
            for (var i = 1; i < json_4f["mapping"].length; i++) {
                json_4f["mapping"][i-1]['end_time'] = json_4f["mapping"][i]['start_time'];
            }
            // termine le mapping à 23:59
            json_4f["mapping"][json_4f["mapping"].length - 1]['end_time'] = '23:59';
            console.log(json_4f);
        
            json_4f["mapping"].forEach(mapping_obj => { 
                let tv_h_d = mapping_obj.start_time;
                let tv_h_f = mapping_obj.end_time;
                let tv_h_d_minutes = time_to_min(tv_h_d);
                let tv_h_f_minutes = time_to_min(tv_h_f);
                let temp = [schema.date, tv_h_d, tv_h_f];
                // ajoute le nb de secteurs ouverts
                temp.push(mapping_obj.pos.length);
                // extrait les TVs ouverts
                let ouv = [];
                mapping_obj.pos.forEach( el => {
                    let sub_tv = el.pos_regroup;
                    let pos = el.pos_name;
                    // remplit les heures ouverts pour chaque TV et chaque position
                    if (!(schema["tv_h"].hasOwnProperty(sub_tv))) { 
                        schema["tv_h"][sub_tv] = [];
                    }
                    if (!(schema["position"].hasOwnProperty(pos))) { 
                        schema["position"][pos] = [];
                    }
                    schema["tv_h"][sub_tv].push([tv_h_d_minutes, tv_h_f_minutes]);
                    schema["position"][pos].push([tv_h_d, tv_h_f,sub_tv]);
                    ouv.push([sub_tv,el.pos_name]);
                    schema.tv.push(sub_tv);
                })
                // calcul du nbre max de secteurs
                schema.max_secteurs = Math.max(schema.max_secteurs, mapping_obj.pos.length);
                // trier temp par ordre alphabétique
                let arr_ouv = this.zone === "AE" ? tri_salto(ouv, "est") : tri_salto(ouv, "ouest");
                temp.push(arr_ouv);
                schema.ouverture.push(temp);
            })
               
            // parfois on a le même TV 2 fois de suite => concaténer les 2 lignes en 1 en étendant l'heure de la 1ère ligne, à faire 2 fois car parfois il y a 3 fois le même TV
            // le faire uniquement si la position est inchangée
            this.doublon(schema);
            this.doublon(schema);
            this.doublon(schema);
            this.doublon(schema);
            this.doublon(schema);
            this.doublon_position(schema);
            // enlève les doublons du tableau des TV
            schema.tv = [...new Set(schema.tv)];
            console.log("Schema");
            console.log(schema);
            return schema;
        }
        catch (err) {
            alert(err.message);
        }
        
    }

    /*  -------------------------------------------------------------
	 construit le nom du fichier courage en fonction de la date
	 example nom_fichier : "COUR-20210516.AE.sch.rea";
	 dd[0] = année, dd[1] = mois
	  @param {string} day - "yyyy-mm-dd"
	  @param {string} zone - "AE" ou "AW"
	------------------------------------------------------------- */
    get_courage_filename() {
        let d = this.day.replace(/-/g, '');
        let dd = this.day.split("-");
        return `${dd[0]}/${dd[1]}/COUR-${d}.${this.zone}.sch.rea`;
    }

    get_4f_filename() {
        const d = this.day.replace(/-/g, '');
        const dd = this.day.split("-");
        const z = this.zone.substring(1,2);
        return `${dd[0]}/${dd[1]}/${d}_000000_LFMM-${z}.xml`;
    }

/*  ---------------------------------------------------
      Fusionne 2 ouvertures à la suite identiques
	 	@param {object} schema - array non trié
		@returns {array} - array filtré
	--------------------------------------------------- */
    doublon(schema) {
        for(let i=0;i<schema.ouverture.length-1;i++) {
            //let i = 0;
            // si le nbr de secteurs est identique 2 fois de suite
            if (schema.ouverture[i][3] == schema.ouverture[i+1][3]) {
                // on vérifie que ce sont les mêmes TV
                // on créé une true copy des 2 tableaux (sinon les données originales sont altérées à cause du passage par référence)
                let tvs1 = [...schema.ouverture[i][4]];
                let tvs2 = [...schema.ouverture[i+1][4]];
                // on trie le tableau et on l'aplatit en strings pour les comparer
                // ex doublon le 4 juillet 2019 à l'est : tvs1.sort().toString() = AB12,P22,AB34,P20,EK,P02,GY,P08,SBAM,P18
                if (tvs1.sort().toString() == tvs2.sort().toString()) {
                    const temp_array = [schema.ouverture[i][0], schema.ouverture[i][1], schema.ouverture[i+1][2], schema.ouverture[i][3], schema.ouverture[i][4]];
                    // on remplace la ligne i dans le tableau et on supprime la ligne i+1 du tableau
                    schema.ouverture.splice(i, 1, temp_array);
                    schema.ouverture.splice(i+1, 1);
                }
            }
        }
    }

/*  ---------------------------------------------------
      Fusionne 2 positions à la suite identiques
        @param {object} schema - array non trié
        @returns {array} - array filtré
    --------------------------------------------------- */
    // pas fini
    doublon_position(schema) {
        // tableau des positions utilisées
        const positions = Object.keys(schema.position);
        console.log("Positions");
        console.log(positions);
        positions.forEach(pos => {
            console.log(schema.position[pos]);
            for(let i=0;i<schema.position[pos].length-1;i++) {
                // si le TV est identique 2 fois de suite
                if (schema.position[pos][i][2] == schema.position[pos][i+1][2]) {
                    const temp_array = [schema.position[pos][i][0], schema.position[pos][i+1][1], schema.position[pos][i+1][2]];
                    // on remplace la ligne i dans le tableau et on supprime la ligne i+1 du tableau
                    schema.position[pos].splice(i, 1, temp_array);
                    schema.position[pos].splice(i+1, 1);
                }
            }
    })
    }

/*  -------------------------------------------------------------------------------
	  corrige les heures de debut lorsque des ouvertures techniques sont détectées
      (sauf pour schema.position : même les ouvertures technique sont gardées)
	   ex : ex 15:37 - 15:56	  puis 15:56 - 15:58  (ouverture technique)
	 	@param {object} schema - array non trié
		@returns {array} - array filtré
	------------------------------------------------------------------------------- */
// ne pas l'inclure cette fonction dans doublon pour faire 1 seule boucle car doublon modifie la longueur du tableau => bug
    correct_technical_opening(schema) {
        for(let i=0;i<schema.ouverture.length-1;i++) {

            // heures du créneau courant
            let current_deb = schema.ouverture[i][1];
            let current_fin = schema.ouverture[i][2];
            // heure du créneau suivant
            let next_deb = time_to_min(schema.ouverture[i+1][1]);
            let next_fin = time_to_min(schema.ouverture[i+1][2]);
            let diff = next_fin - next_deb;
            if (diff < this.ouv_tech) {
                // [date, heure_deb, heure_fin, nbre_sec, [TV], [position]]
                const temp_array = [schema.ouverture[i][0], current_deb, min_to_time(next_fin), schema.ouverture[i][3], schema.ouverture[i][4]];
                schema.ouverture.splice(i, 1, temp_array);
                schema.ouverture.splice(i+1, 1);
            }
        }
        
        // tv : [ [heure_deb en min, heure_fin en min], [heure_deb, heure_fin] ...]
        // on joint les secteurs en continu (heure de fin = heure de début du créneau suivant +- ouv_tech minutes)
        for(let tv in schema["tv_h"]) {
            const arr = schema["tv_h"][tv];
            // on ne teste que si le tv a été ouvert au - 2 fois
            if (arr.length > 1) {
                for(let i=0;i<arr.length-1;i++) {
                    let d1 = arr[i][1];
                    let d2 = arr[i+1][0];
                    // si moins de ouv_tech minutes, l'ouverture n'est pas pris en compte
                    if (d2 - d1 < this.ouv_tech) {
                        const temp_array = [ arr[i][0], arr[i+1][1] ];
                        arr.splice(i, 1, temp_array);
                        arr.splice(i+1, 1);
                        i--;
                    }
                }
            }
        }
        
    }		

}