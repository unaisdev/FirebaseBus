// de electron nos traemos app y BrowserWindow
const path = require('path')
var bodyParser = require("body-parser");

const { app } = require('electron');
const fs = require('fs');
const Window = require('./Window')
const firebase = require('firebase-admin')

require('electron-reload')(__dirname);

// definimos `window`, acá vamos a guardar la instancia de BrowserWindow actual
let window;

var config = {
    apiKey: "AIzaSyAncSYM2c86zWuQw3s1cxEkbSHVxSaAQCk",
    authDomain: "autobusesidrl.firebaseapp.com",
    databaseURL: "https://autobusesidrl.firebaseio.com",
    projectId: "autobusesidrl",
    storageBucket: "autobusesidrl.appspot.com",
    messagingSenderId: "897900550232"
  };
firebase.initializeApp(config);

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

    let newBus
   
    
    mainWindow.once('show', () => {
        var rutas = JSON.parse(fs.readFileSync('recursos/DonostiIrun.json', 'utf8'))

        var ruta = []

        rutas.gpx.trk.trkseg.trkpt.forEach(element => {
            ruta.push(element)
        });

        var autobusesRef = firebase.collection('Autobuses');
        var query = autobusesRef.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    console.log(doc.id, '=>', doc.data());
                });
            })
            .catch(err => {
                console.log('Error getting documents', err);
            });
        
        mainWindow.send('rutes', ruta)
    })

    app.on('newBus', () => {
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


	mainWindow.on('closed', () => {
		// por último escuchamos el evento `closed` de la ventana para limpar la variable `window`
		// de esta forma permitimos matar la ventana sin matar al aplicación
		window = null
	});
}