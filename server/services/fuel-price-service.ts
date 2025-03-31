import { storage } from '../storage';
import axios from 'axios';
import { VehicleFuelType } from '@shared/schema';
import cron from 'node-cron';
import { log } from '../vite';

interface FuelPriceResponse {
  petrol: number;
  diesel: number;
  electric: number; // Cost per kWh
  hybrid: number; // Composite rate
  cng: number;
  lpg: number;
}

// Mock fuel price API response for demonstration
// In production, this would be replaced with an actual API call
async function fetchLatestFuelPrices(): Promise<FuelPriceResponse> {
  try {
    // This would be replaced with an actual API endpoint in production
    // const response = await axios.get('https://api.uaefuelprices.com/latest');
    // return response.data;
    
    // Simulated response with realistic UAE fuel prices (AED per liter)
    return {
      petrol: 2.65, // E-Plus 91
      diesel: 2.98,
      electric: 0.32, // Per kWh
      hybrid: 2.10, // Composite rate for hybrid vehicles
      cng: 2.26,
      lpg: 2.15
    };
  } catch (error) {
    log(`Error fetching fuel prices: ${error instanceof Error ? error.message : String(error)}`, 'fuel-service');
    throw new Error('Failed to fetch fuel prices');
  }
}

// Update fuel prices in the database
async function updateFuelPrices() {
  try {
    log('Starting monthly fuel price update', 'fuel-service');
    
    const prices = await fetchLatestFuelPrices();
    
    // Map the API response to our fuel types
    const updates = [
      { type: VehicleFuelType.PETROL, price: prices.petrol },
      { type: VehicleFuelType.DIESEL, price: prices.diesel },
      { type: VehicleFuelType.ELECTRIC, price: prices.electric },
      { type: VehicleFuelType.HYBRID, price: prices.hybrid },
      { type: VehicleFuelType.CNG, price: prices.cng },
      { type: VehicleFuelType.LPG, price: prices.lpg }
    ];
    
    // Update each fuel type price in the database
    for (const update of updates) {
      await storage.updateFuelTypePrice(update.type, update.price);
    }
    
    log('Fuel prices updated successfully', 'fuel-service');
    
    // Update all vehicle types that use these fuel types to recalculate cost_per_km
    await storage.recalculateVehicleCosts();
    
    log('Vehicle costs recalculated based on new fuel prices', 'fuel-service');
  } catch (error) {
    log(`Error updating fuel prices: ${error instanceof Error ? error.message : String(error)}`, 'fuel-service');
  }
}

// Schedule the update to run at 6:00 AM on the first day of each month
export function scheduleFuelPriceUpdates() {
  // Format: minute hour day-of-month month day-of-week
  // '0 6 1 * *' = At 06:00 on day-of-month 1
  cron.schedule('0 6 1 * *', async () => {
    log('Running scheduled fuel price update', 'fuel-service');
    await updateFuelPrices();
  });
  
  log('Fuel price update scheduler initialized', 'fuel-service');
}

// Function to run an immediate update (for testing or manual triggers)
export async function runImmediateFuelPriceUpdate() {
  log('Running immediate fuel price update', 'fuel-service');
  await updateFuelPrices();
}

// Initial fuel price setup function
export async function initializeFuelPrices() {
  try {
    const existingPrices = await storage.getAllFuelTypes();
    
    // Only initialize if we don't have fuel prices yet
    if (!existingPrices || existingPrices.length === 0) {
      log('Initializing fuel prices for the first time', 'fuel-service');
      await updateFuelPrices();
    } else {
      log('Fuel prices already exist, skipping initialization', 'fuel-service');
    }
  } catch (error) {
    log(`Error initializing fuel prices: ${error instanceof Error ? error.message : String(error)}`, 'fuel-service');
  }
}