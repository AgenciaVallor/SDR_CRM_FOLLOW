import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Create regular client to verify caller identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify caller is admin
    const { data: { user: caller } } = await supabaseClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem criar usuários' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get new user data from request body
    const { nome, email, senha, role, avatar, metaDiariaLigacoes, metaDiariaReunioes } = await req.json()

    if (!nome || !email || !senha || senha.length < 6) {
      return new Response(JSON.stringify({ error: 'Dados inválidos. Senha mínimo 6 caracteres.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Este email já está cadastrado.' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: senha,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: authError?.message || 'Erro ao criar usuário' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert into public.users table
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id:            authData.user.id,
        nome:          nome.trim(),
        email:         email.toLowerCase().trim(),
        senha_hash:    '',
        role:          role || 'vendedor',
        avatar:        avatar || '#4080f0',
        meta_ligacoes: metaDiariaLigacoes || 50,
        meta_reunioes: metaDiariaReunioes || 5,
        ativo:         true,
      })
      .select()
      .single()

    if (insertError) {
      // Rollback: delete auth user if table insert failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(JSON.stringify({ error: 'Erro ao salvar usuário no banco.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, user: newUser }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
