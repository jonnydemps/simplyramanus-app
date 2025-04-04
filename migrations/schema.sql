-- Create users table extension (handled by Supabase Auth)
-- This is just a reference for our schema design

-- Create profiles table to store additional user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create formulations table to store submitted formulations
CREATE TABLE formulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_review, completed, rejected
  original_file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  report_path TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, paid
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ingredients table to store master database of ingredients
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inci_name TEXT NOT NULL,
  cas_number TEXT,
  function TEXT,
  max_concentration DECIMAL,
  restrictions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(inci_name)
);

-- Create formulation_ingredients table to store ingredients in each formulation
CREATE TABLE formulation_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES ingredients(id) NOT NULL,
  concentration DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table for review comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table for generated reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL, -- compliant, non_compliant, partially_compliant
  summary TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table to track payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  formulation_id UUID REFERENCES formulations(id) NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  stripe_payment_id TEXT NOT NULL,
  status TEXT NOT NULL, -- succeeded, pending, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulation_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Formulations policies
CREATE POLICY "Users can view their own formulations" 
  ON formulations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own formulations" 
  ON formulations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own formulations" 
  ON formulations FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admin policies would be added for admin users
