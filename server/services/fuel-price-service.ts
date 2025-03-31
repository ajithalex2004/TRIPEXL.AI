import axios from 'axios';
import { storage } from '../storage';
import { db } from '../db';
import cron from 'node-cron';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

// Global date handler for simulation
const USE_FAKE_DATE = true;
const FAKE_DATE = '2025-04-01';

function getCurrentDate() {
  if (USE_FAKE_DATE) {
    console.log('Using simulated date:', FAKE_DATE);
    return FAKE_DATE;
  } else {
    return new Date().toISOString().split('T')[0];
  }
}

// Define fuel types and their current prices in AED per liter
const defaultFuelPrices = {
  PETROL: 2.68, // Regular gasoline (Special 95)
  DIESEL: 3.01, // Diesel
  ELECTRIC: 0.33, // Cost per kWh equivalent to liter
  HYBRID: 2.15, // Average hybrid fuel cost
  CNG: 2.28, // Compressed Natural Gas
  LPG: 2.18  // Liquified Petroleum Gas
};

// Initialize the fuel price service
export async function initializeFuelPriceService() {
  console.log('Initializing fuel price service');
  
  try {
    // Check if we already have fuel types in the database
    const existingFuelTypes = await db.select().from(schema.fuelTypes);
    
    if (existingFuelTypes.length === 0) {
      // If not, insert default fuel types with current prices
      console.log('No fuel types found, initializing with default values');
      
      const defaultValues = [
        {
          type: 'Petrol',
          price: defaultFuelPrices.PETROL.toString(),
          co2_factor: '2.31',
          efficiency: '12.5',
          emission_factor: '0.24',
          idle_consumption: '0.8',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: defaultFuelPrices.PETROL}])
        },
        {
          type: 'Diesel',
          price: defaultFuelPrices.DIESEL.toString(),
          co2_factor: '2.68',
          efficiency: '16.2',
          emission_factor: '0.27',
          idle_consumption: '0.6',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: defaultFuelPrices.DIESEL}])
        },
        {
          type: 'Premium',
          price: '3.56',
          co2_factor: '2.20',
          efficiency: '11.7',
          emission_factor: '0.22',
          idle_consumption: '0.9',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: 3.56}])
        },
        {
          type: 'Electric',
          price: defaultFuelPrices.ELECTRIC.toString(),
          co2_factor: '0.05',
          efficiency: '25.0',
          emission_factor: '0.05',
          idle_consumption: '0.1',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: defaultFuelPrices.ELECTRIC}])
        },
        {
          type: 'Hybrid',
          price: defaultFuelPrices.HYBRID.toString(),
          co2_factor: '1.52',
          efficiency: '19.8',
          emission_factor: '0.15',
          idle_consumption: '0.5',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: defaultFuelPrices.HYBRID}])
        },
        {
          type: 'CNG',
          price: defaultFuelPrices.CNG.toString(),
          co2_factor: '1.25',
          efficiency: '18.9',
          emission_factor: '0.12',
          idle_consumption: '0.4',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: defaultFuelPrices.CNG}])
        },
        {
          type: 'LPG',
          price: defaultFuelPrices.LPG.toString(),
          co2_factor: '1.35',
          efficiency: '17.6',
          emission_factor: '0.14',
          idle_consumption: '0.5',
          historical_prices: JSON.stringify([{date: new Date().toISOString().split('T')[0], price: defaultFuelPrices.LPG}])
        }
      ];
      
      // Insert each type one by one to avoid potential issues
      for (const fuelType of defaultValues) {
        await db.insert(schema.fuelTypes).values(fuelType);
        console.log(`Initialized ${fuelType.type} fuel type`);
      }
      
      console.log('Default fuel types initialized');
    } else {
      console.log('Fuel types already exist in database:', existingFuelTypes.length, 'types found');
    }
    
    // Schedule the monthly fuel price update job
    // Runs on the 1st day of each month at 6:00 AM
    cron.schedule('0 6 1 * *', async () => {
      console.log('Running scheduled fuel price update job');
      await updateFuelPrices();
    });
    
    console.log('Fuel price service initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing fuel price service:', error);
    return false;
  }
}

// Function to update fuel prices (would connect to an external API in a real implementation)
export async function updateFuelPrices() {
  try {
    console.log('Updating fuel prices');
    
    // Get current fuel prices from DB
    const fuelTypes = await db.select().from(schema.fuelTypes);
    const fuelTypeMap = new Map(fuelTypes.map(ft => [ft.type, ft]));
    
    // In a real implementation, this would fetch from an external API
    // For now, we'll simulate with small random variations
    const updatedPrices = {
      'Petrol': roundToTwoDecimals(defaultFuelPrices.PETROL + getRandomVariation(0.05)),
      'Diesel': roundToTwoDecimals(defaultFuelPrices.DIESEL + getRandomVariation(0.07)),
      'Premium': roundToTwoDecimals(3.56 + getRandomVariation(0.06)),
      'Electric': roundToTwoDecimals(defaultFuelPrices.ELECTRIC + getRandomVariation(0.02)),
      'Hybrid': roundToTwoDecimals(defaultFuelPrices.HYBRID + getRandomVariation(0.04)),
      'CNG': roundToTwoDecimals(defaultFuelPrices.CNG + getRandomVariation(0.03)),
      'LPG': roundToTwoDecimals(defaultFuelPrices.LPG + getRandomVariation(0.03))
    };
    
    // Update each fuel type price in the database
    for (const [type, price] of Object.entries(updatedPrices)) {
      console.log(`Updating ${type} price to ${price} AED/liter`);
      
      const fuelType = fuelTypeMap.get(type);
      if (fuelType) {
        // Update price in the database
        // Let's simulate a different date by setting it to April 1st
        // We need to use explicit dates for the simulation
        const useFakeDate = true; // Use this to toggle simulation mode
        const currentDate = useFakeDate ? 
          '2025-04-01' : // Simulate April 1st for testing
          new Date().toISOString().split('T')[0];
        console.log(`Using date for fuel price history: ${currentDate}`);
        let historicalPrices = [];
        
        try {
          // Parse historical prices if they're stored as a string
          if (typeof fuelType.historical_prices === 'string') {
            historicalPrices = JSON.parse(fuelType.historical_prices || '[]');
          } 
          // Handle if it's already an object (Array)
          else if (Array.isArray(fuelType.historical_prices)) {
            historicalPrices = fuelType.historical_prices;
          }
          // Handle if it's a single object
          else if (typeof fuelType.historical_prices === 'object' && fuelType.historical_prices !== null) {
            historicalPrices = [fuelType.historical_prices];
          }
        } catch (e) {
          console.warn(`Error parsing historical prices for ${type}:`, e);
          historicalPrices = [];
        }
        
        // Check if we already have an entry for today
        const existingEntryIndex = historicalPrices.findIndex(
          entry => entry.date === currentDate
        );
        
        if (existingEntryIndex >= 0) {
          // Update today's entry
          historicalPrices[existingEntryIndex].price = price;
        } else {
          // Add new price to history
          historicalPrices.push({
            date: currentDate,
            price: price
          });
        }
        
        // Keep only last 12 months of data
        if (historicalPrices.length > 12) {
          historicalPrices = historicalPrices.slice(-12);
        }
        
        console.log(`Updating ${type} with historical prices:`, historicalPrices);
        
        // Update the database record
        await db.update(schema.fuelTypes)
          .set({
            price: price.toString(),
            updated_at: new Date(),
            historical_prices: JSON.stringify(historicalPrices)
          })
          .where(eq(schema.fuelTypes.type, type));
      } else {
        console.warn(`Fuel type ${type} not found in database, skipping update`);
      }
    }
    
    // Recalculate vehicle costs based on the new fuel prices
    await storage.recalculateVehicleCosts();
    
    console.log('Fuel prices updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating fuel prices:', error);
    return false;
  }
}

// Function to get historical fuel prices
export async function getFuelPriceHistory() {
  try {
    console.log('Fetching fuel price history from database');
    
    // Get fuel types with their historical data
    const fuelTypes = await db.select().from(schema.fuelTypes);
    
    // Format for frontend chart display
    const monthlyData: Record<string, any> = {};
    
    // Process each fuel type's historical prices
    for (const fuelType of fuelTypes) {
      let historicalPrices = [];
      
      try {
        // Handle historical prices data
        let historicalPricesData = [];
        
        // Check if the value is already an object (happens when multiple updates in same session)
        if (typeof fuelType.historical_prices === 'object' && fuelType.historical_prices !== null) {
          historicalPricesData = Array.isArray(fuelType.historical_prices) ? fuelType.historical_prices : [fuelType.historical_prices];
        } else {
          // Try to parse it from a string
          try {
            historicalPricesData = JSON.parse(fuelType.historical_prices?.toString() || '[]');
          } catch (parseError) {
            console.warn(`Failed to parse historical prices JSON for ${fuelType.type}:`, parseError);
            // In case of parsing error, use current price as fallback
            historicalPricesData = [{
              date: new Date().toISOString().split('T')[0],
              price: parseFloat(fuelType.price.toString())
            }];
          }
        }
        
        // Add each historical price entry to the corresponding month
        for (const entry of historicalPricesData) {
          if (entry && entry.date) {
            const date = new Date(entry.date);
            const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            if (!monthlyData[monthName]) {
              monthlyData[monthName] = { month: monthName };
            }
            
            // Store price using lowercase fuel type as the key
            const price = typeof entry.price === 'number' ? entry.price : parseFloat(entry.price);
            monthlyData[monthName][fuelType.type.toLowerCase()] = price;
          }
        }
        
      } catch (e) {
        console.warn(`Error processing historical prices for ${fuelType.type}:`, e);
      }
    }
    
    // Convert to array and sort by date (newest first)
    const history = Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
    
    // If we don't have enough historical data, add current data
    if (history.length === 0) {
      const currentMonth = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
      const currentEntry = { month: currentMonth };
      
      for (const fuelType of fuelTypes) {
        currentEntry[fuelType.type.toLowerCase()] = parseFloat(fuelType.price.toString());
      }
      
      history.push(currentEntry);
    }
    
    console.log('Fuel price history data:', history);
    return history;
  } catch (error) {
    console.error('Error fetching fuel price history:', error);
    throw error;
  }
}

// Helper function to get small random price variations
function getRandomVariation(maxVariation: number) {
  return (Math.random() * maxVariation * 2) - maxVariation;
}

// Helper function to round to two decimal places
function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

// Function to manually trigger a fuel price update
export async function triggerFuelPriceUpdate() {
  console.log('Manually triggering fuel price update');
  return await updateFuelPrices();
}