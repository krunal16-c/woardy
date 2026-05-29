import { useState, useRef, useCallback } from 'react';
import { scanWardrobe, confirmScan, IMG_BASE } from '../api.service';

const CATEGORIES = ['tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'dresses'];
const CAT_LABEL = { tops: 'Tops', bottoms: 'Bottoms', outerwear: 'Outerwear', shoes: 'Shoes', accessories: 'Accessories', dresses: 'Dresses' };

function Icon({ name, size = 20, filled = false, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${filled ? 500 : 300}, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

// ── Video → JPEG frames via Canvas ────────────────────────────────────────────
async function extractVideoFrames(videoFile, maxFrames = 12) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames = [];
    let frameIdx = 0;

    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(videoFile);

    const done = () => {
      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onloadedmetadata = () => {
      const W = Math.min(video.videoWidth, 1280);
      canvas.width = W;
      canvas.height = Math.round(W * (video.videoHeight / video.videoWidth));

      const dur = video.duration;
      const start = dur * 0.04;
      const end   = dur * 0.96;
      const step  = (end - start) / Math.max(maxFrames - 1, 1);

      const seekNext = () => {
        if (frameIdx >= maxFrames) { done(); return; }
        video.currentTime = start + frameIdx * step;
        frameIdx++;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) frames.push(new File([blob], `frame-${frameIdx}.jpg`, { type: 'image/jpeg' }));
          seekNext();
        }, 'image/jpeg', 0.82);
      };

      video.onerror = done;
      setTimeout(done, 40_000); // hard timeout
      seekNext();
    };

    video.onerror = done;
  });
}

// ── Step components ───────────────────────────────────────────────────────────

function UploadStep({ onScan }) {
  const [photos, setPhotos] = useState([]);   // File[]
  const [video, setVideo]   = useState(null); // File | null
  const [dragOver, setDragOver] = useState(false);
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  const addPhotos = useCallback(files => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    setPhotos(prev => [...prev, ...imgs].slice(0, 20));
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    const vid = Array.from(files).find(f => f.type.startsWith('video/'));
    if (vid) { setVideo(vid); return; }
    addPhotos(files);
  }, [addPhotos]);

  const canScan = photos.length > 0 || video !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* Photo upload */}
      <div>
        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.12em] mb-2.5">Photos</p>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => photoRef.current.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 ${
            dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-stone-200 hover:border-indigo-300 hover:bg-stone-50'
          }`}
        >
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => addPhotos(e.target.files)}
          />
          <Icon name="add_photo_alternate" size={28} className="text-stone-300 mb-2" />
          <p className="text-sm font-medium text-stone-500">Drop photos here or click to browse</p>
          <p className="text-xs text-stone-400 mt-1">Up to 20 images · JPG, PNG, WEBP</p>
        </div>

        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200"
                />
                <button
                  onClick={e => { e.stopPropagation(); setPhotos(p => p.filter((_, j) => j !== i)); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video upload */}
      <div>
        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.12em] mb-2.5">
          Video <span className="text-stone-400 normal-case font-normal tracking-normal">— walk through your wardrobe</span>
        </p>
        <div
          onClick={() => videoRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-150 ${
            video ? 'border-indigo-300 bg-indigo-50' : 'border-stone-200 hover:border-indigo-300 hover:bg-stone-50'
          }`}
        >
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => setVideo(e.target.files[0] || null)}
          />
          {video ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Icon name="videocam" size={20} filled />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-stone-700 truncate max-w-[200px]">{video.name}</p>
                  <p className="text-xs text-stone-400">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setVideo(null); }}
                className="text-stone-400 hover:text-red-500 transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ) : (
            <>
              <Icon name="videocam" size={28} className="text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-500">Upload a wardrobe walkthrough video</p>
              <p className="text-xs text-stone-400 mt-1">MP4, MOV, WEBM · frames extracted automatically</p>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => onScan(photos, video)}
        disabled={!canScan}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors duration-150"
      >
        <Icon name="auto_awesome" size={18} filled />
        Scan with Gemini AI
      </button>
    </div>
  );
}

function ScanningStep({ phase }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="auto_awesome" size={22} filled className="text-indigo-600" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-stone-800 text-[15px]">
          {phase === 'extracting' ? 'Extracting video frames…' : 'Analysing with Gemini…'}
        </p>
        <p className="text-stone-400 text-sm mt-1">
          {phase === 'extracting'
            ? 'Sampling frames from your video'
            : 'Identifying clothing items and cropping images'}
        </p>
      </div>
    </div>
  );
}

function ReviewStep({ items, onConfirm, onRescan, saving }) {
  const [list, setList] = useState(items);

  const update = (i, patch) => setList(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  const remove = i => setList(prev => prev.filter((_, idx) => idx !== i));

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <Icon name="search_off" size={40} className="text-stone-300" />
        <p className="font-semibold text-stone-700">No clothing items detected</p>
        <p className="text-stone-400 text-sm max-w-xs">
          Try uploading clearer photos with good lighting, or a video showing each item separately.
        </p>
        <button onClick={onRescan} className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Try again →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{list.length}</span> item{list.length !== 1 ? 's' : ''} detected — review before saving
        </p>
        <button onClick={onRescan} className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1">
          <Icon name="refresh" size={14} /> Re-scan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {list.map((item, i) => (
          <div key={i} className="bg-stone-50 border border-stone-100 rounded-2xl p-3 flex gap-3">
            {/* Cropped image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 border border-stone-200 shrink-0">
              {item.imageUrl && (
                <img
                  src={`${IMG_BASE}${item.imageUrl}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Editable fields */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <input
                value={item.name}
                onChange={e => update(i, { name: e.target.value })}
                className="w-full text-[13px] font-semibold text-stone-800 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <select
                value={item.category}
                onChange={e => update(i, { category: e.target.value })}
                className="w-full text-[12px] text-stone-600 bg-white border border-stone-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
              <div className="flex items-center gap-1.5">
                {item.color && (
                  <span className="text-[11px] text-stone-500 bg-white border border-stone-200 rounded-md px-2 py-0.5 capitalize">{item.color}</span>
                )}
                {item.tags?.slice(0, 2).map(t => (
                  <span key={t} className="text-[10px] text-indigo-600 bg-indigo-50 rounded-md px-1.5 py-0.5">{t}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => remove(i)}
              className="text-stone-300 hover:text-red-400 transition-colors shrink-0 self-start mt-0.5"
            >
              <Icon name="delete" size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => onConfirm(list)}
        disabled={saving || list.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors duration-150"
      >
        {saving ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
        ) : (
          <><Icon name="add_circle" size={18} filled /> Add {list.length} item{list.length !== 1 ? 's' : ''} to wardrobe</>
        )}
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function WardrobeScan({ onClose, onDone }) {
  const [step, setStep]       = useState('upload');   // upload | extracting | scanning | review | done
  const [detected, setDetected] = useState([]);
  const [error, setError]     = useState(null);
  const [saving, setSaving]   = useState(false);

  async function handleScan(photos, video) {
    setError(null);
    let allFiles = [...photos];

    if (video) {
      setStep('extracting');
      const frames = await extractVideoFrames(video);
      allFiles = [...allFiles, ...frames];
    }

    if (allFiles.length === 0) {
      setError('No images to scan. Please add photos or a video.');
      setStep('upload');
      return;
    }

    setStep('scanning');
    try {
      const fd = new FormData();
      allFiles.forEach(f => fd.append('images', f));
      const { items } = await scanWardrobe(fd);
      setDetected(items);
      setStep('review');
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      setStep('upload');
    }
  }

  async function handleConfirm(items) {
    setSaving(true);
    try {
      await confirmScan(items);
      setStep('done');
      onDone?.();
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-card-lg overflow-hidden flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Icon name="auto_awesome" size={18} filled />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-stone-900 leading-tight">Scan Wardrobe</h2>
              <p className="text-[11px] text-stone-400">
                {step === 'upload'    && 'Upload photos or a video'}
                {step === 'extracting' && 'Extracting frames…'}
                {step === 'scanning'  && 'Analysing with Gemini AI…'}
                {step === 'review'    && 'Review detected items'}
                {step === 'done'      && 'Items added to wardrobe'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Icon name="error" size={16} filled className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'upload' && (
            <UploadStep onScan={handleScan} />
          )}
          {(step === 'extracting' || step === 'scanning') && (
            <ScanningStep phase={step} />
          )}
          {step === 'review' && (
            <ReviewStep
              items={detected}
              onConfirm={handleConfirm}
              onRescan={() => setStep('upload')}
              saving={saving}
            />
          )}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <Icon name="check_circle" size={32} filled className="text-emerald-500" />
              </div>
              <p className="font-semibold text-stone-800 text-[15px]">Added to your wardrobe</p>
              <p className="text-stone-400 text-sm">All items are now in your wardrobe catalogue.</p>
              <button
                onClick={onClose}
                className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
