import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Wrench, 
  ArrowLeft, 
  Calendar, 
  User, 
  MapPin, 
  Gauge, 
  FileText, 
  CheckSquare,
  Trash,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  vehicle: {
    license_plate: string;
  };
  maintenance_date: string;
  performed_by: string;
  performed_at: string;
  current_mileage: number;
  maintenance_type: 'regular' | 'additional';
  update_mileage: boolean;
  notes: string | null;
  created_at: string;
  services: {
    id: string;
    service_description: string;
  }[];
}

const MaintenanceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      if (!id) return;
      
      try {
        // Fetch maintenance record
        const { data, error } = await supabase
          .from('maintenance_records')
          .select(`
            id,
            vehicle_id,
            vehicles (license_plate),
            maintenance_date,
            performed_by,
            performed_at,
            current_mileage,
            maintenance_type,
            update_mileage,
            notes,
            created_at
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('maintenance_services')
          .select('id, service_description')
          .eq('maintenance_id', id);

        if (servicesError) throw servicesError;

        // Process data
        const processedRecord: MaintenanceRecord = {
          ...data,
          vehicle: data.vehicles,
          services: servicesData || []
        };

        setRecord(processedRecord);
      } catch (error) {
        console.error('Error fetching maintenance details:', error);
        setError('Failed to load maintenance record');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceData();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !record) return;
    
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Maintenance record deleted successfully');
      navigate(`/vehicles/${record.vehicle_id}`);
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      toast.error('Failed to delete maintenance record');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-b-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-800">{error || 'Maintenance record not found'}</p>
        <Link 
          to="/maintenance" 
          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Maintenance
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center mb-4 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back
      </button>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="p-3 mr-4 text-blue-600 bg-blue-100 rounded-full">
              <Wrench size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Maintenance Details
              </h1>
              <Link 
                to={`/vehicles/${record.vehicle_id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {record.vehicle.license_plate}
              </Link>
            </div>
          </div>
          <div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash size={16} className="mr-1" />
              Delete
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar size={20} className="mt-1 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Maintenance Date</p>
                  <p className="font-medium">{format(new Date(record.maintenance_date), 'PPPP')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <User size={20} className="mt-1 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Performed By</p>
                  <p className="font-medium">{record.performed_by}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin size={20} className="mt-1 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Performed At</p>
                  <p className="font-medium">{record.performed_at}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Gauge size={20} className="mt-1 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Mileage</p>
                  <p className="font-medium">{record.current_mileage.toLocaleString()} km</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Wrench size={20} className="mt-1 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Maintenance Type</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.maintenance_type === 'regular' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.maintenance_type === 'regular' ? 'Regular' : 'Additional'}
                    </span>
                    {record.maintenance_type === 'regular' && (
                      <span className="ml-2 text-sm text-gray-500">
                        Next at {(record.current_mileage + 5000).toLocaleString()} km
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {record.update_mileage && (
                <div className="flex items-start">
                  <CheckSquare size={20} className="mt-1 mr-3 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Mileage Updated</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Services Performed</h2>
            {record.services.length === 0 ? (
              <p className="text-gray-500">No services recorded</p>
            ) : (
              <ul className="pl-5 space-y-2 list-disc">
                {record.services.map((service) => (
                  <li key={service.id} className="text-gray-700">
                    {service.service_description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {record.notes && (
            <div className="mt-6 space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-line text-gray-700">{record.notes}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Record created on {format(new Date(record.created_at), 'PPpp')}</p>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setDeleteConfirm(false)}></div>
            
            <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Maintenance Record</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this maintenance record? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDetails;