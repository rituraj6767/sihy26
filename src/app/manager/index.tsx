import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function ManagerIndex() {
  return <Redirect href={'/manager/alerts' as any} />;
}
