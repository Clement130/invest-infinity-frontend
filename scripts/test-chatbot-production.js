/**
 * Script de test pour diagnostiquer l'erreur 502 du chatbot en production
 */

const SUPABASE_URL = 'https://vveswlmcgmizmjsriezw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznJXrTNadOwdjY';

async function testChatbot() {
  console.log('🧪 Test du chatbot en production...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Bonjour, comment ça va ?'
          }
        ],
        context: {
          userRole: 'prospect'
        }
      })
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`\n📝 Response Body:`);
    
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(text);
    }

    if (!response.ok) {
      console.error(`\n❌ Erreur ${response.status}: ${response.statusText}`);
      return false;
    }

    console.log('\n✅ Test réussi !');
    return true;
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error(error.stack);
    return false;
  }
}

testChatbot().then(success => {
  process.exit(success ? 0 : 1);
});



















