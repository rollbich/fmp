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
	let response = await fetch("../php/get_data.php", {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ "url": url})
	});
	console.log("response : "+response.status);
	// Note : suppression du .then(rep_status) car interfère avec await
	if (response.ok) { // entre 200 et 300
		if (response == 404) { return 404 }
		return Promise.resolve(response.json())
	} else {
		const d = response.url.split('json/');
		const date = hyphen_date(d[1].substr(5,8));
		// l'erreur est transmise au bloc catch
		if (response.status == 404) { return Promise.reject(new Error(`Le fichier B2B du ${date} n'existe pas`)); }
		return Promise.reject(new Error('Erreur: '+response.statusText))
	}
  }
  catch (err) {
	const z = zone === "AE" ? "EST" : "OUEST";
	console.log(err);
	//alert(`Erreur ${type} zone ${z} : ${err.message}`);
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

	if (typeof schema === 'undefined') schema = await read_schema_realise(day, zone);
	const date = day.replace(/-/g, ''); // yyyymmdd
	const year = day.substring(0,4);
	const month = date.substring(4,6);
	const area = zone === "AE" ? "est" : "west";
	const url = `${year}/${month}/${date}-H20-${area}.json`;	
	const resp = await loadJsonB2B(url, "H20", zone);
	let result; 
	if (resp !== 404) {
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
		console.log("Get H20 via B2B : OK");
	} else {
		result = 404;
	}
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
	const year = day.substring(0,4);
	const month = date.substring(4,6);
	const area = zone === "AE" ? "est" : "west";
	const url = `${year}/${month}/${date}-Occ-${area}.json`;	
	const resp = await loadJsonB2B(url, "OCC", zone);
	let result;
	if (resp !== 404) {
		result = {};
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
					if (time_min>= deb && time_min < fin) return true;
					return false;
				});
				
				if (open === true) result[day][tv].push([time, occ, peak, sustain]);
					
			}					
		});
		console.log("Get Occ via B2B : OK");
	} else {
		result = 404;
	}
	return result;
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph H20
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - ["heure:min",...]
			@param {array} data - [load,...]
			@param {integer} mv - valeur de la MV
			@param {integer} mv_ods - valeur de la MV ODS
			@param {string} tv - nom du TV
	-------------------------------------------------------------------------- */
function show_h20_graph(containerId, dataAxis, data, mv, mv_ods = 0, tv, time_visu = "", data_reg = [], data_delay = [], data_reason = []) {
	let dataMaxh20 = Math.max(...data);
	let dataMaxDelay = Math.max(...data_delay);
	let yh20 = (Math.floor(dataMaxh20/10)+1)*10;
	if (dataMaxDelay >120) yDelay = dataMaxDelay - 60; else yDelay = 0;
	let myChart = echarts.init(document.getElementById(containerId));
	let option;
	if (time_visu === "") time_visu = "Load vue à minuit UTC"; else time_visu = `Load vue à ${time_visu} UTC`;
	option = {
		title: {
			text: `H/20 : ${tv} - ${time_visu}`,
			subtext: 'Click or Scroll to Zoom',
			textStyle: { color: '#FFF' },
			left: 'center'
		},
		legend: {
			data: ['H/20', 'Rate', 'Delay'],
			bottom: 20,
			orient: 'horizontal',
			textStyle: {
				color: '#ddd'
			}
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
		yAxis: [
		{
			type: 'value',
			name: 'H20',
			max: yh20,
			interval: 10,
			  axisLabel: {
				formatter: '{value}'
			},
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
		{
			type: 'value',
			show: false,
			name: 'Delay',
			min: 0,		// astuce
			max: 0, 	// pour cacher le graph
			axisLabel: {
				show: false,
				formatter: '{value}'
			},
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
		}
		],
		dataZoom: [
			{
				type: 'inside'
			}
		],
		series: [
			{
				name: 'H20',
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
				tooltip: {
					valueFormatter: function (value) {
					  return value;
					}
				},
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
							formatter: `MV : ${mv}`,
							color: '#6c6',
							textBorderColor: '#000',
							textBorderWidth: 2,					
							fontStyle: 'normal',
							fontWeight: 'bold',
							fontSize: 12,
							fontFamily: 'Helvetica'
						  }
						} 
                    ],
                },
				data: data
			},
			{
				name: 'Rate',
				tooltip: {
					valueFormatter: function (value) {
						return value;
					}
				},
				type: 'line',
				step: 'start',
				color: '#0F0',
				data: data_reg
			},
			{
				name: 'Delay',
				yAxisIndex: 1,
				tooltip: {
					valueFormatter: function (value) {
						return value;
					}
				},
				itemStyle: {
					color: 'yellow'
				},
				symbolSize: 4,
				type: 'scatter',
				data: data_delay
			},
			{
				name: 'Reason',
				tooltip: {
					valueFormatter: function (value) {
						return value;
					}
				},
				itemStyle: {
					color: 'pink'
				},
				symbolSize: 4,
				type: 'scatter',
				data: data_reason
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
function show_occ_graph(containerId, dataAxis, data, peak, sustain, tv, time_visu = "", data_reg = [], data_delay = []) {
	let dataMax = Math.max(...data);
	if (dataMax < 61) yOccMax = 60;
	if (dataMax < 31) yOccMax = 30;
	
	let myChart = echarts.init(document.getElementById(containerId));
	let yRate = Math.min(yOccMax*2,60);
	if (time_visu === "") time_visu = "Load vue à minuit UTC"; else time_visu = `Load vue à ${time_visu} UTC`;
	option = {
		title: {
			text: `Occ : ${tv} - ${time_visu}`,
			subtext: 'Click or Scroll to Zoom',
			textStyle: { color: '#FFF' },
			left: 'center'
		},
		tooltip: {
			trigger: 'axis'
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
		yAxis: [
			{
			  type: 'value',
			  name: 'Load',
			  min: 0,
			  max: yOccMax,
			  interval: 10,
			  axisLabel: {
				formatter: '{value}'
			  }
			},
			{
			  type: 'value',
			  name: 'Rate',
			  nameTextStyle: {
				color: '#0F0'
			  },
			  min: 0,
			  max: yRate,
			  interval: 10,
			  axisLabel: {
				formatter: '{value}',
				textStyle: {
					color: '#0f0'
				}
			  }
			}
		  ],
		dataZoom: [
			{
				type: 'inside'
			}
		],
		series: [
			{
				name: 'Load',
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
				markLine: {                      
                    symbol:"none", //Remove the arrow at the end of the cordon
					lineStyle: {
						type: 'dashed',
                        color: '#C00',
                        width: 1,
                    },
                    data: [
                        { 
						yAxis: peak, 
						name: 'PEAK', 
						label: {  
							formatter: `P: ${peak}`,
							offset: [20, 0],
							color: '#d00',
							textBorderColor: '#000',
							textBorderWidth: 0,					
							fontStyle: 'normal',
							fontWeight: 'normal',
							fontSize: 13,
							fontFamily: 'Helvetica'
						}
  					    },
						{ 
						yAxis: sustain, 
						name: 'SUSTAIN', 
						label: {  
							formatter: `S: ${sustain}`,
							offset: [20, 0],								
							color: '#d00',
							textBorderColor: '#000',
							textBorderWidth: 0,					
							fontStyle: 'normal',
							fontWeight: 'normal',
							fontSize: 13,
							fontFamily: 'Helvetica'
						}
  					    },
                    ],
                },
				data: data
			},
			{
				name: 'Rate',
				yAxisIndex: 1,
				tooltip: {
					valueFormatter: function (value) {
						return value;
					}
				},
				type: 'line',
				step: 'start',
				color: '#0F0',
				data: data_reg
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

// ---------------------------------------------------------------------------
//								STATS
// ---------------------------------------------------------------------------
/*	--------------------------------------------------------------------------
	 	Affiche le graph Traffic Year
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, week...]
			@param {array} data - [load,...]
			@param {string} zon - "nom du titre de la zone" (ex : LFMMCTA)
	-------------------------------------------------------------------------- */
function show_traffic_graph(containerId, year, listWeek, data, data_lastyear, dataRef = null, zon) {

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
			/*
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				areaStyle: {},
				data: dataRef,
			},
			*/
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
	 	Affiche le graph Traffic Year - par mois
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, month...]
			@param {array} data - [load,...]
			@param {string} zon - "nom du titre de la zone" (ex : LFMMCTA)
	-------------------------------------------------------------------------- */
function show_traffic_graph_mois(containerId, year, listWeek, data, data_lastyear, dataRef = null, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "400px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Trafic mois sur l'année ${year} - ${zon}`,
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
			/*
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				areaStyle: {},
				data: dataRef
			},
			*/
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				areaStyle: {},
				data: data_lastyear
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				areaStyle: {},
				data: data
			}]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Traffic Cumulé Year par mois
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, month...]
			@param {array} data - [load,...]
			@param {string} zon - "nom du titre de la zone" (ex : LFMMCTA)
	-------------------------------------------------------------------------- */
function show_traffic_graph_mois_cumule(containerId, year, listMonth, data, data_lastyear, dataRef = null, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "350px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Trafic cumulé sur l'année ${year} - ${zon}`,
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
			/*
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				//areaStyle: {},
				data: dataRef,
			},
			*/
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				//areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				//areaStyle: {},
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
			@param {string} zon - "nom du titre de la zone" (ex : LFMMCTA)
	-------------------------------------------------------------------------- */
function show_delay_graph(containerId, year, listWeek, data, data_lastyear, dataRef = null, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "400px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Delay semaine sur l'année ${year} - ${zon}`,
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
			/*
			{
				name: "2019",
				type: 'bar',
				color : '#339dff',
				areaStyle: {},
				data: dataRef,
			},
			*/
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
	 	Affiche le graph delay - Year - par mois
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} dataAxis - [1, 2, 3, month...]
			@param {array} data - [load,...]
			@param {string} zon - "nom du titre de la zone" (ex : LFMMCTAE)
	-------------------------------------------------------------------------- */
function show_delay_graph_month(containerId, year, listMonth, data, data_lastyear, dataRef = null, zon, maxi) {

	let chartDom = $(containerId);
	chartDom.style.height = "440px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Delay mois sur l'année ${year} - ${zon}`,
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
					name: `Delay mois sur l'année - ${zon}`,
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
			name: 'Delay en min',
			nameTextStyle: {
				color: '#fff',
				fontSize: '1.2rem'
			},
			nameRotate: 90,
			nameGap: 60,
			nameLocation: 'middle',
			max: maxi
		},
		series: [
			/*
			{
				name: "2019",
				type: 'bar',
				color : '#339dff',
				areaStyle: {},
				data: dataRef,
			},
			*/
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
			@param {string} zon - "nom du titre de la zone" (ex : LFMMCTA)
	-------------------------------------------------------------------------- */
function show_delay_graph_mois_cumule(containerId, year, listMonth, data, data_lastyear, dataRef = null, zon) {

	let chartDom = $(containerId);
	chartDom.style.height = "350px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	let option;
	
	option = {
		title: {
			text: `Délai cumulé sur l'année ${year} - ${zon}`,
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
		toolbox: {
			feature: {
				saveAsImage: {
					name: `Trafic semaine sur l'année - ${zon}`,
					title: 'PNG',
					show: true
				}
			}
		},
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
			/*
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				//areaStyle: {},
				data: dataRef,
			},
			*/
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				//areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				//areaStyle: {},
				data: data,
			}]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Delay par causes du mois 
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} month - numéro du mois
			@param {array} data - [...]
			@param {string} titre - "nom du titre de la zone"
	-------------------------------------------------------------------------- */
function show_delay_graph_mois_par_causes(containerId, year, month, data, titre) {
	const nom_mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
	let chartDom = $(containerId);
	chartDom.style.height = "400px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	let total = 0;
	let option;
	const result = [];
	data.forEach(cause_obj => {
		for (cause in cause_obj) {
			let obj = {};
			obj["value"] = cause_obj[cause];
			total += cause_obj[cause];
			obj["name"] = cause;
			result.push(obj);
		}
	}) 
	
	option = {
		// Global palette:
		color: [
			'#d66',
			'#6b6',
			'lightblue',
			'orange',
			'pink',
			'yellow',
			'white',
			'#bda29a',
			'#6e7074',
			'#546570',
			'#c4ccd3'
		  ],
		title: {
			text: `Délai par cause - ${nom_mois[month-1]} ${year} - ${titre}`,
			textStyle: {
				fontSize: '1.5rem',
				color: '#FFF'
			},
			x: 'center',
			y: 'top',
			padding: 10
		},
		tooltip: {
		  trigger: 'item'
		},
		legend: {
		  top: 'center',
		  left: 'left',
		  textStyle: {
			fontSize: '1.2rem',
			color: '#eee'
		  },
		  orient: 'vertical'
		},
		series: [
		  {
			name: 'Reason',
			type: 'pie',
			radius: ['60%', '90%'],
			avoidLabelOverlap: false,
			itemStyle : {
				borderRadius: 10,
				borderColor: '#eee',
			  	borderWidth: 2,
				normal : {
					 label : {
						show: true, position: 'inner',
						formatter : function (params){
							var val = ((parseInt(params.value)/parseInt(total))*100).toFixed(1);
							return  val.toString() + '%\n'
						},
						textStyle : {
							color: 'black'
						}
					},
					labelLine : {
						show : false
					}
				}
			},
			top: '20%',
			label: {
			  show: false,
			  position: 'center'
			},
			emphasis: {
			  label: {
				show: true,
				fontSize: '20',
				fontWeight: 'bold'
			  }
			},
			labelLine: {
			  show: false
			},
			data: result
		  }
		]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Delay par causes du mois 
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} month - numéro du mois
			@param {array} data - [...]
			@param {string} titre - "nom du titre de la zone"
	-------------------------------------------------------------------------- */
function show_delay_graph_mois_par_tvs(containerId, year, month, data, titre) {
	const nom_mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
	let chartDom = $(containerId);
	chartDom.style.height = "400px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	let total = 0;
	let option;
	const result = [];
	data.forEach(tvs_obj => {
		for (tv in tvs_obj) {
			let obj = {};
			obj["value"] = tvs_obj[tv];
			total += tvs_obj[tv];
			obj["name"] = tv;
			result.push(obj);
		}
	}) 
	
	option = {
		// Global palette:
		color: [
			'#d66',
			'#6b6',
			'lightblue',
			'orange',
			'pink',
			'yellow',
			'white',
			'#bda29a',
			'#6e7074',
			'#546570',
			'#c4ccd3'
			],
		title: {
			text: `Délai par TVs - ${nom_mois[month-1]} ${year} - ${titre}`,
			textStyle: {
				fontSize: '1.5rem',
				color: '#FFF'
			},
			x: 'center',
			y: 'top',
			padding: 10
		},
		tooltip: {
			trigger: 'item'
		},
		legend: {
			top: 'center',
			left: 'left',
			textStyle: {
			fontSize: '1.2rem',
			color: '#eee'
			},
			orient: 'vertical'
		},
		series: [
			{
			name: 'TVs',
			type: 'pie',
			radius: ['60%', '90%'],
			avoidLabelOverlap: false,
			itemStyle : {
				borderRadius: 10,
				borderColor: '#eee',
					borderWidth: 2,
				normal : {
						label : {
						show: true, position: 'inner',
						formatter : function (params){
							var val = ((parseInt(params.value)/parseInt(total))*100).toFixed(1);
							return  val.toString() + '%\n'
						},
						textStyle : {
							color: 'black'
						}
					},
					labelLine : {
						show : false
					}
				}
			},
			top: '20%',
			label: {
				show: false,
				position: 'center'
			},
			emphasis: {
				label: {
				show: true,
				fontSize: '20',
				fontWeight: 'bold'
				}
			},
			labelLine: {
				show: false
			},
			data: result
			}
		]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Delay par causes de la semaine 
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} week - numéro de la semaine
			@param {array} data - [{ value: 1048, name: 'Search Engine' }, ..., { value: 300, name: 'Video Ads' } ]
			@param {string} titre - "nom du titre de la zone"
      ]
	-------------------------------------------------------------------------- */
function show_delay_graph_week_par_causes(containerId, year, week, data, titre) {
	let chartDom = $(containerId);
	chartDom.style.height = "400px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	let total = 0;
	let option;
	const result = [];
	Object.keys(data).forEach(cause => {
			let obj = {};
			obj["value"] = data[cause];
			total += data[cause];
			obj["name"] = cause;
			result.push(obj);
	}) 
	
	option = {
		// Global palette:
		color: [
			'#d66',
			'#6b6',
			'lightblue',
			'orange',
			'pink',
			'yellow',
			'white',
			'#bda29a',
			'#6e7074',
			'#546570',
			'#c4ccd3'
			],
		title: {
			text: `Délai par cause - Sem ${week} ${year} - ${titre}`,
			textStyle: {
				fontSize: '1.5rem',
				color: '#FFF'
			},
			x: 'center',
			y: 'top',
			padding: 10
		},
		tooltip: {
			trigger: 'item'
		},
		legend: {
			top: 'center',
			left: 'left',
			textStyle: {
			fontSize: '1.2rem',
			color: '#eee'
			},
			orient: 'vertical'
		},
		series: [
			{
			name: 'Reason',
			type: 'pie',
			radius: ['60%', '90%'],
			avoidLabelOverlap: false,
			itemStyle : {
				borderRadius: 10,
				borderColor: '#eee',
					borderWidth: 2,
				normal : {
						label : {
						show: true, position: 'inner',
						formatter : function (params){
							var val = ((parseInt(params.value)/parseInt(total))*100).toFixed(1);
							return  val.toString() + '%\n'
						},
						textStyle : {
							color: 'black'
						}
					},
					labelLine : {
						show : false
					}
				}
			},
			top: '20%',
			label: {
				show: false,
				position: 'center'
			},
			emphasis: {
				label: {
				show: true,
				fontSize: '20',
				fontWeight: 'bold'
				}
			},
			labelLine: {
				show: false
			},
			data: result
			}
		]
	};
	
	myChart.setOption(option);
	
}

/*	--------------------------------------------------------------------------
	 	Affiche le graph Delay Cumulé Year par mois
			@param {string} containerId - Id de l'HTML Element conteneur
			@param {array} data - [load,...]
			@param {string} zon - "nom du titre de la zone"
	-------------------------------------------------------------------------- */
function show_delay_graph_week_cumule(containerId, year, data, data_lastyear, dataRef = null, zon, title = "") {

	let chartDom = $(containerId);
	chartDom.style.height = "350px";
	chartDom.style.width = "870px";
	let myChart = echarts.init(chartDom);
	
	// dataAxis
	const listWeek = [];
	for(let i=1;i<54;i++) {listWeek.push(i)}

	let option;
	
	option = {
		title: {
			text: `Délai ${title} cumulé sur l'année ${year} - ${zon}`,
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
		toolbox: {
			feature: {
				saveAsImage: {
					name: `Trafic ${title} semaine sur l'année - ${zon}`,
					title: 'PNG',
					show: true
				}
			}
		},
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
			name: 'Semaine',
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
			/*
			{
				name: "2019",
				type: 'line',
				color : '#339dff',
				//areaStyle: {},
				data: dataRef,
			},
			*/
			{
				name: year-1,
				type: 'line',
				color: 'yellow',
				//areaStyle: {},
				data: data_lastyear,
			},
			{
				name: year,
				type: 'line',
				color: '#4CC417',
				//areaStyle: {},
				data: data,
			}]
	};
	
	myChart.setOption(option);
	
}