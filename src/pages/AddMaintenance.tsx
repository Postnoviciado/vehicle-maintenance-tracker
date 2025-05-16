import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Wrench, ArrowLeft, Plus, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface MaintenanceFormData {
  vehicle_id: string;
  maintenance_date: string;
  performed_by: string;
  performed_at: string;
  current_mileage: number;
  maintenance_type: 'regular' | 'additional';
  update_mileage: boolean;
  notes: string;
  services: { description: string }[];
}

interface Vehicle {
  id: string;
  license_plate: string;
  details?: {
    current_mileage: number | null;
  };
}

const AddMaintenance: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromQuery = queryParams.get('vehicleId');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<MaintenanceFormData>({
    defaultValues: {
      vehicle_id: vehicleIdFromQuery || '',
      maintenance_date: new Date().toISOString().substring(0, 10),
      performed_by: '',
      performed_at: '',
      current_mileage: 0,
      maintenance_type: 'regular',
      update_mileage: true,
      notes: '',
      services: [{ description: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services"
  });

  const selectedVehicleId = watch('vehicle_id');
  const maintenanceType = watch('maintenance_type');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            id,
            license_plate,
            vehicle_details (current_mileage)
          `);

        if (error) throw error;

        const processedVehicles = data.map((vehicle: any) => ({
          id: vehicle.id,
          license_plate: vehicle.license_plate,
          details: vehicle.vehicle_details[0] || { current_mileage: null }
        }));

        setVehicles(processedVehicles);

        // If we have a vehicle ID and it exists in the fetched vehicles, pre-select it
        if (vehicleIdFromQuery) {
          const vehicle = processedVehicles.find(v => v.id === vehicleIdFromQuery);
          if (vehicle && vehicle.details?.current_mileage) {
            setValue('current_mileage', vehicle.details.current_mileage);
          }
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        toast.error('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [vehicleIdFromQuery, setValue]);

  useEffect(() => {
    // When vehicle selection changes, update mileage if available
    if (selectedVehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (selectedVehicle?.details?.current_mileage) {
        setValue('current_mileage', selectedVehicle.details.current_mileage);
      }
    }
  }, [selectedVehicleId, vehicles, setValue]);

  const onSubmit = async (data: MaintenanceFormData) => {
    if (!data.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }

    setSubmitting(true);

    try {
      // Insert maintenance record
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .insert([{
          vehicle_id: data.vehicle_id,
          maintenance_date: data.maintenance_date,
          performed_by: data.performed_by,
          performed_at: data.performed_at,
          current_mileage: data.current_mileage,
          maintenance_type: data.maintenance_type,
          update_mileage: data.update_mileage && data.maintenance_type === 'regular',
          notes: data.notes || null
        }])
        .select();

      if (maintenanceError) throw maintenanceError;
      if (!maintenanceData || maintenanceData.length === 0) throw new Error('Failed to create maintenance record');

      const maintenanceId = maintenanceData[0].id;

      // Insert maintenance services
      if (data.services && data.services.length > 0) {
        const servicesToInsert = data.services
          .filter(service => service.description.trim() !== '')
          .map(service => ({
            maintenance_id: maintenanceId,
            service_description: service.description
          }));

        if (servicesToInsert.length > 0) {
          const { error: servicesError } = await supabase
            .from('maintenance_services')
            .insert(servicesToInsert);

          if (servicesError) throw servicesError;
        }
      }

      // Update vehicle mileage if needed
      if (data.update_mileage && data.maintenance_type === 'regular') {
        const { error: updateError } = await supabase
          .from('vehicle_details')
          .update({ current_mileage: data.current_mileage })
          .eq('vehicle_id', data.vehicle_id);

        if (updateError) throw updateError;
      }

      toast.success('Maintenance record added successfully!');
      navigate(`/maintenance/${maintenanceId}`);
    } catch (error: any) {
      console.error('Error adding maintenance record:', error);
      toast.error(error.message || 'Failed to add maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-b-transparent border-blue-500 rounded-full animate-spin"></div>
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
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 mr-3 bg-blue-100 rounded-full">
            <Wrench size={24} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add Maintenance Record</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
                Vehicle*
              </label>
              <select
                id="vehicle_id"
                {...register('vehicle_id', { required: 'Vehicle is required' })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate}
                  </option>
                ))}
              </select>
              {errors.vehicle_id && (
                <p className="mt-1 text-sm text-red-600">{errors.vehicle_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="maintenance_date" className="block text-sm font-medium text-gray-700">
                Maintenance Date*
              </label>
              <input
                type="date"
                id="maintenance_date"
                {...register('maintenance_date', { required: 'Date is required' })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.maintenance_date && (
                <p className="mt-1 text-sm text-red-600">{errors.maintenance_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="performed_by" className="block text-sm font-medium text-gray-700">
                Performed By*
              </label>
              <input
                type="text"
                id="performed_by"
                {...register('performed_by', { required: 'This field is required' })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Name of person/company"
              />
              {errors.performed_by && (
                <p className="mt-1 text-sm text-red-600">{errors.performed_by.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="performed_at" className="block text-sm font-medium text-gray-700">
                Performed At*
              </label>
              <input
                type="text"
                id="performed_at"
                {...register('performed_at', { required: 'This field is required' })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Location/Workshop"
              />
              {errors.performed_at && (
                <p className="mt-1 text-sm text-red-600">{errors.performed_at.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700">
                Current Mileage (km)*
              </label>
              <input
                type="number"
                id="current_mileage"
                {...register('current_mileage', { 
                  required: 'Mileage is required',
                  min: { value: 0, message: 'Mileage cannot be negative' },
                  valueAsNumber: true
                })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.current_mileage && (
                <p className="mt-1 text-sm text-red-600">{errors.current_mileage.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700">
                Maintenance Type*
              </label>
              <select
                id="maintenance_type"
                {...register('maintenance_type', { required: 'Type is required' })}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="regular">Regular (Every 5,000 km)</option>
                <option value="additional">Additional</option>
              </select>
              {errors.maintenance_type && (
                <p className="mt-1 text-sm text-red-600">{errors.maintenance_type.message}</p>
              )}
            </div>
          </div>

          {maintenanceType === 'regular' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="update_mileage"
                {...register('update_mileage')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="update_mileage" className="block ml-2 text-sm text-gray-700">
                Update vehicle's current mileage with this value
              </label>
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Services Performed
            </label>
            <div className="mt-1 space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    {...register(`services.${index}.description`)}
                    placeholder="Service description"
                    className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ description: '' })}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                <Plus size={16} className="mr-1" />
                Add Service
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Any additional notes about this maintenance"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Maintenance Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaintenance;