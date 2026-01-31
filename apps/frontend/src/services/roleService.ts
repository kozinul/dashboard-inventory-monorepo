import axios from '../lib/axios';

export interface Permission {
    resource: string;
    actions: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export interface Role {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    permissions: Permission[];
    isSystem: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateRoleDto {
    name: string;
    slug: string;
    description?: string;
    permissions: Permission[];
}

export interface UpdateRoleDto {
    name?: string;
    slug?: string;
    description?: string;
    permissions?: Permission[];
}

const getRoles = async (): Promise<Role[]> => {
    const response = await axios.get('/roles');
    return response.data;
};

const getRoleById = async (id: string): Promise<Role> => {
    const response = await axios.get(`/roles/${id}`);
    return response.data;
};

const createRole = async (data: CreateRoleDto): Promise<Role> => {
    const response = await axios.post('/roles', data);
    return response.data;
};

const updateRole = async (id: string, data: UpdateRoleDto): Promise<Role> => {
    const response = await axios.put(`/roles/${id}`, data);
    return response.data;
};

const deleteRole = async (id: string): Promise<void> => {
    await axios.delete(`/roles/${id}`);
};

export const roleService = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
};
