// de electron nos traemos app y BrowserWindow
const path = require('path')
var bodyParser = require("body-parser");

const { app, ipcMain } = require('electron');
const fs = require('fs');
const Window = require('./Window')
const HashMap = require('hashmap');

const Firestore = require('@google-cloud/firestore');
const delay = require('delay');

const firestore = new Firestore({
  projectId: 'autobusesidrl',
  keyFilename: 'recursos/key.json',
  timestampsInSnapshots: true
});

require('electron-reload')(__dirname);

// definimos `window`, acá vamos a guardar la instancia de BrowserWindow actual
let window;

// cuando nuestra app haya terminado de iniciar va a disparar el evento `ready`
// lo escuchamos y ejecutamos la función `createWindow`
app.on('ready', createWindow);

// escuchamos el evento `window-all-closed` y si no estamos en Mac cerramos la aplicación
// lo de Mac es debido a que en este SO es común que se pueda cerrar todas las ventanas sin cerrar
// la aplicación completa
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// definimos la función `createWindow`
function createWindow() {
	// instanciamos BrowserWindow, esto va a iniciar un proceso `renderer`
    let mainWindow = new Window({

        file: path.join('renderers', 'index.html')
    })

    var autobuses = firestore.collection('Autobus');
    var rutas = firestore.collection('Ruta');
    

    var LineaA15 = JSON.parse(fs.readFileSync('recursos/LineaA-15.json', 'utf8'))
    var LineaH6 = JSON.parse(fs.readFileSync('recursos/LineaH-6.json', 'utf8'))
    var LineaE25 = JSON.parse(fs.readFileSync('recursos/LineaE-25.json', 'utf8'))

    mainWindow.webContents.openDevTools()

    var posArray = {}
    var ruta = []
    var buses = []
    var rutes = []
    
    mainWindow.once('show', () => {   
        /*rutas.doc(LineaH6.ruta.idRuta).set(LineaH6).then(function() {
            console.log("Document successfully written!");
        });*/

        LineaA15.ruta.trk.forEach(element=> {
            console.log(element)
            element.trkpt.forEach(element => {
                console.log(element)
                ruta.push(element)
            });
        })

        rutas.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                rutes.push(doc._fieldsProto.ruta)
            });

        })
        .catch(err => {
            console.log('Error getting documents', err);
        });      

        autobuses.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    buses.push(doc._fieldsProto)
                });
                mainWindow.send('buses', buses)
                mainWindow.send('pro', rutes)                

            })
            .catch(err => {
                console.log('Error getting documents', err);
            });      
    })

    ipcMain.on('lanzarBus', (event, bus, rutes) => {
        const autobusesRef = firestore.collection('Autobus').doc(bus);
        posArray[bus] = 1
        console.log(posArray)

        autobusesRef.onSnapshot(function(doc) {
            console.log("CAMBIOS ESCUCHADOS EN " + doc._fieldsProto.nombre.stringValue)

            mainWindow.send('posBus', doc._fieldsProto)
        });
        
        actualizarPosicion()

        async function actualizarPosicion() {
            autobusesRef.update({
                "latLong": new Firestore.GeoPoint(parseFloat(rutes[posArray[bus]]._lat) , parseFloat(rutes[posArray[bus]]._lon))
            })
            .then(function() {
                console.log("Bus en camino... DATOS CAMBIADOS");
                posArray[bus] = posArray[bus] + 1

            })
            .catch(function(error) {
                // The document probably doesn't exist.
                console.error("Ha ocurrido un error con la posicion! ", error);
            });
                
            await delay(200)
            if(posArray[bus]  < rutes.length){
                console.log("POS " + bus + ": " + posArray[bus] )
                actualizarPosicion()
            }else{
                console.log("RUTA FINALIZADA")
            }
        }
        
      })

      ipcMain.on('newBus', () => {
        // if addTodoWin does not already exist
        if (!newBus) {
          // create a new add todo window
          newBus = new Window({
            file: path.join('renderer', 'add.html'),
            width: 400,
            height: 400,
            // close with the main window
            parent: mainWindow
          })
    
          // cleanup
          newBus.on('closed', () => {
            newBus = null
          })
        }
      })

      ipcMain.on('closed', () => {
		// por último escuchamos el evento `closed` de la ventana para limpar la variable `window`
		// de esta forma permitimos matar la ventana sin matar al aplicación
		window = null
    });
}