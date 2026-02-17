import express from 'express';
// We can't easily import the app because it runs the server.
// Instead we will mock the app and import the routes.

import inventoryRoutes from '../routes/inventory.routes.js';

const app = express();
app.use('/api/v1/inventory', inventoryRoutes);

function printRoutes(stack: any[], prefix = '') {
    stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            printRoutes(layer.handle.stack, prefix + (layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace('\\/', '/').replace('\\', '')));
        }
    });
}

console.log('Registered Routes:');
printRoutes(app._router.stack);
process.exit(0);
