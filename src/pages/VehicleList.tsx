import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Car, Plus, Search, AlertTriangle } from 'lucide-react';
import { format, isWithinInterval, addDays } from 'date-fns';

interface Vehicle {
  id: string;
  license_plate: string;
  manufacture_year: number;
  details: {
    soat_expiry: string | null;
    tech_inspection_date: string | null;
    next_tech_inspection_date: string | null;
    fire_extinguisher_renewal: string | null;
    current_mileage: number | null;
    tire_pressure: string | null;
    updated_at: string;
  };
}

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            id,
            license_plate,
            manufacture_year,
            vehicle_details (
              soat_expiry,
              tech_inspection_date,
              next_tech_inspection_date,
              fire_extinguisher_renewal,
              current_mileage,
              tire_pressure,
              updated_at
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Process vehicle data
        const processedVehicles = data.map((vehicle: any) => ({
          id: vehicle.id,
          license_plate: vehicle.license_plate,
          manufacture_year: vehicle.manufacture_year,
          details: vehicle.vehicle_details[0] || {
            soat_expiry: null,
            tech_inspection_date: null,
            next_tech_inspection_date: null,
            fire_extinguisher_renewal: null,
            current_mileage: null,
            tire_pressure: null,
            updated_at: null
          },
        }));

        setVehicles(processedVehicles);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError('Failed to load vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasUpcomingExpiry = (vehicle: Vehicle) => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    // Check if any of the dates are within 30 days
    const dates = [
      vehicle.details.soat_expiry,
      vehicle.details.next_tech_inspection_date,
      vehicle.details.fire_extinguisher_renewal
    ].filter(Boolean) as string[];

    return dates.some(dateStr => {
      const date = new Date(dateStr);
      return isWithinInterval(date, { start: today, end: thirtyDaysFromNow });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-b-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-1 text-gray-600">Manage your vehicles and their maintenance</p>
        </div>
        <Link
          to="/vehicles/add"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={18} className="mr-2" />
          Add Vehicle
        </Link>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-2 pl-10 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search vehicles by license plate..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow">
          <Car size={48} className="mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-gray-500">
            {vehicles.length === 0
              ? "You haven't added any vehicles yet."
              : "No vehicles match your search."}
          </p>
          {vehicles.length === 0 && (
            <Link
              to="/vehicles/add"
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Add Your First Vehicle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              to={`/vehicles/${vehicle.id}`}
              className="overflow-hidden transition-transform transform bg-white rounded-lg shadow hover:scale-102"
            >
              <div className="relative p-6">
                {hasUpcomingExpiry(vehicle) && (
                  <div className="absolute top-2 right-2 flex items-center text-orange-500">
                    <AlertTriangle size={16} className="mr-1" />
                    <span className="text-xs font-medium">Upcoming expiry</span>
                  </div>
                )}
                <div className="flex items-center mb-4">
                  <div className="p-3 mr-4 text-blue-600 bg-blue-100 rounded-full">
                    <Car size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.license_plate}</h3>
                    <p className="text-sm text-gray-500">{vehicle.manufacture_year}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {vehicle.details.current_mileage && (
                    <p>
                      <span className="font-medium">Mileage:</span>{' '}
                      {vehicle.details.current_mileage.toLocaleString()} km
                    </p>
                  )}
                  {vehicle.details.soat_expiry && (
                    <p>
                      <span className="font-medium">SOAT:</span>{' '}
                      {format(new Date(vehicle.details.soat_expiry), 'PP')}
                    </p>
                  )}
                  {vehicle.details.next_tech_inspection_date && (
                    <p>
                      <span className="font-medium">Tech Inspection:</span>{' '}
                      {format(new Date(vehicle.details.next_tech_inspection_date), 'PP')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;