import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { KYCSubmission } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function KYCForm() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: kyc, isLoading } = useQuery<KYCSubmission>({
    queryKey: ['merchant-kyc'],
    queryFn: async () => {
      const res = await client.get('/kyc/');
      return res.data;
    }
  });

  const [formData, setFormData] = useState<Partial<KYCSubmission>>({});
  const [files, setFiles] = useState<{ pan?: File; aadhaar?: File; bank?: File }>({});

  useEffect(() => {
    if (kyc) {
      setFormData(kyc);
    }
  }, [kyc]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await client.put('/kyc/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-kyc'] });
      alert("Progress saved!");
    },
    onError: (err: any) => {
      alert("Error saving: " + JSON.stringify(err.response?.data || err.message));
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await client.post('/kyc/submit/');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-kyc'] });
      alert("Submitted for review!");
    },
    onError: (err: any) => {
      alert("Error submitting: " + JSON.stringify(err.response?.data || err.message));
    }
  });

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;

  const isReadOnly = !['draft', 'more_info_requested'].includes(kyc?.status || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if (formData[key as keyof KYCSubmission] !== null && formData[key as keyof KYCSubmission] !== undefined && typeof formData[key as keyof KYCSubmission] !== 'object') {
            data.append(key, formData[key as keyof KYCSubmission] as string);
        }
    });
    if (files.pan) data.append('pan_document', files.pan);
    if (files.aadhaar) data.append('aadhaar_document', files.aadhaar);
    if (files.bank) data.append('bank_statement', files.bank);
    
    updateMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md mt-10 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">KYC Submission</h1>
        <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
      </div>

      <div className="mb-4 p-4 rounded bg-blue-50 text-blue-800 border border-blue-200">
        Status: <strong>{kyc?.status.toUpperCase()}</strong>
      </div>
      
      {kyc?.reviewer_notes && (
        <div className="mb-4 p-4 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
          <strong>Reviewer Notes:</strong> {kyc.reviewer_notes}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Personal Name</label>
          <input disabled={isReadOnly} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" value={formData.personal_name || ''} onChange={e => setFormData({...formData, personal_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Personal Email</label>
          <input disabled={isReadOnly} type="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" value={formData.personal_email || ''} onChange={e => setFormData({...formData, personal_email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Personal Phone</label>
          <input disabled={isReadOnly} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" value={formData.personal_phone || ''} onChange={e => setFormData({...formData, personal_phone: e.target.value})} />
        </div>
        
        <hr className="my-6" />
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input disabled={isReadOnly} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" value={formData.business_name || ''} onChange={e => setFormData({...formData, business_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Type</label>
          <input disabled={isReadOnly} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" value={formData.business_type || ''} onChange={e => setFormData({...formData, business_type: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Expected Monthly Volume (USD)</label>
          <input disabled={isReadOnly} type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" value={formData.expected_monthly_volume || ''} onChange={e => setFormData({...formData, expected_monthly_volume: e.target.value})} />
        </div>

        <hr className="my-6" />

        <div>
          <label className="block text-sm font-medium text-gray-700">PAN Document (PDF/JPG/PNG max 5MB)</label>
          {kyc?.pan_document && <p className="text-sm text-green-600 mb-2">✓ Current file uploaded</p>}
          {!isReadOnly && <input type="file" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" onChange={e => setFiles({...files, pan: e.target.files?.[0]})} />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Aadhaar Document</label>
          {kyc?.aadhaar_document && <p className="text-sm text-green-600 mb-2">✓ Current file uploaded</p>}
          {!isReadOnly && <input type="file" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" onChange={e => setFiles({...files, aadhaar: e.target.files?.[0]})} />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Statement</label>
          {kyc?.bank_statement && <p className="text-sm text-green-600 mb-2">✓ Current file uploaded</p>}
          {!isReadOnly && <input type="file" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" onChange={e => setFiles({...files, bank: e.target.files?.[0]})} />}
        </div>

        {!isReadOnly && (
          <div className="flex gap-4 pt-4">
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">Save Progress</button>
            <button type="button" onClick={() => submitMutation.mutate()} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Submit for Review</button>
          </div>
        )}
      </form>
    </div>
  );
}
