import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  Play,
  X,
  RefreshCw,
  Film,
  Search,
  FolderVideo,
  AlertCircle
} from 'lucide-react';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  url: string;
}

interface ListResult {
  success: boolean;
  files: VideoFile[];
  folder?: string;
  error?: string;
}

const electronAPI = (window as any).electronAPI;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const VideoPage: React.FC = () => {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadVideos = async () => {
    if (!electronAPI) return;
    setLoading(true);
    setError('');
    try {
      const result: ListResult = await electronAPI.listVideoFiles();
      if (result.success) {
        setFiles(result.files);
        setFolder(result.folder || '');
      } else {
        setError(result.error || 'Erro ao listar vídeos.');
        setFiles([]);
        setFolder(result.folder || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleSelectFolder = async () => {
    if (!electronAPI) return;
    const result = await electronAPI.selectVideoFolder();
    if (result.success) {
      await loadVideos();
    }
  };

  const handleOpenFolder = async () => {
    if (!electronAPI) return;
    await electronAPI.openVideoFolder();
  };

  const handlePlay = (video: VideoFile) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setSelectedVideo(null);
  };

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!electronAPI) {
    return (
      <div className="flex items-center justify-center min-h-96 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <p className="text-gray-600">Este recurso está disponível apenas no aplicativo desktop.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Film className="h-6 w-6" />
            Vídeos
          </h2>
          {folder && (
            <p className="text-xs text-gray-500 mt-1 truncate max-w-xl" title={folder}>
              {folder}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleOpenFolder}>
            <FolderOpen className="h-4 w-4 mr-1" />
            Abrir pasta
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectFolder}>
            <FolderVideo className="h-4 w-4 mr-1" />
            Trocar pasta
          </Button>
          <Button variant="outline" size="sm" onClick={loadVideos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Player de vídeo */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
              <span className="text-white text-sm truncate max-w-md" title={selectedVideo.name}>
                {selectedVideo.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
                onClick={handleClosePlayer}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <video
              ref={videoRef}
              src={selectedVideo.url}
              controls
              autoPlay
              className="w-full max-h-[75vh] bg-black"
            />
          </div>
        </div>
      )}

      {/* Busca */}
      {files.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar vídeo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Lista de vídeos */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Film className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">
            {search ? 'Nenhum vídeo encontrado para a busca.' : 'Nenhum vídeo encontrado na pasta.'}
          </p>
          {!search && !error && (
            <p className="text-sm mt-1">
              Certifique-se de que a pasta contém arquivos de vídeo (.mp4, .mkv, .avi, etc.)
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(video => (
            <Card
              key={video.path}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handlePlay(video)}
            >
              <CardContent className="p-0">
                <div className="bg-gray-900 aspect-video flex items-center justify-center relative">
                  <Film className="h-12 w-12 text-gray-600" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="bg-white/90 rounded-full p-3">
                      <Play className="h-6 w-6 text-gray-800 fill-gray-800" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p
                    className="text-sm font-medium text-gray-800 truncate"
                    title={video.name}
                  >
                    {video.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(video.size)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoPage;
