// de electron nos traemos app y BrowserWindow
const path = require('path')
var bodyParser = require("body-parser");

const { app, ipcMain } = require('electron');
const fs = require('fs');
const Window = require('./Window')
const HashMap = require('hashmap');
var admin = require("firebase-admin");

var serviceAccount = require("./recursos/key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://autobusesidrl.firebaseio.com"
});

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


    var autobusesF = firestore.collection('Autobus');
    var rutasF = firestore.collection('Ruta');

    mainWindow.webContents.openDevTools()
        //Cargamos JSONs desde local
        var LineaA15 = JSON.parse(fs.readFileSync('recursos/LineaA-15.json', 'utf8'))
        var LineaH6 = JSON.parse(fs.readFileSync('recursos/LineaH-6.json', 'utf8'))
        var LineaE25 = JSON.parse(fs.readFileSync('recursos/LineaE-25.json', 'utf8'))

    var posArray = {}
    var ruta = []
    var lineas = []
    var buses = []
    let rutes = []

    function leerRutasAutobuses(){


    }

    
    mainWindow.once('show', () => {   
        
        /*rutasF.doc(LineaH6.ruta.idRuta).set(LineaH6).then(function() {
            console.log("Document successfully written!");
        });
        ruta.id.push(LineaA15.ruta.idRuta)
*/

        /*LineaA15.ruta.trk.forEach(element=> {
            element.trkpt.forEach(element => {
                rutes.puntos.push(element)
            });
        })*/
        console.log(rutes)
        var coordenadas = []

        rutasF.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                ruta.push(doc._fieldsProto.ruta)
            });
            ruta.forEach(element => {
                var linea = element.mapValue.fields.idRuta.stringValue
                element.mapValue.fields.trk.arrayValue.values.forEach(element => {
                    element.mapValue.fields.trkpt.arrayValue.values.forEach(element => {
                        var coordenada = {
                            _lat: element.mapValue.fields._lat.stringValue,
                            _lon: element.mapValue.fields._lon.stringValue
                        }
                        coordenadas.push(coordenada)
                    });
                });
                rutes[linea] = coordenadas
                coordenadas = []
                lineas.push(linea)
                //rutes[linea] = idRutas.push()
            });
            mainWindow.send('rutes', lineas)        

        })
        .catch(err => {
            console.log('Error getting documents', err);
        });      

        autobusesF.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    buses.push(doc._fieldsProto)
                });
                mainWindow.send('buses', buses)        

            })
            .catch(err => {
                console.log('Error getting documents', err);
            });      
    })

    ipcMain.on('lanzarBus', (event, bus, linea) => {

        // This registration token comes from the client FCM SDKs.

        // See documentation on defining a message payload.
        var message = {
            android: {
              ttl: 3600 * 1000, // 1 hour in milliseconds
              priority: 'normal',
              notification: {
                title: 'EEEEE',
                body: 'aaaaaaaaaaaaaaa',
                icon: 'stock_ticker_update',
                color: '#f45342'
              }
            },
            topic: 'Averias'
          };

          console.log("mensaje creado")

        admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });


        const autobusesRef = firestore.collection('Autobus').doc(bus);
        posArray[bus] = 1
        console.log(rutes)


        autobusesRef.onSnapshot(function(doc) {
            console.log("CAMBIOS ESCUCHADOS EN " + doc._fieldsProto.nombre.stringValue)

            mainWindow.send('posBus', doc._fieldsProto)
        });
        
        actualizarPosicion()

        async function actualizarPosicion() {
            console.log("dentroactualizar" + linea)
           // console.log("lat: " + rutes[linea][posArray[bus]]._lat + ", lon: " + rutes.puntos[posArray[bus]]._lon)
            autobusesRef.update({
                "latLong": new Firestore.GeoPoint(parseFloat(rutes[linea][posArray[bus]]._lat) , parseFloat(rutes[linea][posArray[bus]]._lon))
            })
            .then(function() {
                console.log("Bus en camino... DATOS CAMBIADOS");
                posArray[bus] = posArray[bus] + 1

            })
            .catch(function(error) {
                // The document probably doesn't exist.
                console.error("Ha ocurrido un error con la posicion! ", error);
            });
                
            await delay(220)
            if(posArray[bus]  < rutes[linea].length){
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