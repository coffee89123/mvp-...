
-- roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

-- services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  duration integer not null default 30,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant all on public.services to service_role;
grant insert, update, delete on public.services to authenticated;
alter table public.services enable row level security;
create policy "anyone reads active services" on public.services for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "admins manage services" on public.services for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- time slots
create table public.time_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (date, start_time)
);
grant select on public.time_slots to anon, authenticated;
grant all on public.time_slots to service_role;
grant insert, update, delete on public.time_slots to authenticated;
alter table public.time_slots enable row level security;
create policy "anyone reads time slots" on public.time_slots for select to anon, authenticated using (true);
create policy "admins manage time slots" on public.time_slots for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  service_id uuid references public.services(id),
  service_name text not null,
  appointment_date date not null,
  appointment_time time not null,
  customer_name text not null,
  phone text not null,
  email text,
  appointment_reason text not null,
  note text,
  status text not null default 'booked' check (status in ('booked','completed','cancelled','no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.appointments to service_role;
grant select, insert, update, delete on public.appointments to authenticated;
alter table public.appointments enable row level security;
create policy "admins manage appointments" on public.appointments for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create unique index appointments_active_slot_idx on public.appointments (appointment_date, appointment_time) where status <> 'cancelled';
create index appointments_date_idx on public.appointments (appointment_date);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

-- unique booking number: BK-YYYYMMDD-NNN
create or replace function public.assign_booking_number() returns trigger language plpgsql set search_path = public as $$
declare seq integer; prefix text;
begin
  if new.booking_number is not null and new.booking_number <> '' then return new; end if;
  prefix := 'BK-' || to_char(new.appointment_date, 'YYYYMMDD') || '-';
  perform pg_advisory_xact_lock(hashtext(prefix));
  select coalesce(max(substring(booking_number from '[0-9]+$')::int), 0) + 1 into seq
    from public.appointments where booking_number like prefix || '%';
  new.booking_number := prefix || lpad(seq::text, 3, '0');
  return new;
end; $$;
create trigger appointments_booking_number before insert on public.appointments for each row execute function public.assign_booking_number();

-- seed services
insert into public.services (name, description, duration, sort_order) values
  ('開戶諮詢', '由專人協助您了解開戶流程與相關問題。', 30, 1),
  ('開戶協助', '協助您處理開戶流程及相關操作問題。', 30, 2),
  ('補件協助', '協助您確認補件內容及相關問題。', 20, 3),
  ('其他諮詢', '其他需要專人協助的事項。', 30, 4);

-- seed time slots: weekdays for next 45 days, 09:00-11:30 and 13:30-16:30
insert into public.time_slots (date, start_time, end_time)
select d::date, t, t + interval '30 minutes'
from generate_series((now() at time zone 'Asia/Taipei')::date, (now() at time zone 'Asia/Taipei')::date + 45, interval '1 day') d
cross join (
  select (time '09:00' + (n * interval '30 minutes'))::time as t
  from generate_series(0, 5) n
  union all
  select (time '13:30' + (n * interval '30 minutes'))::time
  from generate_series(0, 5) n
) times
where extract(isodow from d) between 1 and 5;

-- seed appointments
insert into public.appointments (booking_number, service_name, service_id, appointment_date, appointment_time, customer_name, phone, email, appointment_reason, note, status)
select 'BK-20260910-001', '開戶諮詢', (select id from public.services where name='開戶諮詢'), date '2026-09-10', time '10:00', '王小明', '0912345678', 'wang@example.com', '開戶', '希望能盡快安排', 'booked'
union all select 'BK-20260910-002', '補件協助', (select id from public.services where name='補件協助'), date '2026-09-10', time '11:00', '李佳蓉', '0922333444', null, '補件', null, 'completed'
union all select 'BK-20260911-001', '開戶協助', (select id from public.services where name='開戶協助'), date '2026-09-11', time '09:30', '陳志偉', '0933555666', 'chen@example.com', '操作問題', '需要視訊說明', 'booked'
union all select 'BK-20260911-002', '其他諮詢', (select id from public.services where name='其他諮詢'), date '2026-09-11', time '14:00', '林淑芬', '0955777888', null, '資料確認', null, 'cancelled'
union all select 'BK-20260908-001', '開戶諮詢', (select id from public.services where name='開戶諮詢'), date '2026-09-08', time '09:00', '張家豪', '0966111222', null, '開戶', null, 'no_show';
