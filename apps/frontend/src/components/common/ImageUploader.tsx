import { useState, useRef, ChangeEvent } from 'react';

interface ImageUploaderProps {
    onChange?: (file: File | null) => void;
}

export function ImageUploader({ onChange }: ImageUploaderProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onChange?.(file);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange?.(null);
    };

    return (
        <div className="flex flex-col w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
            />

            {!previewUrl ? (
                <div
                    onClick={handleBrowseClick}
                    className="group relative flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#315368] hover:border-indigo-500/50 dark:hover:border-primary/50 bg-slate-50 dark:bg-[#101c23]/50 px-6 py-12 transition-all cursor-pointer"
                >
                    <div className="size-20 rounded-full bg-indigo-50 dark:bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-4xl text-indigo-600 dark:text-primary">cloud_upload</span>
                    </div>
                    <div className="flex max-w-[480px] flex-col items-center gap-2">
                        <p className="text-slate-900 dark:text-white text-xl font-bold tracking-tight text-center">Upload User Photo</p>
                        <p className="text-slate-500 dark:text-[#90b4cb] text-sm font-normal leading-relaxed text-center">
                            Drag and drop or click to upload.
                            Supported formats: JPEG, PNG.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="flex items-center gap-2 px-6 h-12 bg-indigo-600 dark:bg-primary hover:bg-indigo-700 dark:hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 dark:shadow-primary/20 transition-all"
                        >
                            <span className="material-symbols-outlined">file_upload</span>
                            Browse Files
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-[#315368]">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={handleBrowseClick}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                        >
                            <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-3 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
