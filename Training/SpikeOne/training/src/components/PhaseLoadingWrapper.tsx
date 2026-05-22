import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function PhaseLoadingWrapper({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/message')
      .then(res => res.json())
      .then(data => {
        setMessage(data.message)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch:', err)
        setLoading(false)
      })
    // const timer = setTimeout(() => setLoading(false), 900);
    // return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      
      <div style={{ padding: '1rem' }}>
        <Skeleton height={32} width="40%" />
        <Skeleton count={4} style={{ marginTop: '0.75rem' }} />
        {message && <p className="mb-2 text-gray-600 italic">{message}</p>}
      </div>
    );
  }

  return <>{children}</>;
}