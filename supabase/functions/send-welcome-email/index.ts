import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

type EmailPayload = {
  email: string;
  prenom?: string;
  capital?: number;
};

// Fonction pour déterminer le segment du lead
function getLeadSegment(capital: number | null | undefined): string {
  if (!capital) return 'low';
  if (capital < 500) return 'low';
  if (capital < 2000) return 'medium';
  return 'high';
}

// Fonction pour générer le contenu de l'email selon le segment
function getEmailContent(segment: string, prenom: string, email: string) {
  const baseContent = {
    subject: '',
    html: '',
  };

  switch (segment) {
    case 'high':
      return {
        subject: `Bienvenue ${prenom} ! Accès à ta formation premium 🚀`,
        html: `
          <h2>Félicitations ${prenom} !</h2>
          <p>Ton inscription est confirmée. Accède immédiatement à ta formation gratuite sur Discord.</p>
          <p><strong>Prochaine étape :</strong> Rejoins notre communauté Discord pour commencer ta formation.</p>
          <a href="https://discord.gg/Y9RvKDCrWH">Rejoindre Discord</a>
          <p>Tu as un capital important prévu, tu pourrais être intéressé par notre formation premium avec coaching personnalisé.</p>
          <a href="${supabaseUrl.replace('/supabase.co', '')}/pricing">Découvrir les formations</a>
        `,
      };
    case 'medium':
      return {
        subject: `Bienvenue ${prenom} ! Commence ta formation trading maintenant 🎯`,
        html: `
          <h2>Félicitations ${prenom} !</h2>
          <p>Ton inscription est confirmée. Accède immédiatement à ta formation gratuite sur Discord.</p>
          <p><strong>Prochaine étape :</strong> Rejoins notre communauté Discord pour commencer ta formation.</p>
          <a href="https://discord.gg/Y9RvKDCrWH">Rejoindre Discord</a>
          <p>Tu as un bon capital de départ. Pour aller plus loin, découvre nos formations complètes.</p>
          <a href="${supabaseUrl.replace('/supabase.co', '')}/pricing">Voir les formations</a>
        `,
      };
    default:
      return {
        subject: `Bienvenue ${prenom} ! Accède à ta formation gratuite 🎉`,
        html: `
          <h2>Félicitations ${prenom} !</h2>
          <p>Ton inscription est confirmée. Accède immédiatement à ta formation gratuite sur Discord.</p>
          <p><strong>Prochaine étape :</strong> Rejoins notre communauté Discord pour commencer ta formation.</p>
          <a href="https://discord.gg/Y9RvKDCrWH">Rejoindre Discord</a>
          <p>Commence par la formation gratuite, et quand tu seras prêt, découvre nos formations complètes.</p>
        `,
      };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const payload = (await req.json()) as EmailPayload;
    const { email, prenom = 'Cher membre', capital } = payload;

    if (!email) {
      return new Response(
        JSON.stringify({
          error: 'Email is required',
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Déterminer le segment
    const segment = getLeadSegment(capital);
    
    // Générer le contenu de l'email
    const emailContent = getEmailContent(segment, prenom, email);

    // Mettre à jour le lead avec le segment
    await supabase
      .from('leads')
      .update({ 
        metadata: { segment, email_sent: true, email_sent_at: new Date().toISOString() }
      })
      .eq('email', email.toLowerCase());

    // Ici, vous devriez intégrer un service d'email (SendGrid, Resend, etc.)
    // Pour l'instant, on log juste le contenu
    console.log('Email à envoyer:', {
      to: email,
      subject: emailContent.subject,
      segment,
    });

    return new Response(
      JSON.stringify({
        success: true,
        segment,
        message: 'Email scheduled (integration needed)',
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error('[send-welcome-email] unexpected error', err);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        details: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});

