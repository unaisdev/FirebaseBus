'use strict'

const { ipcRenderer } = require('electron')

var rutas = []

const cargarJsonEventListener = (e) => {

}



document.getElementById("bJson").addEventListener('click', (e) => {
  ipcRenderer.send('cargarJson')
})

ipcRenderer.on('rutes', (event, rutes) => {
  // get the todoList ul
  console.log(rutes)
  var html = ""
  const selectRutas = document.getElementById('selectRuta')

  rutes.forEach(element => {
    html = `<option value="${element}">${element}</option>` + html;

  });

  console.log(html);

 selectRutas.innerHTML = html

})

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

  tablaBuses.querySelectorAll('tr').forEach(tr => {
    tr.querySelectorAll('td button').forEach(button => {
      button.addEventListener('click', (e) => {
        var selRutas = document.getElementById('selectRuta')
        var ruta = selRutas.options[selRutas.selectedIndex].text
        console.log(ruta)
        ipcRenderer.send('lanzarBus', tr.id, ruta)
      
      })
    })
  })
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
