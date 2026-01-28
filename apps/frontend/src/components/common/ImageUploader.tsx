import { useState, useRef, ChangeEvent, useEffect } from 'react';

interface ImageUploaderProps {
    onChange?: (file: File | null) => void;
    onImagesChange?: (files: File[]) => void;
    initialImage?: string;
    initialImages?: string[];
    multiple?: boolean;
    targetDimensions?: { width: number; height: number };
}

export function ImageUploader({ onChange, onImagesChange, initialImage, initialImages, multiple = false, targetDimensions }: ImageUploaderProps) {
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current) {
            onImagesChange?.(files);
        } else {
            isMounted.current = true;
        }
    }, [files, onImagesChange]);

    useEffect(() => {
        if (multiple) {
            if (initialImages && initialImages.length > 0) {
                setPreviewUrls(initialImages);
            }
        } else {
            if (initialImage) {
                setPreviewUrls([initialImage]);
            }
        }
    }, [initialImage, initialImages, multiple]);

    const processImage = async (file: File): Promise<File> => {
        if (!targetDimensions) return file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    return reject(new Error('Failed to get canvas context'));
                }

                canvas.width = targetDimensions.width;
                canvas.height = targetDimensions.height;

                // "Cover" fit logic: Crop to center
                const targetRatio = targetDimensions.width / targetDimensions.height;
                const sourceRatio = img.width / img.height;

                let drawWidth = img.width;
                let drawHeight = img.height;
                let offsetX = 0;
                let offsetY = 0;

                if (sourceRatio > targetRatio) {
                    // Source is wider than target: Crop width
                    drawHeight = img.height;
                    drawWidth = img.height * targetRatio;
                    offsetX = (img.width - drawWidth) / 2;
                } else {
                    // Source is taller than target: Crop height
                    drawWidth = img.width;
                    drawHeight = img.width / targetRatio;
                    offsetY = (img.height - drawHeight) / 2;
                }

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, targetDimensions.width, targetDimensions.height);

                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        const processedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(processedFile);
                    } else {
                        reject(new Error('Canvas to Blob failed'));
                    }
                }, 'image/jpeg', 0.8); // Compress to 0.8 quality
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Image load failed'));
            };

            img.src = url;
        });
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            setIsProcessing(true);
            try {
                const fileArray = Array.from(selectedFiles);
                const processedFiles = await Promise.all(fileArray.map(file => processImage(file)));

                if (multiple) {
                    const newUrls = processedFiles.map(file => URL.createObjectURL(file));

                    setFiles(prev => {
                        const updated = [...prev, ...processedFiles];
                        return updated;
                    });
                    setPreviewUrls(prev => [...prev, ...newUrls]);
                } else {
                    const file = processedFiles[0];
                    if (file) {
                        const url = URL.createObjectURL(file);
                        setPreviewUrls([url]);
                        onChange?.(file);
                    }
                }
            } catch (error) {
                console.error("Error processing images:", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = (index: number) => {
        if (multiple) {
            setPreviewUrls(prev => prev.filter((_, i) => i !== index));
            setFiles(prev => {
                const updated = prev.filter((_, i) => i !== index);
                return updated;
            });
            // Note: If removing an initial image, this logic might be tricky if mixed with new files.
            // For simplicity in this iteration, we assume local files for strictly new additions or full replacement.
            // However, typical behavior for 'initialImages' is just for display, usually cannot "delete" them without ID.
            // But since this is a simple mockish implementation, let's just update the view.
        } else {
            setPreviewUrls([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onChange?.(null);
        }
    };

    return (
        <div className="flex flex-col w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                multiple={multiple}
            />

            {(previewUrls.length === 0) ? (
                <div
                    onClick={!isProcessing ? handleBrowseClick : undefined}
                    className={`group relative flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#315368] ${!isProcessing ? 'hover:border-indigo-500/50 dark:hover:border-primary/50 cursor-pointer' : 'cursor-wait opacity-70'} bg-slate-50 dark:bg-[#101c23]/50 px-6 py-12 transition-all`}
                >
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Processing images...</p>
                        </div>
                    ) : (
                        <>
                            <div className="size-20 rounded-full bg-indigo-50 dark:bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-indigo-600 dark:text-primary">cloud_upload</span>
                            </div>
                            <div className="flex max-w-[480px] flex-col items-center gap-2">
                                <p className="text-slate-900 dark:text-white text-xl font-bold tracking-tight text-center">
                                    {multiple ? 'Upload Asset Photos' : 'Upload User Photo'}
                                </p>
                                <p className="text-slate-500 dark:text-[#90b4cb] text-sm font-normal leading-relaxed text-center">
                                    Drag and drop or click to upload.
                                    Supported formats: JPEG, PNG.
                                    {targetDimensions && ` Images will be resized to ${targetDimensions.width}x${targetDimensions.height}.`}
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
                        </>
                    )}
                </div>
            ) : (
                <div className={`grid gap-4 ${multiple ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                    {previewUrls.map((url, index) => (
                        <div key={index} className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-[#315368]">
                            <img
                                src={url}
                                alt={`Preview ${index}`}
                                className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                { /* Only show browse on simple single mode or add a generic "add morE" button elsewhere */}
                                {!multiple && (
                                    <button
                                        type="button"
                                        onClick={handleBrowseClick}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="p-3 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {multiple && (
                        <div
                            onClick={handleBrowseClick}
                            className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#315368] hover:border-indigo-500/50 dark:hover:border-primary/50 bg-slate-50 dark:bg-[#101c23]/50 cursor-pointer transition-all"
                        >
                            <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500">add_photo_alternate</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">Add More</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

