
drop policy "anyone reads active services" on public.services;
create policy "anyone reads active services" on public.services for select to anon, authenticated
  using (is_active or (auth.uid() is not null and public.has_role(auth.uid(), 'admin')));

revoke all on function public.has_role(uuid, app_role) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated, service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.assign_booking_number() from public, anon, authenticated;
