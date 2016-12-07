const http = require('http')
const https = require('https')
const jsdom = require('jsdom')

const APP_STORE       = 'https://itunes.apple.com/lookup?id=' + process.env.APP_STORE_ID
const PLAY_STORE      = 'https://play.google.com/store/apps/details?id=' + process.env.PLAY_STORE_ID
const MAX_APP_SCORE   = 5
const INTERVAL_TIMING = 3600000 // 1 hour


var AppStoreInfo = {
  currentRating: 4.5,
  numberOfReviews: 109
}

var PlayStoreInfo = {
  currentRating: 4.5,
  numberOfReviews: 34
}

function updateAppStoreInfo() {
  console.log('PENDING: Update App Store Info')

  https.get(APP_STORE, (res) => {
    var json = ''

    res.on('data', data => json += data)

    res.on('end', () => {
      json = JSON.parse(json)

      if(json.results[0].averageUserRating && json.results[0].userRatingCount) {
        AppStoreInfo = {
          currentRating: json.results[0].averageUserRating,
          numberOfReviews: json.results[0].userRatingCount
        }

        console.log('SUCCESS: Update App Store Info')
      }
    })

  }).on('error', e => console.error('ERROR: Update App Store Info', e))
}

function updatePlayStoreInfo() {
  console.log('PENDING: Update Play Store Info')

  https.get(PLAY_STORE, (res) => {
    var html = ''

    res.on('data', data => html += data)

    res.on('end', () => {
      jsdom.env(html, function (err, window) {
        let numberOfReviews = parseInt(window.document.querySelector("meta[itemprop='ratingCount']").content)
        let currentRating = parseFloat(window.document.querySelector("meta[itemprop='ratingValue']").content)

        if(currentRating && numberOfReviews) {
          PlayStoreInfo = {
            currentRating: currentRating,
            numberOfReviews: numberOfReviews
          }

          console.log('SUCCESS: Update Play Store Info')
        }
      })
    })

  }).on('error', e => console.error('ERROR: Update Play Store Info', e))
}

try {
  updateAppStoreInfo()
  updatePlayStoreInfo()
} catch(e) {
  console.log('ERROR: Update Store info at start', e)
}

setInterval(() => {
  try {
    updateAppStoreInfo()
    updatePlayStoreInfo()
  } catch(e) {
    console.log(e)
  }
}, INTERVAL_TIMING)

http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
  })

  if(req.url === '/ios') {
    res.end(JSON.stringify(AppStoreInfo))
  } else {
    res.end(JSON.stringify(PlayStoreInfo))
  }
}).listen(process.env.PORT)
