import fetch from 'node-fetch';

async function testContractAPI() {
  console.log('Testing Contract API...');
  
  try {
    // Test 1: Try to save contract with name field
    const response = await fetch('https://signova-blond.vercel.app/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Contract',
        type: 'MSA',
        amount: 1000,
        currency: 'USD',
        effective_date: '2026-01-01',
        expiry_date: '2027-01-01',
        summary: 'Test summary',
      }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('Expected: 401 Unauthorized (need login)');
      console.log('API endpoint is reachable');
    } else if (response.ok) {
      console.log('Contract saved successfully!');
    } else {
      console.log('Error:', data.error);
      if (data.error?.includes('Missing required field')) {
        console.log('CRITICAL BUG: Database schema issue');
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testContractAPI();