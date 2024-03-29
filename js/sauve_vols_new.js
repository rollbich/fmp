class sauve_vols {

    constructor(containerId, zone, start_day, end_day) {
        this.containerId = containerId;
        this.zone2 = zone;
        this.zone = (zone === "AE") ? "est" : "ouest";
        this.start_day = start_day;
        this.end_day = end_day;
        this.init();
    }

    async init() {
        this.data = new period_vols(this.start_day, this.end_day, this.zone2);
        await this.data.init();
        console.log(this.data.vols);
        this.sauv_vols();
    }

/*  ---------------------------------------------------------------------
            Remplissage bdd avec les données vols nouveau format
            this.data.vols: {
                "2024-01-01": {
                    "LFMMCTA": ["LFMMCTA", "2023-08-01", regdemand, load, demand],
                    "LFMMCTAE": [],
                    "LFMMCTAW": [],
                    "LFMMFMPE": [
                        ["LFMRAE", "2023-08-01", load], ["LFMSBAM", ...], ... []
                    ],
                    "LFMMFMPW": [],
                    "LFMMAPP": {
                        "flights": nb,
                        "LFKJ": ["2023-08-01", nb],
                        ...
                    },
                    "VOLS_RAE": [{
                        "id": "WZZ1EB",
                        "dep": "LEAL",
                        "arr": "EPGD",
                        "type": "A21N",
                        "operator": "WZZ",
                        "depTime": "2024-02-19 22:53",
                        "arrTime": "2024-02-20 02:15"
                        }, ..., {}],
                    "VOLS_RAW": [],
                    "VOLS_APP": {
                        pas utilisé
                    }
                }
            }
    --------------------------------------------------------------------- */

    async sauv_vols() {
        
        for (const [day, obj] of Object.entries(this.data.vols)) {
            const CTA_reg_demand = obj["LFMMCTA"][2];
            const CTA_load = obj["LFMMCTA"][3];
            const CTA_demand = obj["LFMMCTA"][4];
            const CTAE_reg_demand = obj["LFMMCTAE"][2];
            const CTAE_load = obj["LFMMCTAE"][3];
            const CTAE_demand = obj["LFMMCTAE"][4];
            const CTAW_reg_demand = obj["LFMMCTAW"][2];
            const CTAW_load = obj["LFMMCTAW"][3];
            const CTAW_demand = obj["LFMMCTAW"][4];
            const RAE_load = obj["LFMMFMPE"][0][2];
            const SBAM_load = obj["LFMMFMPE"][1][2];
            const EK_load = obj["LFMMFMPE"][2][2];
            const AB_load = obj["LFMMFMPE"][3][2];
            const GY_load = obj["LFMMFMPE"][4][2];
            const RAW_load = obj["LFMMFMPW"][0][2];
            const MALY_load = obj["LFMMFMPW"][1][2];
            const WW_load = obj["LFMMFMPW"][2][2];
            const MF_load = obj["LFMMFMPW"][3][2];
            const DZ_load = obj["LFMMFMPW"][4][2];
            const vols_RAE = [];
            const vols_RAW = [];
            // l'ordre doit être respecté d'où l'array même si
            const tab_TVAPP = ["LFKJ","LFKF","LFKB","LFKC","LFMN","LFMD","LFTZ","LFTH","LFML","LFMV","LFMQ","LFLL","LFLY","LFLS","LFLB","LFLP","LFLC","LFMT","LFTW","LFMP","LFMU","LFLV","LFLN","LFLU","LFMI","LFMH","LFMA","LFLI","LFMC","LFKS","LFMY","LFMO","LFKA","LFKO","LFMS","LFMZ","LFMF","LFTF","LFLE","LFLG","LFLJ","LFLM","LFLO","LFNA","LFNB","LFNG","LFNH","LFXA"];
            const LFMMAPP = {};
            LFMMAPP["flights"] = obj["LFMMAPP"]["flights"];
            tab_TVAPP.forEach(ad => {
                //LFMMAPP[ad] = obj["LFMMAPP"][ad][1];
                LFMMAPP[ad] = obj["LFMMAPP"][ad];
            })
            
            obj["VOLS_RAE"].forEach(obj_vol => {
                
                const temp = {};
                temp["id"] = obj_vol["id"];
                if (obj_vol["dep"] == null) {
                    temp["dep"] = "unknown";
                } else {
                    temp["dep"] = obj_vol["dep"];
                }
                if (obj_vol["arr"] == null) {
                    temp["arr"] = "unknown";
                } else {
                    temp["arr"] = obj_vol["arr"];
                }
                temp["type"] = obj_vol["type"];
                temp["operator"] = obj_vol["operator"];
                temp["depTime"] = obj_vol["depTime"];
                temp["arrTime"] = obj_vol["arrTime"];
                vols_RAE.push(temp);
                
            });
            obj["VOLS_RAW"].forEach(obj_vol => {
                
                const temp = {};
                temp["id"] = obj_vol["id"];
                if (obj_vol["dep"] == null) {
                    temp["dep"] = "unknown";
                } else {
                    temp["dep"] = obj_vol["dep"];
                }
                if (obj_vol["arr"] == null) {
                    temp["arr"] = "unknown";
                } else {
                    temp["arr"] = obj_vol["arr"];
                }
                temp["type"] = obj_vol["type"];
                temp["operator"] = obj_vol["operator"];
                temp["depTime"] = obj_vol["depTime"];
                temp["arrTime"] = obj_vol["arrTime"];
                vols_RAW.push(temp);
                
            });
            
           
            await this.set_vols_crna(day, CTA_reg_demand, CTA_load, CTA_demand, CTAE_reg_demand, CTAE_load, CTAE_demand, CTAW_reg_demand, CTAW_load, CTAW_demand, RAE_load, SBAM_load, EK_load, AB_load, GY_load, RAW_load, MALY_load, WW_load, MF_load, DZ_load, vols_RAE, vols_RAW);
            await this.set_vols_app(day, LFMMAPP);
        }
    }

    // sauv les vols CRNA dans la BDD
    async set_vols_crna(day, CTA_reg_demand, CTA_load, CTA_demand, CTAE_reg_demand, CTAE_load, CTAE_demand, CTAW_reg_demand, CTAW_load, CTAW_demand, RAE_load, SBAM_load, EK_load, AB_load, GY_load, RAW_load, MALY_load, WW_load, MF_load, DZ_load, vols_RAE, vols_RAW) {
        
        const cles = {
            "day": day, 
            "CTA_reg_demand": CTA_reg_demand, 
            "CTA_load": CTA_load, 
            "CTA_demand": CTA_demand, 
            "CTAE_reg_demand": CTAE_reg_demand, 
            "CTAE_load": CTAE_load, 
            "CTAE_demand": CTAE_demand, 
            "CTAW_reg_demand": CTAW_reg_demand, 
            "CTAW_load": CTAW_load, 
            "CTAW_demand": CTAW_demand, 
            "RAE_load": RAE_load, 
            "SBAM_load": SBAM_load, 
            "EK_load": EK_load, 
            "AB_load": AB_load, 
            "GY_load": GY_load, 
            "RAW_load": RAW_load, 
            "MALY_load": MALY_load, 
            "WW_load": WW_load, 
            "MF_load": MF_load, 
            "DZ_load": DZ_load, 
            "vols_RAE": JSON.stringify(vols_RAE), 
            "vols_RAW": JSON.stringify(vols_RAW),
            "fonction": "set_vols_crna"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        try {
            const response = await fetch("../php/bdd_sql.php", data);
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
        
    }

    // sauv les vols APP dans la BDD
    async set_vols_app(day, LFMMAPP) {
        
        const cles = {
            "day": day, 
            "LFMMAPP": LFMMAPP,
            "fonction": "set_vols_app"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        
        try {
            const response = await fetch("../php/bdd_sql.php", data);
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
        
    }

}