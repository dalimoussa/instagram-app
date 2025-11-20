import LicenseUsageDashboard from '../components/LicenseUsageDashboard';

export default function Licenses() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor your account usage and manage Instagram connections
        </p>
      </div>

      {/* License Dashboard */}
      <LicenseUsageDashboard />
    </div>
  );
}
