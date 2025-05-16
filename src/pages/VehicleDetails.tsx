import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Car, 
  Calendar, 
  Gauge, 
  ArrowLeft, 
  Edit, 
  Trash, 
  AlertTriangle, 
  Clock, 
  FileText,
  Plus,
  Wrench
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  license_plate: string;
  manufacture_year: number;
  details: {
    id: string;
    soat_expiry: string | null;
    tech_inspection_date: string | null;
    next_tech_inspection_date: string | null;
    fire_extinguisher_renewal: string | null;
    current_mileage: number | null;
    tire_pressure: string | null;
    updated_at: string;
  };
}

interface Maintenance {
  id: string;
  maintenance_date: string;
  performed_by: string;
  maintenance_type: 'regular' | 'additional';
  current_mileage: number;
}

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!id) return;
      
      try {
        // Fetch vehicle data
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select(`
            id,
            license_plate,
            manufacture_year,
            vehicle_details (
              id,
              soat_expiry,
              tech_inspection_date,
              next_tech_inspection_date,
              fire_extinguisher_renewal,
              current_mileage,
              tire_pressure,
              updated_at
            )
          `)
          .eq('id', id)
          .single();

        if (vehicleError) throw vehicleError;

        // Process vehicle data
        const processedVehicle: Vehicle = {
          id: vehicleData.id,
          license_plate: vehicleData.license_plate,
          manufacture_year: vehicleData.manufacture_year,
          details: vehicleData.vehicle_details[0] || {
            id: '',
            soat_expiry: null,
            tech_inspection_date: null,
            next_tech_inspection_date: null,
            fire_extinguisher_renewal: null,
            current_mileage: null,
            tire_pressure: null,
            updated_at: '',
          },
        };

        setVehicle(processedVehicle);

        // Fetch maintenance records
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance_records')
          .select('id, maintenance_date, performed_by, maintenance_type, current_mileage')
          .eq('vehicle_id', id)
          .order('maintenance_date', { ascending: false });

        if (maintenanceError) throw maintenanceError;

        setMaintenanceRecords(maintenanceData || []);
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
        setError('Failed to load vehicle details');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Vehicle deleted successfully');
      navigate('/vehicles');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    
    const targetDate = new Date(dateString);
    const today = new Date();
    return differenceInDays(targetDate, today);
  };

  const getStatusColor = (daysLeft: number | null) => {
    if (daysLeft === null) return 'text-gray-500';
    if (daysLeft < 0) return 'text-red-600';
    if (daysLeft <= 7) return 'text-orange-500';
    if (daysLeft <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDateStatus = (label: string, dateString: string | null) => {
    if (!dateString) return null;
    
    const daysLeft = getDaysUntil(dateString);
    const statusColor = getStatusColor(daysLeft);
    
    return (
      <div className="flex items-center">
        <Calendar size={18} className="mr-2 text-gray-500" />
        <div>
          <span className="text-gray-700">{label}: </span>
          <span className="font-medium">{format(new Date(dateString), 'PP')}</span>
          {daysLeft !== null && (
            <span className={`ml-2 text-sm ${statusColor}`}>
              {daysLeft < 0 
                ? `Expired ${Math.abs(daysLeft)} days ago` 
                : daysLeft === 0 
                  ? 'Today!'
                  : `${daysLeft} days left`}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-b-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-800">{error || 'Vehicle not found'}</p>
        <Link 
          to="/vehicles" 
          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Vehicles
        </Link>
      </div>
    );
  }

  const nextMileageMaintenance = vehicle.details.current_mileage && maintenanceRecords.length > 0
    ? maintenanceRecords
        .filter(record => record.maintenance_type === 'regular')
        .map(record => record.current_mileage + 5000)
        .sort((a, b) => a - b)
        .find(mileage => mileage > vehicle.details.current_mileage!)
    : null;

  return (
    <div>
      <button 
        onClick={() => navigate('/vehicles')}
        className="flex items-center mb-4 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Vehicles
      </button>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="p-3 mr-4 text-blue-600 bg-blue-100 rounded-full">
              <Car size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.license_plate}</h1>
              <p className="text-gray-600">Year: {vehicle.manufacture_year}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/maintenance/add?vehicleId=${vehicle.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus size={16} className="mr-1" />
              Add Maintenance
            </Link>
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
          <h2 className="mb-4 text-xl font-bold text-gray-900">Vehicle Details</h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="mb-3 text-lg font-medium text-gray-900">Current Status</h3>
              <div className="space-y-3">
                {vehicle.details.current_mileage !== null && (
                  <div className="flex items-center">
                    <Gauge size={18} className="mr-2 text-gray-500" />
                    <div>
                      <span className="text-gray-700">Current Mileage: </span>
                      <span className="font-medium">{vehicle.details.current_mileage.toLocaleString()} km</span>
                      {nextMileageMaintenance && (
                        <span className="ml-2 text-sm text-blue-600">
                          Next maintenance at {nextMileageMaintenance.toLocaleString()} km
                          ({(nextMileageMaintenance - vehicle.details.current_mileage).toLocaleString()} km left)
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {vehicle.details.tire_pressure && (
                  <div className="flex items-center">
                    <AlertTriangle size={18} className="mr-2 text-gray-500" />
                    <div>
                      <span className="text-gray-700">Tire Pressure: </span>
                      <span className="font-medium">{vehicle.details.tire_pressure}</span>
                    </div>
                  </div>
                )}
                
                {vehicle.details.updated_at && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    Last updated: {format(new Date(vehicle.details.updated_at), 'PPpp')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="mb-3 text-lg font-medium text-gray-900">Important Dates</h3>
              <div className="space-y-3">
                {getDateStatus('SOAT Expiry', vehicle.details.soat_expiry)}
                {getDateStatus('Technical Inspection', vehicle.details.next_tech_inspection_date)}
                {getDateStatus('Fire Extinguisher Renewal', vehicle.details.fire_extinguisher_renewal)}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Maintenance History</h2>
              <Link
                to={`/maintenance/add?vehicleId=${vehicle.id}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} className="mr-1" />
                Add Record
              </Link>
            </div>
            
            {maintenanceRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <Wrench size={48} className="mb-2 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">No maintenance records yet</h3>
                <p className="mt-1 text-gray-500">
                  Add your first maintenance record to start tracking
                </p>
                <Link
                  to={`/maintenance/add?vehicleId=${vehicle.id}`}
                  className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Maintenance Record
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Performed By
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Mileage
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {maintenanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(record.maintenance_date), 'PP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.maintenance_type === 'regular' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {record.maintenance_type === 'regular' ? 'Regular' : 'Additional'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.performed_by}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.current_mileage.toLocaleString()} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          <Link to={`/maintenance/${record.id}`} className="hover:text-blue-800">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Vehicle</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this vehicle? This action cannot be undone.
                      All maintenance records associated with this vehicle will also be deleted.
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

export default VehicleDetails;