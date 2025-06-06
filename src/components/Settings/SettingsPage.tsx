
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Palette, Save, RotateCcw } from 'lucide-react';

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
      const { data, error } = await supabase
        .from('configuracoes')
        .select('tema_cores')
        .eq('usuario_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data?.tema_cores) {
        const colors = data.tema_cores as unknown as ColorSettings;
        if (colors && typeof colors === 'object' && 'primary' in colors) {
          setColorSettings(colors);
          applyColors(colors);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const applyColors = (colors: ColorSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
  };

  const saveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          usuario_id: user.id,
          tema_cores: colorSettings as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      applyColors(colorSettings);
      toast({
        title: "Configurações salvas",
        description: "Suas personalizações foram aplicadas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
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
  };

  const handleColorChange = (colorType: keyof ColorSettings, value: string) => {
    setColorSettings(prev => ({
      ...prev,
      [colorType]: value
    }));
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
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={colorSettings.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      placeholder="#DC2626"
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
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      placeholder="#16A34A"
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
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={colorSettings.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      placeholder="#3B82F6"
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
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={colorSettings.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      placeholder="#F9FAFB"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button variant="outline" onClick={resetToDefault} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restaurar Padrão
                </Button>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-muted">
                <h3 className="font-medium mb-2">Pré-visualização</h3>
                <div className="flex gap-2">
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300" 
                    style={{ backgroundColor: colorSettings.primary }}
                    title="Cor Primária"
                  />
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300" 
                    style={{ backgroundColor: colorSettings.secondary }}
                    title="Cor Secundária"
                  />
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300" 
                    style={{ backgroundColor: colorSettings.accent }}
                    title="Cor de Destaque"
                  />
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300" 
                    style={{ backgroundColor: colorSettings.background }}
                    title="Cor de Fundo"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de personalização do dashboard será implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
