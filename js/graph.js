/*	------------------------------ 
------------ JSON B2B----------------- 
	------------------------------	*/

/*	-------------------------------------------------
		Charge un fichier json H20 ou OCC
			@param {string} url
			@param {string} type - "H20" ou "Occ"
			@param {zone} zone - "AE ou "AW"
	------------------------------------------------- */
async function loadJsonB2B(url, type, zone) { 
  try {
	let response = await fetch(url).then(rep_status_B2B); 
    let json = await response.json(); 
    return json;
  }
  catch (err) {
	const z = zone === "AE" ? "EST" : "OUEST";
	//alert(`Erreur ${type} zone ${z} : ${err.message}`);
  }
}

/*	-------------------------------------------
	  vérifie la réception du fichier H20/Occ
	  	@param {promise} response
		@returns {promise}
	------------------------------------------- */
function rep_status_B2B(response) {
	if (response.ok) { // entre 200 et 300
		return Promise.resolve(response)
	} else {
		const d = response.url.split('json/');
		const date = hyphen_date(d[1].substr(0,8));
		// l'erreur est transmise au bloc catch de loadJsonB2B
		if (response.status == 404) { return Promise.reject(new Error(`Le fichier B2B du ${date} n'existe pas`)); }
		return Promise.reject(new Error('Erreur: '+response.statusText))
	}
}

/*  -----------------------------------------------------------------------
	marge pour montrer le H20 : 15 minutes
	ex : si un TV ouvre à 15h45, on va afficher le H20 à partir de 15h30
		 pour que la donnée H20 de 15h40 soit affichée
	----------------------------------------------------------------------- */
const graph_margin = 15;

/*	---------------------------------------------------------------------------------------------------
	 get H20 depuis nos fichiers récupérés en B2B à partir de 06:00 local (05:00 ou 04:00 UTC) 
		 on charge le tableau [ [TV, yyyy-mm-dd, hh:mm, mv, h20], ...] du json H20
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE" ou "AW"
		@returns {object} 
		 result : {
			date: { tv: [ ["heure:min": trafic], ... ] }
		 }
	//	ex	"2021-06-21": { RAE: [ ["04:00": "4"], ["04:20": "15"] ... ], AB: [ ["00:00": "5"], ... }
	-------------------------------------------------------------------------------------------------- */
async function get_h20_b2b(day, zone, schema = undefined) {
	console.log("get_h20");
	console.log(schema);
	if (typeof schema === 'undefined') schema = await read_schema_realise(day, zone);
	const date = day.replace(/-/g, ''); // yyyymmdd
	const area = zone === "AE" ? "est" : "west";
	
	const url = `../b2b/json/${date}-H20-${area}.json`;	
	const resp = await loadJsonB2B(url, "H20", zone);
		
	result = {};
	result[day] = {};
	
	resp.forEach( arr => {
						
		const tv = arr[0];
		const time = arr[2];
		const time_min = time_to_min(arr[2]);
		const mv = arr[3];
		const h20 = arr[4];
			
		if (schema["tv_h"].hasOwnProperty(tv)) {
							
			if (!(result[day].hasOwnProperty(tv))) { 
				result[day][tv] = [];
			}
								
			let open = schema["tv_h"][tv].some( elem => {
				const deb = elem[0];
				const fin = elem[1];
				if (time_min>= deb-graph_margin && time_min+59 < fin+graph_margin) return true;
				return false;
			});
			
			if (open === true) result[day][tv].push([time, h20, mv]);
				
		}
						
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
			date: { tv: [ ["heure:min": trafic], ... ] }
		 }
	//	ex	"2021-06-21": { RAE: [ ["04:00": "4"], ["04:01": "5"] ... ], AB: [ ["00:00": "5"], ... }
	-------------------------------------------------------------------------------------------------- */
async function get_occ_b2b(day, zone, schema = undefined) {
	if (typeof schema === 'undefined') schema = await read_schema_realise(day, zone);
	const date = day.replace(/-/g, ''); // yyyymmdd
	const area = zone === "AE" ? "est" : "west";
	
	const url = `../b2b/json/${date}-Occ-${area}.json`;	
	const resp = await loadJsonB2B(url, "OCC", zone);
		
	const result = {};
	result[day] = {};
	
	resp.forEach( arr => {
						
		const tv = arr[0];
		const time = arr[2];
		const time_min = time_to_min(arr[2]);
		const peak = arr[3];
		const sustain = arr[4];
		const occ = arr[5];
					
		if (schema["tv_h"].hasOwnProperty(tv)) {
							
			if (!(result[day].hasOwnProperty(tv))) { 
				result[day][tv] = [];
			}
			let open = schema["tv_h"][tv].some( elem => {
				const deb = elem[0];
				const fin = elem[1];
				if (time_min>= deb-graph_margin && time_min < fin+graph_margin) return true;
				return false;
			});
			
			if (open === true) result[day][tv].push([time, occ, peak, sustain]);
				
		}					
	});
	console.log("Get Occ via B2B : OK");			
	return result;
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph H20
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - ["heure:min",...]
			@param {array} data - [load,...]
			@param {integer} mv - valeur de la MV
			@param {string} tv - nom du TV
	-------------------------------------------------------------------------- */
function show_h20_graph(containerId, dataAxis, data, mv, tv) {
	let myChart = echarts.init(document.getElementById(containerId));
	let yMax = mv*1.6;
	let dataShadow = [];

	for (var i = 0; i < data.length; i++) {
		dataShadow.push(yMax);
	}
	let option;
	
	option = {
		title: {
			text: `H/20 : ${tv}`,
			subtext: 'Click or Scroll to Zoom',
			textStyle: { color: '#FFF' },
			left: 'center'
		},
		xAxis: {
			data: dataAxis,
			axisLabel: {
				inside: true,
				textStyle: {
					color: '#fff'
				}
			},
			axisTick: {
				show: false
			},
			axisLine: {
				show: false
			},
			z: 10
		},
		yAxis: {
			axisLine: {
				show: false
			},
			axisTick: {
				show: false
			},
			axisLabel: {
				textStyle: {
					color: '#999'
				}
			}
		},
		dataZoom: [
			{
				type: 'inside'
			}
		],
		series: [
			{ // For shadow
				type: 'bar',
				itemStyle: {
					color: 'rgba(0,0,0,0.05)'
				},
				barGap: '-100%',
				barCategoryGap: '40%',
				data: dataShadow,
				animation: false,
				markLine: {                      
                    symbol:"none", //Remove the arrow at the end of the cordon
					lineStyle: {
						type: 'dashed',
                        color: '#C00',
                        width: 1,
                    },
                    data: [
                        { yAxis: mv, name: 'MV', 
						  label: { 
							formatter: `MV: ${mv}`,
							color: '#fff',
							textBorderColor: '#000',
							textBorderWidth: 2,					
							fontStyle: 'normal',
							fontWeight: 'bold',
							fontSize: 14,
							fontFamily: 'Helvetica'
						  } 
						},
                    ],
                },
			},
			{
				type: 'bar',
				itemStyle: {
					color: new echarts.graphic.LinearGradient(
						0, 0, 0, 1,
						[
							{offset: 0, color: '#83bff6'},
							{offset: 0.5, color: '#188df0'},
							{offset: 1, color: '#188df0'}
						]
					)
				},
				emphasis: {
					itemStyle: {
						color: new echarts.graphic.LinearGradient(
							0, 0, 0, 1,
							[
								{offset: 0, color: '#2378f7'},
								{offset: 0.7, color: '#2378f7'},
								{offset: 1, color: '#83bff6'}
							]
						)
					}
				},
				data: data
			}
		]
	};
	
	 
	myChart.setOption(option);

	// Enable data zoom when user click bar.
	let zoomSize = 6;
	myChart.on('click', function (params) {
		myChart.dispatchAction({
			type: 'dataZoom',
			startValue: dataAxis[Math.max(params.dataIndex - zoomSize / 2, 0)],
			endValue: dataAxis[Math.min(params.dataIndex + zoomSize / 2, data.length - 1)]
		});
	});
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Occ
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - ["heure:min",...]
			@param {array} data - [load,...]
			@param {integer} peak - valeur du peak
			@param {integer} sustain - valeur du sustain
			@param {string} tv - nom du TV
	-------------------------------------------------------------------------- */
function show_occ_graph(containerId, dataAxis, data, peak, sustain, tv) {
	let myChart = echarts.init(document.getElementById(containerId));
	let yMax = peak*1.5;
	let dataShadow = [];

	for (var i = 0; i < data.length; i++) {
		dataShadow.push(yMax);
	}

	option = {
		title: {
			text: `Occ : ${tv}`,
			subtext: 'Click or Scroll to Zoom',
			textStyle: { color: '#FFF' },
			left: 'center'
		},
		xAxis: {
			data: dataAxis,
			axisLabel: {
				inside: true,
				textStyle: {
					color: '#fff'
				}
			},
			axisTick: {
				show: false
			},
			axisLine: {
				show: false
			},
			z: 10
		},
		yAxis: {
			axisLine: {
				show: false
			},
			axisTick: {
				show: false
			},
			axisLabel: {
				textStyle: {
					color: '#999'
				}
			}
		},
		dataZoom: [
			{
				type: 'inside'
			}
		],
		series: [
			{ // For shadow
				type: 'bar',
				itemStyle: {
					color: 'rgba(0,0,0,0.05)'
				},
				barGap: '-100%',
				barCategoryGap: '40%',
				data: dataShadow,
				animation: false,
				markLine: {                      
                    symbol:"none", //Remove the arrow at the end of the cordon
					lineStyle: {
						type: 'dashed',
                        color: '#C00',
                        width: 1,
                    },
                    data: [
                        { yAxis: peak, name: 'PEAK', 
						  label: {  formatter: `Peak: ${peak}`,
									color: '#fff',
									textBorderColor: '#000',
									textBorderWidth: 2,					
									fontStyle: 'normal',
									fontWeight: 'bold',
									fontSize: 14,
									fontFamily: 'Helvetica'
								}
  					    },
						{ yAxis: sustain, name: 'SUSTAIN', label: { formatter: `Sustain: ${sustain}`,
									color: '#fff',
									textBorderColor: '#000',
									textBorderWidth: 2,					
									fontStyle: 'normal',
									fontWeight: 'bold',
									fontSize: 14,
									fontFamily: 'Helvetica'
								}
  					    },
                    ],
                },
			},
			{
				type: 'bar',
				itemStyle: {
					color: new echarts.graphic.LinearGradient(
						0, 0, 0, 1,
						[
							{offset: 0, color: '#83bff6'},
							{offset: 0.5, color: '#188df0'},
							{offset: 1, color: '#188df0'}
						]
					)
				},
				emphasis: {
					itemStyle: {
						color: new echarts.graphic.LinearGradient(
							0, 0, 0, 1,
							[
								{offset: 0, color: '#2378f7'},
								{offset: 0.7, color: '#2378f7'},
								{offset: 1, color: '#83bff6'}
							]
						)
					}
				},
				data: data
			}
		]
		/*,
		visualMap: {
            pieces: [{
                gt: 0,
                lte: `${sustain}`,
                color: '#93CE07'
            }, {
                gt: `${sustain}`,
                lte: `${peak}`,
                color: '#FBDB0F'
            }]
        }
		*/
	};

	myChart.setOption(option);

	// Enable data zoom when user click bar.
	let zoomSize = 6;
	myChart.on('click', function (params) {
		myChart.dispatchAction({
			type: 'dataZoom',
			startValue: dataAxis[Math.max(params.dataIndex - zoomSize / 2, 0)],
			endValue: dataAxis[Math.min(params.dataIndex + zoomSize / 2, data.length - 1)]
		});
	});
	
	document.querySelector('#graph-container-occ').classList.remove('off');;
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Traffic Year
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, week...]
			@param {array} data - [load,...]
	-------------------------------------------------------------------------- */
function show_traffic_graph(containerId, year, listWeek, data, data_lastyear, data2019, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "350px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Trafic semaine sur l'année - ${zon}`,
			textStyle: {
				color: '#FFF',
				fontSize: '1.5rem'
			},
			x: 'center',
			y: 'top'
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow',
				label: {
					show: true
				}
			}
		},
		/*
		toolbox: {
			feature: {
				saveAsImage: {
					name: `Trafic semaine sur l'année - ${zon}`,
					title: 'PNG',
					show: true
				}
			}
		},
		*/
		grid: {
			containLabel: true
		},
		legend: {
			x: 'center', // 'center' | 'left' | {number},
			y: 'top' | 30, // 'center' | 'bottom' | {number}
			padding: -1,
			textStyle: {
				color: '#fff'
			}
		},
		calculable: true,
		xAxis: {
			type: 'category',
			name: 'Semaines',
			nameLocation: 'middle',
			axisLabel: {
				show: true,
				interval: 'auto',    // {number}
				margin: 8,
				textStyle: {
					color: '#fff'
				}
			},
			nameGap: 30,
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			data: listWeek
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: '{value}'
			},
			name: 'Nombre de vols',
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			nameRotate: 90,
    		nameGap: 60,
			nameLocation: 'middle'
		},
		series: [
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				areaStyle: {},
				data: data2019,
			},
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				areaStyle: {},
				data: data,
			}]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Traffic Cumulé Year par mois
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, month...]
			@param {array} data - [load,...]
	-------------------------------------------------------------------------- */
function show_traffic_graph_mois_cumule(containerId, year, listMonth, data, data_lastyear, data2019, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "350px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Trafic cumulé sur l'année - ${zon}`,
			textStyle: {
				color: '#FFF',
				fontSize: '1.5rem'
			},
			x: 'center',
			y: 'top'
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow',
				label: {
					show: true
				}
			}
		},
		/*
		toolbox: {
			feature: {
				saveAsImage: {
					name: `Trafic semaine sur l'année - ${zon}`,
					title: 'PNG',
					show: true
				}
			}
		},
		*/
		grid: {
			containLabel: true
		},
		legend: {
			x: 'center', // 'center' | 'left' | {number},
			y: 'top' | 30, // 'center' | 'bottom' | {number}
			padding: -1,
			textStyle: {
				color: '#fff'
			}
		},
		calculable: true,
		xAxis: {
			type: 'category',
			name: 'Mois',
			nameLocation: 'middle',
			axisLabel: {
				show: true,
				interval: 'auto',    // {number}
				margin: 8,
				textStyle: {
					color: '#fff'
				}
			},
			nameGap: 30,
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			data: listMonth
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: '{value}'
			},
			name: 'Cumul des vols',
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			nameRotate: 90,
			nameGap: 60,
			nameLocation: 'middle'
		},
		series: [
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				areaStyle: {},
				data: data2019,
			},
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				areaStyle: {},
				data: data,
			}]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph delay - Year
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, week...]
			@param {array} data - [load,...]
	-------------------------------------------------------------------------- */
function show_delay_graph(containerId, year, listWeek, data, data_lastyear, data2019, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "400px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Delay semaine sur l'année - ${zon}`,
			textStyle: {
				color: '#FFF',
				fontSize: '1.5rem'
			},
			x: 'center',
			y: 'top'
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow',
				label: {
					show: true
				}
			}
		},
		/*
		toolbox: {
			feature: {
				saveAsImage: {
					name: `Delay semaine sur l'année - ${zon}`,
					title: 'PNG',
					show: true
				}
			}
		},
		*/
		grid: {
			containLabel: true
		},
		legend: {
			x: 'center', // 'center' | 'left' | {number},
			y: 'top' | 30, // 'center' | 'bottom' | {number}
			padding: -1,
			textStyle: {
				color: '#fff'
			}
		},
		calculable: true,
		xAxis: {
			type: 'category',
			name: 'Semaines',
			nameLocation: 'middle',
			axisLabel: {
				show: true,
				interval: 'auto',    // {number}
				margin: 8,
				textStyle: {
					color: '#fff'
				}
			},
			nameGap: 30,
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			data: listWeek
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: '{value}'
			},
			name: 'Delay en min',
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			nameRotate: 90,
			nameGap: 60,
			nameLocation: 'middle'
		},
		series: [
			{
				name: "2019",
				type: 'bar',
				color : '#339dff',
				areaStyle: {},
				data: data2019,
			},
			{
				name: year-1,
				type: 'bar',
				color: 'yellow',
				areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'bar',
				color: '#4CC417',
				areaStyle: {},
				data: data,
			}]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Delay Cumulé Year par mois
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, month...]
			@param {array} data - [load,...]
	-------------------------------------------------------------------------- */
function show_delay_graph_mois_cumule(containerId, year, listMonth, data, data_lastyear, data2019, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "350px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Délai cumulé sur l'année - ${zon}`,
			textStyle: {
				color: '#FFF',
				fontSize: '1.5rem'
			},
			x: 'center',
			y: 'top'
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow',
				label: {
					show: true
				}
			}
		},
		/*
		toolbox: {
			feature: {
				saveAsImage: {
					name: `Trafic semaine sur l'année - ${zon}`,
					title: 'PNG',
					show: true
				}
			}
		},
		*/
		grid: {
			containLabel: true
		},
		legend: {
			x: 'center', // 'center' | 'left' | {number},
			y: 'top' | 30, // 'center' | 'bottom' | {number}
			padding: -1,
			textStyle: {
				color: '#fff'
			}
		},
		calculable: true,
		xAxis: {
			type: 'category',
			name: 'Mois',
			nameLocation: 'middle',
			axisLabel: {
				show: true,
				interval: 'auto',    // {number}
				margin: 8,
				textStyle: {
					color: '#fff'
				}
			},
			nameGap: 30,
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			data: listMonth
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: '{value}'
			},
			name: 'Cumul des délais',
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			nameRotate: 90,
			nameGap: 60,
			nameLocation: 'middle'
		},
		series: [
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				areaStyle: {},
				data: data2019,
			},
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				areaStyle: {},
				data: data,
			}]
	};
	
	myChart.setOption(option);
	
}