import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsFormData {
  days_after_maintenance: number;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SettingsFormData>({
    defaultValues: {
      days_after_maintenance: 30,
    }
  });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('reminder_settings')
          .select('days_after_maintenance')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine for new users
          throw error;
        }
        
        if (data) {
          setValue('days_after_maintenance', data.days_after_maintenance);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setFormLoading(false);
      }
    };
    
    fetchSettings();
  }, [user, setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Check if settings already exist
      const { data: existingData, error: fetchError } = await supabase
        .from('reminder_settings')
        .select('id')
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;
      
      let error;
      
      if (existingData && existingData.length > 0) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('reminder_settings')
          .update({ days_after_maintenance: data.days_after_maintenance })
          .eq('user_id', user.id);
        
        error = updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('reminder_settings')
          .insert([{ 
            user_id: user.id, 
            days_after_maintenance: data.days_after_maintenance 
          }]);
        
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-b-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Configure your application preferences
        </p>
      </header>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex items-center p-6 border-b">
          <div className="p-2 mr-3 bg-blue-100 rounded-full">
            <SettingsIcon size={24} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Application Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center text-lg font-medium text-gray-900">
                <Bell size={20} className="mr-2 text-blue-600" />
                Reminder Settings
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Configure when to receive maintenance reminders
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="days_after_maintenance" className="block text-sm font-medium text-gray-700">
                  Days after last maintenance to remind about mileage
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <input
                    type="number"
                    id="days_after_maintenance"
                    {...register('days_after_maintenance', {
                      required: 'This field is required',
                      min: { value: 1, message: 'Days must be at least 1' },
                      max: { value: 365, message: 'Days cannot exceed 365' },
                      valueAsNumber: true
                    })}
                    className="block w-full pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">days</span>
                  </div>
                </div>
                {errors.days_after_maintenance && (
                  <p className="mt-1 text-sm text-red-600">{errors.days_after_maintenance.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  You'll be reminded about your vehicle's mileage after this many days have passed since the last regular maintenance.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                  <>
                    <Save size={16} className="mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;