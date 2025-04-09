-- Create tables for SimplyRA application

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);

-- Create formulations table
CREATE TABLE IF NOT EXISTS formulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'rejected')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  original_file_name TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  inci_name TEXT NOT NULL,
  cas_number TEXT,
  function TEXT,
  concentration DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own formulations"
  ON formulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own formulations"
  ON formulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own formulations"
  ON formulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view ingredients in their formulations"
  ON ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM formulations
    WHERE formulations.id = ingredients.formulation_id
    AND formulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can view reports for their formulations"
  ON reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM formulations
    WHERE formulations.id = reports.formulation_id
    AND formulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can view comments on their formulations"
  ON comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM formulations
    WHERE formulations.id = comments.formulation_id
    AND formulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert comments on their formulations"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can view all formulations"
  ON formulations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can update all formulations"
  ON formulations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can view all ingredients"
  ON ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can insert reports"
  ON reports FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));
