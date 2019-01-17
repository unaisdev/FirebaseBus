'use strict'

const { ipcRenderer } = require('electron')

// delete todo by its text value ( used below in event listener)
const lanzarBus = (e) => {
  ipcRenderer.send('lanzarBus', e.target.textContent)
}

// create add todo window button
document.getElementById('newBus').addEventListener('click', () => {
  ipcRenderer.send('newBus')
})

// on receive todos
ipcRenderer.on('buses', (event, buses) => {
  // get the todoList ul
  const tablaBuses = document.getElementById('buses')

  // create html string
  const busItems = buses.reduce((html, bus) => {
    html += `<tr>
            <td>${bus.nombre}</td>
            <td>${bus.id}</td>
            <td><button id="${bus.nombre}" class="uk-button uk-button-default" type="button">LANZAR!</button></td>
        </tr>`

    return html
  }, '')

  // set list html to the todo items
  tablaBuses.innerHTML = busItems

  // add click handlers to delete the clicked todo
  tablaBuses.querySelectorAll('button').forEach(item => {
    item.addEventListener('click', deleteTodo)
  })
})

ipcRenderer.on('rutes', (event, rutes) => {
    // get the todoList ul
    const tablaRutas = document.getElementById('buses')
  
    // create html string
    const todoItems = todos.reduce((html, todo) => {
      html += `<li class="todo-item">${todo}</li>`
  
      return html
    }, '')
  
    // set list html to the todo items
    tablaBuses.innerHTML = todoItems
  
    // add click handlers to delete the clicked todo
    tablaBuses.querySelectorAll('button').forEach(item => {
      item.addEventListener('click', lanzarBus)
    })
  })