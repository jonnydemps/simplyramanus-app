// Temporary content for src/app/admin/page.tsx
'use client';
import { useAuth } from '@/components/auth/AuthProvider'; // Optional: keep auth check

export default function AdminPageSimpleTest() {
   const { user, profile } = useAuth(); // Get auth state if needed

   console.log("--- Rendering SIMPLE Admin Page --- User:", user?.id, "Admin:", profile?.is_admin);

   return (
       <div style={{ padding: '50px', textAlign: 'center', background: 'lightgreen' }}>
           <h1>Admin Page Loaded!</h1>
           <p>If you see this green background, the redirect worked and this basic page rendered.</p>
           <p>User ID: {user?.id ?? 'Loading...'}</p>
           <p>Is Admin: {profile?.is_admin?.toString() ?? 'Loading...'}</p>
           <a href="/dashboard">Go to Dashboard</a><br/>
           <a href="/">Go Home</a>
       </div>
   );
}