import React, { useRef, useState } from "react";
import "../styles/imageEditor.css";

const ImageEditor = ({ onSave, onCancel, currentImage }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(currentImage || null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      resetTransforms();
    };
    reader.readAsDataURL(file);
  };

  const resetTransforms = () => {
    setScale(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = "rgba(200, 160, 72, 0.1)";
    ctx.fillRect(0, 0, size, size);

    // Draw circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw image
    const img = new Image();
    img.src = image;
    img.onload = () => {
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const imgWidth = img.width;
      const imgHeight = img.height;
      const ratio = Math.max(size / imgWidth, size / imgHeight);

      ctx.drawImage(
        img,
        offsetX - (imgWidth * ratio) / 2,
        offsetY - (imgHeight * ratio) / 2,
        imgWidth * ratio,
        imgHeight * ratio
      );
      ctx.restore();
    };
  };

  const handleCanvasMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setOffsetX((prev) => prev + deltaX / scale);
    setOffsetY((prev) => prev + deltaY / scale);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert to JPEG with aggressive quality compression to keep size < 200KB
    let quality = 0.6;
    let compressedBase64 = canvas.toDataURL("image/jpeg", quality);
    
    // Progressively reduce quality if still too large
    while (compressedBase64.length > 200000 && quality > 0.1) {
      quality -= 0.1;
      compressedBase64 = canvas.toDataURL("image/jpeg", quality);
    }
    
    onSave(compressedBase64);
  };

  React.useEffect(() => {
    drawPreview();
  }, [image, scale, rotation, offsetX, offsetY]);

  return (
    <div className="image-editor-overlay">
      <div className="image-editor-modal">
        <h2>Edit Profile Picture</h2>

        <div className="editor-content">
          {!image ? (
            <div className="upload-area">
              <p>📷 Select an image to upload</p>
              <button
                className="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <>
              <div className="preview-section">
                <canvas
                  ref={canvasRef}
                  className="preview-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                <p className="canvas-hint">Drag to move • Scroll to zoom</p>
              </div>

              <div className="controls-section">
                <div className="control-group">
                  <label>Zoom</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="slider"
                  />
                  <span className="value-display">{(scale * 100).toFixed(0)}%</span>
                </div>

                <div className="control-group">
                  <label>Rotate</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="slider"
                  />
                  <span className="value-display">{rotation}°</span>
                </div>

                <button
                  className="secondary"
                  onClick={() => {
                    resetTransforms();
                    handleFileSelect({ target: { files: [null] } });
                    setImage(null);
                  }}
                  style={{ marginTop: "12px", width: "100%" }}
                >
                  Change Image
                </button>
              </div>
            </>
          )}
        </div>

        <div className="editor-actions">
          <button className="secondary" onClick={onCancel}>
            Cancel
          </button>
          {image && (
            <button className="primary" onClick={handleSave}>
              Save Picture
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
