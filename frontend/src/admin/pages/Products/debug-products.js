/**
 * Add this debug code to your Products.js file
 * Place it inside the Products component, before the return statement
 */

// Add this debugging code to Products.js component:

// DEBUG: Log image changes
useEffect(() => {
  console.log('🔍 DEBUG: formData.images changed:', formData.images);
  console.log('🔍 DEBUG: Image types:', formData.images.map(img => typeof img));
  console.log('🔍 DEBUG: Image details:', formData.images.map((img, idx) => ({
    index: idx,
    type: typeof img,
    isString: typeof img === 'string',
    isObject: typeof img === 'object',
    hasPreview: img && img.preview,
    hasFile: img && img.file,
    value: img
  })));
}, [formData.images]);

// DEBUG: Log when editing product
useEffect(() => {
  if (editingId) {
    console.log('🔍 DEBUG: Editing product ID:', editingId);
    console.log('🔍 DEBUG: Product images on edit:', formData.images);
  }
}, [editingId, formData.images]);

// DEBUG: Enhanced handleInputChange with logging
const debugHandleInputChange = (e) => {
  const { name, value, type, files } = e.target;
  
  console.log('🔍 DEBUG: handleInputChange called:', { name, value, type, files });
  
  if (type === "file" && files && files.length > 0) {
    console.log('🔍 DEBUG: Files selected:', Array.from(files).map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })));
    
    // convert to objects with preview for client-side preview
    const newImages = Array.from(files).map((f) => {
      const preview = URL.createObjectURL(f);
      console.log('🔍 DEBUG: Created preview for:', f.name, preview);
      return { file: f, preview };
    });
    
    console.log('🔍 DEBUG: New images array:', newImages);
    
    setFormData((prev) => {
      const updated = {
        ...prev,
        images: [...(prev.images || []), ...newImages],
      };
      console.log('🔍 DEBUG: Updated formData.images:', updated.images);
      return updated;
    });
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
};

// DEBUG: Enhanced handleSubmit with logging
const debugHandleSubmit = async (e) => {
  e.preventDefault();
  console.log('🔍 DEBUG: handleSubmit called');
  console.log('🔍 DEBUG: Current formData.images:', formData.images);
  
  try {
    setLoading(true);
    setError("");
    const payload = { ...formData };

    // Handle images: upload files to AWS S3 first
    const existingUrls = (payload.images || []).filter((i) => typeof i === "string");
    const fileObjs = (payload.images || []).filter((i) => i && typeof i === "object" && i.file);
    
    console.log('🔍 DEBUG: Existing URLs:', existingUrls);
    console.log('🔍 DEBUG: File objects to upload:', fileObjs);
    
    // Upload new images to AWS S3
    const uploadedUrls = [];
    for (const fileObj of fileObjs) {
      try {
        console.log('🔍 DEBUG: Uploading file:', fileObj.file.name);
        
        const formDataForUpload = new FormData();
        formDataForUpload.append('images', fileObj.file);
        
        const uploadRes = await adminClient.post('/upload/product-images', formDataForUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        console.log('🔍 DEBUG: Upload response:', uploadRes.data);
        
        if (uploadRes.data.urls && uploadRes.data.urls.length > 0) {
          uploadedUrls.push(...uploadRes.data.urls);
          console.log('🔍 DEBUG: Uploaded URLs:', uploadedUrls);
        }
      } catch (error) {
        console.error('🔍 DEBUG: Error uploading image:', error);
        throw error;
      }
    }
    
    payload.images = [...existingUrls, ...uploadedUrls];
    console.log('🔍 DEBUG: Final payload.images:', payload.images);

    // Continue with rest of the function...
    // (rest of your original handleSubmit code)
    
  } catch (err) {
    console.error('🔍 DEBUG: handleSubmit error:', err);
    setError(err.message || "Save failed");
  } finally {
    setLoading(false);
  }
};

// Replace your existing functions with these debug versions to see detailed logs
