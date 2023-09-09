<?php
require_once("config_olaf.php");

/*  ------------------------------------------
		lecture d'un fichier via curl
	------------------------------------------ */

function get_file($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
    //curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    //curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
    $result = curl_exec($ch);
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    if ($curl_error !== '') {
        echo "\nCurl Error : $curl_error";
    }
    unset($ch); 
    return [$result, $status_code];
}

/*  ------------------------------------------
		API OLAF
	------------------------------------------ */

function get_olaf($zone, $date, $yesterdate) {
	
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, OLAF_URL."?center=LFMM&zone=".$zone."&dateStart=".$yesterdate."&dateEnd=".$date);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	/*------------------------------------------------------*/
	$cred = OLAF_USER.":".OLAF_PASS;
	curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
	curl_setopt($ch, CURLOPT_USERPWD, $cred);
	$result = curl_exec($ch);
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

// minutes depuis minuit => return "xx:xx"
function min_to_strtime(int $time) {
	$a = floor($time/60);
	$b = (int) $time % 60;
	return sprintf("%02d", $a).":".sprintf("%02d", $b);
}

// "xx:yy" => return le temps en  minutes depuis minuit
function strtime_to_min(string $str_time) {
	$t = explode(":", $str_time);
	return intval($t[0])*60+intval($t[1]);
}

// récupère les 2 chiffres après la virgule
function get_decimale(float $nombre) {
	return sprintf("%02d", ($nombre - (int) $nombre) * 100) ;
}

/*  ------------------------------------------------------------------------------
	  récupère l'heure en fonction du numéro de colonne 
	 	@param {integer} col - Numéro de la colonne du tds
		@returns {string} - "hh:mm"
	------------------------------------------------------------------------------ */
function get_time($col) {
	$h = sprintf("%02d", floor($col/4));
	$minut = $col%4 === 0 ? "00" : get_decimale($col/4)*15/25;
	$minut = $minut === 3 ? "30" : $minut;
	return $h.":".strval($minut);
}
	
class capa {

	/* ------------------------------------------------------
			@param {string} day 	- "yyyy-mm-jj"
            @param {string} zone	- "est" ou "ouest"
	   ------------------------------------------------------ */
    private $day;
	private $yesterday;
    private $zone;
	private $timeOffset;
    private $zone_olaf;
    private $tabvac;
    private $dep;
    private $eq_dep;
    private $tour_local;
    private $saison;
    private $tour_utc;
    private $tds_supp_local;
    private $tds_supp_utc;
    private $instr;
    private $tab_vac_eq;
    private $effectif;

    // $zone : "est" ou "ouest"
    public function __construct(string $day, string $zone) {
        $this->day = $day;
        $this->zone = $zone;
        $this->zone_olaf = ($zone === "ouest") ? 'W' : 'E';
        $this->tabvac = ["J2","S1","N","","","","JX","J1","J3","S2","",""]; 
        $this->dep = new DateTime('2019-01-08'); // 8 janv 2019
        $this->eq_dep = 11; // équipe 11 en J2
        $this->init();
    }

	public function init() {
		$this->timeOffset = $this->get_decalage();
		$this->tour_local = json_decode(file_get_contents("../tour_de_service.json"));
		$this->saison = $this->get_date_tour($this->tour_local);
		$this->tour_utc = $this->get_tour_utc();
		$this->tds_supp_local = json_decode(file_get_contents("../tds_supp.json"));
		$this->tds_supp_utc = $this->get_tds_supp_utc();
		$this->instr = json_decode(file_get_contents("../instruction.json"));
		$this->tab_vac_eq = $this->get_vac_eq();
		$yesterday = new DateTime($this->day);
        $yesterday = $yesterday->modify("-1 day");
		$this->yesterday = $yesterday->format("Y-m-d");
	}

	// Récupère le décalage horaire en heures
	public function get_decalage() {
		$d = new DateTime($this->day);
		$timeZoneParis = new DateTimeZone("Europe/Paris");
		$timeOffset = abs(($timeZoneParis->getOffset($d)) / 3600);
		return $timeOffset;
	}

    /* ----------------------------------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
        *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
            @returns {object} : 
			  { "pc_vac": {
					"JX" : {
						"JXA-ete": {"nombre": nb, "nombre_det": nb, "agent": { "nom1" : "détaché", "nom2": "salle"}}, 
						"JXB-ete": {...}, 
						"RDxxx": {...},
						"nbpc": nbre_pc,
						"nbcds": nbre_cds,
						"renfort": nbre_renfort,
						"BV": BV,
						"RO": nbre_RO,
						"RO induit": nbre_induit,
					},
					"vac": { // inclu "N-1"
						"nbpc": nbre_pc,
						"nbcds": nbre_cds,
						"renfort": nbre_renfort,
						"BV": BV,
						"RO": nbre_RO,
						"RO induit": nbre_induit,
						"teamData": {...},
						"userList": {...},
						"aTeamComposition": {...},
						"html": {...}
					}, 
					...
				}, 
                "pc_total_dispo_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ],
				"pc_total_RD_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ],
				"pc_instru_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ]
			  }
    ------------------------------------------------------------------------------------------------------------------- */
    public function get_nbpc_dispo() {
		
		// récupère l'objet contenant les propriétés equipes, return string
		$effectif = get_olaf($this->zone_olaf, $this->day, $this->yesterday);
        // convert to stdClass
		$this->effectif = json_decode($effectif);

		// Calcul du nombre de pc à afficher 
		// On récupère l'effectif total, donc on doit enlever le cds sur les vacations qui en ont 1	
		$pc = new stdClass();
		$pc->JX = new stdClass();
		$pc->J1 = new stdClass();
		$pc->J3 = new stdClass();
		$pc->S2 = new stdClass();
		$pc->J2 = new stdClass();
		$pc->S1 = new stdClass();
		$pc->N = new stdClass();
		$pc->{'N-1'} = new stdClass();

		/*  -------------------------------------------------
			pc["JX"] contient les JX mais aussi les RD bleus
			pc["JX"] = {
				"JXA": {
					"nombre": 2,
					"agent": {
						"Jean Coco": "détaché",
						"Moustache": "salle"
					}
				},
				"RDJ3b-ms": {
					...
				}
				...
		}
		-----------------------------------------------------  */

		$Renfort = $this->effectif->{$this->day}->Renfort;
		// Renfort hors JX
		$RD_names_horsJX = [];
		$nb_jx = 0;
		$nb_jx_det = 0;
		foreach ($Renfort as $renf1 => $value1) {
			foreach ($value1 as $cle => $obj) {
				$label = $obj->contextmenutype->label;
				$jx_type = "";
				$rd_type = "";
				$type_renfort = "";
				// JXA & JXB salle
				// "RD bleu JXa-ms" - "RD bleu J1-ms" - "RD bleu J3b-ms" + Est only "RD bleu S1b-ms" + West only "RD bleu S1a-ms"
				// "RD bleu J3a-ete" - "RD bleu S1b-ete" - "RD bleu J1-ete" + Est only "RD bleu JXb-ete" + West only "RD bleu J3b-ete" 
				$nb_det = 0;
				if (str_contains($label, "JX")) {
					if (str_contains($label, "RD bleu")) { // RD
						$type_renfort = "RD";
						$rd_type = substr($label, 8); // ex : Jxa-ms
						$jx_type = $rd_type;
						$nb_det++;
						$nb_jx_det++;
					} else { // JX salle
						$type_renfort = "JX";
						$jx_type = $label;
					}
					$nb_jx++;
				} else { // RD non JX
					$type_renfort = "RD";
					$rd_type = substr($label, 8);
					$jx_type = "RD$rd_type";
					array_push($RD_names_horsJX, $jx_type);
					$nb_det++;
				}		
				
				$agent = $obj->agent->nomComplet;
				$agent_type = (str_contains($label, "det") || str_contains($label, "RD")) ? "détaché" : "salle";
				if (property_exists($pc->JX, $jx_type) === false) { 
					$pc->JX->{$jx_type} = new stdClass();
					$pc->JX->{$jx_type}->nombre = 0;
					$pc->JX->{$jx_type}->nombre_det = 0; 
					$pc->JX->{$jx_type}->agent = new stdClass();
				}
				$pc->JX->{$jx_type}->agent->{$agent} = $agent_type;
				$pc->JX->{$jx_type}->nombre++;
				$pc->JX->{$jx_type}->nombre_det += $nb_det;
			}
		}
		
		foreach ($this->tab_vac_eq as $vac => $value) {
			$p = $value."-".$this->zone_olaf;
			if ($vac !== "N-1") {
				if ($vac !== "JX") {
					// Le RO induit apparait si detachés > 1 et plus que 1 n'est pas Expert Ops, ACDS ou Assistant sub
					$pc->{$vac}->ROinduit = (int) $this->effectif->{$this->day}->{$p}->teamReserve->roInduction;
					$pc->{$vac}->nbcds = (int) $this->tour_local->{$this->zone}->{$this->saison}->cds->{$vac};
					$pc->{$vac}->nbpc = (int) $this->effectif->{$this->day}->{$p}->teamReserve->teamQuantity - (int) $pc->{$vac}->nbcds; 
					$pc->{$vac}->BV = (int) $this->effectif->{$this->day}->{$p}->teamReserve->BV;
					$pc->{$vac}->RO = (int) $this->effectif->{$this->day}->{$p}->teamReserve->roQuantity;
					$pc->{$vac}->userList = $this->effectif->{$this->day}->{$p}->userList;
					$pc->{$vac}->teamData = $this->effectif->{$this->day}->{$p}->teamData;
					$pc->{$vac}->aTeamComposition = $this->effectif->{$this->day}->{$p}->aTeamComposition;
					$pc->{$vac}->html = $this->effectif->{$this->day}->{$p}->html->{$this->day}->{$p};
					if (property_exists($pc->{$vac}->html, "lesrenforts") === false) {
						$pc->{$vac}->renfort = 0;
					} else {
						$pc->{$vac}->renfort = count(array_keys(get_object_vars($pc->{$vac}->html->lesrenforts)));
					}
					//$pc->{$vac}->detache = (int) $this->effectif->{$this->day}->{$p}->teamReserve->detacheQuantity;
				} else {
					$pc->{$vac}->ROinduit = 0;
					$pc->{$vac}->nbcds = 0;
					$pc->{$vac}->nbpc = $nb_jx; 
					$pc->{$vac}->BV = 10;
					$pc->{$vac}->RO = 0;
					$det = 0; 
					$pc->{$vac}->renfort = $nb_jx_det;
				}
			} else {
				$pc->{$vac}->ROinduit = (int) $this->effectif->{$this->yesterday}->{$p}->teamReserve->roInduction;
				$pc->{$vac}->nbcds = (int) $this->tour_local->{$this->zone}->{$this->saison}->cds->N;
				$pc->{$vac}->nbpc = (int) $this->effectif->{$this->yesterday}->{$p}->teamReserve->teamQuantity - (int) $pc->{$vac}->nbcds; 
				$pc->{$vac}->BV = (int) $this->effectif->{$this->yesterday}->{$p}->teamReserve->BV;
				$pc->{$vac}->RO = (int) $this->effectif->{$this->yesterday}->{$p}->teamReserve->roQuantity;
				$pc->{$vac}->userList = $this->effectif->{$this->yesterday}->{$p}->userList;
				$pc->{$vac}->teamData = $this->effectif->{$this->yesterday}->{$p}->teamData;
				$pc->{$vac}->aTeamComposition = $this->effectif->{$this->yesterday}->{$p}->aTeamComposition;
				$pc->{$vac}->html = $this->effectif->{$this->yesterday}->{$p}->html->{$this->yesterday}->{$p};
				if (property_exists($pc->{$vac}->html, "lesrenforts") === false) {
					$pc->{$vac}->renfort = 0;
				} else {
					$pc->{$vac}->renfort = count(array_keys(get_object_vars($pc->{$vac}->html->lesrenforts)));
				}
				//$pc->{$vac}->detache = (int) $this->effectif->{$this->day}->{$p}->teamReserve->detacheQuantity;
			}
		} 

		// array du nombre de pc dispo associé au créneau horaire du tour de service
		// En 24h, il y a 96 créneaux de 15mn.
		// [ ["hh:mm", nb_pc_dispo], [...], ... ]
		$nb_pc = 0;
		$pcs = []; // total pc hors instr & hors RD bleu supp (les RD Jx sont inclus)
		$pct = []; // total pc
		$ucesos = [];
		$in15mn = []; // nbre de pc instruction par 15 mn
		// effectif_RD_15mn = {
		//	  "RD...": [],
		//	  "RD...": []
		//	  ...
		//  }
		$effectif_total_RD_15mn = [];
		$effectif_RD_15mn = new stdClass();
		$vacs = ["JX","J1", "J3", "S2", "J2", "S1"];

		for($i=0;$i<96;$i++) {
			foreach($vacs as $vacation) {
				$cds = $pc->{$vacation}->nbcds;
				$dispoA = min(floor($pc->{$vacation}->nbpc/2), floor(($pc->{$vacation}->BV + $pc->{$vacation}->renfort - $cds - $pc->{$vacation}->ROinduit)/2));
				$dispoB = min(floor($pc->{$vacation}->nbpc/2)+($pc->{$vacation}->nbpc)%2, floor(($pc->{$vacation}->BV + $pc->{$vacation}->renfort - $cds - $pc->{$vacation}->ROinduit)/2)+($pc->{$vacation}->BV + $pc->{$vacation}->renfort - $cds - $pc->{$vacation}->ROinduit)%2);

				if ($vacation === "JX" && $this->zone === "est" && $this->saison === "ete") {
					$dispoB = min(floor($pc->{$vacation}->nbpc/2), floor(($pc->{$vacation}->BV + $pc->{$vacation}->renfort - $cds - $pc->{$vacation}->ROinduit)/2));
					$dispoA = min(floor($pc->{$vacation}->nbpc/2)+($pc->{$vacation}->nbpc)%2, floor(($pc->{$vacation}->BV + $pc->{$vacation}->renfort - $cds - $pc->{$vacation}->ROinduit)/2)+($pc->{$vacation}->BV + $pc->{$vacation}->renfort - $cds - $pc->{$vacation}->ROinduit)%2);
				}

				if ($vacation === "S1" && $this->zone === "est" && $this->saison === "ete") {
					switch ($pc->S1->nbpc) {
						case 6:
							$dispoA = 3;
							$dispoB = 3;
							break;
						case 7:
							$dispoA = 3;
							$dispoB = 4;
							break;
						case 8:
							$dispoA = 3;
							$dispoB = 5;
							break;
						case 9:
							$dispoA = 3;
							$dispoB = 6;
							break;
						case 10:
							$dispoA = 3;
							$dispoB = 7;
							break;
						case 11:
							$dispoA = 4;
							$dispoB = 7;
							break;
						case 12:
							$dispoA = 4;
							$dispoB = 8;
							break;
						case 13:
							$dispoA = 4;
							$dispoB = 9;
							break;
					}
				}
		
				if ($vacation === "S1" && $this->zone === "ouest" && $this->saison === "ete") {
					$d = new DateTime($this->day);
					$jour_sem = (int) $d->format("w"); // 0=dimanche
					if ($jour_sem === 2 || $jour_sem === 3 || $jour_sem === 4) {
						$dispoA = 0;
						$dispoB = $pc->S1->nbpc;
					} else {
						switch ($pc->S1->nbpc) {
							case 6:
								$dispoA = 3;
								$dispoB = 3;
								break;
							case 7:
								$dispoA = 3;
								$dispoB = 4;
								break;
							case 8:
								$dispoA = 3;
								$dispoB = 5;
								break;
							case 9:
								$dispoA = 3;
								$dispoB = 6;
								break;
							case 10:
								$dispoA = 3;
								$dispoB = 7;
								break;
							case 11:
								$dispoA = 4;
								$dispoB = 7;
								break;
							case 12:
								$dispoA = 4;
								$dispoB = 8;
								break;
							case 13:
								$dispoA = 4;
								$dispoB = 9;
								break;
						}
					}
				}

				// Ajout du CDS qui bosse sur secteur
				if ($this->tour_utc->{$vacation}[$i][1] === 1) $nb_pc += $cds;
				// Ajout de la sous-vacation A
				if ($this->tour_utc->{$vacation}[$i][2] === 1) {
						$nb_pc += $dispoA;
				}
				// Ajout de la sous-vacation B
				if ($this->tour_utc->{$vacation}[$i][3] === 1) {
						$nb_pc += $dispoB;
				}
			}

			// Nuit de 19h30 à 00h00
			$cds = $pc->N->nbcds;
			// CDS
			if ($this->tour_utc->N[$i][1] === 1 && $i>48) $nb_pc += $cds; // cds qui bosse sur secteur
			// Sous-vacation A
			if ($this->tour_utc->N[$i][2] === 1 && $i>48) {
				if ($this->saison === "ete" && $pc->N->nbpc === 6) {
					$nb_pc += 2;
				} else {
					$nb_pc += min(floor($pc->N->nbpc/2), floor(($pc->N->BV + $pc->N->renfort - $cds - $pc->N->ROinduit)/2));
				}
			}
			// Sous-vacation B
			if ($this->tour_utc->N[$i][3] === 1 && $i>48) {
				if ($this->saison === "ete" && $pc->N->nbpc === 6) {
					$nb_pc += 4;
				} else {
					$nb_pc += min(floor($pc->N->nbpc/2)+($pc->N->nbpc)%2, floor(($pc->N->BV + $pc->N->renfort - $cds - $pc->N->ROinduit)/2)+($pc->N->BV + $pc->N->renfort - $cds - $pc->N->ROinduit)%2);
				}
			}

			// Nuit de 00h00 à 06h30
			$cds = $pc->{'N-1'}->nbcds;
			if ($this->tour_utc->N[$i][1] === 1 && $i<48) $nb_pc += $cds; // cds qui bosse sur secteur
			// Sous-vacation A
			if ($this->tour_utc->N[$i][2] === 1 && $i<48) {
				if ($this->saison === "ete" && $pc->{'N-1'}->nbpc === 6) {
					$nb_pc += 2;
				} else {
					$nb_pc += min(floor($pc->{"N-1"}->nbpc/2), floor(($pc->{"N-1"}->BV + $pc->{"N-1"}->renfort - $cds - $pc->{'N-1'}->ROinduit)/2));
				}
			}
			// Sous-vacation B
			if ($this->tour_utc->N[$i][3] === 1 && $i<48) {
				if ($this->saison === "ete" && $pc->{'N-1'}->nbpc === 6) {
					$nb_pc += 4;
				} else {
					$nb_pc += min(floor($pc->{"N-1"}->nbpc/2)+($pc->{"N-1"}->nbpc)%2, floor(($pc->{"N-1"}->BV + $pc->{"N-1"}->renfort - $cds - $pc->{"N-1"}->ROinduit)/2) + ($pc->{"N-1"}->BV + $pc->{"N-1"}->renfort - $cds - $pc->{"N-1"}->ROinduit)%2);
				}
			}
			// this.tour_utc["J1"][i][0] = heure (ex : "01:45"), on aurait pu prendre n'importe quelle vac à la place de J1
			array_push($pcs, [$this->tour_utc->J1[$i][0], $nb_pc]);
			
			
			/* 	----------------------------------------------------------------------------------------
					in15mn[i] = [nb_pc_supp, { "type": "Inst ou Eleve ....", "comm": "commentaire"}]
				---------------------------------------------------------------------------------------- */
			$in15mn[$i] = [0, []];
			if (property_exists($this->instr->{$this->zone}, $this->day)) {
				foreach($this->instr->{$this->zone}->{$this->day} as $index=>$elem) {
					$debut = $elem->debut;
					$fin = $elem->fin;
					$d = $elem->date;
					$zone = $elem->zone;
					$type = $elem->type;
					$comm = $elem->comm;
					$t = get_time($i);
					if ($d === $this->day && strtolower($zone) === $this->zone) {
						if ($t >= $debut && $t< $fin) {
							$z = new stdClass();
							$z->{$type} = $type;
							$z->{$comm} = $comm;
							if ($type === "Inst") { $in15mn[$i][0] += 2; $nb_pc += 2; array_push($in15mn[$i][1], $z); }
							if ($type === "Inst1") { $in15mn[$i][0] += 1; $nb_pc += 2; array_push($in15mn[$i][1], $z); }
							if ($type === "Eleve") { array_push($in15mn[$i][1], $z); }
							if ($type === "Asa") { $in15mn[$i][0] -= 1; $nb_pc -= 1; array_push($in15mn[$i][1], $z); }
							if ($type === "Simu1PC") { $in15mn[$i][0] -= 1; $nb_pc -= 1; array_push($in15mn[$i][1], $z); }
							if ($type === "Simu2PC") { $in15mn[$i][0] -= 2; $nb_pc -= 2; array_push($in15mn[$i][1], $z); }
							if ($type === "-1PC") { $in15mn[$i][0] -= 1; $nb_pc -= 1; array_push($in15mn[$i][1], $z); }
						} 
					}
				};
			}
			
			// s'il y a un Jx ce jour là
			// on ne créé que les vac_jx existantes ce jour là
			foreach($RD_names_horsJX as $index=>$vac_jx) {
				if (property_exists($effectif_RD_15mn, $vac_jx) === false) $effectif_RD_15mn->{$vac_jx} = [];
				$effectif_RD_15mn->{$vac_jx}[$i] = 0;
			}
			
			foreach($RD_names_horsJX as $index=>$vac_jx) {
				if ($vac_jx != "nbcds") {
					$nb2 = $pc->JX->{$vac_jx}->nombre;
					if ($this->tds_supp_utc->{$vac_jx}[$i][1] === 1) {
						$effectif_RD_15mn->{$vac_jx}[$i] = $nb2;
					}
				}
			};

			
			$nb_pc = 0;
		}

		for($i=0;$i<96;$i++) {
			$keys = array_keys(get_object_vars($effectif_RD_15mn));
			$effectif_total_RD_15mn[$i] = 0;
			foreach($keys as $vac_RD) {
				$effectif_total_RD_15mn[$i] += $effectif_RD_15mn->{$vac_RD}[$i];
			}
		}

		for($i=0;$i<96;$i++) {
			$nbr = $effectif_total_RD_15mn[$i] + $in15mn[$i][0] + $pcs[$i][1];
			array_push($pct, [$this->tour_utc->J1[$i][0], $nbr]);
			array_push($ucesos, [$this->tour_utc->J1[$i][0], floor($nbr/2)]);
		}

		$compacted_ucesos = [];
		$index_ini = 0;
		for($j=0;$j<95;$j++) {
			if ($ucesos[$j][1] !== $ucesos[$j+1][1]) {
				array_push($compacted_ucesos, [get_time($index_ini), get_time($j+1), floor($ucesos[$j][1])]);
				$index_ini = $j+1;
			}
		}
		array_push($compacted_ucesos, [get_time($index_ini), get_time(95), floor($ucesos[95][1])]);

		$res = new stdClass();
		$res->day= $this->day;
		$res->zone = $this->zone;
		$res->saison = $this->saison;
		$res->offSetTime = $this->timeOffset;
		$res->pc_total = $pct;
		$res->uceso = $ucesos;
		$res->compacted_uceso = $compacted_ucesos;
		$res->pc_total_horsInstrRD_15mn = $pcs; // total pc hors instr & hors RD bleu supp (les RD Jx sont inclus)
		$res->pc_instr_15mn = $in15mn;
		$res->pc_RD_15mn = $effectif_RD_15mn;
		$res->pc_total_RD_15mn = $effectif_total_RD_15mn;
		$res->pc_vac = $pc;
		return $res;

    }

    /* ---------------------------------------------------
        Calcule les équipes qui travaillent et leur vac
        Paramètres
            @param {string} day - yyyy-mm-jj
            @returns {object} { "J1": 5, "vac": n°eq ... }
    ---------------------------------------------------- */
    public function get_vac_eq () {
        $ecartj = $this->dep->diff(new DateTime($this->day))->days;
        $tab = new stdClass();
        for ($eq=1;$eq<13;$eq++) {
            $debvac = ($ecartj - $eq + $this->eq_dep) % 12;
			$z = $this->tabvac[$debvac];
            if ($z !== "" && $z !== "N") {
				$tab->$z = $eq;
			}
            if ($z === "N") {
                $tab->$z = $eq;
                $eqN1 = $eq === 1 ? 12 : $eq - 1; // equipe de nuit de la veille
                $tab->{'N-1'} = $eqN1; 
            }
        }
        return $tab;
    }

    /* --------------------------------------------------------------------------------------
        Détection du tour de service en vigueur à la date choisie
        @param {object} tour 	- le json du tour de service
        @param {string} day 	- "yyyy-mm-jj"
        @param {string} zone 	- "est" ou "ouest"
        @returns {string}  - saison : "ete", "hiver", "mi-saison-basse", "mi-saison-haute"
    -------------------------------------------------------------------------------------- */
    public function get_date_tour($tour) {
        $d = new DateTime($this->day);
		$annee = (int) $d->format("Y");
		$mois = (int) $d->format("m");
        $d_hiver = explode("-", $tour->{$this->zone}->hiver->plage[0][0]);
		$f_hiver = explode("-", $tour->{$this->zone}->hiver->plage[0][1]);
        $d_ete = explode("-", $tour->{$this->zone}->ete->plage[0][0]);
        $f_ete = explode("-", $tour->{$this->zone}->ete->plage[0][1]);
        $index = $mois < 7 ? 0 : 1;
        $d_msb = explode("-", $tour->{$this->zone}->{'mi-saison-basse'}->plage[$index][0]);
        $f_msb = explode("-", $tour->{$this->zone}->{'mi-saison-basse'}->plage[$index][1]);
        $d_msh = explode("-", $tour->{$this->zone}->{'mi-saison-haute'}->plage[$index][0]);
        $f_msh = explode("-", $tour->{$this->zone}->{'mi-saison-haute'}->plage[$index][1]);
        
        $decembre = new DateTime("$annee-12-31"); // 31 decembre
        $janvier = new DateTime("$annee-01-01"); // 1er janvier
        $fin_hiver = new DateTime("$annee-$f_hiver[1]-$f_hiver[0]");
        $debut_hiver = new DateTime("$annee-$d_hiver[1]-$d_hiver[0]");
        $debut_msb = new DateTime("$annee-$d_msb[1]-$d_msb[0]");
        $fin_msb = new DateTime("$annee-$f_msb[1]-$f_msb[0]");
        $debut_msh = new DateTime("$annee-$d_msh[1]-$d_msh[0]");
        $fin_msh = new DateTime("$annee-$f_msh[1]-$f_msh[0]");
        $debut_ete = new DateTime("$annee-$d_ete[1]-$d_ete[0]");
        $fin_ete = new DateTime("$annee-$f_ete[1]-$f_ete[0]");

        if ($d >= $debut_hiver && $d <= $decembre) return "hiver";
        if ($d >= $janvier && $d <= $fin_hiver) return "hiver";
        if ($d >= $debut_ete && $d <= $fin_ete) return "ete";
        if ($d >= $debut_msb && $d <= $fin_msb) return "mi-saison-basse";
        if ($d >= $debut_msh && $d <= $fin_msh) return "mi-saison-haute";
    }

	// objet : passage par référence par défaut
	private function push_utc($vac, $tour_utc) {
		$tour = $this->tour_local->{$this->zone}->{$this->saison};
		$index_deb = $this->timeOffset*4 - 1;	

		foreach($tour->{$vac} as $index=>$elem) {
			if ($index > $index_deb) {
				$h = min_to_strtime(strtime_to_min($elem[0]) - $this->timeOffset*60);
				array_push($tour_utc->{$vac}, [$h, $elem[1], $elem[2], $elem[3]]);
			}
		};
		if ($this->timeOffset === 2) {
			array_push($tour_utc->{$vac}, ["22:00", $tour->{$vac}[0][1], $tour->{$vac}[0][2], $tour->{$vac}[0][3]]);
			array_push($tour_utc->{$vac}, ["22:15", $tour->{$vac}[1][1], $tour->{$vac}[1][2], $tour->{$vac}[1][3]]);
			array_push($tour_utc->{$vac}, ["22:30", $tour->{$vac}[2][1], $tour->{$vac}[2][2], $tour->{$vac}[2][3]]);
			array_push($tour_utc->{$vac}, ["22:45", $tour->{$vac}[3][1], $tour->{$vac}[3][2], $tour->{$vac}[3][3]]);
		}
		array_push($tour_utc->{$vac}, ["23:00", $tour->{$vac}[4][1], $tour->{$vac}[4][2], $tour->{$vac}[4][3]]);
		array_push($tour_utc->{$vac}, ["23:15", $tour->{$vac}[5][1], $tour->{$vac}[5][2], $tour->{$vac}[5][3]]);
		array_push($tour_utc->{$vac}, ["23:30", $tour->{$vac}[6][1], $tour->{$vac}[6][2], $tour->{$vac}[6][3]]);
		array_push($tour_utc->{$vac}, ["23:45", $tour->{$vac}[7][1], $tour->{$vac}[7][2], $tour->{$vac}[7][3]]);
	}

    /* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
        @returns {object}  - tour_utc : { [ ["00:00", 0, 1, 1], ["hh:mm", cds, A, B], ... ] }
    ----------------------------------------------------------------------------------------- */	
    public function get_tour_utc() {

        $tour_utc = new stdClass();
		$tour_utc->JX = [];
        $tour_utc->J1 = [];
        $tour_utc->J3 = [];
        $tour_utc->S2 = [];
        $tour_utc->J2 = [];
        $tour_utc->S1 = [];
        $tour_utc->N = [];
        
		$this->push_utc("JX", $tour_utc);
		$this->push_utc("J1", $tour_utc);
		$this->push_utc("J3", $tour_utc);
		$this->push_utc("S2", $tour_utc);
		$this->push_utc("J2", $tour_utc);
		$this->push_utc("S1", $tour_utc);
		$this->push_utc("N", $tour_utc);
		
        return $tour_utc;
    }

	// objet : passage par référence par défaut
	private function push_utc_supp($vac, $tour_utc_supp) {
		$tour = $this->tds_supp_local->{$this->zone};
		$index_deb = $this->timeOffset*4 - 1;

		foreach($tour->{$vac} as $index=>$elem) {
			if ($index > $index_deb) {
				$h = min_to_strtime(strtime_to_min($elem[0]) - $this->timeOffset*60);
				array_push($tour_utc_supp->{$vac}, [$h, $elem[1]]);
			}
		};

		if ($this->timeOffset === 2) {
			array_push($tour_utc_supp->{$vac}, ["22:00", $tour->{$vac}[0][1]]);
			array_push($tour_utc_supp->{$vac}, ["22:15", $tour->{$vac}[1][1]]);
			array_push($tour_utc_supp->{$vac}, ["22:30", $tour->{$vac}[2][1]]);
			array_push($tour_utc_supp->{$vac}, ["22:45", $tour->{$vac}[3][1]]);
		}
		array_push($tour_utc_supp->{$vac}, ["23:00", $tour->{$vac}[4][1]]);
		array_push($tour_utc_supp->{$vac}, ["23:15", $tour->{$vac}[5][1]]);
		array_push($tour_utc_supp->{$vac}, ["23:30", $tour->{$vac}[6][1]]);
		array_push($tour_utc_supp->{$vac}, ["23:45", $tour->{$vac}[7][1]]);
	}

	/* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
			{"est":{
				"RD...":[["00:00",0],["00:15",0],...],
				"RD...":[["00:00",0],["00:15",0],...]
				...
			}}
        @returns {object}  - tour_utc (sans la zone) 
			{ 
				"RD...": [ ["00:00", 0], ["hh:mm", nb], ... ],
				"RD...": [ ["00:00", 0], ["hh:mm", nb], ... ]
				...
			}
    ----------------------------------------------------------------------------------------- */
	public function get_tds_supp_utc() {
		
        $tour = $this->tds_supp_local->{$this->zone};	
        $index_deb = $this->timeOffset*4 - 1;
       
        $tour_utc_supp = new stdClass();

		// RD_vac_hors_Jx = ["RD...","RD...",...]
		$RD_vac_hors_Jx = array_keys(get_object_vars($tour));

        foreach ($RD_vac_hors_Jx as $vac) {
			$tour_utc_supp->{$vac} = [];
		}
        
		foreach ($RD_vac_hors_Jx as $vac) {
			$this->push_utc_supp($vac, $tour_utc_supp);
		}

        return $tour_utc_supp;
	}

}
?>