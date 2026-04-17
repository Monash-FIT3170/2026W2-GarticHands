import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function PhaseLoadingWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <Skeleton height={32} width="40%" />
        <Skeleton count={4} style={{ marginTop: '0.75rem' }} />
      </div>
    );
  }

  return <>{children}</>;
}