# SimplyRA - Regulatory Affairs Simplified

SimplyRA is a web application for regulatory affairs specialists to review cosmetic formulations for Australia and New Zealand compliance. The platform allows customers to submit formulations in Excel format, which are then reviewed by specialists who generate compliance reports.

## Features

- User authentication with Supabase
- Secure file upload for Excel formulations
- Ingredient extraction and validation
- Payment processing with Stripe
- Admin review interface
- Customer dashboard for tracking submissions
- Compliance reporting system
- Comment system for communication

## Tech Stack

- Next.js with TypeScript
- Tailwind CSS for styling
- Supabase for authentication and database
- Stripe for payment processing
- XLSX for Excel file parsing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v7 or higher)
- Supabase account
- Stripe account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/simplyra.git
cd simplyra
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

4. Set up the database
Run the SQL schema in the `migrations/schema.sql` file in your Supabase project.

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application can be deployed to any hosting platform that supports Next.js applications, such as Vercel, Netlify, or AWS.

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy the application

## Project Structure

- `src/app/` - Next.js pages
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and API clients
- `migrations/` - Database migration files
- `public/` - Static assets

## License

This project is licensed under the MIT License - see the LICENSE file for details.
