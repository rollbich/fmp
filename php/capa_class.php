<?php
require_once("config_olaf.php");
require_once("bdd.class.php");

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
	
// return nom famille pour les congé et stage
function firstElem($elem) {
	return explode(" ", $elem)[0] ?? $elem;
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
    private $cycle;
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
	private $donnees;

    // $zone : "est" ou "ouest"
    public function __construct(string $day, string $zone) {
		$this->bdd = new bdd($day, $zone);
		$this->bdd_instr = new bdd_instr();
        $this->day = $day;
        $this->zone = $zone;
        $this->zone_olaf = ($zone === "ouest") ? 'W' : 'E';
        $this->cycle = $this->bdd->get_cycle();   		// ["JX","J1","J3","S2","","","J2","S1","N","","",""]; 
		$this->clean_cycle = $this->get_clean_cycle();	// ["JX","J1","J3","S2","J2","S1","N"]; 
        $this->dep = new DateTime('2021-01-13'); // 13 janv 2021
        $this->eq_dep = 9; // équipe 9 en JX
        $this->init();
    }

	public function init() {
		$this->timeOffset = $this->get_decalage();
		$this->tour_local = $this->bdd->get_tds();
		$this->saison = $this->bdd->get_current_tds();
		$this->tour_utc = $this->get_tour_utc();
		$this->tds_supp_local = $this->bdd->get_tds_supp();
		$this->tds_supp_utc = $this->get_tds_supp_utc();
		$this->instr = $this->bdd_instr->get_creneaux_day($this->day, $this->zone);
		$this->tab_vac_eq = $this->get_vac_eq();
		$this->repartition = $this->bdd->get_repartition();
		$yesterday = new DateTime($this->day);
        $yesterday = $yesterday->modify("-1 day");
		$this->yesterday = $yesterday->format("Y-m-d");
	}

	// @return ["JX", "J1", "J3", "S2", "J2", "S1", "N"]
	public function get_clean_cycle() {
		$clean_vacs = [];
		$vacs = $this->cycle;
		foreach ($vacs as $value) {
			if ($value !== "") array_push($clean_vacs, $value);
		}
		return $clean_vacs;
	}

	// Récupère le décalage horaire en heures à 6h
	public function get_decalage() {
		$d = new DateTime($this->day);
		$d->modify('+ 6 hours');
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
					"vac": { // inclus "N-1"
						"nbpc": nbre_pc,
						"nbcds": nbre_cds,
						"renfort": nbre_renfort,
						"BV": BV,
						"RO": nbre_RO,
						"RO induit": nbre_induit,
						"teamData": {...},
						"userList": {...},
						"aTeamComposition": {...},
					}, 
					...
				}, 
                "pc_total_dispo_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ],
				"pc_total_RD_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ],
				"pc_total_instru_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ]
			  }
    ------------------------------------------------------------------------------------------------------------------- */
    public function get_nbpc_dispo() {
		
		// récupère l'objet contenant les propriétés equipes, return string
		$effectif = get_olaf($this->zone_olaf, $this->day, $this->yesterday);
        // convert to stdClass
		$this->effectif = json_decode($effectif);
		// Calcul du nombre de pc à afficher 
		// On récupère l'effectif total, donc on doit enlever le cds sur les vacations qui en ont 1	
		$this->pc = new stdClass();
		foreach($this->clean_cycle as $vac) {
			$this->pc->$vac = new stdClass();
		}
		$this->pc->{'N-1'} = new stdClass();

		/*  -------------------------------------------------
			pc["JX"] contient les JX mais aussi les RD bleus
			pc["JX"] = {
				"JXA-2023": {
					"nombre": 2,
					"agent": {
						"Jean Coco": "détaché",
						"Moustache": "salle"
					}
				},
				"RDJ3b-ms-2023": {
					...
				}
				...
		}
		-----------------------------------------------------  */

		// Dans OLAF, Renfort contient les JX + les RD bleus
		$Renfort = $this->effectif->{$this->day}->Renfort;
		// Renfort hors JX
		$RD_names_horsJX = [];
		$nb_jx = 0;
		$nb_jx_det = 0;
		$RD = new stdClass();
		$TDS_Supp = new stdClass();
		foreach ($Renfort as $renf1 => $value1) {
			foreach ($value1 as $cle => $obj) {
				$label = $obj->contextmenutype->label;
				$jx_type = "";
				$rd_type = "";
				$type_renfort = "";
				// JXA & JXB salle 2023
				// "RD bleu JXa-ms" - "RD bleu J1-ms" - "RD bleu J3b-ms" + Est only "RD bleu S1b-ms" + West only "RD bleu S1a-ms"
				// "RD bleu J3a-ete" - "RD bleu S1b-ete" - "RD bleu J1-ete" + Est only "RD bleu JXb-ete" + West only "RD bleu J3b-ete" 
				$nb_det = 0;
				if (str_contains($label, "JX")) {
					$type_vac = "JX";
					if (str_contains($label, "RD bleu")) { // RD
						$type_renfort = "RD";
						$rd_type = substr($label, 8); // ex : JXa-ms
						$jx_type = $rd_type;
						$nb_det++;
						$nb_jx_det++;
					} else { // JX salle
						$type_renfort = "JX";
						$jx_type = $label;
					}
					$nb_jx++;
				} else { // RD non JX
					$type_vac = "Supp";
					$type_renfort = "RD";
					$rd_type = substr($label, 8);
					$jx_type = "RD$rd_type";
					array_push($RD_names_horsJX, $jx_type);
					$nb_det++;
				}		
				
				$agent = $obj->agent->nomComplet;
				$agent_type = (str_contains($label, "det") || str_contains($label, "RD")) ? "détaché" : "salle";

				if ($type_vac === "JX") {
					if (property_exists($this->pc->JX, $jx_type) === false) { 
						$this->pc->JX->{$jx_type} = new stdClass();
						$this->pc->JX->{$jx_type}->nombre = 0;
						$this->pc->JX->{$jx_type}->nombre_det = 0; 
						$this->pc->JX->{$jx_type}->agent = new stdClass();
					}
					$this->pc->JX->{$jx_type}->agent->{$agent} = $agent_type;
					$this->pc->JX->{$jx_type}->nombre++;
					$this->pc->JX->{$jx_type}->nombre_det += $nb_det;
				} 
				if ($type_renfort === "RD") {
					if (property_exists($RD, $jx_type) === false) { 
						$RD->{$jx_type} = new stdClass();
						$RD->{$jx_type}->nombre = 0;
						$RD->{$jx_type}->nombre_det = 0; 
						$RD->{$jx_type}->agent = new stdClass();
					}
					$RD->{$jx_type}->agent->{$agent} = $agent_type;
					$RD->{$jx_type}->nombre++;
					$RD->{$jx_type}->nombre_det += $nb_det;
				}

				if ($type_vac === "Supp") {
					if (property_exists($TDS_Supp, $jx_type) === false) { 
						$TDS_Supp->{$jx_type} = new stdClass();
						$TDS_Supp->{$jx_type}->nombre = 0;
						$TDS_Supp->{$jx_type}->nombre_det = 0; 
						$TDS_Supp->{$jx_type}->agent = new stdClass();
					}
					$TDS_Supp->{$jx_type}->agent->{$agent} = $agent_type;
					$TDS_Supp->{$jx_type}->nombre++;
					$TDS_Supp->{$jx_type}->nombre_det += $nb_det;
				}
				
			}
		}
		
		$this->pc->JX->equipe = $this->tab_vac_eq->JX;

		foreach ($this->tab_vac_eq as $vac => $value) {
			$p = $value."-".$this->zone_olaf;
			$jour = $this->day;
			if ($vac === "N-1") $jour = $this->yesterday;
			if ($vac !== "JX") {
				// Le RO induit apparait si detachés > 1 et plus que 1 n'est pas Expert Ops, ACDS ou Assistant sub
				$this->pc->{$vac}->ROinduit = (int) $this->effectif->{$jour}->{$p}->teamReserve->roInduction;
				if ($vac === "N-1") {
					$this->pc->{$vac}->nbcds = (int) $this->tour_local->N->nb_cds;
				} else {
					$this->pc->{$vac}->nbcds = (int) $this->tour_local->{$vac}->nb_cds;
				}
				$this->pc->{$vac}->nbpc = (int) $this->effectif->{$jour}->{$p}->teamReserve->teamQuantity - (int) $this->pc->{$vac}->nbcds; 
				$this->pc->{$vac}->BV = (int) $this->effectif->{$jour}->{$p}->teamReserve->BV;
				$this->pc->{$vac}->RO = 0;
				//$this->pc->{$vac}->RO = (int) $this->effectif->{$jour}->{$p}->teamReserve->roQuantity;
				$this->pc->{$vac}->equipe = (int) explode("-", $p)[0];
				$userList = $this->effectif->{$jour}->{$p}->userList;
				$this->pc->{$vac}->teamNominalList = new stdClass();
				$this->pc->{$vac}->teamNominalList->agentsList = [];
				foreach ( $userList as $key=>$value ) {
					if (!(is_array($value->role))) { // soit array vide, soit objet que l'on convertit en array
						$value->role = explode(",", $value->role);
					}
					if (!(in_array(14, $value->role) || in_array(37, $value->role))) { // 14 = détaché 37 = assistant sub ne sont pas mis (OLAF les compte)
						$nc = $value->prenom." ".$value->nom;
						$this->pc->{$vac}->teamNominalList->{$nc} = new stdClass();
						$this->pc->{$vac}->teamNominalList->{$nc}->nom = $value->nom;
						$this->pc->{$vac}->teamNominalList->{$nc}->prenom = $value->prenom;
						$this->pc->{$vac}->teamNominalList->{$nc}->nomComplet = $nc;
						$this->pc->{$vac}->teamNominalList->{$nc}->role = $value->role;
						array_push($this->pc->{$vac}->teamNominalList->agentsList, $value->nom);
					}
				}
				
				$aTeamComposition = $this->effectif->{$jour}->{$p}->aTeamComposition;
				$this->pc->{$vac}->RoList = [];
				$this->pc->{$vac}->CDS = "";
				$this->pc->{$vac}->teamToday = new stdClass();
				foreach ( $aTeamComposition as $key=>$value ) {
					if ($key !== "lesrenforts") {
						foreach ($value as $pers) {
							$nc = $pers->agent->prenom." ".$pers->agent->nom;
							$ro = false;
							$cds = false;
							if (is_array($pers->contextmenuType) === false) { // alors c'est un objet et non un array vide
								if ($pers->contextmenuType->type === "reserve_operationnelle") {
									$ro = true;
								}
								if ($pers->contextmenuType->type === "fonction" && $pers->contextmenuType->label === "CDS") {
									$this->pc->{$vac}->CDS = $nc;
									$cds = true;
								}
							}
							if ($ro) {
								array_push($this->pc->{$vac}->RoList, $nc);
								$this->pc->{$vac}->RO += 1;
							} 
							if ($ro === false) {
								
								$this->pc->{$vac}->teamToday->{$nc} = new stdClass();
								$this->pc->{$vac}->teamToday->{$nc}->prenom = $pers->agent->prenom;
								$this->pc->{$vac}->teamToday->{$nc}->nom = $pers->agent->nom;
								$this->pc->{$vac}->teamToday->{$nc}->nomComplet = $nc;
								$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC";
								$this->pc->{$vac}->teamToday->{$nc}->hasCDSCapability = false; 
								$this->pc->{$vac}->teamToday->{$nc}->hasACDSCapability = false; 

								if (isset($pers->agent->role)) {
									if (is_array($pers->agent->role)) {
										$this->pc->{$vac}->teamToday->{$nc}->role = $pers->agent->role;
									}else {
										$this->pc->{$vac}->teamToday->{$nc}->role = explode(",", $pers->agent->role);
									}
									
									if (in_array(82, $this->pc->{$vac}->teamToday->{$nc}->role)) {
										$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC-CDS";
										$this->pc->{$vac}->teamToday->{$nc}->hasCDSCapability = true; 
									}
									if (in_array(80, $this->pc->{$vac}->teamToday->{$nc}->role)) {
										$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC-ACDS";
										$this->pc->{$vac}->teamToday->{$nc}->hasACDSCapability = true;
									} 
								} else {
									$this->pc->{$vac}->teamToday->{$nc}->role = [];
								}
								if ($cds) $this->pc->{$vac}->teamToday->{$nc}->fonction = "CDS";
								if (in_array(10, $this->pc->{$vac}->teamToday->{$nc}->role)) $this->pc->{$vac}->teamToday->{$nc}->fonction = "stagiaire";
							}
						}
					}
				}
				$this->pc->{$vac}->renfortAgent = new stdClass();
				if (property_exists($aTeamComposition, "lesrenforts") === false) {
					$this->pc->{$vac}->renfort = 0;
				} else {
					$this->pc->{$vac}->renfort = count(array_keys(get_object_vars($aTeamComposition->lesrenforts)));
					$nomComplet ="";
					foreach ($aTeamComposition->lesrenforts as $renf) {
						$nomComplet = $renf->agent->nomComplet;
						$this->pc->{$vac}->renfortAgent->{$nomComplet} = new stdClass();
						$this->pc->{$vac}->renfortAgent->{$nomComplet}->nom = $renf->agent->nom;
						$this->pc->{$vac}->renfortAgent->{$nomComplet}->prenom = $renf->agent->prenom;
						$this->pc->{$vac}->renfortAgent->{$nomComplet}->nomComplet = $nomComplet;
						$this->pc->{$vac}->renfortAgent->{$nomComplet}->fonction = "PC-DET";
					}
				}

				$teamData = $this->effectif->{$jour}->{$p}->teamData;

				/*
				autre_agent: {
					"COUDERC": "<tr ki=39165 class='conge'>\n\t\t<td class=w150p>FRACHON</td>\n    <td class=w250p>PER avec &lt;strong&gt;Isabelle COUDERC&lt;/strong&gt;</td>\n    <td class=w250p>\n\t\n\tLe <b>02/07/2023</b>\n    </td>\n</tr>\n",
					"FREZOULS": "<tr ki=4001030 class='conge'>\n\t\t<td class=w150p>BEAUDONNET</td>\n    <td class=w250p>RPL par &lt;b&gt;FREZOULS&lt;/b&gt;</td>\n    <td class=w250p>\n\t\n\tLe <b>02/07/2023</b>\n    </td>\n</tr>\n"
				}
				*/

				$this->pc->{$vac}->RPL = new stdClass();
				if (isset($teamData->autre_agent)) {
					foreach ($teamData->autre_agent as $nom=>$html_value) { // nom du remplaçant
						if (str_contains($nom, " ")) $nom = explode(" ", $nom)[0];
						foreach ($this->pc->{$vac}->teamNominalList->agentsList as $agent) { // agent remplacé
							if (str_contains($html_value, $agent)) $this->pc->{$vac}->RPL->{$nom} = $agent;
						}
					}
				}

				// Précise la fonction RPL des Remplacant dans teamToday
				foreach ($this->pc->{$vac}->RPL as $remplacant => $remplace) {
					foreach ($this->pc->{$vac}->teamToday as $fullname => $obj) {
						if (strcmp($remplacant, $obj->nom) === 0) {
							$this->pc->{$vac}->teamToday->{$obj->nomComplet}->fonction = "PC-RPL";
						}
					}
				}

				if (is_array($teamData->stage) === false) { // alors c'est bien un objet sinon array vide
					//$this->pc->{$vac}->stage = array_map('firstElem', array_keys(get_object_vars($teamData->stage)));
					$this->pc->{$vac}->stage = array_keys(get_object_vars($teamData->stage));
				} else {
					$this->pc->{$vac}->stage = [];
				}
				if (is_array($teamData->conge) === false) { // alors c'est bien un objet sinon array vide
					//$this->pc->{$vac}->conge = array_map('firstElem', array_keys(get_object_vars($teamData->conge)));
					$this->pc->{$vac}->conge = array_keys(get_object_vars($teamData->conge));
				} else {
					$this->pc->{$vac}->conge = [];
				}

			} else {
				$this->pc->{$vac}->ROinduit = 0;
				$this->pc->{$vac}->nbcds = 0;
				$this->pc->{$vac}->nbpc = $nb_jx; 
				$this->pc->{$vac}->BV = 10;
				$this->pc->{$vac}->RO = 0;
				$det = 0; 
				$this->pc->{$vac}->renfort = $nb_jx_det;
				$this->pc->{$vac}->renfortAgent = new stdClass();
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

		// vacs = ["JX","J1", "J3", "S2", "J2", "S1", "N", "N-1"]  avec le "N-1"
		$vacs = $this->clean_cycle;
		array_push($vacs, "N-1");

		$nb_pc_sousvac = new stdClass();
		foreach($vacs as $vacation) {
			$sv = $this->get_sousvacs($vacation);
			$nb_pc_sousvac->{$vacation} = new StdClass();
			$nb_pc_sousvac->{$vacation}->cds = [];
			foreach($sv as $sousvac) {
				$nb_pc_sousvac->{$vacation}->$sousvac = [];
			}
		}

		for($i=0;$i<96;$i++) {
			foreach($vacs as $vacation) {
				$sv = $this->get_sousvacs($vacation);
				$nb_pc_sousvac->{$vacation}->cds[$i] = 0;
				foreach($sv as $sousvac) {
					$nb_pc_sousvac->$vacation->{$sousvac}[$i] = 0;
				}
			}
		}
		
		for($i=0;$i<96;$i++) {
			foreach($vacs as $vacation) {
				$sv = $this->get_sousvacs($vacation);
				$tour_vacation = $vacation;
				if ($vacation === "N-1") $tour_vacation = "N";
				$rep = $this->get_repartition($vacation);
				
				$doLoop = true;
				if ($vacation === "N-1" && $i>48) $doLoop = false;
				if ($vacation === "N" && $i<48) $doLoop = false;

				if ($doLoop) {
					// Ajout du CDS qui bosse sur secteur
					if ($this->tour_utc->{$tour_vacation}->cds[$i] === 1) {
						$nb_pc += $this->pc->{$vacation}->nbcds;
						$nb_pc_sousvac->{$vacation}->cds[$i] = $this->pc->{$vacation}->nbcds;
					} 
					foreach($sv as $sousvac) {
						// Ajout des sous-vacations
						if ($this->tour_utc->{$tour_vacation}->{$sousvac}[$i] === 1) {
							$nb_pc += $rep->$sousvac;
							$nb_pc_sousvac->{$vacation}->{$sousvac}[$i] = $rep->$sousvac;
						} 
					}
				}

			}

			$heure = get_time($i);
			array_push($pcs, [$heure, $nb_pc]);
			
			
			/* 	----------------------------------------------------------------------------------------
					in15mn[i] = [nb_pc_supp, { "type": "Inst ou Eleve ....", "comm": "commentaire"}]
				---------------------------------------------------------------------------------------- */
			$in15mn[$i] = [0, []];
			
			foreach($this->instr as $index=>$elem) {
				$debut = $elem["debut"];
				$fin = $elem["fin"];
				$d = $elem["day"];
				$zone = $elem["zone"];
				$type = $elem["type"];
				$comm = $elem["comment"];
				$t = get_time($i);
				if ($d === $this->day && strtolower($zone) === $this->zone) {
					if ($t >= $debut && $t< $fin) {
						$z = new stdClass();
						$z->type = $type;
						$z->comm = $comm;
						if ($type === "Inst") { $in15mn[$i-1][0] += 2; $nb_pc += 2; array_push($in15mn[$i-1][1], $z); }
						if ($type === "Inst1") { $in15mn[$i-1][0] += 1; $nb_pc += 2; array_push($in15mn[$i-1][1], $z); }
						if ($type === "Eleve") { array_push($in15mn[$i-1][1], $z); }
						if ($type === "Asa") { $in15mn[$i-1][0] -= 1; $nb_pc -= 1; array_push($in15mn[$i-1][1], $z); }
						if ($type === "Simu1PC") { $in15mn[$i-1][0] -= 1; $nb_pc -= 1; array_push($in15mn[$i-1][1], $z); }
						if ($type === "Simu2PC") { $in15mn[$i-1][0] -= 2; $nb_pc -= 2; array_push($in15mn[$i-1][1], $z); }
						if ($type === "-1PC") { $in15mn[$i-1][0] -= 1; $nb_pc -= 1; array_push($in15mn[$i-1][1], $z); }
					} 
				}
			};
			
			
			// s'il y a un Jx ce jour là
			// on ne créé que les vac_jx existantes ce jour là
			foreach($RD_names_horsJX as $vac_jx) {
				if (property_exists($effectif_RD_15mn, $vac_jx) === false) $effectif_RD_15mn->{$vac_jx} = [];
				$effectif_RD_15mn->{$vac_jx}[$i] = 0;
			}
			
			foreach($RD_names_horsJX as $vac_jx) {
				if ($vac_jx != "nbcds") {
					$nb2 = $RD->{$vac_jx}->nombre;
					if ($this->tds_supp_utc->{$vac_jx}[$i] === 1) {
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
			$heure = get_time($i);
			$nbr = $effectif_total_RD_15mn[$i] + $in15mn[$i][0] + $pcs[$i][1];
			array_push($pct, [$heure, $nbr]);
			array_push($ucesos, [$heure, floor($nbr/2), $nbr/2 - floor($nbr/2)]);
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

		$minutes_ucesos = 0;
		for($j=0;$j<95;$j++) {
			$minutes_ucesos += $ucesos[$j][1]*15;
		}

		$heures_ucesos = floor($minutes_ucesos/60);
		$reste_minutes = $minutes_ucesos%60;

		$roles = new stdClass();
		$roles->CDS = 82;
		$roles->ACDS = 80;
		$roles->DET = 14;
		$roles->ASS_SUB = 37;
		$roles->STAGIAIRE = 10;
		$roles->EXP_OPS = 145;
		$roles->PC_MU = 98;
		$roles->PC_salle = 9;
		$roles->CE = 25;

		$res = new stdClass();
		$res->day= $this->day;
		$res->zone = $this->zone;
		$res->saison = $this->saison;
		$res->tour_local = $this->tour_local;
		$res->offSetTime = $this->timeOffset;
		$res->pc_total = $pct;
		$res->uceso = $ucesos;
		$res->compacted_uceso = $compacted_ucesos;
		$res->heures_uceso = new StdClass();
		$res->heures_uceso->min = $minutes_ucesos;
		$res->heures_uceso->hmin = $heures_ucesos."h".$reste_minutes;
		$res->pc_total_horsInstrRD_15mn = $pcs; // total pc hors instr & hors RD bleu supp (les RD Jx sont inclus)
		$res->pc_total_instr_15mn = $in15mn;
		$res->pc_RD_15mn = $effectif_RD_15mn;
		$res->pc_total_RD_15mn = $effectif_total_RD_15mn;
		$res->pc_vac = $this->pc;
		$res->workingTeam = $this->tab_vac_eq;
		$res->RD = $RD;
		$res->roles = $roles;
		$res->TDS_Supp = $TDS_Supp;
		$res->pc_sousvac_15mn = $nb_pc_sousvac;
		$res->cycle = $this->cycle;
		$res->clean_cycle = $this->clean_cycle;
		$res->tour_utc = $this->tour_utc;
		$res->all_sv= $this->get_all_sousvacs();
		$res->repartition = $this->repartition;
		return $res;

    }

	// retourne le caractère correspondant au code (65 = A)
	// @param int $u
	// @return char
	private function unichr(int $u) {
		return mb_convert_encoding('&#' . intval($u) . ';', 'UTF-8', 'HTML-ENTITIES');
	}

	// 	retourne les sous-vacs d'une vac
	// $sv = ["A", "B"]
	public function get_sv(string $vacation) {
		$vac = $vacation;
		if ($vacation === "N-1") $vac = "N";
		$temp_sv = array_keys(get_object_vars($this->tour_local->{$vac}));
		$sv = array_filter($temp_sv, static function ($element) {
			return ($element !== "cds" && $element !== "nb_cds");
		});
		return $sv;
	}

	// 	retourne les sous-vacs d'une vac
	//	return ["A", "B", "C"...]
	public function get_sousvacs($vacation) {
		$vac = $vacation;
		if ($vacation === "N-1") $vac = "N";
		$nb_sousvacs = count(array_keys(get_object_vars($this->tour_local->$vac))) - 2;
		$arr = [];
		for($i=1;$i<$nb_sousvacs+1;$i++) {
			array_push($arr, $this->unichr($i+64));
		}
		return $arr;
	}

	// @return {"vac": ["A", "B",...], ...}
	public function get_all_sousvacs() {
		$vacs = $this->get_clean_cycle();
		$obj = new stdClass();
		foreach($vacs as $vac) {
			$obj->$vac = $this->get_sousvacs($vac);
		}
		return $obj;
	}

	// defaut: 50/50 avec A<B
	public function get_default_repartition(string $vacation) {
		$tour_vacation = $vacation;
		if ($vacation === "N-1") $tour_vacation = "N";
		$sousvacs = $this->get_sv($tour_vacation);
		$nb_sousvacs = count($sousvacs);

		$rep = new stdClass();

		switch ($nb_sousvacs) {
            case 2:
				$reste = ($this->pc->{$vacation}->nbpc) % 2;
				if ($reste === 0) {
					$repart = $this->repartition->$tour_vacation->standard->sousvac2->reste0;
				}
				if ($reste === 1) {
					$repart = $this->repartition->$tour_vacation->standard->sousvac2->reste1;
				}
				$pc1 = floor($this->pc->{$vacation}->nbpc/2);
				$pc2 = floor(($this->pc->{$vacation}->BV + $this->pc->{$vacation}->renfort - $this->pc->{$vacation}->nbcds - $this->pc->{$vacation}->ROinduit)/2);
				foreach ($sousvacs as $sousvac) {
					$rep->$sousvac = min($pc1 + $repart->$sousvac, $pc2 + $repart->$sousvac);
				}
                break;
			case 3:
				$reste = ($this->pc->{$vacation}->nbpc) % 3;
				if ($reste === 0) {
					$repart = $this->repartition->$vacation->standard->sousvac3->reste0;
				}
				if ($reste === 1) {
					$repart = $this->repartition->$vacation->standard->sousvac3->reste1;
				}
				if ($reste === 2) {
					$repart = $this->repartition->$vacation->standard->sousvac3->reste2;
				}
				$pc1 = floor($this->pc->{$vacation}->nbpc/3);
				$pc2 = floor(($this->pc->{$vacation}->BV + $this->pc->{$vacation}->renfort - $this->pc->{$vacation}->nbcds - $this->pc->{$vacation}->ROinduit)/3);
				foreach ($sousvacs as $sousvac) {
					$rep->$sousvac = min($pc1 + $repart->$sousvac, $pc2 + $repart->$sousvac);
				}
				break;
            default:
				$pc1 = $this->pc->{$vacation}->nbpc;
				$pc2 = $this->pc->{$vacation}->BV + $this->pc->{$vacation}->renfort - $this->pc->{$vacation}->nbcds - $this->pc->{$vacation}->ROinduit;
				$rep->$sousvacs[0] = min($pc1, $pc2);
		}

		return $rep;
	}

	public function get_repartition(String $vacation) {
		$tour_vacation = $vacation;
		if ($vacation === "N-1") $tour_vacation = "N";
		$sousvacs = $this->get_sv($tour_vacation);
		$svcle = "sousvac".count($sousvacs);
		$d = new DateTime($this->day);
		$jours = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
		$weekday = $jours[$d->format("w")];
		$pc_cle = "pc".$this->pc->{$vacation}->nbpc;

		if ($this->repartition->{$tour_vacation}->type_repartition === "fixe") {
			$result = $this->repartition->{$tour_vacation}->fixe->{$svcle}->{$weekday}->{$pc_cle};
		} else {
			$result = $this->get_default_repartition($vacation);
		}	
		return $result;
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
			$z = $this->cycle[$debvac];
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

	// objet : passage par référence par défaut
	private function push_utc($vac, $tour_utc) {
		$index_deb = $this->timeOffset*4 - 1;	
		$nb_cds = $this->tour_local->{$vac}->nb_cds;
		$tour_cds = $this->tour_local->{$vac}->cds;
		$tour_A = $this->tour_local->{$vac}->A;
		$tour_B = $this->tour_local->{$vac}->B;
		
		if ($this->timeOffset === 2) {
			for($i=0;$i<4;$i++) {
				$z = array_shift($tour_cds);
				array_push($tour_cds, $z);
				$z = array_shift($tour_A);
				array_push($tour_A, $z);
				$z = array_shift($tour_B);
				array_push($tour_B, $z);
			}
		}

		for($i=0;$i<4;$i++) {
			$z = array_shift($tour_cds);
			array_push($tour_cds, $z);
			$z = array_shift($tour_A);
			array_push($tour_A, $z);
			$z = array_shift($tour_B);
			array_push($tour_B, $z);
		}

		$tour_utc->{$vac}->nb_cds = $nb_cds;
		$tour_utc->{$vac}->cds = $tour_cds;
		$tour_utc->{$vac}->A = $tour_A;
		$tour_utc->{$vac}->B = $tour_B;

	}

    /* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
        @returns {object}  - tour_utc : { [ ["00:00", 0, 1, 1], ["hh:mm", cds, A, B], ... ] }
    ----------------------------------------------------------------------------------------- */	
    public function get_tour_utc() {

        $tour_utc = new stdClass();
		$tour_utc->JX = new stdClass();
        $tour_utc->J1 = new stdClass();
        $tour_utc->J3 = new stdClass();
        $tour_utc->S2 = new stdClass();
        $tour_utc->J2 = new stdClass();
        $tour_utc->S1 = new stdClass();
        $tour_utc->N = new stdClass();
        
		$this->push_utc("JX", $tour_utc);
		$this->push_utc("J1", $tour_utc);
		$this->push_utc("J3", $tour_utc);
		$this->push_utc("S2", $tour_utc);
		$this->push_utc("J2", $tour_utc);
		$this->push_utc("S1", $tour_utc);
		$this->push_utc("N", $tour_utc);
		
        return $tour_utc;
    }

	/* -----------------------------------------------------------------------------------------
        Transformation du tour supp (défini en heure locale) en heure UTC
        @tds_supp_local {object} - le json du tour supp
			object(stdClass)#26 (3) {
                "RDJ1-msh-2023": [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
                ...
            }
        @returns {object}  - tour_utc (sans la zone) 
			{ 
				"RD...": [ 0, 0, 1, 1, 0, 0 ... ],		96 valeurs
				"RD...": [ 0, 0, 1, 1, 0, 0 ... ]
				...
			}
    ----------------------------------------------------------------------------------------- */
	public function get_tds_supp_utc() {
       
        $tour_utc_supp = new stdClass();

		// RD_vac_hors_Jx = ["RD...","RD...",...]
		$RD_vac_hors_Jx = array_keys(get_object_vars($this->tds_supp_local));

        foreach ($RD_vac_hors_Jx as $vac) {
			$tour_utc_supp->{$vac} = $this->tds_supp_local->{$vac};
			if ($this->timeOffset === 2) {
				for($i=0;$i<4;$i++) {
					$z = array_shift($tour_utc_supp->{$vac});
					array_push($tour_utc_supp->{$vac}, $z);
				}
			}
			for($i=0;$i<4;$i++) {
				$z = array_shift($tour_utc_supp->{$vac});
				array_push($tour_utc_supp->{$vac}, $z);
			}
		}

        return $tour_utc_supp;
	}

}
?>