import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// URL de test (local ou production)
const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

async function testPricingPage() {
  console.log('\n🧪 Test de la page Pricing avec Playwright\n');
  console.log(`📍 URL de test: ${BASE_URL}\n`);

  const browser = await chromium.launch({ 
    headless: false, // Afficher le navigateur pour voir ce qui se passe
    slowMo: 500 // Ralentir pour mieux voir
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    // 1. Vérifier les Price IDs dans la base de données
    console.log('1️⃣ Vérification des Price IDs dans Supabase...');
    const { data: prices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('is_active', true)
      .order('plan_type');

    if (pricesError) {
      console.error('❌ Erreur lors de la récupération des prix:', pricesError);
    } else {
      console.log('✅ Price IDs récupérés depuis la DB:');
      prices.forEach(price => {
        console.log(`   - ${price.plan_name}: ${price.stripe_price_id} (${price.amount_cents / 100}€)`);
      });
    }

    // 2. Naviguer vers la page de pricing
    console.log('\n2️⃣ Navigation vers la page /pricing...');
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 3. Vérifier que les 3 formules sont affichées
    console.log('\n3️⃣ Vérification des 3 formules...');
    
    const formulas = [
      { name: 'Entrée', price: '147€' },
      { name: 'Transformation', price: '497€' },
      { name: 'Immersion Élite', price: '1 997€' }
    ];

    for (const formula of formulas) {
      const formulaText = await page.textContent('body');
      if (formulaText?.includes(formula.name) && formulaText?.includes(formula.price)) {
        console.log(`   ✅ ${formula.name} (${formula.price}) - Affichée correctement`);
      } else {
        console.log(`   ❌ ${formula.name} (${formula.price}) - Non trouvée`);
      }
    }

    // 4. Vérifier les boutons de chaque formule
    console.log('\n4️⃣ Vérification des boutons...');
    
    // Bouton Entrée
    const entreeButton = page.locator('button:has-text("Entrée")').or(page.locator('button:has-text("147€")'));
    if (await entreeButton.count() > 0) {
      console.log('   ✅ Bouton Entrée trouvé');
    } else {
      console.log('   ❌ Bouton Entrée non trouvé');
    }

    // Bouton Transformation
    const transformationButton = page.locator('button:has-text("Transformation")').or(page.locator('button:has-text("497€")'));
    if (await transformationButton.count() > 0) {
      console.log('   ✅ Bouton Transformation trouvé');
    } else {
      console.log('   ❌ Bouton Transformation non trouvé');
    }

    // Bouton Immersion Élite
    const immersionButton = page.locator('button:has-text("Immersion Élite")').or(page.locator('button:has-text("1 997€")'));
    if (await immersionButton.count() > 0) {
      console.log('   ✅ Bouton Immersion Élite trouvé');
    } else {
      console.log('   ❌ Bouton Immersion Élite non trouvé');
    }

    // 5. Tester le clic sur Immersion Élite (doit rediriger vers /immersion-elite)
    console.log('\n5️⃣ Test du clic sur Immersion Élite...');
    try {
      await immersionButton.first().click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/immersion-elite')) {
        console.log('   ✅ Redirection vers /immersion-elite réussie');
        
        // Vérifier que la page Immersion Élite s'affiche correctement
        const pageContent = await page.textContent('body');
        if (pageContent?.includes('Immersion Élite') && pageContent?.includes('1 997€')) {
          console.log('   ✅ Page Immersion Élite affichée correctement');
        } else {
          console.log('   ❌ Contenu de la page Immersion Élite incorrect');
        }

        // Vérifier la sélection de session
        const sessionButtons = page.locator('button:has-text("places restantes")');
        const sessionCount = await sessionButtons.count();
        console.log(`   ℹ️  ${sessionCount} session(s) disponible(s)`);
      } else {
        console.log(`   ❌ Redirection échouée. URL actuelle: ${currentUrl}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors du clic: ${error.message}`);
    }

    // 6. Retourner à la page pricing et tester les autres boutons
    console.log('\n6️⃣ Test des autres formules...');
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Tester le bouton Entrée (doit déclencher le checkout)
    try {
      const entreeBtn = page.locator('button:has-text("Choisir Entrée")').first();
      if (await entreeBtn.count() > 0) {
        console.log('   ✅ Bouton Entrée trouvé, test du clic...');
        
        // Intercepter la requête vers checkout-public
        const checkoutRequest = page.waitForRequest(request => 
          request.url().includes('checkout-public') && request.method() === 'POST'
        );
        
        await entreeBtn.click();
        await page.waitForTimeout(1000);
        
        try {
          const request = await checkoutRequest;
          const requestBody = request.postDataJSON();
          console.log('   ✅ Requête checkout détectée');
          console.log(`   ℹ️  Price ID envoyé: ${requestBody.priceId}`);
          
          // Vérifier que le Price ID correspond à celui de la DB
          const entreePrice = prices.find(p => p.plan_type === 'entree');
          if (entreePrice && requestBody.priceId === entreePrice.stripe_price_id) {
            console.log('   ✅ Price ID correspond à celui de la DB');
          } else {
            console.log('   ⚠️  Price ID ne correspond pas à celui de la DB');
          }
        } catch (e) {
          console.log('   ⚠️  Requête checkout non interceptée (normal si redirection Stripe)');
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors du test Entrée: ${error.message}`);
    }

    // 7. Prendre une capture d'écran
    console.log('\n7️⃣ Capture d\'écran...');
    await page.screenshot({ 
      path: 'test-pricing-screenshot.png',
      fullPage: true 
    });
    console.log('   ✅ Capture sauvegardée: test-pricing-screenshot.png');

    // 8. Vérifier les Price IDs dans le code JavaScript
    console.log('\n8️⃣ Vérification des Price IDs dans le code...');
    const pageContent = await page.content();
    
    // Chercher les références aux Price IDs dans le code
    const priceIdPattern = /price_[A-Za-z0-9_]+/g;
    const foundPriceIds = pageContent.match(priceIdPattern);
    
    if (foundPriceIds) {
      console.log('   ℹ️  Price IDs trouvés dans le code:');
      [...new Set(foundPriceIds)].forEach(id => {
        console.log(`      - ${id}`);
      });
    }

    console.log('\n✅ Tests terminés avec succès!\n');
    
    // Garder le navigateur ouvert 3 secondes pour inspection
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Exécuter les tests
testPricingPage().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

