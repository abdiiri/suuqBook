
-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'business_owner', 'employee');
CREATE TYPE public.payment_method AS ENUM ('cash', 'mpesa', 'credit');
CREATE TYPE public.mpesa_status AS ENUM ('pending', 'success', 'failed', 'cancelled');
CREATE TYPE public.sub_status AS ENUM ('trial', 'active', 'expired');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  business_name TEXT DEFAULT '',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

-- Owner-of helper: returns owner_id for a user (self if owner, else profile.owner_id)
CREATE OR REPLACE FUNCTION public.get_owner_id(_user_id uuid)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.profiles WHERE id = _user_id AND owner_id IS NOT NULL),
    _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "profiles_select_own_or_team" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR owner_id = auth.uid() OR id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- user_roles policies
CREATE POLICY "roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT DEFAULT '',
  buy_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_team_read" ON public.products FOR SELECT TO authenticated
USING (owner_id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "products_owner_write" ON public.products FOR ALL TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_team_all" ON public.customers FOR ALL TO authenticated
USING (owner_id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (owner_id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_owner_all" ON public.suppliers FOR ALL TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- Purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty INT NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_owner_all" ON public.purchases FOR ALL TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- Sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qty INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_team_all" ON public.sales FOR ALL TO authenticated
USING (owner_id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (owner_id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

-- Trigger: on sale insert, deduct stock
CREATE OR REPLACE FUNCTION public.handle_sale_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = stock - NEW.qty WHERE id = NEW.product_id;
  RETURN NEW;
END $$;
CREATE TRIGGER sale_stock_deduct AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_insert();

-- Trigger: on purchase insert, add stock
CREATE OR REPLACE FUNCTION public.handle_purchase_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = stock + NEW.qty WHERE id = NEW.product_id;
  RETURN NEW;
END $$;
CREATE TRIGGER purchase_stock_add AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.handle_purchase_insert();

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status sub_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  current_period_end TIMESTAMPTZ,
  last_receipt TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_owner_read" ON public.subscriptions FOR SELECT TO authenticated
USING (owner_id = public.get_owner_id(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "subs_owner_write" ON public.subscriptions FOR ALL TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- M-Pesa transactions
CREATE TABLE public.mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  phone TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status mpesa_status NOT NULL DEFAULT 'pending',
  receipt TEXT DEFAULT '',
  result_desc TEXT DEFAULT '',
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mpesa_transactions TO authenticated;
GRANT ALL ON public.mpesa_transactions TO service_role;
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mpesa_owner_read" ON public.mpesa_transactions FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- Handle new user: create profile + assign business_owner + start trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    COALESCE(NEW.raw_user_meta_data->>'business_name','')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'business_owner');
  INSERT INTO public.subscriptions (owner_id) VALUES (NEW.id);
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
