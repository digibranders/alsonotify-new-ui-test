'use client';

// Root page - redirect to login (middleware handles token check and redirects)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Middleware will handle redirect based on token
    // If no token, show login page
    router.replace('/login');
  }, [router]);

  return null;
}
