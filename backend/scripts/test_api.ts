import axios from 'axios';

const key = 'ad52f7b8a0mshb6b1642d98fff4cp1b8049jsnc720d089ed86';
const host = 'booking-com15.p.rapidapi.com';

async function run() {
  console.log('Testing Booking.com RapidAPI...');
  try {
    const res = await axios.get(`https://${host}/api/v1/hotels/locations`, {
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host,
      },
      params: { query: 'Sapa', languagecode: 'vi' }
    });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data).slice(0, 300));
  } catch (err: any) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data));
    }
  }
}

run();
