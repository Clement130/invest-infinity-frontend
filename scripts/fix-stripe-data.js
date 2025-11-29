import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixStripeData() {
  console.log('🔧 CORRECTION FORCÉE DES DONNÉES STRIPE...\n');

  try {
    // Supprimer toutes les données existantes
    console.log('🗑️ Suppression des données existantes...');
    const { error: deleteError } = await supabase
      .from('stripe_prices')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      return;
    }

    // Insérer les bonnes données
    console.log('📝 Insertion des données correctes...');
    const { data, error: insertError } = await supabase
      .from('stripe_prices')
      .insert([
        {
          plan_type: 'entree',
          plan_name: 'Entrée',
          stripe_price_id: 'price_1SYkswKaUb6KDbNFvH1x4v0V',
          amount_euros: 147.00,
          is_active: true,
          description: 'Formule Entrée - 147€'
        },
        {
          plan_type: 'transformation',
          plan_name: 'Transformation',
          stripe_price_id: 'price_1SXfxaKaUb6KDbNFRgl7y7I5',
          amount_euros: 497.00,
          is_active: true,
          description: 'Formule Transformation - 497€'
        },
        {
          plan_type: 'immersion',
          plan_name: 'Immersion Élite',
          stripe_price_id: 'price_1SYkswKaUb6KDbNFvwoV35RW',
          amount_euros: 1997.00,
          is_active: true,
          description: 'Formule Immersion Élite - 1997€'
        }
      ]);

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
      return;
    }

    console.log('✅ Données insérées avec succès');

    // Vérifier les données
    console.log('\n🔍 VÉRIFICATION...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('is_active', true);

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
      return;
    }

    console.log('📊 Données dans la base:');
    verifyData.forEach(row => {
      console.log(`  - ${row.plan_name}: ${row.stripe_price_id} (${row.amount_euros}€)`);
    });

    if (verifyData.length === 3) {
      console.log('\n🎉 SUCCESS ! Toutes les données sont maintenant correctes.');
      console.log('🚀 Le checkout devrait maintenant fonctionner en production.');
    } else {
      console.log(`\n❌ Problème: ${verifyData.length}/3 données trouvées`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

fixStripeData();
