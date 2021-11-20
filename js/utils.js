/*  --------------------------
		Utils Généraux
	-------------------------- */

// short getElementById
const $ = (id) => {
	var el = document.getElementById(id);
	if (!el) return null;
	return el;
}

// short querySelector
const $$ = document.querySelector.bind(document);

// Teste si objet est vide
function isObjEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// arrondi à 2 chiffres après la virgule
const round = value => {
	return Math.round(value*100)/100;
}

// force un affichage à 2 chiffres : 2 => 02 (utile pour formater les h ou les min)
const formattedNumber = (valueint) => {
	return fnb = ("0".repeat(1) + valueint).slice(-2);
}

// supprime toutes les occurences de la valeur value d'un tableau
const removeItemAll = (arr, value) => {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}

/*  -----------------------------------------
 				 Utils date 
	----------------------------------------- */

// convertit une date en yyyy-mm-dd
function convertDate(date) {
	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth()+1).toString();
	var dd  = date.getDate().toString();
  
	var mmChars = mm.split('');
	var ddChars = dd.split('');
  
	return yyyy + '-' + (mmChars[1]?mm:"0"+mmChars[0]) + '-' + (ddChars[1]?dd:"0"+ddChars[0]);
  }

// inverse le sens de la date: 2021-12-25 => 25-12-2012
const reverse_date = day => {
	let d = day.split("-");
	return `${d[2]}-${d[1]}-${d[0]}`
}

// ecart entre 2 dates en jours
Date.prototype.ecartJour = function(dat) {
	return Math.round((dat.getTime()-this.getTime())/(1000*3600*24));
}

// ajoute x jours à une date
Date.prototype.addDays= function(nb_day) {
	this.setDate(this.getDate() + nb_day);
	return this;
}

// enlève 1 journée à une date "2021-12-25" => "2021-12-24"
const jmoins1 = day => {
	return new Date(day).addDays(-1).toISOString().split('T')[0];
}
  
const jmoins7 = day => {
	return new Date(day).addDays(-7).toISOString().split('T')[0];
}
  
const jmoins728 = day => {
	return new Date(day).addDays(-728).toISOString().split('T')[0];
}

// minutes depuis minuit => return "xx:xx"
const min_to_time = time => {
	return formattedNumber(Math.floor(time/60))+":"+formattedNumber(time%60);
}

// "xx:yy" => return le temps en  minutes depuis minuit
const time_to_min = str_time => {
	let t = str_time.split(":");
	return parseInt(t[0])*60+parseInt(t[1]);
}

// "xx:yy" => return un array [xx:yy-21, xx+1:yy]
const get_ouv_1h = str_time => {
	let tdeb = min_to_time(time_to_min(str_time)-21);
	let t = tdeb.split(":");
	let hplus1 = parseInt(t[0])+1;
	let plus1 = formattedNumber(hplus1)+':'+formattedNumber(t[1]);
	let result = [tdeb, plus1];
	if (hplus1 > 23) result = ["22:39", "23:59"];
	return result;
}

/*	-------------------------------------------------------
	Récupère dans un tableau les dates entre 2 dates
	  @param {object} start_date - Objet Date
	  @param {object} end_date - Objet Date 
	  @returns {array} - ["2021-06-21", "2021-06-22", ...]
	------------------------------------------------------- */
const get_dates_array = (start_date, end_date) => {
	const arr = [];
	for(dt=new Date(start_date); dt<=end_date; dt.setDate(dt.getDate()+1)){
		month = '' + (dt.getMonth() + 1),
		day = '' + dt.getDate(),
		year = dt.getFullYear();

		if (month.length < 2) 
			month = '0' + month;
		if (day.length < 2) 
			day = '0' + day;
		
		arr.push([year, month, day].join('-'));
	}
	return arr;
}

//  utils dates regulations
/*  -----------------------------------------------------------
	 extrait l'heure d'un string du type "2021-07-17 11:40" 
	----------------------------------------------------------- */
const extract_time = date => {
	return date.substr(11,5);
}
	
//  utils graph.js  
/*  --------------------------------------------
	 formate la date: 20211225 => 25-12-2021 
	-------------------------------------------- */
const hyphen_date = day => {
	let y = day.substr(0,4);
	let m = day.substr(4,2);
	let d = day.substr(6,2);
	return `${d}-${m}-${y}`
}

/*	---------------------------------------------------------
		Charge un fichier json  
			@param {string} url
	--------------------------------------------------------- */
async function loadJson(url) { 
  try {
	let response = await fetch(url).then(rep_status); 
    let json = await response.json(); 
    return json;
  }
  catch (err) {
	alert('Error message: '+err.message);
  }
}

// vérifie la réception du fichier
function rep_status(response) {
	if (response.ok) { // entre 200 et 300
	  return Promise.resolve(response)
	} else {
	  // l'erreur est transmise au bloc catch de loadJson
	  if (response.status == 404) { return Promise.reject(new Error(`Le fichier ${response.url} n'existe pas`)); }
	  return Promise.reject(new Error('Erreur: '+response.statusText))
	}
  }

/*	---------------------------------------------------------
		Exporte le fichier json au format Excel xlsx 
			@param {string} url
			@param {object} json - son à sauvegarder
		util overload
	 	stocke dans fmp/overload/xls/2021
	--------------------------------------------------------- */
function export_json_to_xls(url, json) {
	var data = {
		method: "post",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(json)
	};
	fetch( url, data)
	.then(function(response) {
		return response.text().then(function(texte) {
			const data = texte.split(" ");
			const nom = data[1].split("/");
			if (data[0] === "OK") { 
				show_popup("Export réussi", `Cliquer pour télécharger le fichier<br><a href='php/download_file.php?filename=${data[1]}'>${nom[3]}</a>`); 
			}
			else { show_popup("Erreur d'écriture", "Vérifier le fichier dans le dossier xls"); }
		});
	});
}

/*	---------------------------------------------------------
		Sauve le fichier json du tds 
			@param {string} url
			@param {object} json - son à sauvegarder
	--------------------------------------------------------- */
function post_tds_json(url, json) {
	var data = {
		method: "post",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(json)
	};
	fetch( url, data)
	.then(function(response) {
		return response.text().then(function(texte) {

		});
	});
}

/*	---------------------------------------------------------
		Affiche une Pop-up générique 
			@param {string} text1 - Titre
			@param {string} text2 - Contenu HTML
	--------------------------------------------------------- */
function show_popup(text1, text2) {
	
	document.getElementById('popup-wrap').classList.remove('off');
	document.querySelector('.popup-box h2').innerHTML = text1;
	document.querySelector('.popup-box h3').innerHTML = text2;
    
	document.querySelector('.popup-box').classList.remove('transform-out');
	document.querySelector('.popup-box').classList.add('transform-in');
	
}

/*  ------------------------------------------------------------
	  récupère la date contenue dans le nom du fichier courage 
	  utils ouverture et upload
		@param {string} fichier - Nom du fichier
	 	@returns {string} - "yyyy-mm-dd"
	 example nom_fichier : "COUR-20210516.AE.sch.rea";
	------------------------------------------------------------ */
const get_date_from_courage_file = fichier => {
	let file = fichier.split('COUR-');
	let year = file[1].substr(0,4);
	let month = file[1].substr(4,2);
	let day = file[1].substr(6,2);
	return [day, month, year].join('-');
}

/*  ------------------------------------------------------------------------------
	  récupère l'heure en fonction du numéro de colonne (ne sert pas finalement)
	 	@param {integer} col - Numéro de la colonne du tds
		@returns {string} - "hh:mm"
	------------------------------------------------------------------------------ */
function get_time(col) {
    const h = Math.floor(col/4);
    let min = col%4 === 0 ? "00" : parseInt((col/4).toString().split('.')[1])*15/25;
    min = min === 3 ? "30" : min;
    return h.toString()+":"+min.toString();
}