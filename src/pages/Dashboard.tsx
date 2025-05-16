import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Car, AlertTriangle, Calendar, Info, Wrench } from 'lucide-react';
import { format, addDays, isPast, isWithinInterval } from 'date-fns';

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
  };
}

interface Reminder {
  id: string;
  vehicle_id: string;
  license_plate: string;
  type: 'soat' | 'tech' | 'mileage' | 'extinguisher';
  date: string;
  daysLeft: number;
  message: string;
}

const Dashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicles with their details
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select(`
            id,
            license_plate,
            manufacture_year,
            vehicle_details!inner (
              soat_expiry,
              tech_inspection_date,
              next_tech_inspection_date,
              fire_extinguisher_renewal,
              current_mileage
            )
          `);

        if (vehiclesError) throw vehiclesError;

        // Process vehicles data
        const processedVehicles = vehiclesData.map((vehicle: any) => ({
          id: vehicle.id,
          license_plate: vehicle.license_plate,
          manufacture_year: vehicle.manufacture_year,
          details: vehicle.vehicle_details[0] || {
            soat_expiry: null,
            tech_inspection_date: null,
            next_tech_inspection_date: null,
            fire_extinguisher_renewal: null,
            current_mileage: null,
          },
        }));

        setVehicles(processedVehicles);

        // Generate reminders
        const newReminders: Reminder[] = [];
        const today = new Date();

        for (const vehicle of processedVehicles) {
          // SOAT expiry reminder
          if (vehicle.details.soat_expiry) {
            const expiryDate = new Date(vehicle.details.soat_expiry);
            const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 30 && daysLeft >= -5) {
              newReminders.push({
                id: `soat-${vehicle.id}`,
                vehicle_id: vehicle.id,
                license_plate: vehicle.license_plate,
                type: 'soat',
                date: vehicle.details.soat_expiry,
                daysLeft,
                message: daysLeft < 0 
                  ? `SOAT expired ${Math.abs(daysLeft)} days ago!`
                  : `SOAT expires in ${daysLeft} days`,
              });
            }
          }

          // Technical inspection reminder
          if (vehicle.details.next_tech_inspection_date) {
            const inspectionDate = new Date(vehicle.details.next_tech_inspection_date);
            const daysLeft = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 30 && daysLeft >= -5) {
              newReminders.push({
                id: `tech-${vehicle.id}`,
                vehicle_id: vehicle.id,
                license_plate: vehicle.license_plate,
                type: 'tech',
                date: vehicle.details.next_tech_inspection_date,
                daysLeft,
                message: daysLeft < 0 
                  ? `Technical inspection expired ${Math.abs(daysLeft)} days ago!`
                  : `Technical inspection due in ${daysLeft} days`,
              });
            }
          }

          // Fire extinguisher reminder
          if (vehicle.details.fire_extinguisher_renewal) {
            const renewalDate = new Date(vehicle.details.fire_extinguisher_renewal);
            const daysLeft = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 30 && daysLeft >= -5) {
              newReminders.push({
                id: `extinguisher-${vehicle.id}`,
                vehicle_id: vehicle.id,
                license_plate: vehicle.license_plate,
                type: 'extinguisher',
                date: vehicle.details.fire_extinguisher_renewal,
                daysLeft,
                message: daysLeft < 0 
                  ? `Fire extinguisher expired ${Math.abs(daysLeft)} days ago!`
                  : `Fire extinguisher renewal due in ${daysLeft} days`,
              });
            }
          }

          // Mileage reminder (if we have maintenance records)
          if (vehicle.details.current_mileage) {
            const maintenanceResult = await supabase
              .from('maintenance_records')
              .select('*')
              .eq('vehicle_id', vehicle.id)
              .eq('maintenance_type', 'regular')
              .order('maintenance_date', { ascending: false })
              .limit(1);

            const maintenanceData = maintenanceResult.data;

            if (maintenanceData && maintenanceData.length > 0) {
              const lastMaintenance = maintenanceData[0];
              const nextMileage = lastMaintenance.current_mileage + 5000;
              const mileageLeft = nextMileage - (vehicle.details.current_mileage || 0);
              
              if (mileageLeft <= 500) {
                newReminders.push({
                  id: `mileage-${vehicle.id}`,
                  vehicle_id: vehicle.id,
                  license_plate: vehicle.license_plate,
                  type: 'mileage',
                  date: '', // No specific date
                  daysLeft: 0, // Not day-based
                  message: mileageLeft <= 0 
                    ? `Maintenance overdue by ${Math.abs(mileageLeft)} km`
                    : `Maintenance due in ${mileageLeft} km`,
                });
              }
            }
          }
        }

        // Sort reminders by urgency (negative days first, then ascending)
        newReminders.sort((a, b) => {
          if (a.daysLeft < 0 && b.daysLeft >= 0) return -1;
          if (b.daysLeft < 0 && a.daysLeft >= 0) return 1;
          return a.daysLeft - b.daysLeft;
        });

        setReminders(newReminders);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderRemindersSection = () => {
    if (reminders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow">
          <Info size={48} className="mb-2 text-blue-500" />
          <h3 className="text-lg font-medium">No upcoming reminders</h3>
          <p className="text-gray-500">All your vehicles are up to date.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reminders.map((reminder) => (
          <Link
            key={reminder.id}
            to={`/vehicles/${reminder.vehicle_id}`}
            className="block p-4 transition-transform transform bg-white rounded-lg shadow hover:scale-101"
          >
            <div className="flex items-start">
              <div className={`p-2 mr-4 rounded-full ${getReminderColor(reminder.daysLeft)}`}>
                {getReminderIcon(reminder.type)}
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-medium">
                  {reminder.license_plate}
                </h3>
                <p className={`${reminder.daysLeft < 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                  {reminder.message}
                </p>
                {reminder.date && (
                  <p className="text-sm text-gray-500">
                    {format(new Date(reminder.date), 'PP')}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'soat':
        return <Calendar size={24} className="text-white" />;
      case 'tech':
        return <Wrench size={24} className="text-white" />;
      case 'mileage':
        return <Car size={24} className="text-white" />;
      case 'extinguisher':
        return <AlertTriangle size={24} className="text-white" />;
      default:
        return <Info size={24} className="text-white" />;
    }
  };

  const getReminderColor = (daysLeft: number) => {
    if (daysLeft < 0) {
      return 'bg-red-500';
    } else if (daysLeft < 7) {
      return 'bg-orange-500';
    } else if (daysLeft < 14) {
      return 'bg-yellow-500';
    } else {
      return 'bg-blue-500';
    }
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
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Overview of your vehicle maintenance status
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Car size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">{vehicles.length}</h3>
              <p className="text-sm text-gray-500">Vehicles</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Wrench size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">5</h3>
              <p className="text-sm text-gray-500">Recent Maintenance</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">{reminders.length}</h3>
              <p className="text-sm text-gray-500">Upcoming Reminders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Reminders</h2>
        {renderRemindersSection()}
      </div>

      <div className="flex justify-end">
        <Link
          to="/vehicles/add"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Car size={18} className="mr-2" />
          Add New Vehicle
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;