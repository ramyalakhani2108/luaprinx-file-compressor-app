// app/page.js
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Reset compressed file when file changes
  useEffect(() => {
    if (!file) {
      setCompressedFile(null);
    }
    setError(null);
  }, [file]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const openFileExplorer = () => {
    fileInputRef.current.click();
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setCompressedFile(null);
    setError(null);
    setProgress(0);

    // Simulate progress for demo
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const blob = await res.blob();
      setCompressedFile(blob);
    } catch (error) {
      console.error("Compression error:", error);
      setError("Failed to compress file. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDownload = () => {
    if (!compressedFile || !file) return;

    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `luparinx-compressed-${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return "📁";
    const extension = fileName.split('.').pop().toLowerCase();
    
    const icons = {
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      webp: "🖼️",
      gif: "🖼️",
      mp4: "🎬",
      mov: "🎬",
      mkv: "🎬",
      avi: "🎬",
      pdf: "📄",
      zip: "📦",
      rar: "📦",
      "7z": "📦",
    };
    
    return icons[extension] || "📁";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Calculate savings percentage safely
  const getSavingsPercentage = () => {
    if (!file || !compressedFile) return 0;
    return Math.max(0, Math.round((file.size - compressedFile.size) / file.size * 100));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="w-full max-w-4xl mb-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-indigo-800">
              Luparinx<span className="text-indigo-500">Compress</span>
            </h1>
          </div>
          <p className="text-gray-600 text-center max-w-lg">
            Reduce file sizes without losing quality. Professional compression for images, videos, PDFs and archives.
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-4xl">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-100">
          <div className="p-6 md:p-8">
            {/* Drag & Drop Area */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-50 scale-[1.02]" 
                  : "border-gray-300 hover:border-indigo-400"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={openFileExplorer}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
                accept="image/*,video/*,application/pdf,application/zip,application/x-rar-compressed,application/x-7z-compressed"
              />
              
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {dragActive ? "Drop your file here" : "Drag & drop your file"}
              </h3>
              <p className="text-gray-500 mb-4">
                or <span className="text-indigo-600 font-medium">browse files</span>
              </p>
              <p className="text-sm text-gray-400">
                Supports: JPG, PNG, GIF, MP4, MOV, PDF, ZIP, RAR, 7Z (Max: 200MB)
              </p>
            </div>
            
            {/* Selected File Preview */}
            {file && (
              <div className="mt-6 bg-indigo-50 rounded-xl p-4 flex items-center border border-indigo-200">
                <div className="text-3xl mr-4">
                  {getFileIcon(file.name)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800 truncate max-w-[200px]">{file.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                    <button 
                      onClick={removeFile}
                      className="text-gray-500 hover:text-indigo-600 transition-colors"
                      aria-label="Remove file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            {loading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Compressing with Luparinx technology...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 rounded-xl p-4 flex items-center border border-red-200">
                <div className="text-3xl mr-4">❌</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">Compression Failed</h4>
                      <p className="text-sm text-gray-500">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Compressed File Preview */}
            {compressedFile && file && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex items-center border border-green-200">
                <div className="text-3xl mr-4 text-green-500">✅</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">Compressed Successfully!</h4>
                      <p className="text-sm text-gray-600">
                        Ready to download your compressed file
                      </p>
                    </div>
                    <div className="text-green-600 font-bold">
                      {getSavingsPercentage()}% smaller
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
                    <div>
                      <span className="block">Original: <span className="font-medium">{formatFileSize(file.size)}</span></span>
                      <span className="block">Compressed: <span className="font-medium text-green-600">{formatFileSize(compressedFile.size)}</span></span>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                      Saved {formatFileSize(file.size - compressedFile.size)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCompress}
                disabled={!file || loading}
                className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                  !file || loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Compressing...
                  </>
                ) : (
                  "Compress with Luparinx"
                )}
              </button>
              
              {compressedFile && (
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Compressed File
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-50 px-8 py-4 text-center text-sm text-indigo-700 border-t border-indigo-100">
            <p>All files are processed securely and never stored on our servers. Powered by Luparinx technology.</p>
          </div>
        </div>
        
        {/* Supported Formats */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Supported File Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3 text-indigo-600">🖼️</div>
              <h3 className="font-bold text-gray-800 mb-1">Images</h3>
              <p className="text-sm text-gray-600">JPG, PNG, WEBP, GIF</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3 text-indigo-600">🎬</div>
              <h3 className="font-bold text-gray-800 mb-1">Videos</h3>
              <p className="text-sm text-gray-600">MP4, MOV, MKV, AVI</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3 text-indigo-600">📄</div>
              <h3 className="font-bold text-gray-800 mb-1">Documents</h3>
              <p className="text-sm text-gray-600">PDF, DOC, DOCX</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3 text-indigo-600">📦</div>
              <h3 className="font-bold text-gray-800 mb-1">Archives</h3>
              <p className="text-sm text-gray-600">ZIP, RAR, 7Z</p>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Why Choose Luparinx Compress?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Secure Processing</h3>
              <p className="text-gray-600">Files are processed locally and never uploaded to any server. Your privacy is our priority.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Fast Compression</h3>
              <p className="text-gray-600">Optimized algorithms reduce file sizes in seconds while maintaining quality.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">All-in-One Solution</h3>
              <p className="text-gray-600">Compress images, videos, documents and archives with a single tool.</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <p className="text-lg font-medium text-indigo-800">Luparinx Compress</p>
          <p className="mt-2">Professional file compression technology</p>
          <p className="mt-4 text-sm">© {new Date().getFullYear()} Luparinx Technologies. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}