
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { Download, Loader2, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BackgroundRemover: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setProcessedImage('');
    }
  };

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      // Fetch the image and convert to blob
      const response = await fetch(originalImage);
      const blob = await response.blob();
      
      // Load image element
      const imageElement = await loadImage(blob);
      
      // Remove background
      const processedBlob = await removeBackground(imageElement);
      
      // Create URL for processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImage(processedUrl);
      
      toast({
        title: "Sucesso!",
        description: "Fundo removido com sucesso.",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'logo-sem-fundo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process the current logo automatically
  useEffect(() => {
    const processCurrentLogo = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch('/lovable-uploads/be97db19-c61d-4e37-905a-65b5d5b74d82.png');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setOriginalImage(url);
        
        const imageElement = await loadImage(blob);
        const processedBlob = await removeBackground(imageElement);
        const processedUrl = URL.createObjectURL(processedBlob);
        setProcessedImage(processedUrl);
        
        toast({
          title: "Logo processada!",
          description: "O fundo da logo foi removido automaticamente.",
        });
      } catch (error) {
        console.error('Error processing current logo:', error);
        toast({
          title: "Aviso",
          description: "Não foi possível processar a logo atual automaticamente.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processCurrentLogo();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Remover Fundo da Imagem</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button variant="outline" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Carregar Nova Imagem
              </Button>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {originalImage && (
              <div className="space-y-2">
                <h3 className="font-semibold text-center">Imagem Original</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto max-h-64 object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            {processedImage && (
              <div className="space-y-2">
                <h3 className="font-semibold text-center">Fundo Removido</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-transparent" style={{
                  backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}>
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="w-full h-auto max-h-64 object-contain mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {originalImage && !processedImage && (
              <Button 
                onClick={processImage} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Remover Fundo'
                )}
              </Button>
            )}
            
            {processedImage && (
              <Button 
                onClick={downloadImage}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Imagem
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackgroundRemover;
