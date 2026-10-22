'use client';

import V3TopicChart from '@/components/V3TopicChart';
import { useV3 } from './V3Provider';

export default function V3DashboardPage() {
  const { tests } = useV3();
  return <V3TopicChart tests={tests} />;
}
