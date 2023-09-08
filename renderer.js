const { ipcRenderer } = require('electron');
const { google } = require('googleapis');


const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const clearButton = document.getElementById('clearButton');
const results = document.getElementById('results');
const carButton = document.getElementById('isCar')
const saveButton = document.getElementById('save')
const speakerInput = document.getElementById('speakerId')
const detectButton = document.getElementById('detectRage')
const apiButton = document.getElementById('changeapi')
const apiInput = document.getElementById('newAPI')
ipcRenderer.send('send-data-to-renderer')
var API_KEY = 'AIzaSyBV-vZC-rJeKKJtaose7I07VIcn8ysyino';
var speakerID
var isCar = true
let youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
});
ipcRenderer.on('data-from-main', (event, data) => {
  // Handle the received data here
  console.log('Data received in renderer process:', data);
  API_KEY = data.API_KEY
  speakerID = data.speakerID
  youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
    });
  
});




//updated API from main
ipcRenderer.on('api-from-main',(event,apiUpdate)=>{
    API_KEY = apiUpdate
    youtube = google.youtube({
        version: 'v3',
        auth: API_KEY,
    });
    
})
// API key and YouTube init



saveButton.addEventListener('click',()=>{
  ipcRenderer.send('new-speaker-id',speakerInput.value)
})

// function to search
clearButton.addEventListener('click', clearResults);
// detect rage
detectButton.addEventListener('click',()=>{
    ipcRenderer.send('detect-rage')
})
// Change API event listener
apiButton.addEventListener('click',()=>{
    API_KEY = apiInput.value
    console.log(API_KEY+" sent to main")
    ipcRenderer.send('new-api-update',API_KEY)
    apiInput.value = ''

    
})
async function searchSong() {
    let query = searchInput.value;
    try {
        // Make a request to the YouTube API
        const response = await youtube.search.list({
            part: 'id,snippet',
            q: query,
            maxResults: 3, // Adjust the number of results as needed
        });
        // Extract search results
        const items = response.data.items;

        items.forEach((item, index) => {
            const videoTitle = item.snippet.title;
            const videoId = item.id.videoId;
            console.log("this is the title: " + item.snippet.title);
            console.log(`${index + 1}. ${videoTitle} - https://www.youtube.com/watch?v=${videoId}`);
            let link = `https://www.youtube.com/watch?v=${videoId}`;
            newDiv = document.createElement('div');
            newDiv.setAttribute('class', 'inner-inner-div'); // Use class instead of id
            newLink = document.createElement('a');
            newLink.setAttribute("href", link);
        
            // Add event listener to the div to copy the href from the link
            newDiv.addEventListener('click', (event) => {
                event.preventDefault();
                const href = event.currentTarget.querySelector('a').getAttribute('href');
                searchInput.select();
                playSong(href);
            });
        
            newLink.innerHTML = `${item.snippet.title}`;
        
            newDiv.appendChild(newLink);
            results.appendChild(newDiv);
        });
    } catch (error) {
        console.error('Error searching for the song:', error.message);
    }
}

function playSong(data) {
    // Simulate pressing the "A" key
    let dataAr = [data]
    if (carButton.checked){
      dataAr.push(true)
    }else{
      dataAr.push(false)
    }
    ipcRenderer.send('do-the-thing', dataAr);
}

function clearResults() {
    const allSongs = document.querySelectorAll('.inner-inner-div');
    allSongs.forEach((element) => {
        element.parentNode.removeChild(element);
    });
}

searchButton.addEventListener('click', searchSong);
