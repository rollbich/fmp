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
    public function __construct(string $day, string $zone, bool $use_bdd = false) {
		$this->bdd = new bdd_tds($day, $zone);
		$this->bdd_instr = new bdd_instr();
        $this->day = $day;
        $this->zone = $zone;
		$this->use_bdd = $use_bdd;
        $this->zone_olaf = ($zone === "ouest") ? 'W' : 'E';
        $this->cycle = $this->bdd->get_cycle();   		// ["JX","J1","J3","S2","","","J2","S1","N","","",""]; 
		$this->clean_cycle = $this->get_clean_cycle();	// ["JX","J1","J3","S2","J2","S1","N"]; 
        $this->init();
    }

	public function init() {
		$this->timeOffset = get_decalage($this->day);
		$this->tour_local = $this->bdd->get_tds();
		$this->tour_local_greve = $this->bdd->get_tds("", true);
		$this->saison = $this->bdd->get_current_tds();
		$this->saison_greve = $this->bdd->get_current_tds(1);
		$this->tds_supp_local = $this->bdd->get_tds_supp();
		$this->instr = $this->bdd_instr->get_creneaux_day($this->day, $this->zone);
		$this->repartition = $this->bdd->get_repartition();
		$this->repartition_greve = $this->bdd->get_repartition("", true);
		$yesterday = new DateTime($this->day);
        $yesterday = $yesterday->modify("-1 day");
		$this->yesterday = $yesterday->format("Y-m-d");
	}

	// @return ["JX", "J1", "J3", "S2", "J2", "S1", "N"]
	public function get_clean_cycle() {
		$clean_vacs = [];
		$vacations = $this->cycle;
		foreach ($vacations as $value) {
			if ($value !== "") array_push($clean_vacs, $value);
		}
		return $clean_vacs;
	}

    /* ----------------------------------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
        *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
            @returns {object} : 
			  { "pc_vac": {
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
		// Récupère les couples vacations/equipe sortis par OLAF avec le 'N-1'
		$this->tab_vac_eq = $this->get_vac_eq_olaf();
		// Récupère les vacations sortis par OLAF
		$this->workingVacs = array_keys(get_object_vars($this->tab_vac_eq));
		$workingVacsArrayObject = new ArrayObject($this->workingVacs);
		// Vacations OLAF sans le 'N-1'
		$this->workingCycle = $workingVacsArrayObject->getArrayCopy();
		if(($key = array_search("N-1", $this->workingCycle)) !== false) {
			unset($this->workingCycle[$key]);
		}

		$this->tour_utc = $this->get_tour_utc();
		$this->tour_utc_greve = $this->get_tour_utc(true);
		$this->tds_supp_utc = $this->get_tds_supp_utc();
		
		// Calcul du nombre de pc à afficher 
		// On récupère l'effectif total, donc on doit enlever le cds sur les vacations qui en ont 1	
		$this->pc = new stdClass();
		foreach($this->workingVacs as $vac) {
			$this->pc->{$vac} = new stdClass();
		}

	/*  -------------------------------------------------------------------
				Gestion TDS Supp
				Dans OLAF, Renfort contient les tours supplémentaires
		------------------------------------------------------------------- */
		$Renfort = $this->effectif->{$this->day}->Renfort;
		// Renfort hors vacation d'équipe
		$RD_names = [];
		$RD = new stdClass();
		foreach ($Renfort as $renf1 => $value1) {
			foreach ($value1 as $cle => $obj) {
				// "RD-bureau1-2024" - "RD-bureau1-2024"
				$label = $obj->contextmenutype->label;
				$rd_type = "";
				$type_renfort = "";
				$type_vac = "Supp";
				array_push($RD_names, $label);	
				
				$agent = $obj->agent->nomComplet;
				$agent_type = "détaché";

				if (property_exists($RD, $label) === false) { 
					$RD->{$label} = new stdClass();
					$RD->{$label}->nombre = 0;
					$RD->{$label}->agent = new stdClass();
				}
				$RD->{$label}->agent->{$agent} = $agent_type;
				$RD->{$label}->nombre++;
				
			}
		}
		
		$tds_suppl = new stdClass();

		/*	-----------------------------------------------------------------------
					Get contextmenutype = tagged people
				contextmenutype: {
					"xxxxxx": {
						"id_licence": "4000889",
						"idagent": "4000889",
						"label": "JX",
						"prenom": "Coco",
						"nom": "LAPIN"
					},
					...
				}
			----------------------------------------------------------------------- */
		if (is_array($this->effectif->{$this->day}->contextmenutype)) {
			$contextmenu_today = [];
		} else {
			$contextmenu_today = array_keys(get_object_vars($this->effectif->{$this->day}->contextmenutype));
		}
		if (is_array($this->effectif->{$this->yesterday}->contextmenutype)) {
			$contextmenu_yesterday = [];
		} else {
			$contextmenu_yesterday = array_keys(get_object_vars($this->effectif->{$this->yesterday}->contextmenutype));
		}


		foreach ($this->tab_vac_eq as $vac => $value) {
			$p = $value."-".$this->zone_olaf;
			$jour = $this->day;
			if ($vac === "N-1") $jour = $this->yesterday;
			// lorsque la colonne JX d'OLAF n'existe pas, $p n'existe pas
			if (isset($this->effectif->{$jour}->{$p})) {
				// Le RO induit apparait si detachés > 1 et plus que 1 n'est pas Expert Ops, ACDS ou Assistant sub
				$this->pc->{$vac}->ROinduit = (int) $this->effectif->{$jour}->{$p}->teamReserve->roInduction;
				if ($vac === "N-1") {
					$this->pc->{$vac}->nbcds = (int) $this->tour_local->N->nb_cds;
					$this->pc->{$vac}->nbcds_greve = (int) $this->tour_local_greve->N->nb_cds;
				} else {
					$this->pc->{$vac}->nbcds = (int) $this->tour_local->{$vac}->nb_cds;
					$this->pc->{$vac}->nbcds_greve = (int) $this->tour_local_greve->{$vac}->nb_cds;
				}
				$this->pc->{$vac}->nbpc = (int) $this->effectif->{$jour}->{$p}->teamReserve->teamQuantity - (int) $this->pc->{$vac}->nbcds; 
				$this->pc->{$vac}->BV = (int) $this->effectif->{$jour}->{$p}->teamReserve->BV;
				$this->pc->{$vac}->RO = 0;
				//$this->pc->{$vac}->RO = (int) $this->effectif->{$jour}->{$p}->teamReserve->roQuantity;
				$this->pc->{$vac}->equipe = (int) explode("-", $p)[0];
				$userList = $this->effectif->{$jour}->{$p}->userList;
				$this->pc->{$vac}->teamNominalList = new stdClass();
				$this->pc->{$vac}->teamNominalList->agentsList = [];
				foreach ( $userList as $idagent=>$value ) {
					// parfois role n'existe pas => utilisation de rolelist
					$rolelist = null;
					if (isset($value->role)) {
						if (!(is_array($value->role))) { // soit array vide, soit objet que l'on convertit en array
							$rolelist = explode(",", $value->role);
						} else {
							$rolelist = $value->role;
						}
					} else {
						$rolelist = [];
						foreach($value->rolelist as $role) {
							array_push($rolelist, (int) $role->idrole);
						}
					}
					if (!(in_array(14, $rolelist) || in_array(37, $rolelist))) { // 14 = détaché 37 = assistant sub, on ne les prend pas en compte (OLAF les compte)
						$nc = $value->nom." ".$value->prenom;
						$this->pc->{$vac}->teamNominalList->{$nc} = new stdClass();
						$this->pc->{$vac}->teamNominalList->{$nc}->nom = $value->nom;
						$this->pc->{$vac}->teamNominalList->{$nc}->prenom = $value->prenom;
						$this->pc->{$vac}->teamNominalList->{$nc}->nomComplet = $nc;
						$this->pc->{$vac}->teamNominalList->{$nc}->role = $rolelist;
						array_push($this->pc->{$vac}->teamNominalList->agentsList, $value->nom." ".$value->prenom);
					}
				}
				
				$aTeamComposition = $this->effectif->{$jour}->{$p}->aTeamComposition;
				$this->pc->{$vac}->RoList = [];
				$this->pc->{$vac}->CDS = "";
				$this->pc->{$vac}->teamToday = new stdClass();
				foreach ( $aTeamComposition as $key=>$value ) {
					if ($key !== "lesrenforts") {
						foreach ($value as $pers) {
							$nc = $pers->agent->nom." ".$pers->agent->prenom;
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
								//echo "$vac<br>";
								if ($vac !== "JX") {
									$this->pc->{$vac}->teamToday->{$nc} = new stdClass();
									$this->pc->{$vac}->teamToday->{$nc}->prenom = $pers->agent->prenom;
									$this->pc->{$vac}->teamToday->{$nc}->nom = $pers->agent->nom;
									$this->pc->{$vac}->teamToday->{$nc}->nomComplet = $nc;
									$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC";
									$this->pc->{$vac}->teamToday->{$nc}->hasCDSCapability = false; 
									$this->pc->{$vac}->teamToday->{$nc}->hasACDSCapability = false; 
									
									if (isset($this->pc->{$vac}->teamNominalList->{$nc}->role)) {
										$this->pc->{$vac}->teamToday->{$nc}->role = $this->pc->{$vac}->teamNominalList->{$nc}->role;
									} else {
										$this->pc->{$vac}->teamToday->{$nc}->role = [];
									}
									
									if (in_array(82, $this->pc->{$vac}->teamToday->{$nc}->role)) {
										$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC-CDS";
										$this->pc->{$vac}->teamToday->{$nc}->hasCDSCapability = true; 
									}
									if (in_array(80, $this->pc->{$vac}->teamToday->{$nc}->role)) {
										$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC-ACDS";
										$this->pc->{$vac}->teamToday->{$nc}->hasACDSCapability = true;
									} 
									if ($cds) $this->pc->{$vac}->teamToday->{$nc}->fonction = "CDS";
									if (in_array(183, $this->pc->{$vac}->teamToday->{$nc}->role)) $this->pc->{$vac}->teamToday->{$nc}->fonction = "requalif";
									if (in_array(10, $this->pc->{$vac}->teamToday->{$nc}->role)) $this->pc->{$vac}->teamToday->{$nc}->fonction = "stagiaire";
								} else {
									foreach($contextmenu_today as $key) {
										if ($this->effectif->{$this->day}->contextmenutype->{$key}->idagent == $pers->agent->id) { // == car un est un int et l'autre string
											$this->pc->{$vac}->teamToday->{$nc} = new stdClass();
											$this->pc->{$vac}->teamToday->{$nc}->prenom = $pers->agent->prenom;
											$this->pc->{$vac}->teamToday->{$nc}->nom = $pers->agent->nom;
											$this->pc->{$vac}->teamToday->{$nc}->nomComplet = $nc;
											$this->pc->{$vac}->teamToday->{$nc}->fonction = "PC";
											$this->pc->{$vac}->teamToday->{$nc}->hasCDSCapability = false; 
											$this->pc->{$vac}->teamToday->{$nc}->hasACDSCapability = false;
										}
									}
								}
							}
						}
					}
				}

				//	Recyclage en équipes
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
						$pc = "PC-DET";
						if (is_array($renf->contextmenuType)) {
							// Recyclage classique
						} else {
							// recyclage RD
							$label_RD = strtolower($renf->contextmenuType->label);
							if (str_contains($label_RD, "bleu")) $pc = "RD bleu";
							if (str_contains($label_RD, "jaune")) $pc = "RD jaune";
							if (str_contains($label_RD, "vert")) $pc = "RD vert";
							if (str_contains($label_RD, "rouge")) $pc = "RD rouge";
						}
						$this->pc->{$vac}->renfortAgent->{$nomComplet}->fonction = $pc;
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
						if (str_contains($nom, " ") === false) {
							//$nom = explode(" ", $nom)[0];
							$tab_teamToday = array_keys(get_object_vars($this->pc->{$vac}->teamToday));
							foreach($tab_teamToday as $nom_comp) {
								if (str_contains($nom_comp, $nom)) $nom = $nom_comp;
							}
						}
						
						$h = explode(">", $html_value)[2];
						$remplace = explode("<", $h)[0]; // nom du remplacé
						
						foreach ($this->pc->{$vac}->teamNominalList->agentsList as $ncomp_agent) { // pour trouver agent remplacé
							$n_agent = explode(" ", $ncomp_agent)[0]; // nom uniquement
							if (str_contains($ncomp_agent, $remplace)) {
								$this->pc->{$vac}->RPL->{$nom} = $ncomp_agent;
							} 
						}
					}
				}

				// Précise la fonction RPL des Remplacant dans teamToday
				foreach ($this->pc->{$vac}->RPL as $remplacant => $remplace) {
					foreach ($this->pc->{$vac}->teamToday as $fullname => $obj) {
						if (strcmp($remplacant, $obj->nomComplet) === 0) {
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
					$cge = [];
					$arr_conge = array_keys(get_object_vars($teamData->conge));
					foreach($arr_conge as $nom) {
						if (!str_contains($nom, " ")) {
							foreach ($this->pc->{$vac}->teamNominalList->agentsList as $ncomp_agent) { // pour trouver agent remplacé
								$n_agent = explode(" ", $ncomp_agent)[0]; // nom uniquement
								$p_agent = explode(" ", $ncomp_agent)[1]; // nom uniquement
								if (str_contains($ncomp_agent, $nom)) {
									array_push($cge, $n_agent." ".$p_agent);
								} 
							}
						} else {
							array_push($cge, $nom);
						}
					}
					$this->pc->{$vac}->conge = $cge;
				} else {
					$this->pc->{$vac}->conge = [];
				}

				// Récupère les requis
				/* contextmenutype: {
					323958: {
						id_renfort: "3947",
						id_licence: "4000942",
						label: "Requis1",
						idagent: "4000942",
						prenom: "Quentin",
						nom: "AUBERT"
					},...
				*/
				/*
				echo "<pre>";
				var_dump(get_object_vars($this->effectif->{$this->day}->contextmenutype));
				var_dump(get_object_vars($this->effectif->{$this->yesterday}->contextmenutype));
				echo "</pre>";
				*/
				// Si c'est un array c'est qu'il n'y a pas de données contextmenutype
				// normalement, il y a au moins les tags CDS
				if (is_array($this->effectif->{$this->day}->contextmenutype)) {
					$tags_today = [];
				} else {
					$tags_today = array_keys(get_object_vars($this->effectif->{$this->day}->contextmenutype));
				}
				if (is_array($this->effectif->{$this->yesterday}->contextmenutype)) {
					$tags_yesterday = [];
				} else {
					$tags_yesterday = array_keys(get_object_vars($this->effectif->{$this->yesterday}->contextmenutype));
				}
				$this->pc->{$vac}->requis = [];
				foreach ($tags_today as $cle) {
					$val = $this->effectif->{$this->day}->contextmenutype->$cle;
					if (str_contains($val->label, "Requis")) {
						foreach (array_keys(get_object_vars($this->pc->{$vac}->teamToday)) as $key) {
							$valeur = $this->pc->{$vac}->teamToday->$key;
							if (strcmp($valeur->nom, $val->nom) === 0 && strcmp($valeur->prenom, $val->prenom) === 0) {
								$obj = new stdClass();
								$obj->nom = $valeur->nom;
								$obj->prenom = $valeur->prenom;
								array_push($this->pc->{$vac}->requis, $obj);
							}
						}
						foreach (array_keys(get_object_vars($this->pc->{$vac}->renfortAgent)) as $key) {
							$valeur = $this->pc->{$vac}->renfortAgent->$key;
							if (strcmp($val->nom, $valeur->nom) === 0 && strcmp($val->prenom, $valeur->prenom) === 0) {
								$obj = new stdClass();
								$obj->nom = $valeur->nom;
								$obj->prenom = $valeur->prenom;
								array_push($this->pc->{$vac}->requis, $obj);
							}
						}
					}
				}
				foreach ($tags_yesterday as $cle) {
					$val = $this->effectif->{$this->yesterday}->contextmenutype->$cle;
					if (str_contains($val->label, "Requis")) {
						foreach (array_keys(get_object_vars($this->pc->{$vac}->teamToday)) as $key) {
							$valeur = $this->pc->{$vac}->teamToday->$key;
							if (strcmp($valeur->nom, $val->nom) === 0 && strcmp($valeur->prenom, $val->prenom) === 0) {
								$obj = new stdClass();
								$obj->nom = $valeur->nom;
								$obj->prenom = $valeur->prenom;
								array_push($this->pc->{$vac}->requis, $obj);
							}
						}
						foreach (array_keys(get_object_vars($this->pc->{$vac}->renfortAgent)) as $key) {
							$valeur = $this->pc->{$vac}->renfortAgent->$key;
							if (strcmp($val->nom, $valeur->nom) === 0 && strcmp($val->prenom, $valeur->prenom) === 0) {
								$obj = new stdClass();
								$obj->nom = $valeur->nom;
								$obj->prenom = $valeur->prenom;
								array_push($this->pc->{$vac}->requis, $obj);
							}
						}
					}
				}
				$this->pc->{$vac}->nb_requis = count($this->pc->{$vac}->requis);

			} else {
				$this->pc->{$vac}->ROinduit = 0;
				$this->pc->{$vac}->nbcds = 0;
				$this->pc->{$vac}->nbcds_greve = 0;
				$this->pc->{$vac}->nbpc = 0; 
				$this->pc->{$vac}->BV = 10;
				$this->pc->{$vac}->RO = 0;
				$this->pc->{$vac}->RoList = [];
				$this->pc->{$vac}->stage = [];
				$this->pc->{$vac}->requis = [];
				$this->pc->{$vac}->conge = [];
				$det = 0; 
				$this->pc->{$vac}->renfort = 0;
				$this->pc->{$vac}->renfortAgent = new stdClass();
				$this->pc->{$vac}->RPL = new stdClass();
				$this->pc->{$vac}->nb_requis = 0;
				$this->pc->{$vac}->teamToday = new StdClass();
				$this->pc->{$vac}->teamNominalList = new stdClass();
				$this->pc->{$vac}->teamNominalList->agentsList = [];
			}
			
		} 

		// array du nombre de pc dispo associé au créneau horaire du tour de service
		// En 24h, il y a 96 créneaux de 15mn.
		// [ ["hh:mm", nb_pc_dispo], [...], ... ]
		$nb_pc = 0;
		$nb_pc_greve = 0;
		$pcs = []; // total pc hors instr & hors TDS supp 
		$pct = []; // total pc
		$pct_greve = [];
		$ucesos = [];
		$in15mn = []; // nbre de pc instruction par 15 mn
		// effectif_RD_15mn = {
		//	  "RD...": [],
		//	  "RD...": []
		//	  ...
		//  }
		$effectif_total_RD_15mn = [];
		$effectif_RD_15mn = new stdClass();

		$nb_pc_sousvac = new stdClass();
		$nb_pc_sousvac_greve = new stdClass();
		foreach($this->workingVacs as $vacation) {
			$sv = $this->get_sousvacs($vacation);
			$sv_greve = $this->get_sousvacs($vacation, true);
			$nb_pc_sousvac->{$vacation} = new StdClass();
			$nb_pc_sousvac_greve->{$vacation} = new StdClass();
			$nb_pc_sousvac->{$vacation}->cds = [];
			$nb_pc_sousvac_greve->{$vacation}->cds = [];
			foreach($sv as $sousvac) {
				$nb_pc_sousvac->{$vacation}->$sousvac = [];
			}
			foreach($sv_greve as $sousvac) {
				$nb_pc_sousvac_greve->{$vacation}->$sousvac = [];
			}
		}

		for($i=0;$i<96;$i++) {
			foreach($this->workingVacs as $vacation) {
				$sv = $this->get_sousvacs($vacation);
				$sv_greve = $this->get_sousvacs($vacation, true);
				$nb_pc_sousvac->{$vacation}->cds[$i] = 0;
				$nb_pc_sousvac_greve->{$vacation}->cds[$i] = 0;
				foreach($sv as $sousvac) {
					$nb_pc_sousvac->$vacation->{$sousvac}[$i] = 0;
				}
				foreach($sv_greve as $sousvac) {
					$nb_pc_sousvac_greve->$vacation->{$sousvac}[$i] = 0;
				}
			}
		}
		
		// array des sousvacs concernées par l'horaire par 15mn (96 valeurs)
		$details_sv_15mn = [];

		for($i=0;$i<96;$i++) {
			$obj_sv = new stdClass();
			foreach($this->workingVacs as $vacation) {
				$obj_sv->$vacation = new stdClass();
				$sv = $this->get_sousvacs($vacation);
				$sv_greve = $this->get_sousvacs($vacation, true);
				$tour_vacation = $vacation;
				if ($vacation === "N-1") $tour_vacation = "N";
				$rep = $this->get_repartition($vacation);
				$rep_greve = $this->get_repartition($vacation, true);
				
				$doLoop = true;
				if ($vacation === "N-1" && $i>48) $doLoop = false;
				if ($vacation === "N" && $i<48) $doLoop = false;

				if ($doLoop) {
					// Ajout du CDS qui bosse sur secteur
					if ($this->tour_utc->{$tour_vacation}->cds[$i] === 1) {
						$nb_pc += $this->pc->{$vacation}->nbcds;
						$nb_pc_sousvac->{$vacation}->cds[$i] = $this->pc->{$vacation}->nbcds;
					} 
					if ($this->tour_utc_greve->{$tour_vacation}->cds[$i] === 1) {
						$nb_pc_greve += $this->pc->{$vacation}->nbcds_greve;
						$nb_pc_sousvac_greve->{$vacation}->cds[$i] = $this->pc->{$vacation}->nbcds_greve;
					} 
					foreach($sv as $sousvac) {
						// Ajout des sous-vacations
						if ($this->tour_utc->{$tour_vacation}->{$sousvac}[$i] === 1) {
							$nb_pc += $rep->$sousvac;
							$nb_pc_sousvac->{$vacation}->{$sousvac}[$i] = $rep->$sousvac;
							$obj_sv->$vacation->$sousvac = $rep->$sousvac;
						} 
					}
					foreach($sv_greve as $sousvac) {
						if ($this->tour_utc_greve->{$tour_vacation}->{$sousvac}[$i] === 1) {
							$nb_pc_greve += $rep_greve->$sousvac;
							$nb_pc_sousvac_greve->{$vacation}->{$sousvac}[$i] = $rep_greve->$sousvac;
						} 
					}
				}
				if (!get_object_vars($obj_sv->$vacation)) unset($obj_sv->$vacation);
			}
			array_push($details_sv_15mn, $obj_sv);
			$heure = get_time($i);
			array_push($pcs, [$heure, $nb_pc]);
			array_push($pct_greve, [$heure, $nb_pc_greve]);
			
			
			/* 	----------------------------------------------------------------------------------------
					in15mn[i] = [nb_pc_supp, { "type": "Inst ou Eleve ....", "comm": "commentaire"}]
				---------------------------------------------------------------------------------------- */
			$in15mn[$i] = [0, []];
			/*
			echo "<pre>";
			var_dump($this->instr);
			echo "</pre>";
			*/
			foreach($this->instr as $index=>$elem) {
				$debut = $elem["debut"];
				$fin = $elem["fin"];
				$d = $elem["day"];
				$zone = $elem["zone"];
				$type = $elem["type"];
				$comm = $elem["comment"];
				$t = get_time($i);
				if ($d === $this->day && strtolower($zone) === $this->zone) {
					if ($i === 95 && $fin === "23:59:00") { 
						$in15mn[$i][0] -= 1; 
						$nb_pc -= 1; 
						$z = new stdClass();
						$z->type = $type;
						$z->comm = $comm;
						array_push($in15mn[$i][1], $z); 
					}
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
						if ($type === "-2PC") { $in15mn[$i-1][0] -= 2; $nb_pc -= 2; array_push($in15mn[$i-1][1], $z); }
					} 
				}
			};
			
			
			// s'il y a un Jx ce jour là
			// on ne créé que les vac_jx existantes ce jour là
			foreach($RD_names as $vac_jx) {
				if (property_exists($effectif_RD_15mn, $vac_jx) === false) $effectif_RD_15mn->{$vac_jx} = [];
				$effectif_RD_15mn->{$vac_jx}[$i] = 0;
			}
			
			foreach($RD_names as $vac_jx) {
				if ($vac_jx != "nbcds") {
					$nb2 = $RD->{$vac_jx}->nombre;
					if ($this->tds_supp_utc->{$vac_jx}[$i] === 1) {
						$effectif_RD_15mn->{$vac_jx}[$i] = $nb2;
					}
				}
			};

			$nb_pc = 0;
			$nb_pc_greve = 0;
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
		$res->cycle = $this->cycle;
		$res->clean_cycle = $this->clean_cycle;
		$res->offSetTime = $this->timeOffset;
		$res->tour_local = $this->tour_local;
		$res->tour_utc = $this->tour_utc;
		$res->tour_local_greve = $this->tour_local_greve;
		$res->tour_utc_greve = $this->tour_utc_greve;
		$res->tour_supp_local = $this->tds_supp_local;
		$res->tour_supp_utc = $this->tds_supp_utc;
		$res->workingTeam = $this->tab_vac_eq;
		$res->workingVacs = $this->workingVacs;
		$res->all_sv= $this->get_all_sousvacs();
		$res->repartition = $this->repartition;
		$res->repartition_greve = $this->repartition_greve;
		$res->pc_vac = $this->pc;
		$res->pc_total = $pct;
		$res->pc_total_greve = $pct_greve;
		$res->uceso = $ucesos;
		$res->compacted_uceso = $compacted_ucesos;
		$res->heures_uceso = new StdClass();
		$res->heures_uceso->min = $minutes_ucesos;
		$res->heures_uceso->hmin = $heures_ucesos."h".$reste_minutes;
		$res->pc_total_horsInstrRD_15mn = $pcs; // total pc hors instr & hors TDS supp (les RD Jx sont inclus)
		$res->pc_total_instr_15mn = $in15mn;
		$res->pc_RD_15mn = $effectif_RD_15mn;
		$res->pc_total_RD_15mn = $effectif_total_RD_15mn;
		$res->RD = $RD;
		$res->roles = $roles;
		$res->pc_sousvac_15mn = $nb_pc_sousvac;
		$res->pc_sousvac_15mn_greve = $nb_pc_sousvac_greve;
		$res->details_sv_15mn = $details_sv_15mn;
		$res->instr = $this->instr;
		
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
	public function get_sv(string $vacation, bool $greve = false) {
		$vac = $vacation;
		$tour = "tour_local";
		if ($greve === true) $tour = "tour_local_greve";
		if ($vacation === "N-1") $vac = "N";
		$temp_sv = array_keys(get_object_vars($this->{$tour}->{$vac}));
		$sv = array_filter($temp_sv, static function ($element) {
			return ($element !== "cds" && $element !== "nb_cds");
		});
		return $sv;
	}

	// 	retourne les sous-vacs d'une vac
	//	return ["A", "B", "C"...]
	public function get_sousvacs(string $vacation, bool $greve = false) {
		$vac = $vacation;
		$tour = "tour_local";
		if ($greve === true) $tour = "tour_local_greve";
		if ($vacation === "N-1") $vac = "N";
		$nb_sousvacs = count(array_keys(get_object_vars($this->{$tour}->$vac))) - 2;
		$arr = [];
		for($i=1;$i<$nb_sousvacs+1;$i++) {
			array_push($arr, $this->unichr($i+64));
		}
		return $arr;
	}

	// @return {"vac": ["A", "B",...], ...}
	public function get_all_sousvacs(bool $greve = false) {
		$obj = new stdClass();
		foreach($this->workingCycle as $vac) {
			$obj->$vac = $this->get_sousvacs($vac, $greve);
		}
		return $obj;
	}

	// defaut: 50/50 avec A<B
	public function get_default_repartition_greve(string $vacation) {
		$tour_vacation = $vacation;
		if ($vacation === "N-1") $tour_vacation = "N";
		$sousvacs = $this->get_sv($tour_vacation, true);
		$nb_sousvacs = count($sousvacs);

		$rep = new stdClass();

		switch ($nb_sousvacs) {
            case 2:
				$reste = ($this->pc->{$vacation}->nb_requis) % 2;
				if ($reste === 0) {
					$repart = $this->repartition->$tour_vacation->standard->sousvac2->reste0;
				}
				if ($reste === 1) {
					$repart = $this->repartition->$tour_vacation->standard->sousvac2->reste1;
				}
				$pc = floor($this->pc->{$vacation}->nb_requis/2);
				foreach ($sousvacs as $sousvac) {
					$rep->$sousvac = min($pc + $repart->$sousvac, $pc + $repart->$sousvac);
				}
                break;
			case 3:
				$reste = ($this->pc->{$vacation}->nb_requis) % 3;
				if ($reste === 0) {
					$repart = $this->repartition->$vacation->standard->sousvac3->reste0;
				}
				if ($reste === 1) {
					$repart = $this->repartition->$vacation->standard->sousvac3->reste1;
				}
				if ($reste === 2) {
					$repart = $this->repartition->$vacation->standard->sousvac3->reste2;
				}
				$pc = floor($this->pc->{$vacation}->nb_requis/3);
				foreach ($sousvacs as $sousvac) {
					$rep->$sousvac = min($pc + $repart->$sousvac, $pc + $repart->$sousvac);
				}
				break;
            default:
				$pc = $this->pc->{$vacation}->nb_requis;
				$rep->$sousvacs[0] = $pc;
		}

		return $rep;
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

	public function get_repartition(String $vacation, bool $greve = false) {
		if ($greve === true) return $this->get_default_repartition_greve($vacation);
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
			2021-01-13 :  13 janv 2021, equipe 9 en JX
            @returns {object} { "J1": 5, "vac": n°eq ... }
    ---------------------------------------------------- */
    public function get_vac_eq () {
		$dep = new DateTime('2021-01-13');
        $eq_dep = 9;
        $ecartj = $dep->diff(new DateTime($this->day))->days;
        $tab = new stdClass();
        for ($eq=1;$eq<13;$eq++) {
            $debvac = ($ecartj - $eq + $eq_dep) % 12;
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

	/* -----------------------------------------------------------------
        Récupère les équipes qui travaillent depuis OLAF avec le 'N-1'
            @returns {object} { "J1": 5, "vac": n°eq ... }
    -------------------------------------------------------------------- */
    public function get_vac_eq_olaf () {
		$tab = new stdClass();
        $keys = array_keys(get_object_vars($this->effectif->{$this->day}));
		foreach($keys as $eq) {
			// si "-E" ou "-W" est dans la chaine
			if(strpos($eq, "-E") !== false || strpos($eq, "-W") !== false){
				$numero = (int) explode("-", $eq)[0];
				// 2è test, on vérifie si c'est un nombre
				if (is_numeric($numero)) {
					$vac = $this->effectif->{$this->day}->{$eq}->vacation->label;
					$tab->{$vac} = $numero;
					if ($vac === "N") {
						$eqN1 = $numero === 1 ? 12 : $numero - 1; // equipe de nuit de la veille
						$tab->{'N-1'} = $eqN1;
					}
				}
			}
		}
        return $tab;
    }

	// objet : passage par référence par défaut
	private function push_utc($vac, $tour_utc, $greve = false) {
		$index_deb = $this->timeOffset*4 - 1;	
		$tour = "tour_local";
		if ($greve === true) $tour = "tour_local_greve";
		$tour_utc->{$vac}->nb_cds = $this->{$tour}->{$vac}->nb_cds;
		$tour_utc->{$vac}->cds = $this->{$tour}->{$vac}->cds;

		$sousvacs = $this->get_sv($vac, $greve);
		/*
		echo $vac."<br>";
		if ($greve === false) echo "Pas de grève<br>"; else echo "Grève<br>";
		var_dump($sousvacs);
		echo "<br>";
		*/
		foreach($sousvacs as $sousvac) {
			$tour_utc->{$vac}->{$sousvac} = $this->{$tour}->{$vac}->{$sousvac};
		}
		
		if ($this->timeOffset === 2) {
			for($i=0;$i<4;$i++) {
				$z = array_shift($tour_utc->{$vac}->cds);
				array_push($tour_utc->{$vac}->cds, $z);
				foreach($sousvacs as $sousvac) {
					$z = array_shift($tour_utc->{$vac}->{$sousvac});
					array_push($tour_utc->{$vac}->{$sousvac}, $z);
				}
			}
		}

		for($i=0;$i<4;$i++) {
			$z = array_shift($tour_utc->{$vac}->cds);
			array_push($tour_utc->{$vac}->cds, $z);
			foreach($sousvacs as $sousvac) {
				$z = array_shift($tour_utc->{$vac}->{$sousvac});
				array_push($tour_utc->{$vac}->{$sousvac}, $z);
			}
		}		

	}
	

    /* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
        @returns {object}  - tour_utc : { [ ["00:00", 0, 1, 1], ["hh:mm", cds, A, B], ... ] }
    ----------------------------------------------------------------------------------------- */	
    public function get_tour_utc($greve = false) {

		$tour_utc = new stdClass();
		
		foreach($this->workingCycle as $vac) {
			$tour_utc->$vac = new stdClass();
			$this->push_utc($vac, $tour_utc, $greve);
		}
        
        return $tour_utc;
    }

	/* -----------------------------------------------------------------------------------------
        Transformation du tour supp (défini en heure locale) en heure UTC
        @tds_supp_local {object} - le json du tour supp
			object(stdClass)#26 (3) {
                "RD-bureau1-2024": [ 0, 0, 1, 1, 0, 0 ... ],   96 valeurs
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

		// RD_vac = ["RD...","RD...",...]
		$RD_vac = array_keys(get_object_vars($this->tds_supp_local));

        foreach ($RD_vac as $vac) {
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