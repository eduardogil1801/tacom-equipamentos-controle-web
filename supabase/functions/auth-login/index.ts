import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return json({ error: "Credenciais inválidas" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const ident = String(identifier).trim();
    const { data: usuario } = await admin
      .from("usuarios")
      .select("id, nome, sobrenome, email, username, senha, ativo, auth_user_id, must_change_password, is_temp_password")
      .or(`email.eq.${ident},username.eq.${ident}`)
      .eq("ativo", true)
      .maybeSingle();

    if (!usuario) return json({ error: "Credenciais inválidas" }, 401);

    const stored = usuario.senha ?? "";
    const isHashed = stored.startsWith("$2");
    const valid = isHashed ? await bcrypt.compare(password, stored) : stored === password;
    if (!valid) return json({ error: "Credenciais inválidas" }, 401);

    const hashed = isHashed ? stored : await bcrypt.hash(password, 10);

    // Ensure a real Supabase Auth account exists with this password
    let authUserId = usuario.auth_user_id as string | null;
    if (!authUserId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: usuario.email,
        password,
        email_confirm: true,
        user_metadata: { usuario_id: usuario.id },
      });
      if (created?.user) {
        authUserId = created.user.id;
      } else {
        // Account already exists: locate it and sync the password
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users?.find(
          (u) => (u.email ?? "").toLowerCase() === usuario.email.toLowerCase(),
        );
        if (!existing) return json({ error: createError?.message ?? "Falha ao criar sessão" }, 500);
        authUserId = existing.id;
        await admin.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
      }
    } else {
      await admin.auth.admin.updateUserById(authUserId, { password });
    }

    await admin
      .from("usuarios")
      .update({ auth_user_id: authUserId, senha: hashed })
      .eq("id", usuario.id);

    return json({ email: usuario.email });
  } catch (e) {
    console.error("auth-login error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
