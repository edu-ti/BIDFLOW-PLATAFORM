export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          BidFlow Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Enterprise-grade bidding and auction management system
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Auctions</h2>
            <p className="text-gray-600">Manage auctions and bids</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-gray-600">Real-time analytics and insights</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-gray-600">User management and roles</p>
          </div>
        </div>
      </div>
    </main>
  );
}