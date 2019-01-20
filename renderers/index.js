'use strict'

const { ipcRenderer } = require('electron')
var rutas = []
var bus = "irun"

// delete todo by its text value ( used below in event listener)
const lanzarBus = (e) => {
  console.log("MANDANDO" + bus + rutas)
  ipcRenderer.send('comenzarRuta', bus, rutas)
}

// create add todo window button
document.getElementById('newBus').addEventListener('click', () => {
  ipcRenderer.send('newBus')
})

// on receive todos
ipcRenderer.on('buses', (event, buses) => {
  // get the todoList ul
  console.log(buses)
  const tablaBuses = document.getElementById('buses')

  // create html string
  const busItems = buses.reduce((html, bus) => {
    console.log(bus)
    html += `<tr>
            <td>${bus.nombre.stringValue}</td>
            <td>${bus.latLong.geoPointValue.latitude}</td>
            <td>${bus.latLong.geoPointValue.longitude}</td>
            <td><button class="uk-button uk-button-default" type="button">LANZAR!</button></td>
        </tr>`

    return html
  }, '')

  // set list html to the todo items
  tablaBuses.innerHTML = busItems
})


ipcRenderer.on('rutes', (event, rutes) => {
    // get the todoList ul
    rutas = rutes
    console.log(rutes)
    const tablaRutas = document.getElementById('buses')
 
    // add click handlers to delete the clicked todo
    tablaRutas.querySelectorAll('tr td button').forEach(item => {
      item.addEventListener('click', lanzarBus)
    })
  })