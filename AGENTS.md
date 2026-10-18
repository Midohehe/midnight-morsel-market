<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Data layer: src/lib/store.ts hydrates an in-memory DB snapshot from the database (realtime + polling refresh); all writes go through `api.*` (RLS or SECURITY DEFINER RPCs). Why: money/status changes must be atomic and server-validated.
- Accounts: username maps to `<username>@nightbite.app`, password stored as `nb::<password>` so short PINs pass the auth minimum. Why: username-only login on email auth.
