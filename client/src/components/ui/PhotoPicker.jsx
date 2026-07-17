import { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { resizeImageToBlob } from '../../lib/imageResize.js';

/**
 * Click-to-upload photo control. Resizes/crops to the standard ID-photo
 * size client-side (see imageResize.js) before handing the blob back via
 * onChange - the parent decides when/how to actually upload it.
 */
export default function PhotoPicker({ existingPhotoUrl, onChange, size = 96 }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  // Local preview object URL needs cleanup on unmount/replacement.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const blob = await resizeImageToBlob(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onChange(blob);
    } catch {
      setError('Could not process that image - try a different file.');
    }
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayUrl = previewUrl || existingPhotoUrl;

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-500 transition-colors"
          style={{ width: size, height: size * 1.33 }}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="Athlete" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-primary-500">
              <Camera size={20} />
              <span className="text-[10px] font-medium">Add Photo</span>
            </div>
          )}
        </button>
        <div className="text-xs text-slate-500">
          <p>Click to {displayUrl ? 'replace' : 'upload'} a photo.</p>
          <p className="text-slate-400">Auto-cropped to ID-photo size (3:4).</p>
          {displayUrl && (
            <button type="button" onClick={clear} className="mt-1 flex items-center gap-1 text-status-action hover:underline">
              <X size={12} /> Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-status-action">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={handleFile} className="hidden" />
    </div>
  );
}
