import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Car, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface VehicleFormData {
  license_plate: string;
  manufacture_year: number;
  soat_expiry: string;
  tech_inspection_date: string;
  next_tech_inspection_date: string;
  fire_extinguisher_renewal: string;
  current_mileage: number;
  tire_pressure: string;
}

const AddVehicle: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<VehicleFormData>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: VehicleFormData) => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Insert vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([{
          license_plate: data.license_plate.toUpperCase(),
          manufacture_year: data.manufacture_year,
          user_id: userId,
        }])
        .select();

      if (vehicleError) throw vehicleError;
      if (!vehicleData || vehicleData.length === 0) throw new Error('Failed to create vehicle');

      const vehicleId = vehicleData[0].id;

      // Insert vehicle details
      const { error: detailsError } = await supabase
        .from('vehicle_details')
        .insert([{
          vehicle_id: vehicleId,
          soat_expiry: data.soat_expiry || null,
          tech_inspection_date: data.tech_inspection_date || null,
          next_tech_inspection_date: data.next_tech_inspection_date || null,
          fire_extinguisher_renewal: data.fire_extinguisher_renewal || null,
          current_mileage: data.current_mileage || null,
          tire_pressure: data.tire_pressure || null,
        }]);

      if (detailsError) throw detailsError;

      toast.success('Vehicle added successfully!');
      navigate('/vehicles');
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast.error(error.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => navigate('/vehicles')}
        className="flex items-center mb-4 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Vehicles
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 mr-3 bg-blue-100 rounded-full">
            <Car size={24} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Fixed characteristics */}
            <div>
              <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                License Plate Number*
              </label>
              <input
                type="text"
                id="license_plate"
                {...register('license_plate', { required: 'License plate is required' })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ABC-123"
              />
              {errors.license_plate && (
                <p className="mt-1 text-sm text-red-600">{errors.license_plate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="manufacture_year" className="block text-sm font-medium text-gray-700">
                Manufacture Year*
              </label>
              <input
                type="number"
                id="manufacture_year"
                {...register('manufacture_year', { 
                  required: 'Manufacture year is required',
                  min: { value: 1900, message: 'Year must be after 1900' },
                  max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="2020"
              />
              {errors.manufacture_year && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacture_year.message}</p>
              )}
            </div>

            {/* Variable characteristics */}
            <div>
              <label htmlFor="soat_expiry" className="block text-sm font-medium text-gray-700">
                SOAT Expiry Date
              </label>
              <input
                type="date"
                id="soat_expiry"
                {...register('soat_expiry')}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="tech_inspection_date" className="block text-sm font-medium text-gray-700">
                Last Technical Inspection Date
              </label>
              <input
                type="date"
                id="tech_inspection_date"
                {...register('tech_inspection_date')}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="next_tech_inspection_date" className="block text-sm font-medium text-gray-700">
                Next Technical Inspection Date
              </label>
              <input
                type="date"
                id="next_tech_inspection_date"
                {...register('next_tech_inspection_date')}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="fire_extinguisher_renewal" className="block text-sm font-medium text-gray-700">
                Fire Extinguisher Renewal Date
              </label>
              <input
                type="date"
                id="fire_extinguisher_renewal"
                {...register('fire_extinguisher_renewal')}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700">
                Current Mileage (km)
              </label>
              <input
                type="number"
                id="current_mileage"
                {...register('current_mileage', { 
                  min: { value: 0, message: 'Mileage cannot be negative' } 
                })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="5000"
              />
              {errors.current_mileage && (
                <p className="mt-1 text-sm text-red-600">{errors.current_mileage.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="tire_pressure" className="block text-sm font-medium text-gray-700">
                Tire Pressure
              </label>
              <input
                type="text"
                id="tire_pressure"
                {...register('tire_pressure')}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., 32 PSI (front), 34 PSI (rear)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Add Vehicle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;