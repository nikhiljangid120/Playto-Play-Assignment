import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import type { QueueItem, DashboardMetrics } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { logout } = useAuth();
  
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['reviewer-metrics'],
    queryFn: async () => {
      const res = await client.get('/reviews/metrics/');
      return res.data;
    }
  });

  const { data: queue, isLoading } = useQuery<QueueItem[]>({
    queryKey: ['reviewer-queue'],
    queryFn: async () => {
      const res = await client.get('/reviews/');
      return res.data;
    }
  });

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h1>
        <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">In Queue</h3>
          <p className="text-3xl font-bold text-gray-900">{metrics?.queue_count ?? '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Avg Time in Queue</h3>
          <p className="text-3xl font-bold text-gray-900">{metrics?.avg_time_in_queue || '0'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Approval Rate (7d)</h3>
          <p className="text-3xl font-bold text-gray-900">{metrics?.approval_rate_7d ?? '-'}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Risk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>}
            {queue?.length === 0 && <tr><td colSpan={5} className="px-6 py-4 text-center">Queue is empty</td></tr>}
            {queue?.map((item) => (
              <tr key={item.id} className={item.at_risk ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.merchant_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {item.at_risk ? (
                     <span className="text-red-600 font-bold">⚠️ At Risk</span>
                  ) : (
                     <span className="text-green-600">Healthy</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/reviewer/submission/${item.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
