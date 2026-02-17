import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department } from '../models/department.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const listDepartments = async () => {
    try {
        await connectDB();
        const departments = await Department.find({});
        console.log('Departments found:');
        console.table(departments.map(d => ({
            id: d._id.toString(),
            name: d.name
        })));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listDepartments();
