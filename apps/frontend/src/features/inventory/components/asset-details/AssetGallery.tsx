import { useRef } from 'react';
import { PhotoIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Asset } from "@/services/assetService";
import { uploadService } from "@/services/uploadService";
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import Swal from 'sweetalert2';

// Helper to normalize image data
interface ImageObject {
    url: string;
    caption?: string;
    filename?: string;
}

const normalizeImage = (img: string | ImageObject | null | undefined): ImageObject | null => {
    if (!img) return null;
    if (typeof img === 'string') {
        const parts = img.split('/');
        const filename = parts[parts.length - 1];
        return { url: img, filename };
    }
    if (typeof img === 'object' && img.url) {
        return img;
    }
    return null;
};

interface AssetGalleryProps {
    asset: Asset;
    onUpdate?: (id: string, data: Partial<Asset>) => Promise<void>;
}

// Client-side image resizing util
const resizeImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context error');

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) return reject('Canvas blob error');
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(resizedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export function AssetGallery({ asset, onUpdate }: AssetGalleryProps) {
    const images = (asset.images || [])
        .map(normalizeImage)
        .filter((img): img is ImageObject => img !== null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Swal.fire({
            title: 'Processing Image...',
            html: `
                <div class="mb-2">Optimizing</div>
                <div class="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                    <div id="swal-upload-progress" class="bg-primary h-2.5 rounded-full" style="width: 0%"></div>
                </div>
                <div id="swal-upload-status" class="mt-2 text-sm text-slate-500">Preparing...</div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const updateProgress = (percent: number, status: string) => {
            const bar = document.getElementById('swal-upload-progress');
            const statusText = document.getElementById('swal-upload-status');
            if (bar) bar.style.width = `${percent}%`;
            if (statusText) statusText.innerText = status;
        };

        try {
            updateProgress(10, 'Resizing image...');
            const resizedFile = await resizeImage(file);
            updateProgress(30, 'Uploading...');

            // 2. Upload with progress
            const { url, filename } = await uploadService.upload(resizedFile, (progress) => {
                const overallProgress = 30 + Math.round((progress * 0.6));
                updateProgress(overallProgress, `Uploading: ${progress}%`);
            });

            updateProgress(100, 'Finalizing...');

            const newImageObj: ImageObject = { url, filename, caption: '' };
            const updatedImages = [...images, newImageObj];

            if (onUpdate) {
                await onUpdate(asset.id || asset._id, { images: updatedImages });
            }

            Swal.fire({
                icon: 'success',
                title: 'Uploaded!',
                imageUrl: url,
                imageHeight: 200,
                imageAlt: 'Uploaded image',
                text: 'Image has been added to the gallery.',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error: any) {
            console.error("Upload failed", error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || "Failed to upload image"
            });
        }
    };

    const handleEditCaption = async (idx: number) => {
        const img = images[idx];
        if (!img) return;

        const { value: text } = await Swal.fire({
            title: 'Edit Caption',
            input: 'text',
            inputLabel: 'Image Caption',
            inputValue: img.caption || '',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    // return 'You need to write something!' // Optional validation
                }
            }
        });

        if (text !== undefined && onUpdate) {
            const updatedImages = [...images];
            // Ensure the image object at idx exists before spreading
            if (updatedImages[idx]) {
                updatedImages[idx] = { ...updatedImages[idx], caption: text };
                await onUpdate(asset.id || asset._id, { images: updatedImages });
                showSuccessToast('Caption updated');
            }
        }
    };

    const handleDeleteImage = async (idx: number) => {
        const img = images[idx];
        if (!img) return;

        const result = await Swal.fire({
            title: 'Delete Photo?',
            text: "This will permanently remove the photo and delete the file.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed && onUpdate) {
            try {
                // 1. Delete file from server (if filename exists)
                if (img.filename) {
                    await uploadService.delete(img.filename).catch(err => {
                        console.error("Failed to delete file from server, but will remove record", err);
                    });
                }

                // 2. Update asset record
                const updatedImages = images.filter((_, i) => i !== idx);
                await onUpdate(asset.id || asset._id, { images: updatedImages });

                showSuccessToast('Photo deleted');
            } catch (error) {
                showErrorToast('Failed to delete photo');
            }
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold dark:text-white">Visual Documentation</h3>
                </div>
                <p className="text-xs text-slate-500">{images.length} total images found</p>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Images */}
                    {images.map((img: ImageObject, idx: number) => (
                        <div key={idx} className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-black/5">
                            <img
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                alt={img.caption || `${asset.name} - view ${idx + 1}`}
                                src={img.url}
                            />

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditCaption(idx); }}
                                    className="p-1.5 bg-white/20 backdrop-blur rounded-full hover:bg-white/40 text-white transition"
                                    title="Edit Caption"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(idx); }}
                                    className="p-1.5 bg-red-500/80 backdrop-blur rounded-full hover:bg-red-500 text-white transition"
                                    title="Delete Photo"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Caption Bar */}
                            {img.caption && (
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2">
                                    <p className="text-[10px] text-white font-medium truncate text-center">{img.caption}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Upload Button */}
                    <button
                        onClick={handleUploadClick}
                        className="aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/5 hover:border-primary transition-all text-slate-500 hover:text-primary"
                    >
                        <PlusIcon className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload Photo</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <PhotoIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">No images available</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Upload photos to document this asset</p>
                    <button
                        onClick={handleUploadClick}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" /> Upload Photos
                    </button>
                </div>
            )}
        </section>
    );
}
