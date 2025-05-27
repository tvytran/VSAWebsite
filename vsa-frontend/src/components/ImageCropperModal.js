import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Helper function to get cropped image as a Blob
const getCroppedImg = (image, crop, fileName) => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 1); // Specify image format and quality
  });
};

function ImageCropperModal({ imageUrl, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState(); // Initialize crop state without values
  const imgRef = useRef(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  // Function to set initial crop when image loads
  const onImageLoad = useCallback((e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 50, // Initial crop width percentage
        },
        1 / 1, // Aspect ratio (square)
        width,
        height
      ),
      width,
      height
    );

    setCrop(newCrop);
  }, []);

  // Handle save button click
  const handleSave = useCallback(async () => {
    console.log('handleSave called'); // Log when handleSave is called
    console.log('completedCrop:', completedCrop); // Log completedCrop state
    console.log('imgRef.current:', imgRef.current); // Log imgRef.current

    if (!completedCrop || !imgRef.current) {
      console.log('Save aborted: completedCrop or imgRef.current missing'); // Log if save is aborted
      return;
    }
    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'profile.jpeg'
      );
      onCropComplete(croppedBlob); // Pass the blob to the parent
    } catch (e) {
      console.error('Error cropping image:', e);
      // Handle error (e.g., show error message)
    }
  }, [completedCrop, onCropComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Crop Profile Picture</h2>
        {imageUrl && (
          <div className="relative flex justify-center" style={{ width: '300px', height: '300px', overflow: 'hidden' }}>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => {
                setCompletedCrop(c);
                console.log('onComplete called with:', c); // Log when onComplete is called
              }}
              aspect={1 / 1}
              circularCrop // Make the crop area circular
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageUrl}
                onLoad={onImageLoad}
                style={{ display: 'block', maxHeight: '100%', maxWidth: '100%' }} // Ensure image fits and is block level
              />
            </ReactCrop>
          </div>
        )}
        {/* react-image-crop handles zoom differently, typically not with a separate slider */}
        {/* You can implement zoom manually if needed, but it's not built-in like react-easy-crop */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#b32a2a] text-white rounded-md"
            disabled={!completedCrop}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal; 