import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Database
connectDB();

import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import jobTitleRoutes from './routes/jobTitle.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import categoryRoutes from './routes/category.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import disposalRoutes from './routes/disposal.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { locationRoutes } from './routes/location.routes.js';
import { locationTypeRoutes } from './routes/locationType.routes.js';
import databaseRoutes from './routes/database.routes.js';

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/job-titles', jobTitleRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/disposal', disposalRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/location-types', locationTypeRoutes);
app.use('/api/v1/database', databaseRoutes);

import uploadRoutes from './routes/upload.routes.js';
import path from 'path';

app.use('/api/v1/upload', uploadRoutes); // Register upload routes

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
