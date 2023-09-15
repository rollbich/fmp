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

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// moyenne de nombre dans un array
function numAverage(arr) {
	let b = arr.length,
		c = 0, i;
	for (i = 0; i < b; i++){
	  c += Number(a[i]);
	}
	return c/b;
}

// arrondi à 2 chiffres après la virgule
const round = value => {
	return Math.round(value*100)/100;
}

// force + devant un positif
class SignedFormat extends Intl.NumberFormat {
	constructor(...args) { super(...args) }
	format(x) {
	  let y = super.format(x);
	  return x < 0 ? y : '+' + y;
	}
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

// function wait
function wait(t) {
	return new Promise((r) => setTimeout(r, t));
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

// get minutes from a date
function get_minutes(date) {
	var h = date.getHours()*60;
	var m = date.getMinutes();
	return h+m;
  }

// inverse le sens de la date: 2021-12-25 => 25-12-2012
const reverse_date = day => {
	let d = day.split("-");
	return `${d[2]}-${d[1]}-${d[0]}`
}

// ecart entre la date du jour et une autre date en jours
Date.prototype.ecartJour = function(dat) {
	return Math.round((dat.getTime()-this.getTime())/(1000*3600*24));
}

// ecart entre 2 dates en jours
const ecart_date = (dat1, dat2) => {
	return Math.round((dat2.getTime()-dat1.getTime())/(1000*3600*24));
}

// clone une date
Date.prototype.clone = function() { 
	return new Date(this.getTime()); 
};

// ajoute x jours à une date
Date.prototype.addDays= function(nb_day) {
	this.setDate(this.getDate() + nb_day);
	this.setHours(3); // on met 3h, enlève le pb au passage à l'heure d'été
	return this;
}

Date.prototype.getDaysInMonth = function() {
	// Janvier = 0
	//jour 0 is the last day in the previous month
	return new Date(this.getFullYear(), this.getMonth()+1, 0).getDate();
}

// ajoute x jours à un string yyyy-mm-dd
const addDays_toString = (day, nb_day) => {
	return new Date(day).addDays(nb_day).toISOString().split('T')[0];
}

const jplus1 = day => {
	return new Date(day).addDays(1).toISOString().split('T')[0];
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

// jour de la semaine
// "2021-02-28" => monday
const jour_sem = day => {
	const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
	return jours[new Date(day).getDay()];
}

// Récupère le même jour de la semaine équivalente d'une année passée
// day : date de depart "2021-03-28"
// year : année passée où on veut récupérer le jour correspondant
const get_sameday = (day, year) => {
	const d = new Date(day);
	console.log("Day: "+d);
	const j = d.getDate();
	const m = d.getMonth();
	const y = d.getFullYear();
	const js = d.getDay();
	// on approxime le jour equivalent
	let past_d = new Date(day);
	past_d = d.addDays(-365.25*(y-year));
	let past_d_js = past_d.getDay();
	// ecart entre les jours de la semaine de day et past_d
	const ecart = past_d_js - js;
	console.log("ecart: "+ecart);
	// on corrige pour avoir le même jour de la semaine
	past_d = past_d.addDays(-ecart);
	console.log("past_day: "+past_d);
	const past_d_month = past_d.getMonth();
	const past_d_jour = past_d.getDate();
	// Calcul de l'écart en jour entre les 2 journées (on fixe une année quelconque pour le calcul)
	const d1 = new Date(year, past_d_month, past_d_jour);
	const d2 = new Date(year, m, j);
	const ecart2 = ecart_date(d1, d2);
	// Si abs(ecart) > 3, ce n'est pas le jour le plus proche, il faut ajouter/enlever 7 jours 
	if (ecart2 > 3) {
		past_d = past_d.addDays(7);
	}
	if (ecart2 < -3) {
		past_d = past_d.addDays(-7);
	}
	console.log("result: "+past_d);
	return past_d;
}

/* For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 */
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
}

function getPreviousWeekNumber(d) {
	d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	return getWeekNumber(d.addDays(-7));
}

function getPreviousMonthNumber(d) {
	let m = d.getMonth();
	let y = d.getFullYear();
	return m === 1 ? [y-1, 12] : [y, m-1];
}

function isLeapYear(year) {
	if (year % 400 === 0) return true;
	if (year % 100 === 0) return false;
	return year % 4 === 0;
}

//calcul du nbre de semaine de l'année
function isoWeeksInYear(year) {
    const isLeapYearr = isLeapYear(year);
    const last = new Date(year, 11, 31);
    const day = last.getDay();
    if (day === 4 || (isLeapYearr && day === 5)) {
      return 53
    }
    return 52
}

// idem (testée : résultat identique à la précédente)
function weeksInYear(year) {
    let d = new Date(year, 11, 31);
    let week = getWeekNumber(d)[1];
    return week == 1 ? 52 : week;
}

// getDay => dimanche = 0
// Dimanche = 0,...,Samedi = 6 ==> Lundi = 0,..., Dimanche = 6
const getZeroBasedIsoWeekDay = date => (date.getDay() + 6) % 7
// ==> Lundi = 1,..., Dimanche = 7
const getIsoWeekDay = date => getZeroBasedIsoWeekDay(date) + 1

// retourne la date correspondante au jour de la semaine, de la semaine week et de l'année year
// weekDay = 1 pour lundi.... = 7 pour dimanche
function weekDateToDate(year, week, weekDay) {
    const zeroBasedWeek = week - 1
    const zeroBasedWeekDay = weekDay - 1
    let days = (zeroBasedWeek * 7) + zeroBasedWeekDay

    // Dates start at 2017-01-01 and not 2017-01-00
    days += 1

    const firstDayOfYear = new Date(year, 0, 1)
    const firstIsoWeekDay = getIsoWeekDay(firstDayOfYear)
    const zeroBasedFirstIsoWeekDay = getZeroBasedIsoWeekDay(firstDayOfYear)

    // If year begins with W52 or W53
    if (firstIsoWeekDay > 4) days += 8 - firstIsoWeekDay
    // Else begins with W01
    else days -= zeroBasedFirstIsoWeekDay
	// month = 0 car days est compris entre 1 et 365
    return new Date(year, 0, days)
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
  
/*  --------------------------------------------
	 formate la date: 2021-12-25 => 25122021 
	-------------------------------------------- */
const remove_hyphen_date = day => {
	return day.replace(/-/g, '');
}

/*	---------------------------------------------------------
		Charge un fichier json  
			@param {string} url
	--------------------------------------------------------- */
async function loadJson(url) { 
  
  var myHeaders = new Headers();
  myHeaders.append('pragma', 'no-cache');
  myHeaders.append('cache-control', 'no-cache');

  var myInit = {
    method: 'GET',
    headers: myHeaders,
  };

  try {
	let response = await fetch(url, myInit);
	// Intégration de la vérif sans utiliser loadJson.then() car le then() interfère avec await
	if (response.ok) { // entre 200 et 300
		return Promise.resolve(response.json())
	  } else {
		// l'erreur est transmise au bloc catch de loadJson
		if (response.status == 404) { return Promise.reject(new Error(`Le fichier ${response.url} n'existe pas`)); }
		return Promise.reject(new Error('Erreur: '+response.statusText))
	} 
  }
  catch (err) {
	console.error('Error loadJson : '+err.message);
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
	document.querySelector('.popup-box').style.top = window.innerHeight/2 + window.scrollY + 'px';
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
	  récupère l'heure en fonction du numéro de colonne 
	 	@param {integer} col - Numéro de la colonne du tds
		@returns {string} - "hh:mm"
	------------------------------------------------------------------------------ */
function get_time(col) {
    const h = formattedNumber(Math.floor(col/4));
    let min = col%4 === 0 ? "00" : parseInt((col/4).toString().split('.')[1])*15/25;
    min = min === 3 ? "30" : min;
    return h.toString()+":"+min.toString();
}

/* -------------------------------------------------------------------------------------
		Cookie 
	ex : setCookie({ name: 'count', value: 100, duration: 300 });   // 300s, 5 minutes
		 const count = getCookie('count', parseInt);
		
		 For storing array inside cookie : 
		setter : var json_str = JSON.stringify(arr); setCookie('mycookie', json_str);
		getter : getCookie('mycookie'); var arr = JSON.parse(json_str);
   ------------------------------------------------------------------------------------- */

const setCookie = (options) => {
  	const { name, value = '', path = '/', duration = 3600 } = options;
  	const durationMs = duration * 1000;
  	const expires = new Date(Date.now() + durationMs);
  	document.cookie = `${name}=${escape(value)}; expires=${expires.toUTCString()}; path=${path}`;
}

const getCookie = (name, cast = String) => {
  	if (document.cookie.length == 0) return;

  	const match = document.cookie.match(`${name}=(?<value>[\\w]*);?`);
  	if (!match) return;

  	const value = match?.groups?.value ?? '';
	return cast(unescape(value));
}

const cookieExists = (name) => {
  return getCookie(name) !== undefined;
}

const deleteCookie = (name) => {
  setCookie({ name: name, value: undefined, duration: -1});
}

/* ----------------------------------------
		tester existence url 
   ---------------------------------------- */
async function isUrlFound(url) {
	try {
	  const response = await fetch(url, {
		method: 'HEAD',
		cache: 'no-cache'
	  });
  
	  return response.status === 200;
  
	} catch(error) {
	  // console.log(error);
	  return false;
	}
  }