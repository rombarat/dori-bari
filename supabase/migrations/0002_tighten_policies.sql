-- is_admin() is only needed inside policies evaluated for signed-in users.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- One SELECT policy per table: split the admin "for all" policies into write-only policies.
do $$
declare t text;
begin
  foreach t in array array['categories', 'products', 'blocked_dates'] loop
    execute format('drop policy if exists "admin manages %s" on public.%I', replace(t, '_', ' '), t);
    execute format('create policy "admin inserts %1$s" on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin updates %1$s" on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin deletes %1$s" on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;
