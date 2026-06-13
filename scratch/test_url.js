async function testUrls() {
  const urls = [
    // 1. Direct path
    'https://na.gov.pk/uploads/images/NA%202-.jpg',
    // 2. Direct path alternative
    'https://na.gov.pk/uploads/images/NA%203.jpg',
    // 3. phpThumb clean path
    'https://na.gov.pk/PhpThumb/phpThumb.php?w=150&src=../uploads/images/NA%202-.jpg',
    // 4. Raw nested path from site
    'https://na.gov.pk/PhpThumb/phpThumb.php?h=80&q=50&src=../PhpThumb/phpThumb.php?w=80&q=50&src=../uploads/images/NA%202-.jpg'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(10000)
      });
      console.log(`URL: ${url}`);
      console.log(`  Status: ${res.status} ${res.statusText}`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
      console.log(`  Content-Length: ${res.headers.get('content-length')}`);
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e.message);
    }
  }
}

testUrls();
