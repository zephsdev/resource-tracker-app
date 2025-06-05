import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Resource Tracker Dashboard</h1>
      <ul className="space-y-2">
        <li><Link href="/resources" className="text-blue-600 underline">Manage Resources</Link></li>
        <li><Link href="/projects" className="text-blue-600 underline">Manage Projects</Link></li>
        <li><Link href="/allocations" className="text-blue-600 underline">View Allocations</Link></li>
      </ul>
    </main>
  );
}
