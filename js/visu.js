class visu {

    /*  -------------------------------------------------------------
        @param {string} containerId - Id du conteneur
            @param {string} day - "yyyy-mm-dd"
            @param {string} zone - "AE ou "AW"
    ----------------------------------------------------------------- */
    constructor(day, zone) {
        this.day = day;
        this.zone = zone;
        //this.container = $(containerId);
        this.h = {};
        this.o = {};
        this.heures = {
            "02:00": true, "02:20": true, "03:00": true, "03:20": true,
            "04:00": true, "04:20": true, "05:00": true, "05:20": true,
            "06:00": true, "06:20": true, "07:00": true, "07:20": true,
            "08:00": true, "08:20": true, "09:00": true, "09:20": true, 
            "10:00": true, "10:20": true, "11:00": true, "11:20": true, 
            "12:00": true, "12:20": true, "13:00": true, "13:20": true,
            "14:00": true, "14:20": true, "15:00": true, "15:20": true, 
            "16:00": true, "16:20": true, "17:00": true, "17:20": true, 
            "18:00": true, "18:20": true, "19:00": true, "19:20": true, 
            "20:00": true, "20:20": true, "21:00": true, "21:20": true, "23:59": true };
        this.init();
        //console.log(this.h);
    }

    async init() {
        show_popup("Loading graphs", "");
        for (const [ key, value ] of Object.entries(this.heures)) {
            await this.get_graph(key);
        }
        await this.show_tvs();
        document.querySelector('.popup-close').click();
        this.show_slider();
        this.add_slider_listener();
        this.show_graphs();
    }

    async get_graph(t) {
        let tt = t.replace(/:/g, '');
        if (t === "23:59") {
            this.h[tt] = await get_visu_h20(this.day, this.zone, "");
            this.o[tt] = await get_visu_occ(this.day, this.zone, "");
        } else {
            this.h[tt] = await get_visu_h20(this.day, this.zone, tt);
            this.o[tt] = await get_visu_occ(this.day, this.zone, tt);
        }
        if (this.h[tt] === 'undefined') this.heures[t] = false;
        console.log(t);
        console.log(this.h[tt]);
        console.log(this.o[tt]);
    }

    async show_tvs() {
        const url_tvs = "../b2b/TV_count.json";
        const liste_tvs =  await loadJson(url_tvs);
        const tv_zone = this.zone === "AE" ? "TV-EST" : "TV-OUEST";
        let tvs = liste_tvs[tv_zone];
        let table = "";
        tvs.forEach(tv => {
            table += `<div class='visu-liste-tvs' data-tv='${tv}'>${tv}</div>`;
        })
        $('tvs').innerHTML = table;
    }

    show_slider() {
        let li = '<div class="range"></div><ul class="range-labels">';
        for (const [ key, value ] of Object.entries(this.heures)) {
            if (value === true && key !== "23:59") li += `<li class="heure" data-heure="${key}">${key}</li>`;   
            //if (value === false) li += `<li class="heure" data-heure="${key}">--:--</li>`; 
            if (value === true && key === "23:59") li += `<li class="heure active selected" data-heure="23:59">23:59</li>`;
        }
        li += '</ul>';
        $('timeline').innerHTML = li;
        this.heure_slider = document.querySelectorAll('.heure');
    }

    add_slider_listener() {
        for (const label_h of this.heure_slider) {
            label_h.addEventListener('click', (event) => {
                let t = label_h.dataset.heure;
                t = t.replace(/:/g, '');
                for (const li of this.heure_slider) {
                    li.classList.remove('active');
                    li.classList.remove('selected');
                }
                label_h.classList.add('active');
                label_h.classList.add('selected');
            })
        }
    }

    async show_visu() {
        await this.show_tvs();
        this.add_slider_listener();
        this.show_graphs();
    }

    show_graphs() {
        const box_tv = document.querySelectorAll('.visu-liste-tvs');
        for (let box of box_tv) {
            box.addEventListener('click', async (event) => {
                let tv = box.dataset.tv;
                let data = [];
                let dataAxis = [];	
                let data_occ = [];
                let dataAxis_occ = [];
                let full_time = document.querySelector(".selected").dataset.heure;

                const time = full_time.replace(/:/g, '');
                console.log("Time: "+time);
                const reg = new regul(this.day, this.zone, false);
                await reg.init();
                const regbytv = reg.get_regbytv();

                const z = this.zone === "AE" ? "est" : "ouest";
                const d = convertDate(new Date);
                const mv_b2b = new mv(d, z);
                let mv_4f = await mv_b2b.get_b2b_mvs();

                let data_reg_h20 = [];
                let data_reg_occ = [];
                let data_reg_h20_delay = []; 
                let data_reg_h20_reason = []; 
                let data_reg_occ_delay = [];
                console.log("regreg");
                console.log(regbytv);
                try {
                    this.h[time][tv].forEach(value => {
                        dataAxis.push(value[0]);
                        data.push(value[1]);
                        if (typeof regbytv[tv] !== 'undefined') { // tv qui ont eu des reguls
                            let r;
                            let cause;
                            let delay;
                            regbytv[tv].forEach(elem => {
                                if (time_to_min(elem[0]) > time_to_min("04:00") && time_to_min(elem[1]) < time_to_min("23:59")) {
                                    console.log(tv);
                                    if (time_to_min(elem[1]) >= time_to_min(value[0]) && time_to_min(elem[0]) <= time_to_min(value[0])) {
                                        r = elem[2]; 
                                        cause=  elem[3];
                                        delay = elem[4];  
                                    } 
                                } 
                            });
                            data_reg_h20.push(r);
                            data_reg_h20_delay.push(delay);
                            data_reg_h20_reason.push(cause);
                        }
                    });

                    console.log(dataAxis);
                    console.log(data_reg_h20);

                    this.o[time][tv].forEach(value => {
                        dataAxis_occ.push(value[0]);
                        data_occ.push(value[1]);
                        if (typeof regbytv[tv] !== 'undefined') { // tv qui ont eu des reguls
                            let r;
                            let cause;
                            let delay;
                            regbytv[tv].forEach(elem => {
                                if (time_to_min(elem[0]) > time_to_min("04:00") && time_to_min(elem[1]) < time_to_min("23:59")) {
                                    console.log(tv);
                                    if (time_to_min(elem[1]) >= time_to_min(value[0]) && time_to_min(elem[0]) <= time_to_min(value[0])) {
                                        r = elem[2];   
                                        cause=  elem[3];
                                        delay = elem[4];  
                                    } 
                                } 
                            });
                            data_reg_occ.push(r);
                            data_reg_occ_delay.push(delay);
                        }
                    });	
                    
                    let peak = this.o[time][tv][0][2];
                    let sustain = this.o[time][tv][0][3];			

                    document.getElementById('graph-container-h20').classList.remove('off');
                    document.getElementById('graph-container-occ').classList.remove('off');
                    const full_tv = "LFM"+tv;
                    let mv = mv_4f[full_tv][0]["capacity"];
                    let mv_ods = this.h[time][tv][0][2];
                    show_h20_graph('graph_h20', dataAxis, data, mv, mv_ods, tv, full_time, data_reg_h20, data_reg_h20_delay, data_reg_h20_reason);
                    show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv, full_time, data_reg_occ, data_reg_occ_delay);
                    
                }
                
                catch (err) {
                    show_popup("Attention ! ", `Les données du TV: ${tv} vu à ${full_time} n'ont pas été récupérées en B2B.`);
                    console.log(err);
                }
            })
        }
    }
}

/*	---------------------------------------------------------------------------------------------------
	 get H20 depuis nos fichiers récupérés en B2B à partir de 06:00 local (05:00 ou 04:00 UTC) 
		 on charge le tableau [ [TV, yyyy-mm-dd, hh:mm, mv, h20], ...] du json H20
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE" ou "AW"
		@param {string} time - "12h20"
		@returns {object} 
		 result : {
			tv: [ ["heure:min": trafic], ... ], ...
		 }
	//	ex	{ RAE: [ ["04:00": "4"], ["04:20": "15"] ... ], AB: [ ["00:00": "5"], ... }
	-------------------------------------------------------------------------------------------------- */
async function get_visu_h20(day, zone, time = "") {
    const date = day.replace(/-/g, ''); // yyyymmdd
    const year = day.substring(0,4);
    const month = date.substring(4,6);
    const area = zone === "AE" ? "est" : "west";
    let url = "";
    if (time == "") {
        url = `../b2b/json/${year}/${month}/${date}-H20-${area}.json`; 
    } else {
        const h = time.substring(0,2);
        const mn = time.substring(2,4);
        url = `../b2b/json/${year}/${month}/${date}-H20-${area}-${h}h${mn}.json`;	
    }
    const resp = await loadJsonB2B(url, "H20", zone);
    if (typeof resp === 'undefined') return 'undefined';	
    result = {};
        
    resp.forEach( arr => {
                        
        const tv = arr[0];
        const time = arr[2];
        const time_min = time_to_min(arr[2]);
        const mv = arr[3];
        const h20 = arr[4];
                            
        if (!(result.hasOwnProperty(tv))) { 
            result[tv] = [];
        }
        
        result[tv].push([time, h20, mv]);
                        
    });
    
    return result;
}

/*	---------------------------------------------------------------------------------------------------
	 get Occ depuis nos fichiers récupérés en B2B à partir de 06:00 local (05:00 ou 04:00 UTC) 
		 on charge le tableau [ [TV, yyyy-mm-dd, hh:mm, peak, sustain, occ], ...] du json Occ
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE" ou "AW"
		@returns {object} 
		 result : {
			tv: [ ["heure:min": trafic], ... ], ... }
		 }
	//	ex	{ RAE: [ ["04:00": "4"], ["04:01": "5"] ... ], AB: [ ["00:00": "5"], ... }
	-------------------------------------------------------------------------------------------------- */
async function get_visu_occ(day, zone, time = "") {
    const date = day.replace(/-/g, ''); // yyyymmdd
    const year = day.substring(0,4);
    const month = date.substring(4,6);
    const area = zone === "AE" ? "est" : "west";
    let url = "";
    if (time == "") {
        url = `../b2b/json/${year}/${month}/${date}-Occ-${area}.json`; 
    } else {
        const h = time.substring(0,2);
        const mn = time.substring(2,4);
        url = `../b2b/json/${year}/${month}/${date}-Occ-${area}-${h}h${mn}.json`;	
    }
    const resp = await loadJsonB2B(url, "OCC", zone);
    if (typeof resp === 'undefined') return 'undefined';
    const result = {};
    
    resp.forEach( arr => {			
        const tv = arr[0];
        const time = arr[2];
        const time_min = time_to_min(arr[2]);
        const peak = arr[3];
        const sustain = arr[4];
        const occ = arr[5];		
                        
        if (!(result.hasOwnProperty(tv))) { 
            result[tv] = [];
        }
        
        result[tv].push([time, occ, peak, sustain]);
                                    
    });	
    return result;
    
}