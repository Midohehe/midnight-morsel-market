CREATE TYPE public.app_role AS ENUM ('ADMIN','COOK','DELIVERY','CUSTOMER');

CREATE OR REPLACE FUNCTION public.now_ms() RETURNS bigint LANGUAGE sql STABLE AS $$ SELECT (extract(epoch from now())*1000)::bigint $$;
CREATE OR REPLACE FUNCTION public.short_id() RETURNS text LANGUAGE sql VOLATILE AS $$ SELECT substr(md5(random()::text || clock_timestamp()::text),1,10) $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '🙂',
  address text NOT NULL DEFAULT '',
  cook_id text,
  created_at bigint NOT NULL DEFAULT public.now_ms()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own or admin read profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));
CREATE POLICY "own update profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own or admin read roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));

CREATE TABLE public.cooks (
  id text PRIMARY KEY DEFAULT ('c' || public.short_id()),
  user_id uuid,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '🧑‍🍳',
  kitchen_name_ar text NOT NULL DEFAULT '',
  kitchen_name_en text NOT NULL DEFAULT '',
  address_ar text NOT NULL DEFAULT '',
  address_en text NOT NULL DEFAULT '',
  lat double precision NOT NULL DEFAULT 32.87,
  lng double precision NOT NULL DEFAULT 13.15,
  rating double precision NOT NULL DEFAULT 5,
  total_orders integer NOT NULL DEFAULT 0,
  is_open boolean NOT NULL DEFAULT false,
  kitchen_video_url text NOT NULL DEFAULT '',
  cover text NOT NULL DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  banned boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.cooks TO anon;
GRANT SELECT, INSERT, UPDATE ON public.cooks TO authenticated;
GRANT ALL ON public.cooks TO service_role;
ALTER TABLE public.cooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads cooks" ON public.cooks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owner or admin updates cook" ON public.cooks FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));

-- owners cannot self-verify, unban, or edit rating
CREATE OR REPLACE FUNCTION public.cooks_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'ADMIN') THEN
    NEW.is_verified := OLD.is_verified; NEW.banned := OLD.banned; NEW.rating := OLD.rating;
    NEW.total_orders := OLD.total_orders; NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cooks_guard BEFORE UPDATE ON public.cooks FOR EACH ROW EXECUTE FUNCTION public.cooks_guard();

CREATE OR REPLACE FUNCTION public.owns_cook(_cook_id text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cooks WHERE id = _cook_id AND user_id = auth.uid())
$$;

CREATE TABLE public.products (
  id text PRIMARY KEY DEFAULT ('p' || public.short_id()),
  cook_id text NOT NULL REFERENCES public.cooks(id) ON DELETE CASCADE,
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  "price_LYD" double precision NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  quantity_available integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'sandwich',
  unavailable boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owner inserts products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.owns_cook(cook_id));
CREATE POLICY "owner updates products" ON public.products FOR UPDATE TO authenticated USING (public.owns_cook(cook_id)) WITH CHECK (public.owns_cook(cook_id));
CREATE POLICY "owner deletes products" ON public.products FOR DELETE TO authenticated USING (public.owns_cook(cook_id));

CREATE TABLE public.orders (
  id text PRIMARY KEY DEFAULT ('o' || public.short_id()),
  customer_id uuid,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  customer_address text NOT NULL DEFAULT '',
  cook_id text NOT NULL REFERENCES public.cooks(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal double precision NOT NULL DEFAULT 0,
  delivery_fee double precision NOT NULL DEFAULT 5,
  app_fee double precision NOT NULL DEFAULT 2,
  total double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  ready boolean NOT NULL DEFAULT false,
  payment text NOT NULL DEFAULT 'cash',
  created_at bigint NOT NULL DEFAULT public.now_ms(),
  delivery_boy jsonb,
  delivery_boy_id uuid,
  rated boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read orders" ON public.orders FOR SELECT TO authenticated USING (
  customer_id = auth.uid() OR public.owns_cook(cook_id) OR delivery_boy_id = auth.uid()
  OR (public.has_role(auth.uid(),'DELIVERY') AND status = 'cooking' AND delivery_boy_id IS NULL)
  OR public.has_role(auth.uid(),'ADMIN'));

CREATE TABLE public.reviews (
  id text PRIMARY KEY DEFAULT ('r' || public.short_id()),
  cook_id text NOT NULL REFERENCES public.cooks(id) ON DELETE CASCADE,
  order_id text NOT NULL UNIQUE,
  rating integer NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at bigint NOT NULL DEFAULT public.now_ms()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY,
  balance double precision NOT NULL DEFAULT 0
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin wallet" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));

CREATE TABLE public.transactions (
  id text PRIMARY KEY DEFAULT ('t' || public.short_id()),
  user_id uuid NOT NULL,
  amount double precision NOT NULL,
  type text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at bigint NOT NULL DEFAULT public.now_ms()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin txns" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));

CREATE TABLE public.topup_cards (
  id text PRIMARY KEY DEFAULT ('k' || public.short_id()),
  code text NOT NULL UNIQUE,
  amount double precision NOT NULL,
  batch text NOT NULL DEFAULT '',
  created_at bigint NOT NULL DEFAULT public.now_ms(),
  used_by uuid,
  used_at bigint
);
GRANT SELECT ON public.topup_cards TO authenticated;
GRANT ALL ON public.topup_cards TO service_role;
ALTER TABLE public.topup_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads cards" ON public.topup_cards FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ADMIN'));

-- wallet helper (internal)
CREATE OR REPLACE FUNCTION public._wallet_move(_uid uuid, _amount double precision, _type text, _note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets(user_id, balance) VALUES (_uid, round((_amount)::numeric,2))
  ON CONFLICT (user_id) DO UPDATE SET balance = round((public.wallets.balance + _amount)::numeric,2);
  INSERT INTO public.transactions(user_id, amount, type, note) VALUES (_uid, _amount, _type, _note);
END $$;
REVOKE ALL ON FUNCTION public._wallet_move(uuid,double precision,text,text) FROM PUBLIC, anon, authenticated;

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  r text := upper(COALESCE(m->>'role','CUSTOMER'));
  uname text := lower(COALESCE(m->>'username', split_part(NEW.email,'@',1)));
  cid text;
BEGIN
  IF r NOT IN ('CUSTOMER','COOK','DELIVERY') THEN r := 'CUSTOMER'; END IF;
  IF r = 'COOK' THEN
    INSERT INTO public.cooks(user_id, name, phone, kitchen_name_ar, kitchen_name_en, address_ar, address_en, lat, lng, rating)
    VALUES (NEW.id, COALESCE(m->>'name',''), COALESCE(m->>'phone',''), COALESCE(m->>'kitchen',''), COALESCE(m->>'kitchen',''),
            COALESCE(m->>'address',''), COALESCE(m->>'address',''), 32.86 + random()*0.03, 13.13 + random()*0.08, 5)
    RETURNING id INTO cid;
  END IF;
  INSERT INTO public.profiles(id, username, name, phone, address, avatar, cook_id)
  VALUES (NEW.id, uname, COALESCE(m->>'name',''), COALESCE(m->>'phone',''), COALESCE(m->>'address',''),
          CASE r WHEN 'COOK' THEN '🧑‍🍳' WHEN 'DELIVERY' THEN '🏍️' ELSE '🙂' END, cid);
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, r::public.app_role);
  INSERT INTO public.wallets(user_id, balance) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- public: is a username taken
CREATE OR REPLACE FUNCTION public.username_taken(_u text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE username = lower(_u))
$$;

CREATE OR REPLACE FUNCTION public.place_order(_cook_id text, _items jsonb, _name text, _phone text, _address text, _payment text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid(); it jsonb; p public.products; k public.cooks;
  out_items jsonb := '[]'; sub double precision := 0; tot double precision; oid text; bal double precision;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO k FROM public.cooks WHERE id = _cook_id;
  IF k.id IS NULL OR NOT k.is_open OR k.banned THEN RAISE EXCEPTION 'kitchen_closed'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'empty'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO p FROM public.products WHERE id = it->>'product_id' AND cook_id = _cook_id FOR UPDATE;
    IF p.id IS NULL OR p.unavailable OR p.quantity_available < (it->>'qty')::int OR (it->>'qty')::int < 1 THEN RAISE EXCEPTION 'sold_out'; END IF;
    UPDATE public.products SET quantity_available = quantity_available - (it->>'qty')::int WHERE id = p.id;
    sub := sub + p."price_LYD" * (it->>'qty')::int;
    out_items := out_items || jsonb_build_object('product_id', p.id, 'qty', (it->>'qty')::int, 'price', p."price_LYD", 'name_ar', p.name_ar, 'name_en', p.name_en);
  END LOOP;
  tot := sub + 5 + 2;
  oid := 'o' || public.short_id();
  IF _payment = 'wallet' THEN
    SELECT balance INTO bal FROM public.wallets WHERE user_id = me FOR UPDATE;
    IF COALESCE(bal,0) < tot THEN RAISE EXCEPTION 'low_balance'; END IF;
    PERFORM public._wallet_move(me, -tot, 'payment', 'Order #' || upper(right(oid,5)));
  END IF;
  INSERT INTO public.orders(id, customer_id, customer_name, customer_phone, customer_address, cook_id, items, subtotal, delivery_fee, app_fee, total, payment)
  VALUES (oid, me, _name, _phone, _address, _cook_id, out_items, sub, 5, 2, tot, CASE WHEN _payment='wallet' THEN 'wallet' ELSE 'cash' END);
  UPDATE public.profiles SET address = _address WHERE id = me AND address = '';
  RETURN oid;
END $$;

CREATE OR REPLACE FUNCTION public.cook_update_order(_order_id text, _action text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF o.id IS NULL OR NOT public.owns_cook(o.cook_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _action = 'accept' AND o.status = 'pending' THEN UPDATE public.orders SET status='cooking' WHERE id=o.id;
  ELSIF _action = 'reject' AND o.status = 'pending' THEN
    UPDATE public.orders SET status='rejected' WHERE id=o.id;
    IF o.payment = 'wallet' AND o.customer_id IS NOT NULL THEN PERFORM public._wallet_move(o.customer_id, o.total, 'refund', 'Order #' || upper(right(o.id,5))); END IF;
  ELSIF _action = 'ready' AND o.status = 'cooking' THEN UPDATE public.orders SET ready=true WHERE id=o.id;
  ELSE RAISE EXCEPTION 'bad_transition'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.driver_take(_order_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.profiles;
BEGIN
  IF NOT public.has_role(auth.uid(),'DELIVERY') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO pr FROM public.profiles WHERE id = auth.uid();
  UPDATE public.orders SET delivery_boy_id = auth.uid(), status='on_way',
    delivery_boy = jsonb_build_object('id', auth.uid(), 'name', pr.name, 'phone', pr.phone)
  WHERE id = _order_id AND status='cooking' AND delivery_boy_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'taken'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.driver_deliver(_order_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; k public.cooks;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF o.id IS NULL OR o.delivery_boy_id IS DISTINCT FROM auth.uid() OR o.status <> 'on_way' THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.orders SET status='delivered' WHERE id=o.id;
  UPDATE public.cooks SET total_orders = total_orders + 1 WHERE id = o.cook_id RETURNING * INTO k;
  IF o.payment = 'wallet' THEN
    IF k.user_id IS NOT NULL THEN PERFORM public._wallet_move(k.user_id, round((o.subtotal*0.8)::numeric,2)::double precision, 'earning', 'Order #' || upper(right(o.id,5))); END IF;
    PERFORM public._wallet_move(o.delivery_boy_id, o.delivery_fee, 'earning', 'Delivery #' || upper(right(o.id,5)));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rate_order(_order_id text, _rating int, _comment text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF o.id IS NULL OR o.customer_id IS DISTINCT FROM auth.uid() OR o.status <> 'delivered' OR o.rated THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'bad_rating'; END IF;
  INSERT INTO public.reviews(cook_id, order_id, rating, comment) VALUES (o.cook_id, o.id, _rating, COALESCE(_comment,''));
  UPDATE public.orders SET rated = true WHERE id = o.id;
  UPDATE public.cooks SET rating = round(((rating * 9 + _rating) / 10.0)::numeric, 2) WHERE id = o.cook_id;
END $$;

CREATE OR REPLACE FUNCTION public.redeem_card(_code text) RETURNS double precision
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.topup_cards;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO c FROM public.topup_cards WHERE regexp_replace(code,'\D','','g') = regexp_replace(_code,'\D','','g') FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'invalid'; END IF;
  IF c.used_by IS NOT NULL THEN RAISE EXCEPTION 'used'; END IF;
  UPDATE public.topup_cards SET used_by = auth.uid(), used_at = public.now_ms() WHERE id = c.id;
  PERFORM public._wallet_move(auth.uid(), c.amount, 'topup', 'Card ' || right(c.code,4));
  RETURN c.amount;
END $$;

CREATE OR REPLACE FUNCTION public.admin_issue_cards(_amount double precision, _qty int, _batch text) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i int := 0; code text;
BEGIN
  IF NOT public.has_role(auth.uid(),'ADMIN') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _amount <= 0 OR _qty < 1 OR _qty > 500 THEN RAISE EXCEPTION 'bad_input'; END IF;
  WHILE i < _qty LOOP
    code := regexp_replace(lpad((floor(random()*1e8))::bigint::text,8,'0') || lpad((floor(random()*1e8))::bigint::text,8,'0'), '(\d{4})(?=\d)', '\1-', 'g');
    BEGIN
      INSERT INTO public.topup_cards(code, amount, batch) VALUES (code, _amount, _batch);
      i := i + 1;
    EXCEPTION WHEN unique_violation THEN NULL; END;
  END LOOP;
  RETURN i;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders, public.cooks, public.products, public.wallets, public.transactions;