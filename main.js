const { app, BrowserWindow, ipcMain,clipboard } = require('electron');
const ffi = require('./node_modules/@lwahonen/ffi-napi'); // Import node-ffi
const ref = require('@lwahonen/ref-napi');
const robot = require('robotjs');
const fs = require('fs')
function createSettingsFileIfNotExists() {
  if (!fs.existsSync('./settings.json')) {
    const defaultSettings = {
      speakerID: 'test',
      isCarSpeaker: false,
      API_KEY: 'AIzaSyBV-vZC-rJeKKJtaose7I07VIcn8ysyino'
    };

    fs.writeFileSync('./settings.json', JSON.stringify(defaultSettings, null, 2), 'utf-8');
  }
}
function readSettings() {
  try {
    const data = fs.readFileSync('./settings.json', 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.log('Error reading JSON: ', err);
    return null;
  }
}
function updateSpeakerID(newSpeakerID) {
  settings = readSettings();

  if (settings) {
    settings.speakerID = newSpeakerID;

    // Write the updated settings back to the JSON file
    fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2), 'utf-8');
  }
  settings = readSettings()
}
createSettingsFileIfNotExists();




// Load the user32.dll library
const user32 = ffi.Library('user32', {
  'FindWindowA': ['long', ['string', 'string']],
  'FindWindowW': ['long', ['string', 'string']], // Add FindWindowW
  'GetForegroundWindow': ['long', []],           // Add GetForegroundWindow
  'SetForegroundWindow': ['bool', ['long']],
});
// Define the window title of Discord (replace with the actual title)
const windowTitle = 'RAGE Multiplayer';

// Create a global variable for the Discord window handle
let hwnd;

// Find the HWND of the Discord window when the app is ready
app.on('ready', () => {
  // Create the main Electron window
  var mainWindow = new BrowserWindow({ width: 800, height: 800,webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  } });
  createSettingsFileIfNotExists();
  ipcMain.on('detect-rage',(event)=>{
    setTimeout(()=>{
      hwnd = user32.GetForegroundWindow()
    },5000)
    console.log(settings.API_KEY)

  })


  mainWindow.loadFile('index.html'); // Load your HTML file
  var settings = readSettings()
  // Delay the FindWindow call to ensure the window is created
  setTimeout(() => {
    hwnd = user32.GetForegroundWindow()
  
    if (hwnd !== 0) {
      console.log(`Found Discord window with HWND: ${hwnd}`);
    } else {
      console.log('Discord window not found.');
    }
  }, 3000);
  ipcMain.on('send-data-to-renderer',(event,settings = readSettings()) =>{
    mainWindow.webContents.send('data-from-main',settings)
  
  }) 
  ipcMain.on('new-speaker-id',(event,newId)=>{
    updateSpeakerID(newId)
    console.log(settings.speakerID)
  })
  // Function to update API KEY
  function updateAPIKEY(newApi) {
    settings = readSettings()
    
    if (settings) {
      settings.API_KEY = newApi
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2), 'utf-8');
    }
    settings = readSettings()
    mainWindow.webContents.send('api-from-main',settings.API_KEY)
  }

  // Listen for the 'do-the-thing' message from the renderer process
  ipcMain.on('do-the-thing', (event, dataAr) => {
    console.log(dataAr)
    // Check if the Discord window handle is available
    if (hwnd !== 0) {
      // Set focus to the Discord window
      robot.setKeyboardDelay(10)
      
      
      user32.SetForegroundWindow(hwnd);
      data = dataAr[0]
      var command = '/carurl '
      if (dataAr[1]==false){
        settings = readSettings()
        data = settings.speakerID + " " + data
        command = '/speakerurl '
      }
      clipboard.writeText(command+ data)
      // Simulate pressing the "T" key
      robot.keyTap('t');
      setTimeout(() => {
        // Simulate the keyboard shortcut for paste (Ctrl+V)
        robot.keyTap('v', ['control']);
        // Simulate pressing Enter key
        robot.keyTap('enter')
      }, 100);
      ipcMain.on('speaker-type-change',(event,newID)=>{

      })
     
      
      

    } else {
      console.log('RAGE window not found.');
    }
  });
  ipcMain.on('new-api-update',(event,newApiKey)=>{
    console.log(`changing API KEY to ${newApiKey}`)
    updateAPIKEY(newApiKey)
  })

  
});
