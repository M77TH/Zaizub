'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/editor');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] text-gray-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mr-3" />
      กำลังเปลี่ยนเส้นทางไปที่ห้องตัดต่อ...
    </div>
  );
}