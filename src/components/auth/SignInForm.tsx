const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }

    // Successfully signed in. AuthProvider's onAuthStateChange will handle
    // fetching the profile and updating the state. We don't need to do
    // the admin check or redirect from here anymore.
    console.log("SignInForm: Sign in API call successful for user:", data?.user?.id);

    // NO REDIRECTS HERE - let AuthRedirector handle it based on state

  } catch (err: unknown) {
    let message = 'An error occurred during sign in. Please check your credentials.';
    if (typeof err === 'object' && err !== null && 'message' in err) {
       message = err.message as string;
    } else if (err instanceof Error) {
       message = err.message;
    }
    console.error("SignInForm: Sign in catch block:", err);
    setError(message);
    setLoading(false); // Set loading false only on error here
  }
  // Don't set loading false on success, AuthProvider handles loading state
};