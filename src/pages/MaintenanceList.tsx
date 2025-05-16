import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wrench, Plus, Search, Calendar, Car } from 'lucide-react';
import { format } from 'date-fns';

interface Maintenance {
  id: string;
  maintenance_date: string;
  performed_by: string;
  maintenance_type: 'regular' | 'additional';
  current_mileage: number;
  vehicle: {
    id: string;
    license_plate: string;
  };
}

const MaintenanceList: React.FC = () => {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenanceRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance_records')
          .select(`
            id,
            maintenance_date,
            performed_by,
            maintenance_type,
            current_mileage,
            vehicles (
              id,
              license_plate
            )
          `)
          .order('maintenance_date', { ascending: false });

        if (error) throw error;

        // Process maintenance data
        const processedRecords = data.map((record: any) => ({
          ...record,
          vehicle: record.vehicles
        }));

        setRecords(processedRecords);
      } catch (error) {
        console.error('Error fetching maintenance records:', error);
        setError('Failed to load maintenance records');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceRecords();
  }, []);

  const filteredRecords = records.filter((record) =>
    record.vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.performed_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Records</h1>
          <p className="mt-1 text-gray-600">View and manage all maintenance activities</p>
        </div>
        <Link
          to="/maintenance/add"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={18} className="mr-2" />
          Add Maintenance
        </Link>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-2 pl-10 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search by license plate or who performed the maintenance..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow">
          <Wrench size={48} className="mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No maintenance records found</h3>
          <p className="mt-1 text-gray-500">
            {records.length === 0
              ? "You haven't added any maintenance records yet."
              : "No records match your search."}
          </p>
          {records.length === 0 && (
            <Link
              to="/maintenance/add"
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Add Your First Record
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <li key={record.id}>
                <Link to={`/maintenance/${record.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 mr-3 bg-blue-100 rounded-full">
                          <Wrench size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.vehicle.license_plate}
                          </p>
                          <p className="text-sm text-gray-500">
                            By {record.performed_by}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={16} className="mr-1" />
                          {format(new Date(record.maintenance_date), 'PP')}
                        </div>
                        <span
                          className={`px-2 py-1 mt-1 text-xs font-medium rounded-full ${
                            record.maintenance_type === 'regular'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {record.maintenance_type === 'regular' ? 'Regular' : 'Additional'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <Car size={16} className="mr-1 text-gray-400" />
                          {record.current_mileage.toLocaleString()} km
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;