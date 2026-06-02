import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BookOpen, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import tacomLogo from '@/assets/tacom-logo.png';
import { toast } from '@/hooks/use-toast';

// Cores padrão TACOM
const SYSTEM_RED: [number, number, number] = [232, 62, 62];
const SYSTEM_GRAY: [number, number, number] = [110, 110, 110];
const TEXT_DARK: [number, number, number] = [40, 40, 40];

const loadLogo = (): Promise<{ dataUrl: string; w: number; h: number } | null> =>
  new Promise((resolve) => {
    fetch(tacomLogo)
      .then((r) => r.blob())
      .then((b) => {
        const fr = new FileReader();
        fr.onload = () => {
          const dataUrl = fr.result as string;
          const img = new Image();
          img.onload = () => resolve({ dataUrl, w: img.width, h: img.height });
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        };
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(b);
      })
      .catch(() => resolve(null));
  });

interface Section {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface DocPDFOptions {
  title: string;
  subtitle: string;
  fileName: string;
  sections: Section[];
}

const generateDocPDF = async ({ title, subtitle, fileName, sections }: DocPDFOptions) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;

  const logo = await loadLogo();

  const drawHeader = () => {
    // Barra vermelha topo
    doc.setFillColor(...SYSTEM_RED);
    doc.rect(0, 0, pageW, 24, 'F');

    if (logo) {
      const logoH = 14;
      const logoW = (logo.w / logo.h) * logoH;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(6, 5, logoW + 6, logoH + 4, 2, 2, 'F');
      doc.addImage(logo.dataUrl, 'PNG', 9, 7, logoW, logoH);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title.toUpperCase(), pageW / 2, 13, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(subtitle, pageW / 2, 19, { align: 'center' });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(...SYSTEM_GRAY);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageH - 10, pageW - marginX, pageH - 10);
    doc.setFontSize(8);
    doc.setTextColor(...SYSTEM_GRAY);
    doc.text('TACOM — Sistema de Controle de Equipamentos', marginX, pageH - 5);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageW - marginX, pageH - 5, { align: 'right' });
  };

  drawHeader();
  let y = 32;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 14) {
      doc.addPage();
      drawHeader();
      y = 32;
    }
  };

  // Apresentação inicial
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  const intro = doc.splitTextToSize(
    'Documento oficial gerado pelo sistema TACOM. Este material descreve em detalhes as funcionalidades e a finalidade de cada recurso, servindo como guia de referência rápida para usuários, operadores e administradores.',
    contentW
  );
  doc.text(intro, marginX, y);
  y += intro.length * 5 + 4;

  sections.forEach((section, idx) => {
    ensureSpace(20);
    // Faixa de título
    doc.setFillColor(...SYSTEM_RED);
    doc.rect(marginX, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${idx + 1}. ${section.title}`, marginX + 3, y + 5.6);
    y += 12;

    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    section.paragraphs.forEach((p) => {
      const lines = doc.splitTextToSize(p, contentW);
      ensureSpace(lines.length * 5 + 2);
      doc.text(lines, marginX, y);
      y += lines.length * 5 + 2;
    });

    if (section.bullets && section.bullets.length) {
      y += 1;
      section.bullets.forEach((b) => {
        const lines = doc.splitTextToSize(b, contentW - 6);
        ensureSpace(lines.length * 5 + 1);
        doc.setFillColor(...SYSTEM_RED);
        doc.circle(marginX + 1.5, y - 1.5, 0.9, 'F');
        doc.text(lines, marginX + 5, y);
        y += lines.length * 5 + 1;
      });
    }
    y += 4;
  });

  // Numerar páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(i, total);
  }

  doc.save(`${fileName}.pdf`);
};

const reportsDoc: Section[] = [
  {
    title: 'Empresas',
    paragraphs: [
      'Relatório consolidado de todas as empresas cadastradas no sistema, incluindo dados de identificação, contato e equipamentos vinculados.',
      'Ideia: oferecer uma visão gerencial das empresas parceiras e da quantidade de equipamentos em posse de cada uma.',
    ],
    bullets: [
      'Filtros por nome de empresa e código de operadora.',
      'Exportação em CSV, XLSX e PDF, além de impressão direta.',
      'Totais por empresa e por categoria de equipamento.',
    ],
  },
  {
    title: 'Status dos Equipamentos',
    paragraphs: [
      'Apresenta a situação atual de cada equipamento (disponível, em uso, em manutenção, aguardando manutenção, danificado, indisponível e devolvido).',
      'Ideia: permitir o monitoramento rápido da operação e identificar gargalos de disponibilidade.',
    ],
    bullets: [
      'Cores padronizadas conforme o Controle de Equipamentos.',
      'Filtros por status e tipo/modelo.',
    ],
  },
  {
    title: 'Distribuição de Equipamentos',
    paragraphs: [
      'Mostra a distribuição dos equipamentos por status e por tipo/modelo em gráficos de barras.',
      'Ideia: visualizar de forma analítica como a frota está alocada e detectar concentrações ou faltas.',
    ],
    bullets: [
      'Filtros multi-seleção de tipos e status com busca em tempo real.',
      'Exportação completa (CSV, XLSX, PDF) e impressão.',
    ],
  },
  {
    title: 'Movimentações',
    paragraphs: [
      'Histórico completo de entradas, saídas e movimentações de equipamentos entre empresas.',
      'Ideia: rastrear o ciclo de vida operacional de cada equipamento, com origem, destino, defeito relacionado e usuário responsável.',
    ],
    bullets: [
      'Filtros por equipamento, empresa, tipo de movimento e período.',
      'Colunas de Origem e Destino exibidas conforme o tipo de movimento.',
    ],
  },
  {
    title: 'Inventário',
    paragraphs: [
      'Lista detalhada dos equipamentos com tipo, modelo, status, estado (UF) e empresa atual.',
      'Ideia: servir como referência rápida de patrimônio e localização dos equipamentos.',
    ],
    bullets: [
      'Filtros por operadora, status e tipo de equipamento.',
      'Drill-down direto no equipamento para ver o histórico.',
    ],
  },
  {
    title: 'Histórico de Equipamentos / Histórico Detalhado',
    paragraphs: [
      'Permite consultar todo o histórico de um equipamento específico, incluindo movimentações, manutenções e defeitos.',
      'Ideia: dar suporte à auditoria e à investigação de problemas recorrentes em um item específico.',
    ],
  },
  {
    title: 'Frota (Faturamento por Serviço)',
    paragraphs: [
      'Consolida a frota por empresa e mês de referência, somando os serviços contratados (Simples C/Image, Simples S/Image, Seção, Nuvem, CITGIS, Buszoom, Telemetria).',
      'Ideia: subsidiar o faturamento mensal e oferecer uma visão completa da composição da frota.',
    ],
    bullets: [
      'Linha de TOTAL GERAL exibida apenas quando todas as empresas estão selecionadas.',
      'PDF com logo TACOM, cabeçalho cinza e total geral em vermelho.',
    ],
  },
  {
    title: 'Manutenções',
    paragraphs: [
      'Acompanha as manutenções realizadas, categorizadas em DR (Defeito de Recolhimento), DE (Defeito de Entrega) e Outros.',
      'Ideia: permitir análise de qualidade e priorização de ações corretivas.',
    ],
  },
  {
    title: 'Relatório Mensal',
    paragraphs: [
      'Consolidação mensal de movimentações, manutenções e status, ideal para apresentações gerenciais.',
    ],
  },
  {
    title: 'Estoque Detalhado',
    paragraphs: [
      'Análise dos níveis de estoque, com destaque para itens em níveis críticos.',
      'Ideia: apoiar o planejamento de compras e reposição.',
    ],
  },
];

const manualSections: Section[] = [
  {
    title: 'Introdução ao Sistema TACOM',
    paragraphs: [
      'O sistema TACOM centraliza o controle de equipamentos, movimentações, manutenções e relatórios operacionais das empresas atendidas.',
      'Este manual descreve cada módulo, cada tela e cada campo principal para facilitar o uso diário.',
    ],
  },
  {
    title: 'Acesso e Autenticação',
    paragraphs: [
      'O acesso é feito por usuário e senha. As senhas são armazenadas de forma criptografada (bcrypt).',
      'Existem dois tipos de perfil: administrador (acesso total) e operacional (acesso conforme permissões).',
    ],
    bullets: [
      'Login: informe e-mail e senha cadastrados.',
      'Logout: disponível no menu lateral.',
      'Esqueci minha senha: solicitar ao administrador a redefinição.',
    ],
  },
  {
    title: 'Dashboard',
    paragraphs: [
      'Tela inicial com indicadores resumidos: quantidade por status, distribuição por empresa e gráfico de manutenções por categoria de defeito (DR/DE/Outros).',
      'Os filtros do dashboard suportam busca em tempo real em todos os multi-selects.',
    ],
  },
  {
    title: 'Controle de Equipamentos',
    paragraphs: [
      'Lista todos os equipamentos cadastrados. Cada linha mostra código, tipo, modelo, status (com cor), empresa atual e ações.',
      'Status possíveis: Disponível (verde), Em Uso (azul), Manutenção (laranja), Aguardando Manutenção (amarelo), Danificado (vermelho), Indisponível (preto), Devolvido (preto).',
    ],
    bullets: [
      'Código: identificador único do equipamento.',
      'Tipo / Modelo: classificação do equipamento.',
      'Estado: UF onde o equipamento está localizado.',
      'Empresa: empresa atualmente responsável.',
      'Coluna de Manutenção: exibida apenas para itens em manutenção ou aguardando.',
    ],
  },
  {
    title: 'Cadastro de Equipamentos',
    paragraphs: [
      'Formulário para inclusão e edição de equipamentos.',
    ],
    bullets: [
      'Código (obrigatório, único).',
      'Tipo e Modelo.',
      'Estado (UF) — padrão Rio Grande do Sul.',
      'Empresa vinculada.',
      'Status inicial (geralmente Disponível).',
    ],
  },
  {
    title: 'Movimentações',
    paragraphs: [
      'Tela para registrar entrada, saída ou transferência de equipamentos entre empresas.',
      'O sistema atualiza automaticamente o status e a empresa vinculada após cada movimentação.',
    ],
    bullets: [
      'Tipo de movimento: entrada, saída ou movimentação.',
      'Empresa de origem e destino.',
      'Defeito relacionado (quando aplicável): DR, DE ou Outro.',
      'Data do movimento: posicionada antes dos campos de defeito.',
      'Observações livres.',
    ],
  },
  {
    title: 'Histórico de Movimentações',
    paragraphs: [
      'Lista todas as movimentações com filtros em cascata por equipamento, empresa e período.',
      'A coluna Defeito mostra DR/DE/Outro conforme registrado. As colunas Origem e Destino são preenchidas conforme o tipo do movimento.',
    ],
  },
  {
    title: 'Frota',
    paragraphs: [
      'Cadastro mensal da frota por empresa, com totais calculados automaticamente.',
    ],
    bullets: [
      'Simples C/Image (vem antes de Simples S/Image no formulário).',
      'Simples S/Image, Seção, Telemetria, CITGIS, Buszoom.',
      'Nuvem = Simples C/Image + Simples S/Image + Seção.',
      'Total = soma de todos os serviços.',
    ],
  },
  {
    title: 'Relatórios',
    paragraphs: [
      'Todos os relatórios suportam exportação em CSV, XLSX e PDF, além de impressão.',
      'Os PDFs seguem o padrão TACOM: barra vermelha no topo, logo TACOM em destaque e rodapé com paginação.',
    ],
  },
  {
    title: 'Permissões e Administração',
    paragraphs: [
      'Apenas administradores acessam as configurações de usuários, permissões e cadastros base.',
      'As permissões de relatórios são individuais e configuradas no módulo de gestão de usuários.',
    ],
  },
  {
    title: 'Boas Práticas',
    paragraphs: [
      'Mantenha sempre o status dos equipamentos atualizado para garantir relatórios fiéis à realidade.',
      'Registre movimentações o mais próximo possível do evento real, informando defeito quando aplicável.',
      'Utilize os filtros antes de exportar para reduzir o volume de dados e facilitar a leitura.',
    ],
  },
  {
    title: 'Suporte',
    paragraphs: [
      'Em caso de dúvidas, problemas ou solicitações de melhorias, acione a equipe TACOM responsável pelo sistema.',
    ],
  },
];

const DocumentationReport: React.FC = () => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleDownload = async (kind: 'reports' | 'manual') => {
    try {
      setLoadingKey(kind);
      if (kind === 'reports') {
        await generateDocPDF({
          title: 'Documentação dos Relatórios',
          subtitle: 'Descrição e finalidade de cada relatório do sistema',
          fileName: `tacom_documentacao_relatorios_${new Date().toISOString().slice(0, 10)}`,
          sections: reportsDoc,
        });
      } else {
        await generateDocPDF({
          title: 'Manual Completo do Sistema',
          subtitle: 'Guia detalhado de uso, campos e funcionalidades',
          fileName: `tacom_manual_sistema_${new Date().toISOString().slice(0, 10)}`,
          sections: manualSections,
        });
      }
      toast({ title: 'PDF gerado', description: 'O download foi iniciado.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível gerar o PDF.', variant: 'destructive' });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentação & Manual</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Baixe os documentos oficiais do sistema TACOM em PDF, com logo e cores padrão da empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-50 text-red-600">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle>Documentação dos Relatórios</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Explicação detalhada de cada relatório do sistema: o que mostra, qual a ideia por trás
              e quais filtros e exportações estão disponíveis.
            </p>
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDownload('reports')}
              disabled={loadingKey !== null}
            >
              <Download className="h-4 w-4 mr-2" />
              {loadingKey === 'reports' ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-50 text-red-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <CardTitle>Manual Completo do Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Guia completo com explicação de cada módulo, tela, campo e fluxo do sistema TACOM.
              Ideal para treinamento de novos usuários.
            </p>
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDownload('manual')}
              disabled={loadingKey !== null}
            >
              <Download className="h-4 w-4 mr-2" />
              {loadingKey === 'manual' ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentationReport;
