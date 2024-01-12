class admin {

    constructor(day) {
        this.day = day;
        this.init();
    }

    async init() {
        const current_day = await this.admin_sql();
        this.current_default_day = current_day["default_day"];
        this.show_modal_change();
    }

    async admin_sql() {
        const obj = {"fonction": "get_day_MV_OTMV"};
        const data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(obj)
        };
       const result = await fetch("admin_sql.php", data);
       return result.json();
    }

    show_modal_change() {
        let modal = ` 
            <div class="modal_change-dialog" role="document">
                <div class="modal_change-content">
                <div class="modal_change-body">
                    <div class="column" id="primary">
                        <h1>Modifier la date par defaut des MV</h1>
                        <p>(cette date sera utilisée si le fichier du jour est inexistant)</h1>
                        <form>
                            <div class="form-group">
                            <p class="defaut">D&eacute;faut : ${this.current_default_day}<br></p>
                            <button id="arrow_left"><</button>
		                    <input type="date" id="start" value="${this.current_default_day}" min="2023-06-01">
		                    <button id="arrow_right">></button>
                            </div><br>
                            <button id="change_default_button" type="button" class="btn btn-primary">Modifier</button>
                        </form>
                        <div id="modal_text_sousvac" class="modal_text off"></div>
                    </div>
                </div>
                <a id='close_modal' class='close_modal'></a>
                </div>
            </div>`;
        const m = $('modal_change');
        m.innerHTML = modal;
        this.add_listener_change();
    }

    add_listener_change() {
        const m = $('modal_change');

        $('arrow_left').addEventListener('click', async e => {
            e.preventDefault();
            $('start').value = addDays_toString($('start').value,-1);
            
        });
        $('arrow_right').addEventListener('click', async e => {
            e.preventDefault();
            $('start').value = addDays_toString($('start').value,1);
        });

        $('close_modal').addEventListener('click', (e) => {
            m.innerHTML = "";
        })

        $('change_default_button').addEventListener('click', async e => {
            console.log("coco");
            const new_day = $('start').value;
            const save_new_day = { "day": new_day, "fonction": "set_day_MV_OTMV"}
            const data = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(save_new_day)
            };
            const result = await fetch("admin_sql.php", data);
            this.current_default_day = new_day;
            show_popup(`Nouvelle date : ${new_day}`, "Op&eacute;ration effectu&eacute;e");
            document.querySelector('.defaut').innerHTML = `D&eacute;faut : ${new_day}`;
            this.show_modal_change();
        })
    }
}