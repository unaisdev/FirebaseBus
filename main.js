// de electron nos traemos app y BrowserWindow
const path = require('path')
var bodyParser = require("body-parser");

const { app, ipcMain } = require('electron');
const fs = require('fs');
const Window = require('./Window')

const Firestore = require('@google-cloud/firestore');
const delay = require('delay');

const firestore = new Firestore({
  projectId: 'autobusesidrl',
  keyFilename: 'recursos/key.json',
  timestampsInSnapshots: true
});

require('electron-reload')(__dirname);
var rutasRef = firestore.collection('Rutas');


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

/*
async function comenzarRuta(bus, rutes){
    console.log("LANZANDO RUTA !")
    await Promise.all(rutes.map(async (element) => {
        autobusesRef.doc(bus).update({
            GeoPoint: {
                latitude: element._lat,
                longitude: element._lat
            }
        })
        .then(function() {
            console.log("Document successfully updated!");
        })
        .catch(function(error) {
            // The document probably doesn't exist.
            console.error("Error updating document: ", error);
        });
        await sleep(500)
        console.log(contents)
      }));
    rutes.forEach(element => {

    })
}*/

// definimos la función `createWindow`
function createWindow() {
	// instanciamos BrowserWindow, esto va a iniciar un proceso `renderer`
    let mainWindow = new Window({

        file: path.join('renderers', 'index.html')
    })

    mainWindow.webContents.openDevTools()

    var autobuses = firestore.collection('Autobus');
    var rutas = firestore.collection('Ruta');

    let newBus

    var rutas = JSON.parse(fs.readFileSync('recursos/DonostiIrun.json', 'utf8'))
    var posRutas = 1

    var ruta = []
    var buses = []
    
    mainWindow.once('show', () => {
        rutas.gpx.trk.trkseg.trkpt.forEach(element => {
            ruta.push(element)
        });

        autobuses.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    buses.push(doc._fieldsProto)
                });
                mainWindow.send('buses', buses)
                mainWindow.send('rutes', ruta)
                

            })
            .catch(err => {
                console.log('Error getting documents', err);
            });

      
    })

 


    ipcMain.on('lanzarBus', (event, bus, rutes) => {
        const autobusesRef = firestore.collection('Autobus').doc(bus);

        autobusesRef.onSnapshot(function(doc) {
            console.log("CAMBIOS ESCUCHADOS EN " + doc._fieldsProto.nombre.stringValue)

            mainWindow.send('posBus', doc._fieldsProto)
        });

        actualizarPosicion()

        async function actualizarPosicion() {
            autobusesRef.update({
                "latLong": new Firestore.GeoPoint(parseFloat(rutes[posRutas]._lat) , parseFloat(rutes[posRutas]._lon))
            })
            .then(function() {
                console.log("Bus en camino... DATOS CAMBIADOS");
                posRutas = posRutas + 99

            })
            .catch(function(error) {
                // The document probably doesn't exist.
                console.error("Ha ocurrido un error con la posicion! ", error);
            });
            

        
            await delay(3000)
            // Executed 100 milliseconds later
            if(posRutas < rutes.length){
                console.log("pos: " + posRutas)
                actualizarPosicion()
                console.log("while")
            }
        }

        /*
        const actualizarPosicion = (e) => {
        autobusesRef.update({
                "latLong": new Firestore.GeoPoint(parseFloat(rutes[posRutas]._lat) , parseFloat(rutes[posRutas]._lon))
            })
            .then(function() {
                console.log("Bus en camino...");
            })
            .catch(function(error) {
                // The document probably doesn't exist.
                console.error("Ha ocurrido un error con la posicion! ", error);
            });
            posRutas = posRutas + 40
            
            sleep.sleep(3)
            actualizarPosicion()
        }
        actualizarPosicion()
*/
        
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