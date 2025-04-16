// Temporary content for src/app/admin/page.tsx
'use client';
import { useAuth } from '@/components/auth/AuthProvider'; // Optional, just to log user

export default function AdminPageSimpleTest() {
   const { user, isLoading } = useAuth(); // Get user and loading state

   // Log when this component actually mounts and renders
   console.log("--- Rendering SIMPLE Admin Page --- isLoading:", isLoading, "User:", user?.id);

   if (isLoading) {
       return <div>Loading Admin Area...</div> // Show loading if auth still resolving
   }

   return (
       <div style={{ padding: '50px', textAlign: 'center', background: 'lightgreen', color: 'black', minHeight: '100vh' }}>
           <h1>Admin Page Loaded Successfully!</h1>
           <p>If you see this green background, the redirect worked and this basic page rendered.</p>
           <p>User ID: {user?.id ?? 'No user found'}</p>
           <p>(You can now restore the original admin page content)</p>
           <br />
           <a href="/dashboard" style={{color: 'blue', textDecoration: 'underline'}}>Go to Dashboard</a><br/>
           <a href="/" style={{color: 'blue', textDecoration: 'underline'}}>Go Home</a>
       </div>
   );
}