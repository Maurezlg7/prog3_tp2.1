function traer_datos(url){
    fetch(url)
    .then(response => response.json())
    .then(data => {
        for(let i of data){
            Object.keys(i).forEach(key => {
                console.log(`${key}: ${i[key]}`);
            });
        }
    })
    .catch(error => console.error(error));
}
traer_datos("sensors.json");