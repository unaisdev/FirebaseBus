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
	// instanciamos mainWindow, esto va a iniciar un proceso `renderer`
    let mainWindow = new Window({
        file: path.join('renderers', 'index.html')
    })

    //Apuntamos hacia que colecion queremos atacar en firebase
    var autobusesF = firestore.collection('Autobus');
    var rutasF = firestore.collection('Ruta');

    //Abrimos la ventana de developer en electron
    mainWindow.webContents.openDevTools()

    //Contador con el id del bus para ir cogiendo cada punto del array que le corresponde a ese bus
    var posArray = {}
    //Variable aux para recoger el array de rutas que tenemos en firebase
    var ruta = []
    //Array strings con el id de cada linea para el select 
    var lineas = []
    //Buses recogidos
    var buses = []
    //Array de posiciones definidas a una linea, para lanzar el autobus sobre ello y ir modificando
    let rutes = []
    
    mainWindow.once('show', () => {   
        
        /* Con este codigo, subimos el json de la Linea directamente a Firebase.
        rutasF.doc(LineaH6.ruta.idRuta).set(LineaH6).then(function() {
            console.log("Document successfully written!");
        }); */

        console.log(rutes)
        var coordenadas = []

        rutasF.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                ruta.push(doc._fieldsProto.ruta)
            });
            //De cada Linea que tenemos en Firebase, recogemos su id, y todo el recorrido que realiza 
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
                //En un array con el id de esa linea, guardamos todos sus puntos
                rutes[linea] = coordenadas
                coordenadas = []
                lineas.push(linea)
            });
            //mandamos a que cargue el select de la ventana principal
            mainWindow.send('rutes', lineas)        

        })
        .catch(err => {
            console.log('Error getting documents', err);
        });      

        //Recogemos los autobuses para cargarlos en la tabla
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

    //Metodo que pone en marcha un bus
    ipcMain.on('lanzarBus', (event, bus, linea) => {
        /* Se envia una notificacion cada vez que se lanza un bus
        el texto que se escribe en la notificacion es el del Title y el Body, 
         bastante customizable. 
         
         Siempre y cuando el cliente este suscrito a un Topic, sino no le llegaran
        esas notificaciones, se podria hacer en la app una zona de suscripciones a lineas,
        retrasos, obras, y asi cuando se quiera enviar una alerta, va dirigida solo a los usuarios
        que han elegido ese Topic. A los demás solo se les mostraria en otra seccion de la aplicación.

         */

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

        //////////////////////////////////////////////////////////////////

        //Recogemos el bus que vamos a poner en marcha
        const autobusesRef = firestore.collection('Autobus').doc(bus);
        //Le damos su hueco para que el continue siempre desde su posicion
        posArray[bus] = 1
        
        //console.log(rutes)

        //Hacemos que se modifique en la aplicacion los valores que se van cambiando en firebase para verlo en tiempo real
        autobusesRef.onSnapshot(function(doc) {
            console.log("CAMBIOS ESCUCHADOS EN " + doc._fieldsProto.nombre.stringValue)

            mainWindow.send('posBus', doc._fieldsProto)
        });
        
        actualizarPosicion()

        //Ejecutamos una funcion asincrona cada 220 mlsg para que la posicion del bus vaya cambiando
        async function actualizarPosicion() {
            console.log("dentroactualizar" + linea)
           // console.log("lat: " + rutes[linea][posArray[bus]]._lat + ", lon: " + rutes.puntos[posArray[bus]]._lon)
            autobusesRef.update({
                //Con la referencia ya, le cambiamos la latitud y la longitud, por la que tenemos de la ruta y se actualiza
                "latLong": new Firestore.GeoPoint(parseFloat(rutes[linea][posArray[bus]]._lat) , parseFloat(rutes[linea][posArray[bus]]._lon))
            })
            .then(function() {
                //Si todo sale bien, le sumamos en la posicion 1 mas para que vaya al siguiente punto
                console.log("Bus en camino... DATOS CAMBIADOS");
                posArray[bus] = posArray[bus] + 1

            })
            .catch(function(error) {
                // The document probably doesn't exist.
                console.error("Ha ocurrido un error con la posicion! ", error);
            });
                
            await delay(220)
            //Y hasta que no llegue a acabar de realizar la ruta el bus, no parará
            if(posArray[bus]  < rutes[linea].length){
                console.log("POS " + bus + ": " + posArray[bus] )
                actualizarPosicion()
            }else{
                console.log("RUTA FINALIZADA")
            }
        }
        
      })
      
      ipcMain.on('closed', () => {
		// por último escuchamos el evento `closed` de la ventana para limpar la variable `window`
		// de esta forma permitimos matar la ventana sin matar al aplicación
		window = null
    });
}