class aup {

    /*  -----------------------------------------------
        @param {string} day - "yyyy-mm-dd"
    ----------------------------------------------- */

    constructor(day) {
        this.day = day;
    }

    async init_aup() {
        this.result = await this.get_aup();
        this.show_aup("result");
    }

    // get aup (LITSA72 + LIR64 + LFMM RSA)
    // récupère l'AUP à partir de l'heure de la demande
    // les données précédant l'heure la requête ne sont fournies
    async get_direct_aup() { 
        try {
            let response = await fetch("../b2b/get_aup.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "day": this.day})
            })
            const json = await response.json(); 
            console.log(json);
            return json;
        }
        
        catch (err) {
            show_popup("Erreur", `L'AUP de la date ${reverse_date(this.day)} n'existe pas`);
            console.log('Get AUP json error: '+err.message);
        }
    }

    // lit le fichier json de la date indiquée
    // ex : 20230525-aup.json
    async get_aup() { 
        const d = this.day.split("-");
        let aup = await loadJson(`../b2b/json/${d[0]}/${d[1]}/${d[0]}${d[1]}${d[2]}-aup.json`);
        if (typeof aup === 'undefined') {
            show_popup("Erreur", `L'AUP de la date ${reverse_date(this.day)} n'existe pas`);
        }
        return aup;
    }

    show_aup(containerId) {
        if (typeof this.result !== 'undefined') {
            let res = `<div><h2>AUP LFMM du ${reverse_date(this.day)} <br><span style='font-size:1rem'>06:00 UTC au lendemain 06:00 UTC</span></h2>`;
            res += `
            <table class="sortable">
                <thead><tr class="titre"><th class="space">RSA</th><th>Début</th><th>Fin</th><th>Lower Limit</th><th>Upper Limit</th></tr></thead>
                <tbody>`.trimStart();
            
            this.result.forEach( rsa => {
                const name = rsa["designator"]; 
                const date_debut = rsa["beginDate"];
                const debut = rsa["begin"];
                const date_fin = rsa["endDate"];
                const fin = rsa["end"];
                const lower_limit = rsa["lowerLimit"];
                const upper_limit = rsa["upperLimit"];
                if (name.substr(0,2) === "LF" && name.substr(0,5) !== "LFT24") {
                    res += `<tr>`;
                    res += `<td>${name}</td><td><span style="font-size:1.2rem; font-weight:bold">${debut}</span>  (${date_debut})</td><td><span style="font-size:1.2rem; font-weight:bold">${fin}</span>  (${date_fin})</td><td>${lower_limit}</td><td>${upper_limit}</td>`
                    res += `</tr>`;
                }
            })
            res += '</tbody></table>';

            res += `
            <table class="sortable">
                <thead><tr class="titre"><th class="space">RSA</th><th>Début</th><th>Fin</th><th>Lower Limit</th><th>Upper Limit</th></tr></thead>
                <tbody>`.trimStart();
            this.result.forEach( rsa => {
                const name = rsa["designator"]; 
                const date_debut = rsa["beginDate"];
                const debut = rsa["begin"];
                const date_fin = rsa["endDate"];
                const fin = rsa["end"];
                const lower_limit = rsa["lowerLimit"];
                const upper_limit = rsa["upperLimit"];
                if (name.substr(0,2) === "LI" || name.substr(0,5) === "LFT24") {
                    res += `<tr>`;
                    res += `<td>${name}</td><td><span style="font-size:1.2rem; font-weight:bold">${debut}</span>  (${date_debut})</td><td><span style="font-size:1.2rem; font-weight:bold">${fin}</span>  (${date_fin})</td><td>${lower_limit}</td><td>${upper_limit}</td>`
                    res += `</tr>`;
                }
            })

            res += '</tbody></table>';
            res += '</div>';
            $(containerId).innerHTML = res;
        }  
    }

}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    * {
      font-size: 200%;
    }

    span {
      width: 4rem;
      display: inline-block;
      text-align: center;
    }

    button {
      width: 4rem;
      height: 4rem;
      border: none;
      border-radius: 10px;
      background-color: seagreen;
      color: white;
    }
  </style>
  <button id="dec">-</button>
  <span id="count"></span>
  <button id="inc">+</button>`;

class myArea extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.getElementById('inc').onclick = () => this.inc();
    this.shadowRoot.getElementById('dec').onclick = () => this.dec();
    this.update(this.count);
  }

  inc() {
    this.update(++this.count);
  }

  dec() {
    this.update(--this.count);
  }

  update(count) {
    this.shadowRoot.getElementById('count').innerHTML = count;
  }
}

customElements.define('area', myArea);