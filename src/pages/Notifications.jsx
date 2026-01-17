import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NotificationList from '../components/notifications/NotificationList';

export default function Notifications() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        setUser(await base44.auth.me());
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-gray-400">Veuillez vous connecter pour voir vos notifications</p>
      </div>
    );
  }

  return <NotificationList userEmail={user.email} />;
}