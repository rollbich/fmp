/*  ----------------------------------------------------------------------
		Upload les schémas réalisés sur le serveur
			@param {string} formId - Id de l'HTML Element Form
	---------------------------------------------------------------------- */
function init_upload(formId) {
  const upForm = $(formId);
 
  async function handleFileSelect(evt) {
	  
    const files = evt.target.files; // FileList object
    //files template
	//  <div class="progress active"></div> à placer avant <div class="done"> pour la progress bar
    let template = `${Object.keys(files).
    map(file => `<div class="file">
     <div class="name"><span>${files[file].name}</span></div>
	 <div class="message"></div>
     <div class="done" data-name="${files[file].name}">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 1000 1000">
		<g><path id="path" d="M500,10C229.4,10,10,229.4,10,500c0,270.6,219.4,490,490,490c270.6,0,490-219.4,490-490C990,229.4,770.6,10,500,10z M500,967.7C241.7,967.7,32.3,758.3,32.3,500C32.3,241.7,241.7,32.3,500,32.3c258.3,0,467.7,209.4,467.7,467.7C967.7,758.3,758.3,967.7,500,967.7z M748.4,325L448,623.1L301.6,477.9c-4.4-4.3-11.4-4.3-15.8,0c-4.4,4.3-4.4,11.3,0,15.6l151.2,150c0.5,1.3,1.4,2.6,2.5,3.7c4.4,4.3,11.4,4.3,15.8,0l308.9-306.5c4.4-4.3,4.4-11.3,0-15.6C759.8,320.7,752.7,320.7,748.4,325z"</g>
		</svg>
     </div>
    </div>`).
    join("")}`;

    $$("#drop").classList.add("hidden");
    $$("footer").classList.add("hasFiles");
    $$(".importar").classList.add("active");
    $$(".list-files").innerHTML = template;
	
	const formData = new FormData(upForm);
	
	try {
		const response = await fetch("../php/fileupload.php", {
			 method: "POST",
			 body: formData,
		})
		const data = await response.json();
		console.log("Data file upload");
		console.log(data);
		const d = document.querySelectorAll(".done");

		data.forEach(elem => {
			d.forEach(function(userItem) {
			if (elem.name == userItem.dataset.name) {
			  if (elem.error == 0) {
				userItem.classList.add("anim");
			  } else {
				userItem.classList.add("animbad");
				userItem.previousElementSibling.innerHTML = elem.error;
			  }
			}
			});	
		});
	} 
	catch (error) {
		alert("Erreur, verifiez vos fichiers "+error);
	}
  
    // We clean the form
    upForm.reset();
	
  }
  // trigger input
  $$("#triggerFile").addEventListener("click", evt => {
    evt.preventDefault();
    $$("input[type=file]").click();
  });

  // drop events
  $$("#drop").ondragleave = evt => {
    $$("#drop").classList.remove("active");
    evt.preventDefault();
  };
  $$("#drop").ondragover = $$("#drop").ondragenter = evt => {
    $$("#drop").classList.add("active");
    evt.preventDefault();
  };
  $$("#drop").ondrop = evt => {
    $$("input[type=file]").files = evt.dataTransfer.files;
    $$("footer").classList.add("hasFiles");
    $$("#drop").classList.remove("active");
    evt.preventDefault();
  };

  //upload more
  $$(".importar").addEventListener("click", () => {
    $$(".list-files").innerHTML = "";
    $$("footer").classList.remove("hasFiles");
    $$(".importar").classList.remove("active");
    setTimeout(() => {
      $$("#drop").classList.remove("hidden");
    }, 500);
  });

  // input change
  $$("input[type=file]").addEventListener("change", handleFileSelect);
}

/*  ----------------------------------------------------------------------
		Affiche les dossiers des schémas réalisés présents
			@param {string} containerId - Id de l'HTML Element conteneur
	---------------------------------------------------------------------- */
async function init_dir(containerId) {
	const dir = $(containerId);
	
	try {
		const response = await fetch("../php/read.php");
		const data = await response.json();
		console.log("Data Dossier");
		console.log(data);
		
		let inner = '<h2>Fichiers Schémas Réalisés présents</h2>';
		inner += "<p>Cliquez sur l'année et le mois pour voir les fichiers</p>";
		inner += '<ul is="expanding-list">';

		for(const annee in data) {
			if (annee !== "files") {

				inner += `<li>${annee}<ul>`;
				const mois_temp = [];

				// réordonne les mois car ils sont dans le désordre
				for(const mois in data[annee]) {
					if (mois !== "files") mois_temp.push(mois);
				}
				mois_temp.sort();
			
				mois_temp.forEach(mois => {
					inner += `<li>${mois}<ul>`;
					data[annee][mois]["files"].sort().forEach(nom => {
						let type, zone, day, z;

						if (nom.indexOf('000000') != -1) {
							type = "4F";
							zone = nom.substring(21,22);
							day = hyphen_date(nom.substring(0,8));
							z = zone === "E" ? "EST" : "OUEST";
						} else {
							type = "Courage";
							zone = nom.substr(14,2);
							day = get_date_from_courage_file(nom);
							z = zone === "AE" ? "EST" : "OUEST";
						}
						inner += `<li>${day} - ${z} - ${type}</li>`;
						
					})
					inner += '</ul></li>';
				});
				inner += '</ul></li>';
			}
		}
		inner += '</ul>';
		document.getElementById('schema_dir').innerHTML = inner;

		// déploiement de l'arborescence : année et mois en cours
		let year_elem = document.querySelector('[is="expanding-list"]').lastChild; // <li> de la dernière année
		year_elem.firstChild.click(); // <span> de l'année
		let month_elem = year_elem.lastChild.lastChild; // <li> du dernier mois
		month_elem.firstChild.click();
	}
	catch (error) {
		alert("Erreur, en listant les fichiers "+error);
	}
}