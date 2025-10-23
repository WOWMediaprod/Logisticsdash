import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Logistics Platform
            <span className="block text-2xl font-normal text-gray-600 mt-2">
              Phase S0 - Foundations
            </span>
          </h1>

          <p className="text-xl text-gray-700 mb-12 leading-relaxed">
            Production-ready logistics platform for container hires with Trip Pack QR,
            real-time tracking, Economic IQ, and tenant-scoped RAG AI.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              title="Container Management"
              description="Track containers with ISO-6346 validation and automated check digits"
              accent="bg-blue-100 text-blue-600"
            />
            <FeatureCard
              title="Live Tracking"
              description="Real-time location updates with geofenced status automation"
              accent="bg-green-100 text-green-600"
            />
            <FeatureCard
              title="Economic IQ"
              description="Revenue, cost, and margin analysis with predictive insights"
              accent="bg-purple-100 text-purple-600"
            />
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Development status</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Completed</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>PostgreSQL + PostGIS + pgvector setup</li>
                  <li>Docker environment with Redis &amp; Minio</li>
                  <li>NestJS backend with Prisma ORM</li>
                  <li>Complete database schema design</li>
                  <li>Next.js frontend foundation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Phase S1 highlights</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Job management dashboard</li>
                  <li>API endpoints &amp; database</li>
                  <li>Visual job cards with status tracking</li>
                  <li>Demo data (jobs, drivers, vehicles)</li>
                  <li>Trip Pack QR generation (in progress)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 hover:scale-105 transition-all inline-block shadow-lg"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/driver"
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 hover:scale-105 transition-all inline-block shadow-lg"
            >
              Driver Dashboard
            </Link>
            <Link
              href="/client"
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 hover:scale-105 transition-all inline-block shadow-lg"
            >
              Client Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  accent: string;
};

function FeatureCard({ title, description, accent }: FeatureCardProps) {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center mb-4 mx-auto font-semibold`}>
        {title.split(' ')[0]}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
