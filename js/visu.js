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
        this.init();
        //console.log(this.h);
    }

    async init() {
        this.show_slider();
        for (const label_h of this.heure_slider) {
            await this.get_graph(label_h);
        }
    }

    async get_graph(label_h) {
        let t = label_h.dataset.heure;
        let tt = t.replace(/:/g, '');
        if (t === "23:59") {
            this.h[tt] = await get_visu_h20(this.day, this.zone, "");
            this.o[tt] = await get_visu_occ(this.day, this.zone, "");
        } else {
            this.h[tt] = await get_visu_h20(this.day, this.zone, tt);
            this.o[tt] = await get_visu_occ(this.day, this.zone, tt);
        }
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
        let li = `<div class="range"></div>
		<ul class="range-labels">
		<li class="heure" data-heure="03:20">03:20</li>
        <li class="heure" data-heure="04:20">04:20</li>
        <li class="heure" data-heure="06:20">06:20</li>
        <li class="heure" data-heure="08:20">08:20</li>
        <li class="heure" data-heure="10:20">10:20</li>
        <li class="heure" data-heure="12:20">12:20</li>
        <li class="heure" data-heure="14:20">14:20</li>
        <li class="heure" data-heure="16:20">16:20</li>
        <li class="heure active selected" data-heure="23:59">23:59</li>
        </ul>`;
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
            box.addEventListener('click', (event) => {
                let tv = box.dataset.tv;
                let data = [];
                let dataAxis = [];	
                let data_occ = [];
                let dataAxis_occ = [];
                let full_time = document.querySelector(".selected").dataset.heure;
                const time = full_time.replace(/:/g, '');
                try {
                    this.h[time][tv].forEach(value => {
                        dataAxis.push(value[0]);
                        data.push(value[1]);
                    });
                    
                    this.o[time][tv].forEach(value => {
                        dataAxis_occ.push(value[0]);
                        data_occ.push(value[1]);
                    });	
                    
                    let peak = this.o[time][tv][0][2];
                    let sustain = this.o[time][tv][0][3];			

                    document.getElementById('graph-container-h20').classList.remove('off');
                    document.getElementById('graph-container-occ').classList.remove('off');
                    let mv = this.h[time][tv][0][2];
                    show_h20_graph('graph_h20', dataAxis, data, mv, tv, full_time);
                    show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv, full_time);
                    
                }
                
                catch (err) {
                    show_popup("Attention ! ", `Les données du TV: ${tv} vu à ${full_time} n'ont pas été récupérées en B2B.`);
                }
            })
        }
    }
}