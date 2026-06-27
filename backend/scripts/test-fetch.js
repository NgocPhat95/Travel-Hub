const axios = require('axios');

async function run() {
  try {
    console.log('Fetching Booking.com search results...');
    const response = await axios.get('https://www.booking.com/searchresults.vi.html', {
      params: {
        ss: 'Việt Nam',
        dest_type: 'country',
        dest_id: '237',
        offset: '0',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.7,en;q=0.3',
      }
    });

    console.log('Response status:', response.status);
    const html = response.data;
    
    // Search for bstatic urls in the html
    const regex = /https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[^\s"'>]+/g;
    const matches = html.match(regex) || [];
    
    console.log(`Found ${matches.length} matches!`);
    const unique = [...new Set(matches)];
    console.log(`Unique matches: ${unique.length}`);
    console.log('Sample matches:');
    unique.slice(0, 15).forEach(m => console.log(m));
  } catch (error) {
    console.error('Fetch failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

run();
