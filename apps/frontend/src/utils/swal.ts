import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Helper to get theme-aware styling
const getThemeConfig = () => ({
    background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a',
});

// Toast notifications (for non-critical feedback)
export const showSuccessToast = (message: string) => {
    return MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        ...getThemeConfig(),
    });
};

export const showErrorToast = (message: string) => {
    return MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        ...getThemeConfig(),
    });
};

export const showInfoToast = (message: string) => {
    return MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        ...getThemeConfig(),
    });
};

// Modal alerts (for important feedback)
export const showSuccess = (title: string, text?: string, timer = 1500) => {
    return MySwal.fire({
        icon: 'success',
        title,
        text,
        timer,
        showConfirmButton: false,
        timerProgressBar: true,
        ...getThemeConfig(),
    });
};

export const showError = (title: string, text?: string) => {
    return MySwal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonColor: '#ef4444',
        ...getThemeConfig(),
    });
};

export const showInfo = (title: string, text?: string) => {
    return MySwal.fire({
        icon: 'info',
        title,
        text,
        confirmButtonColor: '#3b82f6',
        ...getThemeConfig(),
    });
};

// Confirmation dialogs
export const showConfirmDialog = (
    title: string,
    text: string,
    confirmButtonText = 'Yes, delete it!',
    type: 'delete' | 'warning' | 'info' = 'delete'
) => {
    const colors = {
        delete: { confirm: '#ef4444', cancel: '#6b7280' },
        warning: { confirm: '#f59e0b', cancel: '#6b7280' },
        info: { confirm: '#3b82f6', cancel: '#6b7280' }
    };

    return MySwal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: colors[type].confirm,
        cancelButtonColor: colors[type].cancel,
        confirmButtonText,
        cancelButtonText: 'Cancel',
        ...getThemeConfig(),
    });
};

// Loading state
export const showLoading = (title = 'Processing...', text = 'Please wait') => {
    return MySwal.fire({
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => MySwal.showLoading(),
        ...getThemeConfig(),
    });
};

// Close any open Swal
export const closeAlert = () => {
    MySwal.close();
};

// Input dialogs
export const showInputDialog = async (
    title: string,
    inputPlaceholder = '',
    inputType: 'text' | 'textarea' | 'email' = 'text',
    inputValue = ''
) => {
    return MySwal.fire({
        title,
        input: inputType,
        inputPlaceholder,
        inputValue,
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        ...getThemeConfig(),
        inputValidator: (value) => {
            if (!value) return 'This field is required';
            return null;
        }
    });
};

export const showSelectDialog = async (
    title: string,
    options: Record<string, string>,
    inputPlaceholder = 'Select an option'
) => {
    return MySwal.fire({
        title,
        input: 'select',
        inputOptions: options,
        inputPlaceholder,
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        ...getThemeConfig(),
        inputValidator: (value) => {
            if (!value) return 'Please select an option';
            return null;
        }
    });
};

// Generic alert with custom options
export const showAlert = (options: any) => {
    return MySwal.fire({
        ...getThemeConfig(),
        ...options
    });
};
