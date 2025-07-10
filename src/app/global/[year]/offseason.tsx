"use client";

import { useRouter } from "next/navigation";

export default function OffseasonCheck({ year, checked }: { year: string; checked: boolean }) {
  const router = useRouter();
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    checked = e.target.checked;
    router.push(`/global/${e.target.checked ? year : `${year}-no`}`);
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleCheckboxChange}
    />
  );
}