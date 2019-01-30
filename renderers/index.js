'use strict'

const { ipcRenderer } = require('electron')

var rutas = []

const cargarJsonEventListener = (e) => {

}

document.getElementById("bJson").addEventListener('click', (e) => {
  ipcRenderer.send('cargarJson')
})

ipcRenderer.on('pro', (event, rutes) => {
  // get the todoList ul
  console.log(rutes)
  var html = ""
  const selectRutas = document.getElementById('selectRuta')

  rutes.forEach(element => {
    html = `<option value="${element.mapValue.fields.idRuta.stringValue}">${element.mapValue.fields.idRuta.stringValue}</option>` + html;

  });

  console.log(html);

  
  // create html string
  /*const rutaItems = rutes.reduce((html, ruta) => {
    console.log(ruta)

    /*html += `<option value="${ruta}"></option>`
    
    `<tr id= "${bus.id.stringValue}">
            <td>${bus.nombre.stringValue}</td>
            <td>${bus.latLong.geoPointValue.latitude}</td>
            <td>${bus.latLong.geoPointValue.longitude}</td>
            <td><button class="uk-button uk-button-default" type="button">LANZAR!</button></td>
        </tr>`

    return html
  }, '')*/

  // set list html to the todo items
 selectRutas.innerHTML = html

})

// delete todo by its text value ( used below in event listener)
// on receive todos
ipcRenderer.on('buses', (event, buses) => {
  // get the todoList ul
  console.log(buses)
  const tablaBuses = document.getElementById('buses')

  // create html string
  const busItems = buses.reduce((html, bus) => {
    html += `<tr id= "${bus.id.stringValue}">
            <td>${bus.nombre.stringValue}</td>
            <td>${bus.latLong.geoPointValue.latitude}</td>
            <td>${bus.latLong.geoPointValue.longitude}</td>
            <td><button id="lanzarBus" class="uk-button uk-button-default" type="button">LANZAR!</button></td>
        </tr>`

    return html
  }, '')

  // set list html to the todo items
  tablaBuses.innerHTML = busItems
})

ipcRenderer.on('posBus', (event, bus) => {
  // get the todoList ul
  console.log(" CAMBIAMOS HTML " + bus)
  const trBus = document.getElementById(bus.id.stringValue)

  // create html string
  const busHtml =  `<td>${bus.nombre.stringValue}</td>
            <td>${bus.latLong.geoPointValue.latitude}</td>
            <td>${bus.latLong.geoPointValue.longitude}</td>
            <td><button class="uk-button uk-button-default" type="button">LANZAR!</button></td>`

  // set list html to the todo items
  trBus.innerHTML = busHtml
})

ipcRenderer.on('rutes', (event, rutes) => {
    // get the todoList ul
    rutas = rutes
    console.log(rutes)
    const tablaRutas = document.getElementById('buses')
 
    // add click handlers to delete the clicked todo
    tablaRutas.querySelectorAll('tr').forEach(tr => {
      tr.querySelectorAll('td button').forEach(button => {
        button.addEventListener('click', (e) => {
          console.log(tr.id)
          //var selRutas = document.getElementById(selectRutas)
          //var ruta = selRutas.options[selRutas.selectedIndex].value;
            
          ipcRenderer.send('lanzarBus', tr.id, rutes)
        
        })
      })
    })
  })