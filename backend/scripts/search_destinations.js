const https = require('https');

const cities = ['Sapa', 'Ninh Binh', 'Vung Tau', 'Can Tho', 'Ha Giang', 'Quy Nhon', 'Phan Thiet', 'Cat Ba', 'Phong Nha', 'Vinh'];
const apiKey = 'ad52f7b8a0mshb6b1642d98fff4cp1b8049jsnc720d089ed86';

function searchCity(city) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'booking-com15.p.rapidapi.com',
      port: 443,
      path: `/api/v1/hotels/locations?query=${encodeURIComponent(city)}&languagecode=vi`,
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', error => { reject(error); });
    req.end();
  });
}

async function run() {
  console.log('Searching destination IDs...');
  for (const city of cities) {
    try {
      const res = await searchCity(city);
      const data = res.data || [];
      const cityResult = data.find(item => item.dest_type === 'city') || data[0];
      if (cityResult) {
        console.log(`{ destId: '${cityResult.dest_id}', city: '${city}', type: '${cityResult.dest_type}' },`);
      } else {
        console.log(`No results for ${city}`);
      }
    } catch (e) {
      console.error(`Error searching ${city}:`, e.message);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

run();
