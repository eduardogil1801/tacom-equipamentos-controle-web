import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Palette, Save, RotateCcw, Upload, FileSpreadsheet } from 'lucide-react';

interface ColorSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [colorSettings, setColorSettings] = useState<ColorSettings>({
    primary: '#DC2626',
    secondary: '#16A34A',
    accent: '#3B82F6',
    background: '#F9FAFB'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      console.log('Carregando configurações para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('configuracoes')
        .select('tema_cores')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      console.log('Dados carregados:', data);

      if (data?.tema_cores) {
        try {
          // Parse do JSON se for string, ou use diretamente se já for objeto
          const colors = typeof data.tema_cores === 'string' 
            ? JSON.parse(data.tema_cores) 
            : data.tema_cores;
          
          console.log('Cores parseadas:', colors);
          
          if (colors && typeof colors === 'object' && 'primary' in colors) {
            setColorSettings(colors as ColorSettings);
            applyColors(colors as ColorSettings);
          }
        } catch (parseError) {
          console.error('Erro ao fazer parse das cores:', parseError);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const applyColors = (colors: ColorSettings) => {
    console.log('Aplicando cores:', colors);
    const root = document.documentElement;
    
    // Converte hex para HSL para usar com CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Aplicar as cores no CSS
    root.style.setProperty('--primary', hexToHsl(colors.primary));
    root.style.setProperty('--secondary', hexToHsl(colors.secondary));
    root.style.setProperty('--accent', hexToHsl(colors.accent));
    root.style.setProperty('--background', hexToHsl(colors.background));
    
    // Aplicar cor de fundo diretamente no body
    document.body.style.backgroundColor = colors.background;
  };

  const saveSettings = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log('Salvando configurações:', colorSettings);
    
    try {
      // Converte para JSON string para garantir compatibilidade
      const colorsJson = JSON.stringify(colorSettings);
      
      // Primeiro, verifica se já existe uma configuração para o usuário
      const { data: existingConfig } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('usuario_id', user.id)
        .maybeSingle();

      console.log('Configuração existente:', existingConfig);

      let result;
      
      if (existingConfig) {
        console.log('Atualizando configuração existente...');
        result = await supabase
          .from('configuracoes')
          .update({
            tema_cores: colorsJson,
            updated_at: new Date().toISOString()
          })
          .eq('usuario_id', user.id)
          .select();
      } else {
        console.log('Criando nova configuração...');
        result = await supabase
          .from('configuracoes')
          .insert({
            usuario_id: user.id,
            tema_cores: colorsJson,
            updated_at: new Date().toISOString()
          })
          .select();
      }

      console.log('Resultado da operação:', result);

      if (result.error) {
        console.error('Erro no Supabase:', result.error);
        throw result.error;
      }

      applyColors(colorSettings);
      
      toast({
        title: "Configurações salvas",
        description: "Suas personalizações foram aplicadas com sucesso!",
      });
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    const defaultColors = {
      primary: '#DC2626',
      secondary: '#16A34A',
      accent: '#3B82F6',
      background: '#F9FAFB'
    };
    setColorSettings(defaultColors);
    applyColors(defaultColors);
    
    toast({
      title: "Configurações redefinidas",
      description: "As cores foram restauradas para o padrão.",
    });
  };

  const handleColorChange = (colorType: keyof ColorSettings, value: string) => {
    const newColors = {
      ...colorSettings,
      [colorType]: value
    };
    setColorSettings(newColors);
    // Aplica as cores em tempo real para pré-visualização
    applyColors(newColors);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Palette className="h-6 w-6" />
        Configurações
      </h1>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList>
          <TabsTrigger value="colors">Personalização de Cores</TabsTrigger>
          <TabsTrigger value="import">Importação de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Tema de Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={colorSettings.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-16 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={colorSettings.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      placeholder="#DC2626"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-16 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      placeholder="#16A34A"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent"
                      type="color"
                      value={colorSettings.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-16 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={colorSettings.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      placeholder="#3B82F6"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background"
                      type="color"
                      value={colorSettings.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-16 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={colorSettings.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      placeholder="#F9FAFB"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={saveSettings} 
                  disabled={loading} 
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetToDefault} 
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar Padrão
                </Button>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-muted">
                <h3 className="font-medium mb-2">Pré-visualização</h3>
                <div className="flex gap-2">
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm" 
                    style={{ backgroundColor: colorSettings.primary }}
                    title="Cor Primária"
                  />
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm" 
                    style={{ backgroundColor: colorSettings.secondary }}
                    title="Cor Secundária"
                  />
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm" 
                    style={{ backgroundColor: colorSettings.accent }}
                    title="Cor de Destaque"
                  />
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm" 
                    style={{ backgroundColor: colorSettings.background }}
                    title="Cor de Fundo"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importação de Dados Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Alternativas para Importar Excel</h3>
                <p className="text-gray-600 mb-4">
                  Como o sistema não suporta arquivos Excel diretamente, você pode usar estas opções:
                </p>
                
                <div className="text-left space-y-3 max-w-md mx-auto">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">1. Google Sheets</h4>
                    <p className="text-sm text-blue-700">Carregue no Google Sheets e copie/cole os dados aqui</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">2. Converter para CSV</h4>
                    <p className="text-sm text-green-700">Salve como CSV e descreva a estrutura dos dados</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">3. Copiar Dados</h4>
                    <p className="text-sm text-purple-700">Copie algumas linhas de exemplo e cole aqui no chat</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900">4. Descrição Manual</h4>
                    <p className="text-sm text-orange-700">Descreva a estrutura e alguns dados de exemplo</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Escolha a opção mais conveniente para você e me informe no chat!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
