
const SUPABASE_URL = 'https://coouawibolviluoudyam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb3Vhd2lib2x2aWx1b3VkeWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk4OTQsImV4cCI6MjA4ODI2NTg5NH0.keYEIikIzJJcT66aKHmpaBC4_rdUBZrVwFZSmCO_ZWE';

async function check() {
    console.log("Checking Supabase buckets via REST...");
    
    try {
        const resp = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!resp.ok) {
            const errText = await resp.text();
            console.log(`Buckets: ERROR ${resp.status} - ${errText}`);
        } else {
            const buckets = await resp.json();
            console.log(`Buckets found: ${buckets.map(b => b.id).join(', ')}`);
        }
    } catch (e) {
        console.log(`Buckets: FETCH ERROR - ${e.message}`);
    }
}

check();
