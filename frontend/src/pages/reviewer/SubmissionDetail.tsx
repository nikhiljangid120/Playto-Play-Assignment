import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import client from '../../api/client';
import { KYCSubmission } from '../../types';

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  const { data: sub, isLoading } = useQuery<KYCSubmission>({
    queryKey: ['reviewer-detail', id],
    queryFn: async () => {
      const res = await client.get(`/reviews/${id}/`);
      return res.data;
    }
  });

  const transitionMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await client.post(`/reviews/${id}/transition/`, { status, notes });
      return res.data;
    },
    onSuccess: () => {
      navigate('/reviewer');
    },
    onError: (err: any) => {
      alert("Error: " + JSON.stringify(err.response?.data || err.message));
    }
  });

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;
  if (!sub) return <div>Not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Review Submission #{sub.id}</h1>
        <button onClick={() => navigate('/reviewer')} className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Queue
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Applicant Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and documents.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{sub.personal_name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email / Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{sub.personal_email} / {sub.personal_phone}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Business Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{sub.business_name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Expected Volume</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${sub.expected_monthly_volume}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Documents</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">PAN Card</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {sub.pan_document ? <a href={`http://localhost:8000${sub.pan_document}`} target="_blank" className="font-medium text-indigo-600 hover:text-indigo-500">Download</a> : 'N/A'}
                    </div>
                  </li>
                  <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">Aadhaar Card</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {sub.aadhaar_document ? <a href={`http://localhost:8000${sub.aadhaar_document}`} target="_blank" className="font-medium text-indigo-600 hover:text-indigo-500">Download</a> : 'N/A'}
                    </div>
                  </li>
                  <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">Bank Statement</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {sub.bank_statement ? <a href={`http://localhost:8000${sub.bank_statement}`} target="_blank" className="font-medium text-indigo-600 hover:text-indigo-500">Download</a> : 'N/A'}
                    </div>
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {sub.status === 'under_review' && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reviewer Actions</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Notes (required for rejection/more info)</label>
            <textarea
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="E.g. PAN document is blurry..."
            />
          </div>
          <div className="flex gap-4">
            <button onClick={() => transitionMutation.mutate('approved')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Approve
            </button>
            <button onClick={() => transitionMutation.mutate('more_info_requested')} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
              Request More Info
            </button>
            <button onClick={() => transitionMutation.mutate('rejected')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
