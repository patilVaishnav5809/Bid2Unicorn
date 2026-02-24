import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageUpload({ value, onChange, bucket = 'logos', className = "" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (event) => {
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      const file = event.target.files[0];
      if (!file) return;

      // Basic validation
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }

      setUploadProgress(30);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(70);

      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
         throw new Error('Failed to generate public URL');
      }

      setUploadProgress(100);
      
      // Update parent component with the new URL
      onChange(data.publicUrl);
      toast.success('Image uploaded successfully');

    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Preview Area */}
        <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-[#19388A]/50 bg-[#0B1020] overflow-hidden flex-shrink-0 flex items-center justify-center group">
          {value ? (
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => { 
                const target = e.currentTarget;
                target.src = ''; 
                target.classList.add('hidden'); 
                if (target.nextSibling) {
                    /** @type {HTMLElement} */
                    (target.nextSibling).classList.remove('hidden'); 
                }
              }}
            />
          ) : null}
          <div className={`${value ? 'hidden' : 'flex'} flex-col items-center justify-center text-gray-500`}>
            <ImageIcon className="w-8 h-8 opacity-50 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Logo</span>
          </div>

          {/* Upload Overlay */}
          <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <UploadCloud className="w-6 h-6 text-white mb-1" />
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>

          {/* Loading State */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#4F91CD] animate-spin mb-2" />
              <span className="text-[10px] text-white font-bold">{uploadProgress}%</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-1 space-y-2">
           <Input 
             value={value || ''} 
             onChange={(e) => onChange(e.target.value)} 
             placeholder="Or paste an image URL directly..."
             className="bg-[#0B1020] border-[#19388A]/30 w-full"
           />
           <p className="text-xs text-gray-500">
             Maximum file size: 5MB. Recommended square aspect ratio.
           </p>
        </div>
      </div>
    </div>
  );
}
