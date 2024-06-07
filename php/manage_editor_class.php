<?php
require_once("config_olaf.php");
require_once("bdd.class.php");

class editor {

	/* ------------------------------------------------------
			@param {string} day 	- "yyyy-mm-jj"
            @param {string} zone	- "est" ou "ouest"
	   ------------------------------------------------------ */
    
    private $zone;
    private $cycle;
    private $tour_local;
    private $saisons;
    private $tds_supp_local;
	private $tds_repartition;
	private $tds_greve_repartition;


    // $zone : "est" ou "ouest"
    public function __construct(string $zone) {
		$this->zone = $zone;
		$this->bdd = new bdd_tds("",  $zone);
        $this->cycle = $this->bdd->get_cycle();   // ["JX","J1","J3","S2","","","J2","S1","N","","",""]; 
		$this->clean_cycle = $this->get_clean_cycle();
        $this->init();
    }

	/* -------------------------------------------------------------------------------------------------
            all_saisons 	: return toutes les row de dates_saisons_est/ouest 
			beyond_saisons	: return les row de dates_saisons_est/ouest dont la date fin > aujourd'hui
			current_saison	: return le nom du tds de la date d'aujourd'hui
			tds_local		: return tous les tds
    ---------------------------------------------------------------------------------------------------- */

	public function init() {
		$this->tds_local = $this->bdd->get_all_tds();
		$this->all_saisons = $this->bdd->get_saisons();
		$this->all_saisons_greve = $this->bdd->get_saisons(true, 1);
		$this->beyond_saisons = $this->bdd->get_saisons(false);
		$this->beyond_saisons_greve = $this->bdd->get_saisons(false, 1);
		$this->current_tds = $this->bdd->get_current_tds();
		$this->current_tds_greve = $this->bdd->get_current_tds(true);
		$this->tds_supp_local = $this->bdd->get_all_tds_supp();
		$this->tds_repartition = $this->bdd->get_all_repartition();
		$this->tds_greve_repartition = $this->bdd->get_all_repartition(true);
		$this->tds_greve = $this->bdd->get_all_tds(true);
	}

	// @return ["JX", "J1", "J3", "S2", "J2", "S1", "N"]
	private function get_clean_cycle() {
		$clean_vacs = [];
		$vacs = $this->cycle;
		foreach ($vacs as $value) {
			if ($value !== "") array_push($clean_vacs, $value);
		}
		return $clean_vacs;
	}

    /* ----------------------------------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
            @returns {object} : 
			  { "cycle": ["JX","J1","J3","S2","","","J2","S1","N","","",""],
                "tds_local": ...,
				"tds_supp_local": {...},
				"saisons": {...},
                "zone": "est" ou "ouest"
			  }
    ------------------------------------------------------------------------------------------------------------------- */
    public function get_editor_data() {

		$res = new stdClass();
		$res->zone = $this->zone;
		$res->all_saisons = $this->all_saisons;
		$res->all_saisons_greve = $this->all_saisons_greve;
		$res->beyond_saisons = $this->beyond_saisons;
		$res->beyond_saisons_greve = $this->beyond_saisons_greve;
		$res->current_tds = $this->current_tds;
		$res->current_tds_greve = $this->current_tds_greve;
		$res->tds_local = $this->tds_local;
		$res->tds_supp_local = $this->tds_supp_local;
		$res->repartition = $this->tds_repartition;
		$res->repartition_greve = $this->tds_greve_repartition;
		$res->cycle = $this->cycle;
		$res->clean_cycle = $this->clean_cycle;
		$res->tds_greve = $this->tds_greve;
		return $res;

    }

}
?>