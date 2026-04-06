import { RolePermission } from '../models/rolePermission.model.js';

export const syncPermissions = async () => {
    try {
        console.log('Synchronizing required live server permissions...');
        
        // 1. Fix Technician User Permissions
        const techPerms = await RolePermission.findOne({ roleSlug: 'technician' });
        if (techPerms && techPerms.permissions) {
            let updated = false;
            const perms = techPerms.permissions as any[];
            
            const usersPermIndex = perms.findIndex(p => p.resource === 'users');
            if (usersPermIndex >= 0) {
                if (!perms[usersPermIndex].actions.view) {
                    perms[usersPermIndex].actions.view = true;
                    updated = true;
                }
            } else {
                perms.push({
                    resource: 'users',
                    actions: { view: true, create: false, edit: false, delete: false }
                });
                updated = true;
            }
            
            if (updated) {
                techPerms.permissions = perms;
                await techPerms.save();
                console.log('Fixed technician permissions on live database.');
            }
        }
        
        // 2. Fix Manager User Permissions
        const managerPerms = await RolePermission.findOne({ roleSlug: 'manager' });
        if (managerPerms && managerPerms.permissions) {
            let updated = false;
            const perms = managerPerms.permissions as any[];
            const usersPermIndex = perms.findIndex(p => p.resource === 'users');
            if (usersPermIndex >= 0) {
                if (!perms[usersPermIndex].actions.view) {
                    perms[usersPermIndex].actions.view = true;
                    updated = true;
                }
            } else {
                perms.push({
                    resource: 'users',
                    actions: { view: true, create: true, edit: true, delete: false }
                });
                updated = true;
            }
            if (updated) {
                managerPerms.permissions = perms;
                await managerPerms.save();
                console.log('Fixed manager permissions on live database.');
            }
        }

    } catch (error) {
        console.error('Error synchronizing permissions:', error);
    }
};
