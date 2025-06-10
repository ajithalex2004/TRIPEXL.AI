TripEXL Enterprise Fleet Management System User Story 
TripEXL is a comprehensive enterprise fleet management platform designed specifically for businesses in the UAE. The system optimizes vehicle dispatch, booking management, trip merging, and resource allocation with a focus on operational efficiency and cost reduction. Core Features

Booking and Dispatch Management • Create and manage passenger and freight bookings with detailed information including pickup/dropoff locations, times, and priority levels • Review booking details including reference numbers, status updates, and employee information • Track bookings through their lifecycle from creation to completion • Manage booking approvals through configurable multi-level approval workflows based on department and region • Assign vehicles and drivers to bookings manually or leverage the automated dispatch system • View real-time booking status updates including confirmed, assigned, in-progress, and completed states
Smart Trip Merging • Automatically identify bookings that can be merged to optimize vehicle utilization • View merge recommendations based on compatibility scores for pickup/dropoff proximity, timing, and booking types • Manually merge trips with a user-friendly interface for drag-and-drop merging • Access optimized route plans for merged trips with turn-by-turn directions • See the calculated savings in distance, time, fuel, and CO2 emissions for each merged trip • Configure merge eligibility criteria including maximum pickup/dropoff distances, time windows, and trip duration limits
Vehicle and Resource Management • Monitor the real-time status and location of all vehicles in the fleet • Manage vehicle details including make, model, fuel type, capacity, and maintenance schedule • Track vehicle performance metrics including fuel efficiency, cost per kilometer, and CO2 emissions • Receive alerts for vehicle maintenance based on configurable service plans • View vehicle utilization reports and identify underutilized assets • Manage fuel price updates and see how they affect operational costs across the fleet
Employee and User Management • Create and manage user accounts with role-based access control • Link employees to user accounts for seamless system access • Verify employee information during the registration process • Manage employee hierarchies and approval workflows based on organizational structure • Reset user passwords and manage account recovery • Configure system-wide settings through an admin dashboard
Route Optimization and Analytics • Access eco-friendly route recommendations that consider traffic, weather, and fuel efficiency • View detailed route metrics including distance, duration, fuel consumption, and CO2 emissions • Generate performance reports comparing actual vs. expected metrics • Analyze trip data to identify optimization opportunities • Track fuel consumption and emissions for sustainability reporting • View route insights with optimization suggestions for future trips
Authentication and Security • Secure the system with robust authentication mechanisms • Protect sensitive booking and employee data • Link employee records with user accounts to verify employment status • Implement password recovery and account security measures • Maintain audit trails of system activities • Ensure data integrity through robust validation and error handling
Technical Features

User Interface The system provides: • Modern, responsive UI built with React • Intuitive booking creation and management forms • Real-time status updates for bookings and vehicles • Interactive maps for route visualization • Dashboards for tracking performance metrics • Mobile compatibility for on-the-go access
Backend Architecture The system includes: • Express.js server with TypeScript for type safety • PostgreSQL database with Drizzle ORM for data management • Well-structured API endpoints with comprehensive error handling • Modular services for authentication, dispatch, trip merging, and route optimization • Integration with Google Maps API for route planning and location services • Configurable system settings through a configuration service
Optimization Algorithms The system leverages: • Intelligent trip merging algorithms based on proximity, timing, and booking compatibility • Route optimization for distance, time, and fuel efficiency • Automated dispatch logic that considers vehicle location, capacity, and booking priority • Fuel cost calculations that update automatically based on current prices • CO2 emissions tracking based on vehicle type and distance traveled
Integration Capabilities The system supports: • Integration with email services for notifications and alerts • Google Maps API for location services and route optimization • External data sources for fuel price updates • Potential for integration with vehicle telematics systems • Customizable API endpoints for third-party system integration Business Value TripXL delivers significant value to enterprises by:
Reducing operational costs through optimized routing and vehicle utilization
Improving service quality with reliable booking and dispatch management
Enhancing sustainability efforts with emissions tracking and eco-friendly routing
Increasing administrative efficiency through automation and streamlined workflows
Providing data-driven insights for continuous improvement of fleet operations
Supporting scalable fleet management from small businesses to large enterprises This enterprise-grade system is specifically tailored to the UAE market, with features that consider local geography, business practices, and transportation needs, while providing a flexible framework that can be adapted to various industry requirements.
Building TripXL with React Native Frontend To build the complete TripXL system with a React Native frontend and all the necessary backend components. System Architecture Overview TripXL System ├── Frontend (React Native) ├── Backend (Node.js/Express) ├── Database (PostgreSQL) ├── API Layer (RESTful API) ├── Authentication (JWT) ├── Maps Integration (Google Maps API) └── Push Notifications (Firebase)

Frontend: React Native Setup Setup React Native Project bash npx react-native@latest init TripXLMobile --template react-native-template-typescript cd TripXLMobile Install Essential Dependencies bash
Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs npm install react-native-screens react-native-safe-area-context

State Management
npm install @reduxjs/toolkit react-redux redux-persist

UI Components
npm install react-native-paper react-native-vector-icons npm install react-native-gesture-handler react-native-reanimated

Maps
npm install react-native-maps

Forms
npm install react-hook-form zod @hookform/resolvers

API & Networking
npm install axios

Storage
npm install @react-native-async-storage/async-storage Project Structure for React Native src/ ├── api/ │ ├── apiClient.ts │ ├── bookingService.ts │ ├── vehicleService.ts │ └── authService.ts ├── components/ │ ├── common/ │ │ ├── Button.tsx │ │ ├── Card.tsx │ │ ├── Input.tsx │ │ └── Loading.tsx │ ├── booking/ │ │ ├── BookingForm.tsx │ │ ├── BookingItem.tsx │ │ └── BookingList.tsx │ ├── maps/ │ │ ├── RouteMap.tsx │ │ └── LocationPicker.tsx │ └── vehicle/ │ ├── VehicleItem.tsx │ └── VehicleList.tsx ├── navigation/ │ ├── AppNavigator.tsx │ ├── AuthNavigator.tsx │ └── MainTabNavigator.tsx ├── screens/ │ ├── auth/ │ │ ├── LoginScreen.tsx │ │ └── RegisterScreen.tsx │ ├── booking/ │ │ ├── BookingCreateScreen.tsx │ │ ├── BookingDetailsScreen.tsx │ │ └── BookingListScreen.tsx │ ├── vehicle/ │ │ ├── VehicleDetailsScreen.tsx │ │ └── VehicleListScreen.tsx │ ├── dashboard/ │ │ └── DashboardScreen.tsx │ └── settings/ │ └── SettingsScreen.tsx ├── store/ │ ├── index.ts │ ├── authSlice.ts │ ├── bookingSlice.ts │ └── vehicleSlice.ts ├── utils/ │ ├── dateUtils.ts │ ├── locationUtils.ts │ └── validationSchemas.ts └── theme/ ├── colors.ts ├── spacing.ts └── typography.ts Key Screen Implementation Example typescript // src/screens/booking/BookingListScreen.tsx import React, { useEffect } from 'react'; import { View, FlatList, StyleSheet } from 'react-native'; import { useDispatch, useSelector } from 'react-redux'; import { fetchBookings } from '../../store/bookingSlice'; import { BookingItem, Loading, ErrorMessage } from '../../components'; import { FAB } from 'react-native-paper'; import { useNavigation } from '@react-navigation/native';

const BookingListScreen = () => { const dispatch = useDispatch(); const navigation = useNavigation(); const { bookings, loading, error } = useSelector(state => state.booking);

useEffect(() => { dispatch(fetchBookings()); }, [dispatch]);

if (loading) return ; if (error) return ;

return ( <FlatList data={bookings} keyExtractor={item => item.id.toString()} renderItem={({ item }) => ( <BookingItem booking={item} onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })} /> )} /> <FAB style={styles.fab} icon="plus" onPress={() => navigation.navigate('BookingCreate')} /> ); };

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f5f5', }, fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, }, });

export default BookingListScreen; 2. Backend: Express.js with TypeScript Setup Backend Project bash mkdir tripxl-backend cd tripxl-backend npm init -y npm install express cors helmet dotenv typescript ts-node npm install -D @types/express @types/cors @types/node nodemon Create TypeScript Configuration bash npx tsc --init Edit tsconfig.json: json { "compilerOptions": { "target": "ES2018", "module": "commonjs", "outDir": "dist", "strict": true, "esModuleInterop": true, "skipLibCheck": true, "forceConsistentCasingInFileNames": true }, "include": ["src/**/*"], "exclude": ["node_modules"] } Project Structure for Backend tripxl-backend/ ├── src/ │ ├── config/ │ │ ├── database.ts │ │ └── environment.ts │ ├── controllers/ │ │ ├── authController.ts │ │ ├── bookingController.ts │ │ └── vehicleController.ts │ ├── middlewares/ │ │ ├── authMiddleware.ts │ │ ├── errorHandler.ts │ │ └── validator.ts │ ├── models/ │ │ ├── User.ts │ │ ├── Booking.ts │ │ └── Vehicle.ts │ ├── routes/ │ │ ├── authRoutes.ts │ │ ├── bookingRoutes.ts │ │ └── vehicleRoutes.ts │ ├── services/ │ │ ├── authService.ts │ │ ├── bookingService.ts │ │ ├── notificationService.ts │ │ └── routeOptimizationService.ts │ ├── utils/ │ │ ├── logger.ts │ │ └── responseFormatter.ts │ └── index.ts ├── package.json └── tsconfig.json Express App Setup typescript // src/index.ts import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import dotenv from 'dotenv'; import { connectToDatabase } from './config/database'; import authRoutes from './routes/authRoutes'; import bookingRoutes from './routes/bookingRoutes'; import vehicleRoutes from './routes/vehicleRoutes'; import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express(); const PORT = process.env.PORT || 5000;

// Middleware app.use(cors()); app.use(helmet()); app.use(express.json()); app.use(express.urlencoded({ extended: true }));

// Routes app.use('/api/auth', authRoutes); app.use('/api/bookings', bookingRoutes); app.use('/api/vehicles', vehicleRoutes);

// Error handling app.use(errorHandler);

// Start server connectToDatabase() .then(() => { app.listen(PORT, () => { console.log(Server running on port ${PORT}); }); }) .catch(err => { console.error('Failed to connect to the database:', err); process.exit(1); }); 3. Database: PostgreSQL with Drizzle ORM Install PostgreSQL and Drizzle bash npm install pg drizzle-orm npm install -D drizzle-kit @types/pg Database Schema with Drizzle ORM typescript // src/models/schema.ts import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', { id: serial('id').primaryKey(), userName: text('user_name').notNull().unique(), userCode: text('user_code').notNull(), emailId: text('email_id').notNull().unique(), password: text('password').notNull(), userType: text('user_type').notNull(), userOperationType: text('user_operation_type').notNull(), userGroup: text('user_group').notNull(), firstName: text('first_name').notNull(), lastName: text('last_name').notNull(), fullName: text('full_name').notNull(), countryCode: text('country_code'), mobileNumber: text('mobile_number'), isActive: boolean('is_active').default(true), isVerified: boolean('is_verified').default(false), resetToken: text('reset_token'), resetTokenExpiry: timestamp('reset_token_expiry'), createdAt: timestamp('created_at').defaultNow(), updatedAt: timestamp('updated_at').defaultNow() });

export const bookings = pgTable('bookings', { id: serial('id').primaryKey(), referenceNo: text('reference_no').notNull(), employeeId: integer('employee_id').notNull(), bookingType: text('booking_type').notNull(), purpose: text('purpose').notNull(), priority: text('priority').notNull(), status: text('status').notNull().default('new'), pickupLocation: jsonb('pickup_location').notNull(), dropoffLocation: jsonb('dropoff_location').notNull(), pickupTime: timestamp('pickup_time').notNull(), dropoffTime: timestamp('dropoff_time'), assignedVehicleId: text('assigned_vehicle_id'), assignedDriverId: integer('assigned_driver_id'), isMerged: boolean('is_merged').default(false), mergeEligible: boolean('merge_eligible'), tripId: text('trip_id'), mergedWithBookingId: integer('merged_with_booking_id'), hasMergedTrips: boolean('has_merged_trips').default(false), mergedBookingIds: text('merged_booking_ids').array(), totalDistance: text('total_distance'), estimatedCost: text('estimated_cost'), co2Emissions: text('co2_emissions'), specialInstructions: text('special_instructions'), confirmedAt: timestamp('confirmed_at'), completedAt: timestamp('completed_at'), cancelledAt: timestamp('cancelled_at'), createdAt: timestamp('created_at').defaultNow(), updatedAt: timestamp('updated_at').defaultNow() });

export const vehicles = pgTable('vehicles', { id: serial('id').primaryKey(), vehicleNumber: text('vehicle_number').notNull().unique(), name: text('name').notNull(), make: text('make').notNull(), model: text('model').notNull(), year: integer('year').notNull(), status: text('status').notNull().default('Available'), registrationNumber: text('registration_number').notNull(), loadCapacity: integer('load_capacity'), passengerCapacity: integer('passenger_capacity'), currentLocation: jsonb('current_location'), driverName: text('driver_name'), isActive: boolean('is_active').default(true), lastUpdated: timestamp('last_updated').defaultNow(), createdAt: timestamp('created_at').defaultNow(), updatedAt: timestamp('updated_at').defaultNow() }); Database Connection typescript // src/config/database.ts import { drizzle } from 'drizzle-orm/node-postgres'; import { Pool } from 'pg'; import * as schema from '../models/schema'; import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export async function connectToDatabase() { try { await pool.connect(); console.log('Connected to PostgreSQL database'); return true; } catch (error) { console.error('Database connection error:', error); throw error; } } 4. API Implementation Authentication API typescript // src/controllers/authController.ts import { Request, Response } from 'express'; import jwt from 'jsonwebtoken'; import bcrypt from 'bcryptjs'; import { db } from '../config/database'; import { users } from '../models/schema'; import { eq } from 'drizzle-orm';

export const register = async (req: Request, res: Response) => { try { const { userName, emailId, password, firstName, lastName, userType, userOperationType, userGroup } = req.body;

// Check if user exists
const existingUser = await db.select().from(users).where(eq(users.emailId, emailId));
if (existingUser.length > 0) {
  return res.status(400).json({ message: 'User already exists with this email' });
}

// Hash password
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Generate user code
const userCode = `USR${Math.floor(1000 + Math.random() * 9000)}`;

// Create user
const [newUser] = await db.insert(users).values({
  userName,
  userCode,
  emailId,
  password: hashedPassword,
  firstName,
  lastName,
  fullName: `${firstName} ${lastName}`,
  userType,
  userOperationType,
  userGroup,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}).returning();

// Generate token
const token = jwt.sign(
  { userId: newUser.id },
  process.env.JWT_SECRET || 'default_secret',
  { expiresIn: '24h' }
);

// Remove password from response
const { password: _, ...userWithoutPassword } = newUser;

res.status(201).json({
  message: 'User registered successfully',
  user: userWithoutPassword,
  token
});
} catch (error) { console.error('Registration error:', error); res.status(500).json({ message: 'Server error during registration' }); } };

export const login = async (req: Request, res: Response) => { try { const { emailId, password } = req.body;

// Find user
const existingUsers = await db.select().from(users).where(eq(users.emailId, emailId));
if (existingUsers.length === 0) {
  return res.status(401).json({ message: 'Invalid credentials' });
}

const user = existingUsers[0];

// Check password
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  return res.status(401).json({ message: 'Invalid credentials' });
}

// Generate token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET || 'default_secret',
  { expiresIn: '24h' }
);

// Update last login
await db.update(users)
  .set({ updatedAt: new Date() })
  .where(eq(users.id, user.id));

// Remove password from response
const { password: _, ...userWithoutPassword } = user;

res.json({
  message: 'Login successful',
  user: userWithoutPassword,
  token
});
} catch (error) { console.error('Login error:', error); res.status(500).json({ message: 'Server error during login' }); } }; Booking API Example typescript // src/controllers/bookingController.ts import { Request, Response } from 'express'; import { db } from '../config/database'; import { bookings } from '../models/schema'; import { eq } from 'drizzle-orm';

export const getBookings = async (req: Request, res: Response) => { try { const allBookings = await db.select().from(bookings); res.json(allBookings); } catch (error) { console.error('Error fetching bookings:', error); res.status(500).json({ message: 'Server error fetching bookings' }); } };

export const createBooking = async (req: Request, res: Response) => { try { // Generate reference number const refNo = BK${Date.now()}${Math.floor(Math.random() * 1000)};

// Create booking with data from request
const [newBooking] = await db.insert(bookings).values({
  ...req.body,
  referenceNo: refNo,
  status: 'new',
  createdAt: new Date(),
  updatedAt: new Date()
}).returning();

res.status(201).json({
  message: 'Booking created successfully',
  booking: newBooking
});
} catch (error) { console.error('Error creating booking:', error); res.status(500).json({ message: 'Server error creating booking' }); } };

export const getBookingById = async (req: Request, res: Response) => { try { const { id } = req.params; const [booking] = await db.select().from(bookings).where(eq(bookings.id, parseInt(id)));

if (!booking) {
  return res.status(404).json({ message: 'Booking not found' });
}

res.json(booking);
} catch (error) { console.error('Error fetching booking:', error); res.status(500).json({ message: 'Server error fetching booking' }); } };

export const updateBookingStatus = async (req: Request, res: Response) => { try { const { id } = req.params; const { status } = req.body;

// Update status
const [updatedBooking] = await db.update(bookings)
  .set({
    status,
    updatedAt: new Date()
  })
  .where(eq(bookings.id, parseInt(id)))
  .returning();

if (!updatedBooking) {
  return res.status(404).json({ message: 'Booking not found' });
}

res.json({
  message: 'Booking status updated successfully',
  booking: updatedBooking
});
} catch (error) { console.error('Error updating booking status:', error); res.status(500).json({ message: 'Server error updating booking status' }); } }; 5. Authentication Implementation Authentication Middleware typescript // src/middlewares/authMiddleware.ts import { Request, Response, NextFunction } from 'express'; import jwt from 'jsonwebtoken'; import { db } from '../config/database'; import { users } from '../models/schema'; import { eq } from 'drizzle-orm';

interface JwtPayload { userId: number; }

declare global { namespace Express { interface Request { user?: any; } } }

export const protect = async (req: Request, res: Response, next: NextFunction) => { try { // Check for token in headers const authHeader = req.headers.authorization; if (!authHeader || !authHeader.startsWith('Bearer ')) { return res.status(401).json({ message: 'Not authorized, no token' }); }

// Extract token
const token = authHeader.split(' ')[1];

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtPayload;

// Find user by ID from token
const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));

if (!user) {
  return res.status(401).json({ message: 'Not authorized, user not found' });
}

// Add user to request object
req.user = user;
next();
} catch (error) { console.error('Authentication error:', error); res.status(401).json({ message: 'Not authorized, invalid token' }); } }; 6. UI/UX Design for React Native Theme Configuration typescript // src/theme/index.ts import { DefaultTheme } from 'react-native-paper';

export const colors = { primary: '#004990', secondary: '#FF8C00', accent: '#00BFA5', background: '#F5F7FA', surface: '#FFFFFF', error: '#B00020', text: '#333333', disabled: '#CCCCCC', placeholder: '#9E9E9E', backdrop: 'rgba(0, 0, 0, 0.5)', card: '#FFFFFF', notification: '#FF4081', success: '#4CAF50', warning: '#FFC107', info: '#2196F3', };

export const spacing = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48, };

export const typography = { headingLarge: { fontFamily: 'System', fontSize: 28, fontWeight: 'bold', }, headingMedium: { fontFamily: 'System', fontSize: 24, fontWeight: 'bold', }, headingSmall: { fontFamily: 'System', fontSize: 20, fontWeight: 'bold', }, bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: 'normal', }, bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: 'normal', }, bodySmall: { fontFamily: 'System', fontSize: 12, fontWeight: 'normal', }, caption: { fontFamily: 'System', fontSize: 12, fontWeight: '400', }, };

export const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, accent: colors.accent, background: colors.background, surface: colors.surface, error: colors.error, text: colors.text, disabled: colors.disabled, placeholder: colors.placeholder, backdrop: colors.backdrop, notification: colors.notification, }, roundness: 8, }; Custom Components typescript // src/components/common/Button.tsx import React from 'react'; import { StyleSheet } from 'react-native'; import { Button as PaperButton } from 'react-native-paper'; import { colors, spacing } from '../../theme';

type ButtonProps = { mode?: 'contained' | 'outlined' | 'text'; onPress: () => void; title: string; disabled?: boolean; loading?: boolean; color?: string; style?: object; };

const Button = ({ mode = 'contained', onPress, title, disabled = false, loading = false, color = colors.primary, style, }: ButtonProps) => { return ( <PaperButton mode={mode} onPress={onPress} disabled={disabled} loading={loading} color={color} style={[styles.button, style]} > {title} ); };

const styles = StyleSheet.create({ button: { marginVertical: spacing.s, paddingVertical: spacing.xs, }, });

export default Button; Form Components with React Hook Form typescript // src/components/common/FormInput.tsx import React from 'react'; import { StyleSheet, View, Text } from 'react-native'; import { TextInput } from 'react-native-paper'; import { Controller, Control } from 'react-hook-form'; import { colors, spacing, typography } from '../../theme';

type FormInputProps = { name: string; control: Control; label: string; secureTextEntry?: boolean; keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; placeholder?: string; multiline?: boolean; numberOfLines?: number; rules?: object; };

const FormInput = ({ name, control, label, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'none', placeholder = '', multiline = false, numberOfLines = 1, rules = {}, }: FormInputProps) => { return ( <Controller name={name} control={control} rules={rules} render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => ( {error ? ( {error.message} ) : null} )} /> ); };

const styles = StyleSheet.create({ container: { marginBottom: spacing.m, }, input: { backgroundColor: colors.surface, }, errorText: { ...typography.bodySmall, color: colors.error, marginTop: spacing.xs, marginLeft: spacing.s, }, });

export default FormInput; Location Picker Component with Maps typescript // src/components/maps/LocationPicker.tsx import React, { useState, useEffect } from 'react'; import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'; import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; import { Button, ActivityIndicator } from 'react-native-paper'; import * as Location from 'expo-location'; import { colors, spacing, typography } from '../../theme';

type LocationPickerProps = { onLocationSelected: (location: { latitude: number; longitude: number; address: string; }) => void; initialLocation?: { latitude: number; longitude: number; }; label?: string; };

const LocationPicker = ({ onLocationSelected, initialLocation, label = 'Select Location', }: LocationPickerProps) => { const [location, setLocation] = useState( initialLocation || { latitude: 25.276987, longitude: 55.296249, latitudeDelta: 0.0922, longitudeDelta: 0.0421, } ); const [address, setAddress] = useState(''); const [loading, setLoading] = useState(false);

useEffect(() => { getLocationPermission(); }, []);

const getLocationPermission = async () => { try { const { status } = await Location.requestForegroundPermissionsAsync(); if (status !== 'granted') { console.log('Permission to access location was denied'); return; }

  if (!initialLocation) {
    getCurrentLocation();
  }
} catch (error) {
  console.error('Error getting location permission:', error);
}
};

const getCurrentLocation = async () => { try { setLoading(true); const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, });

  const { latitude, longitude } = position.coords;
  setLocation({
    latitude,
    longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  getAddressFromCoordinates(latitude, longitude);
} catch (error) {
  console.error('Error getting current location:', error);
} finally {
  setLoading(false);
}
};

const getAddressFromCoordinates = async (latitude: number, longitude: number) => { try { const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude, });

  if (addressResponse.length > 0) {
    const addr = addressResponse[0];
    const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.country || ''}`;
    setAddress(formattedAddress);
    
    onLocationSelected({
      latitude,
      longitude,
      address: formattedAddress,
    });
  }
} catch (error) {
  console.error('Error getting address:', error);
}
};

const handleMapPress = (event: any) => { const { coordinate } = event.nativeEvent; setLocation({ ...location, latitude: coordinate.latitude, longitude: coordinate.longitude, });

getAddressFromCoordinates(coordinate.latitude, coordinate.longitude);
};

return ( {label}

  <MapView
    provider={PROVIDER_GOOGLE}
    style={styles.map}
    region={location}
    onPress={handleMapPress}
  >
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      draggable
      onDragEnd={(e) => {
        setLocation({
          ...location,
          latitude: e.nativeEvent.coordinate.latitude,
          longitude:
