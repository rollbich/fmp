// fabrique la ligne des heures du tableau
function heure() {
    let res = "";
    for(var i=0;i<96;i++) {
        if (i%4 == 0) res += `<td class="left_2px bottom_2px">${i/4}</td>`;
        if (i%4 == 2) res += `<td class="left_1px bottom_2px f8px">30</td>`;
        if (i%4 == 1 || (i%4 == 3 && i != 95)) { res += '<td class="bottom_2px"></td>'; } else if (i === 95) res += '<td class="right_2px bottom_2px"></td>';
    }
    return res;
}

// Fabrique la ligne du tour de service
	// on teste si le cds travaille
	// ex : vac = "J1"
function affiche_vac(vac, saison, tour_local, zone) {
    const res = affiche_td_vac(vac, saison, tour_local, zone);
    const cds = (vac == "J2" || vac == "S1") ? "-" : "cds";
	return `<tr><td class='left_2px right_1px'></td><td class='pc right_1px'>${cds}</td>${res[0]}</tr>
               <tr><td class='left_2px right_1px'>${vac}</td><td class='right_1px'>A</td>${res[1]}</tr>
               <tr><td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'>B</td>${res[2]}</tr>`;
}

// sous-routine affichage td
function affiche_td_vac(vac, saison, tour_local, zone) {
	let res1 = "", res2 = "", res3 = "";
	/* Sans compactage */
	tour_local[zone][saison][vac].forEach( (elem, index) => {
		let r1 = elem[1];
		let r2 = elem[2];
		let r3 = elem[3];
		let cl1 = "case", cl2 = "case", cl3="case";
		if (r1 != 0) cl1 = "case bg";
		if (r2 != 0) cl2 = "case bg"; 
		if (r3 != 0) cl3 = "case bg";
		if (index == 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
		if (index%4 === 0) { cl1 += " left_2px"; cl2 += " left_2px"; cl3+= " left_2px"; }
		res1 += `<td class='${cl1}' data-vac='${vac}' data-ligne='1' data-col='${index}'>${r1 || ''}</td>`; // CDS travaille sur position ?
		res2 += `<td class='${cl2}' data-vac='${vac}' data-ligne='2' data-col='${index}'>${r2 || ''}</td>`; // partie A
		res3 += `<td class='${cl3} bottom_2px' data-vac='${vac}' data-ligne='3' data-col='${index}'>${r3 || ''}</td>`; // partie B
	});
    return [res1, res2, res3];
}

async function affiche_tds(zone) {
    const tour_local = await loadJson(tour_json);
    const saison = "hiver";
    let res = `<table class="ouverture">
    <caption>TDS ${saison}</caption>
    <thead>
        <tr class="titre">
            <th class="top_2px left_2px right_1px bottom_2px">Vac</th>
            <th class="top_2px bottom_2px right_1px">Part</th>
            <th class="top_2px bottom_2px left_2px right_2px" colspan="96">...</th>
        </tr>
    </thead>
    <tbody>`;
    res += `${affiche_vac("J1", saison, tour_local, zone)}`;
    res += `${affiche_vac("J3", saison, tour_local, zone)}`;
    res += `${affiche_vac("S2", saison, tour_local, zone)}`;
    res += `${affiche_vac("J2", saison, tour_local, zone)}`;
    res += `${affiche_vac("S1", saison, tour_local, zone)}`;
    res += `${affiche_vac("N", saison, tour_local, zone)}`;
    res += `<tr class="titre"><th class='bottom_2px left_2px right_1px' colspan="2">Heures UTC</th>${heure()}`;

    res += '</tbody></table>';
    $('result').innerHTML = res;
    add_listener(tour_local, saison, zone);
}	

function get_time(col) {
    const h = Math.floor(col/4);
    let min = col%4 === 0 ? "00" : parseInt((col/4).toString().split('.')[1])*15/25;
    min = min === 3 ? "30" : min;
    return h.toString()+":"+min.toString();
}

function add_listener(tour_local, saison, zone) {
    const cases = document.querySelectorAll('.case');
    for (const td of cases) {
		td.addEventListener('click', function(event) {
            let lig = this.dataset.ligne;
		    let col = this.dataset.col;
		    let vac = this.dataset.vac;	
            const t = get_time(col);
            let t0 = tour_local[zone][saison][vac][col][0];
            let t1 = tour_local[zone][saison][vac][col][1];
            let t2 = tour_local[zone][saison][vac][col][2];
            let t3 = tour_local[zone][saison][vac][col][3];
            if (this.innerHTML === '1') { 
                this.innerHTML = ''; 
                this.classList.remove('bg');
                if (lig === '1') {
                    tour_local[zone][saison][vac][col] = [t0, 0, t2, t3];
                }
                if (lig === '2') {
                    tour_local[zone][saison][vac][col] = [t0, t1, 0, t3];
                }
                if (lig === '3') {
                    tour_local[zone][saison][vac][col] = [t0, t1, t2, 0];
                }
                console.log("vac: "+vac+"  col: "+col+"  lig: "+lig);
                console.log(tour_local[zone][saison][vac]);
            } else {
                this.innerHTML = '1'; 
                this.classList.add('bg');
                if (lig === '1') {
                    tour_local[zone][saison][vac][col] = [t0, 1, t2, t3];
                }
                if (lig === '2') {
                    tour_local[zone][saison][vac][col] = [t0, t1, 1, t3];
                }
                if (lig === '3') {
                    tour_local[zone][saison][vac][col] = [t0, t1, t2, 1];
                }
                console.log("vac: "+vac+"  col: "+col+"  lig: "+lig);
                console.log(tour_local[zone][saison][vac]);
            }   
        });
    }
    $('button_save').addEventListener('click', function(event) {
        post_tds_json("export_to_json.php", tour_local);
    })
}

