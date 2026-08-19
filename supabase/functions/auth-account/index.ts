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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: authData } = await admin.auth.getUser(token);
    const authUser = authData?.user;
    if (!authUser) return json({ error: "Não autenticado" }, 401);

    const { data: caller } = await admin
      .from("usuarios")
      .select("id, email, user_profiles(user_type)")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();
    if (!caller) return json({ error: "Usuário não encontrado" }, 403);

    const isAdmin = (caller as any).user_profiles?.[0]?.user_type === "administrador" ||
      (caller as any).user_profiles?.user_type === "administrador";

    const body = await req.json();
    const action = body?.action;

    if (action === "change_password") {
      const newPassword: string = body.newPassword ?? "";
      if (newPassword.length < 6) return json({ error: "Senha muito curta" }, 400);

      const { error: authError } = await admin.auth.admin.updateUserById(authUser.id, {
        password: newPassword,
      });
      if (authError) return json({ error: authError.message }, 400);

      await admin
        .from("usuarios")
        .update({
          senha: await bcrypt.hash(newPassword, 10),
          must_change_password: false,
          is_temp_password: false,
        })
        .eq("id", caller.id);

      return json({ success: true });
    }

    if (!isAdmin) return json({ error: "Acesso restrito a administradores" }, 403);

    if (action === "create_user") {
      const { nome, sobrenome, email, username, user_type } = body;
      if (!nome || !sobrenome || !email || !username) return json({ error: "Dados incompletos" }, 400);
      const tempPassword = body.tempPassword || "12345678";

      const { data: newUser, error: insertError } = await admin
        .from("usuarios")
        .insert({
          nome,
          sobrenome,
          email,
          username,
          senha: await bcrypt.hash(tempPassword, 10),
          must_change_password: true,
          is_temp_password: true,
        })
        .select()
        .single();
      if (insertError) return json({ error: insertError.message }, 400);

      const { error: profileError } = await admin
        .from("user_profiles")
        .insert({ user_id: newUser.id, user_type: user_type ?? "operacional" });
      if (profileError) return json({ error: profileError.message }, 400);

      return json({ success: true, tempPassword, id: newUser.id });
    }

    if (action === "reset_password") {
      const { userId } = body;
      if (!userId) return json({ error: "Usuário não informado" }, 400);
      const tempPassword = body.tempPassword || "12345678";

      const { data: target } = await admin
        .from("usuarios")
        .select("id, auth_user_id")
        .eq("id", userId)
        .maybeSingle();
      if (!target) return json({ error: "Usuário não encontrado" }, 404);

      if (target.auth_user_id) {
        await admin.auth.admin.updateUserById(target.auth_user_id, { password: tempPassword });
      }

      await admin
        .from("usuarios")
        .update({
          senha: await bcrypt.hash(tempPassword, 10),
          must_change_password: true,
          is_temp_password: true,
        })
        .eq("id", userId);

      return json({ success: true, tempPassword });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("auth-account error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
