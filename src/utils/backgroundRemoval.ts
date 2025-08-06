// Background removal functionality temporarily disabled for compatibility

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  throw new Error('Background removal functionality is temporarily disabled for compatibility');
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};