import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "ADMIN" });
  if (!data) throw new Error("Forbidden");
}

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    username: z.string().trim().toLowerCase().min(2).max(40).regex(/^[a-z0-9._-]+$/),
    password: z.string().min(4).max(64),
    name: z.string().max(80), phone: z.string().max(30),
    role: z.enum(["CUSTOMER", "DELIVERY"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: `${data.username}@nightbite.app`, password: `nb::${data.password}`, email_confirm: true,
      user_metadata: { username: data.username, name: data.name, phone: data.phone, role: data.role },
    });
    if (error) throw new Error(error.message.includes("already") ? "username_taken" : error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdm } = await supabaseAdmin.rpc("has_role", { _user_id: data.id, _role: "ADMIN" });
    if (isAdm) throw new Error("Cannot delete admin");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
