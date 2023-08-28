async function get_data(url) { 
    try {
        let response = await fetch("../php/get_data.php", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "url": url})
        });
        if (response.ok) { // entre 200 et 300
            return Promise.resolve(response.json())
          } else {
            // l'erreur est transmise au bloc catch de loadJson
            if (response.status == 404) { return Promise.reject(new Error(`Le fichier ${response.url} n'existe pas`)); }
            return Promise.reject(new Error('Erreur: '+response.statusText))
        } 
    }
    
    catch (err) {
        alert('Get DATA Load json error: '+err.message);
    }
}