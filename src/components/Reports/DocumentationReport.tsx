import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BookOpen, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import tacomLogo from '@/assets/tacom-logo.png';
import loginScreen from '@/assets/doc-login-screen.png';
import { toast } from '@/hooks/use-toast';

// Cores padrão TACOM
const SYSTEM_RED: [number, number, number] = [232, 62, 62];
const SYSTEM_RED_DARK: [number, number, number] = [180, 35, 35];
const SYSTEM_GRAY: [number, number, number] = [110, 110, 110];
const TEXT_DARK: [number, number, number] = [40, 40, 40];

const loadImage = (src: string): Promise<{ dataUrl: string; w: number; h: number } | null> =>
  new Promise((resolve) => {
    fetch(src)
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

type IllustrationKind =
  | 'status-legend'
  | 'sample-table'
  | 'header-mockup'
  | 'movement-flow'
  | 'defect-categories'
  | 'frota-card'
  | 'filter-panel'
  | 'export-bar';

interface Section {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  illustration?: IllustrationKind;
  imageSrc?: string;
  imageCaption?: string;
}

interface DocPDFOptions {
  title: string;
  subtitle: string;
  fileName: string;
  sections: Section[];
}

// ============ Ilustrações desenhadas no PDF ============
const drawStatusLegend = (doc: jsPDF, x: number, y: number, w: number): number => {
  const statuses: Array<[string, [number, number, number]]> = [
    ['Disponível', [22, 163, 74]],
    ['Em Uso', [37, 99, 235]],
    ['Manutenção', [249, 115, 22]],
    ['Aguardando Manut.', [234, 179, 8]],
    ['Danificado', [220, 38, 38]],
    ['Indisponível', [0, 0, 0]],
    ['Devolvido', [0, 0, 0]],
  ];
  const cardH = 30;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(x, y, w, cardH, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Legenda de Status (Controle de Equipamentos)', x + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  const colW = w / 4;
  statuses.forEach((s, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = x + 3 + col * colW;
    const cy = y + 10 + row * 8;
    doc.setFillColor(...s[1]);
    doc.roundedRect(cx, cy, 6, 4, 1, 1, 'F');
    doc.setTextColor(...TEXT_DARK);
    doc.text(s[0], cx + 8, cy + 3);
  });
  return cardH + 4;
};

const drawSampleTable = (doc: jsPDF, x: number, y: number, w: number): number => {
  const headers = ['Empresa', 'Mês Ref.', 'Simples C/I', 'Simples S/I', 'Nuvem', 'Total'];
  const rows = [
    ['TRANSBUS', '12/2025', '31', '21', '52', '52'],
    ['VIAMÃO', '12/2025', '32', '42', '248', '248'],
    ['SOUL', '12/2025', '197', '35', '232', '232'],
  ];
  const totalRow = ['TOTAL GERAL', '', '260', '98', '532', '532'];
  const rowH = 5.5;
  const colW = w / headers.length;
  // header
  doc.setFillColor(...SYSTEM_GRAY);
  doc.rect(x, y, w, rowH, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, x + i * colW + 1.5, y + 3.8));
  // body
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  rows.forEach((r, ri) => {
    const yy = y + rowH + ri * rowH;
    if (ri % 2 === 1) {
      doc.setFillColor(248, 235, 235);
      doc.rect(x, yy, w, rowH, 'F');
    }
    r.forEach((c, i) => doc.text(c, x + i * colW + 1.5, yy + 3.8));
  });
  // total row
  const ty = y + rowH + rows.length * rowH;
  doc.setFillColor(...SYSTEM_RED_DARK);
  doc.rect(x, ty, w, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  totalRow.forEach((c, i) => doc.text(c, x + i * colW + 1.5, ty + 3.8));
  const totalH = rowH * (rows.length + 2);
  // caption
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...SYSTEM_GRAY);
  doc.text('Exemplo: tabela do Relatório de FROTA (PDF)', x, y + totalH + 4);
  return totalH + 8;
};

const drawHeaderMockup = (
  doc: jsPDF,
  logo: { dataUrl: string; w: number; h: number } | null,
  x: number,
  y: number,
  w: number,
): number => {
  const h = 18;
  doc.setFillColor(...SYSTEM_RED);
  doc.roundedRect(x, y, w, h, 1, 1, 'F');
  if (logo) {
    const logoH = 10;
    const logoW = (logo.w / logo.h) * logoH;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + 2, y + 4, logoW + 4, logoH + 2, 1, 1, 'F');
    doc.addImage(logo.dataUrl, 'PNG', x + 4, y + 5, logoW, logoH);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RELATÓRIO TACOM', x + w / 2, y + 11, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...SYSTEM_GRAY);
  doc.text('Modelo do cabeçalho aplicado em todos os PDFs', x, y + h + 4);
  return h + 8;
};

const drawMovementFlow = (doc: jsPDF, x: number, y: number, w: number): number => {
  const boxW = (w - 24) / 3;
  const boxH = 14;
  const labels = ['ORIGEM', 'EQUIPAMENTO', 'DESTINO'];
  const colors: [number, number, number][] = [
    [37, 99, 235],
    [232, 62, 62],
    [22, 163, 74],
  ];
  labels.forEach((l, i) => {
    const bx = x + i * (boxW + 12);
    doc.setFillColor(...colors[i]);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(l, bx + boxW / 2, y + 9, { align: 'center' });
    if (i < 2) {
      // arrow
      doc.setDrawColor(...SYSTEM_GRAY);
      doc.setLineWidth(0.6);
      const ax = bx + boxW + 1;
      const ay = y + boxH / 2;
      doc.line(ax, ay, ax + 10, ay);
      doc.line(ax + 10, ay, ax + 7, ay - 2);
      doc.line(ax + 10, ay, ax + 7, ay + 2);
    }
  });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...SYSTEM_GRAY);
  doc.text('Fluxo de movimentação: empresa de origem → equipamento → empresa de destino', x, y + boxH + 4);
  return boxH + 8;
};

const drawDefectCategories = (doc: jsPDF, x: number, y: number, w: number): number => {
  const cats = [
    { code: 'DR', label: 'Defeito de Recolhimento', color: [220, 38, 38] as [number, number, number] },
    { code: 'DE', label: 'Defeito de Entrega', color: [249, 115, 22] as [number, number, number] },
    { code: 'OUTRO', label: 'Outras manutenções', color: [110, 110, 110] as [number, number, number] },
  ];
  const boxW = (w - 8) / 3;
  const boxH = 18;
  cats.forEach((c, i) => {
    const bx = x + i * (boxW + 4);
    doc.setDrawColor(...c.color);
    doc.setLineWidth(0.6);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'FD');
    doc.setFillColor(...c.color);
    doc.roundedRect(bx, y, 12, boxH, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(c.code, bx + 6, y + boxH / 2 + 1.5, { align: 'center' });
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(c.label, bx + 14, y + boxH / 2 + 1);
  });
  return boxH + 4;
};

const drawFrotaCard = (doc: jsPDF, x: number, y: number, w: number): number => {
  const h = 28;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SYSTEM_RED);
  doc.text('CÁLCULO DA FROTA', x + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Nuvem = Simples C/Image + Simples S/Image + Seção', x + 3, y + 11);
  doc.text('Total = Nuvem + Telemetria + CITGIS + Buszoom', x + 3, y + 16);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...SYSTEM_GRAY);
  doc.setFontSize(7.5);
  doc.text('Os totais são recalculados automaticamente ao salvar.', x + 3, y + 23);
  return h + 4;
};

const drawFilterPanel = (doc: jsPDF, x: number, y: number, w: number): number => {
  const h = 22;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text('FILTROS', x + 3, y + 5);
  const colW = (w - 12) / 3;
  ['Empresa', 'Status', 'Período'].forEach((l, i) => {
    const bx = x + 3 + i * (colW + 1.5);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, y + 8, colW, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SYSTEM_GRAY);
    doc.text(l, bx + 2, y + 14);
    doc.setTextColor(...SYSTEM_GRAY);
    doc.text('▾', bx + colW - 3, y + 14);
  });
  return h + 4;
};

const drawExportBar = (doc: jsPDF, x: number, y: number, w: number): number => {
  const buttons = [
    { label: 'Imprimir', color: [110, 110, 110] as [number, number, number] },
    { label: 'PDF', color: [232, 62, 62] as [number, number, number] },
    { label: 'CSV', color: [37, 99, 235] as [number, number, number] },
    { label: 'XLSX', color: [22, 163, 74] as [number, number, number] },
  ];
  const btnW = 22;
  const btnH = 8;
  buttons.forEach((b, i) => {
    const bx = x + i * (btnW + 3);
    doc.setFillColor(...b.color);
    doc.roundedRect(bx, y, btnW, btnH, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(b.label, bx + btnW / 2, y + 5.5, { align: 'center' });
  });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...SYSTEM_GRAY);
  doc.text('Barra de exportação disponível em todos os relatórios', x, y + btnH + 4);
  return btnH + 8;
};

const drawIllustration = (
  doc: jsPDF,
  kind: IllustrationKind,
  logo: { dataUrl: string; w: number; h: number } | null,
  x: number,
  y: number,
  w: number,
): number => {
  switch (kind) {
    case 'status-legend':
      return drawStatusLegend(doc, x, y, w);
    case 'sample-table':
      return drawSampleTable(doc, x, y, w);
    case 'header-mockup':
      return drawHeaderMockup(doc, logo, x, y, w);
    case 'movement-flow':
      return drawMovementFlow(doc, x, y, w);
    case 'defect-categories':
      return drawDefectCategories(doc, x, y, w);
    case 'frota-card':
      return drawFrotaCard(doc, x, y, w);
    case 'filter-panel':
      return drawFilterPanel(doc, x, y, w);
    case 'export-bar':
      return drawExportBar(doc, x, y, w);
    default:
      return 0;
  }
};

// ============ Geração do PDF ============
const generateDocPDF = async ({ title, subtitle, fileName, sections }: DocPDFOptions) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;

  const logo = await loadImage(tacomLogo);

  const drawHeader = () => {
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
    'Documento oficial gerado pelo sistema TACOM. Este material descreve em detalhes as funcionalidades e a finalidade de cada recurso, com diagramas ilustrativos para facilitar o entendimento.',
    contentW,
  );
  doc.text(intro, marginX, y);
  y += intro.length * 5 + 4;

  for (let idx = 0; idx < sections.length; idx++) {
    const section = sections[idx];
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

    // Imagem real (screenshot)
    if (section.imageSrc) {
      const img = await loadImage(section.imageSrc);
      if (img) {
        const maxW = contentW;
        const ratio = img.h / img.w;
        let drawW = maxW;
        let drawH = drawW * ratio;
        const maxH = 110;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH / ratio;
        }
        ensureSpace(drawH + 8);
        const cx = marginX + (contentW - drawW) / 2;
        // moldura
        doc.setDrawColor(...SYSTEM_GRAY);
        doc.setLineWidth(0.3);
        doc.rect(cx - 0.5, y - 0.5, drawW + 1, drawH + 1);
        doc.addImage(img.dataUrl, 'PNG', cx, y, drawW, drawH);
        y += drawH + 3;
        if (section.imageCaption) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...SYSTEM_GRAY);
          doc.text(section.imageCaption, marginX + contentW / 2, y, { align: 'center' });
          y += 5;
        }
      }
    }

    // Ilustração desenhada
    if (section.illustration) {
      y += 2;
      const needed =
        section.illustration === 'sample-table'
          ? 40
          : section.illustration === 'status-legend'
            ? 40
            : 30;
      ensureSpace(needed);
      const used = drawIllustration(doc, section.illustration, logo, marginX, y, contentW);
      y += used;
    }

    y += 4;
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(i, total);
  }

  doc.save(`${fileName}.pdf`);
};

// ============ Conteúdo: Documentação dos Relatórios ============
const reportsDoc: Section[] = [
  {
    title: 'Padrão dos PDFs',
    paragraphs: [
      'Todos os PDFs gerados pelo sistema seguem o mesmo padrão visual: barra superior vermelha com o logo TACOM, título centralizado, cabeçalho de tabela em cinza, linhas alternadas em rosa-claro e rodapé com paginação.',
    ],
    illustration: 'header-mockup',
  },
  {
    title: 'Exportação e Impressão',
    paragraphs: [
      'Cada relatório possui uma barra de exportação completa com botões para Imprimir, gerar PDF, CSV e XLSX.',
    ],
    illustration: 'export-bar',
  },
  {
    title: 'Empresas',
    paragraphs: [
      'Relatório consolidado de todas as empresas cadastradas, incluindo dados de identificação, contato e equipamentos vinculados.',
      'Ideia: oferecer uma visão gerencial das empresas parceiras e da quantidade de equipamentos em posse de cada uma.',
    ],
    bullets: [
      'Filtros por nome de empresa e código de operadora.',
      'Totais por empresa e por categoria de equipamento.',
    ],
    illustration: 'filter-panel',
  },
  {
    title: 'Status dos Equipamentos',
    paragraphs: [
      'Apresenta a situação atual de cada equipamento. As cores são padronizadas em todo o sistema.',
      'Ideia: monitorar a operação e identificar gargalos de disponibilidade.',
    ],
    illustration: 'status-legend',
  },
  {
    title: 'Distribuição de Equipamentos',
    paragraphs: [
      'Mostra a distribuição dos equipamentos por status e por tipo/modelo em gráficos de barras horizontais e empilhadas.',
      'Ideia: visualizar de forma analítica como a frota está alocada e detectar concentrações ou faltas.',
    ],
    bullets: [
      'Filtros multi-seleção de tipos e status com busca em tempo real.',
      'Cores dos gráficos seguem a mesma legenda do Controle de Equipamentos.',
    ],
    illustration: 'status-legend',
  },
  {
    title: 'Movimentações',
    paragraphs: [
      'Histórico completo de entradas, saídas e movimentações entre empresas.',
      'Ideia: rastrear o ciclo de vida operacional de cada equipamento.',
    ],
    illustration: 'movement-flow',
  },
  {
    title: 'Inventário',
    paragraphs: [
      'Lista detalhada dos equipamentos com tipo, modelo, status, estado (UF) e empresa atual.',
      'Ideia: servir como referência rápida de patrimônio e localização.',
    ],
    bullets: [
      'Filtros por operadora, status e tipo de equipamento.',
      'Drill-down direto no equipamento para ver o histórico.',
    ],
  },
  {
    title: 'Histórico de Equipamentos / Detalhado',
    paragraphs: [
      'Permite consultar todo o histórico de um equipamento específico, incluindo movimentações, manutenções e defeitos.',
      'Ideia: dar suporte à auditoria e à investigação de problemas recorrentes em um item.',
    ],
    illustration: 'defect-categories',
  },
  {
    title: 'Frota (Faturamento por Serviço)',
    paragraphs: [
      'Consolida a frota por empresa e mês de referência, somando os serviços contratados (Simples C/Image, Simples S/Image, Seção, Nuvem, CITGIS, Buszoom, Telemetria).',
      'Ideia: subsidiar o faturamento mensal e oferecer uma visão completa da composição da frota.',
    ],
    bullets: [
      'Linha de TOTAL GERAL exibida apenas quando todas as empresas estão selecionadas.',
      'PDF com logo TACOM, cabeçalho cinza e total em vermelho.',
    ],
    illustration: 'sample-table',
  },
  {
    title: 'Manutenções',
    paragraphs: [
      'Acompanha as manutenções realizadas, categorizadas em DR, DE e Outros.',
      'Ideia: permitir análise de qualidade e priorização de ações corretivas.',
    ],
    illustration: 'defect-categories',
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

// ============ Conteúdo: Manual Completo ============
const manualSections: Section[] = [
  {
    title: 'Introdução ao Sistema TACOM',
    paragraphs: [
      'O sistema TACOM centraliza o controle de equipamentos, movimentações, manutenções e relatórios das empresas atendidas.',
      'Este manual descreve cada módulo, tela e campo para facilitar o uso diário.',
    ],
    illustration: 'header-mockup',
  },
  {
    title: 'Acesso e Autenticação',
    paragraphs: [
      'O acesso é feito por usuário e senha. As senhas são armazenadas de forma criptografada (bcrypt).',
      'Existem dois perfis principais: administrador (acesso total) e operacional (acesso conforme permissões configuradas).',
    ],
    bullets: [
      'Login: informe usuário e senha cadastrados.',
      'Logout: disponível no menu lateral.',
      'Esqueci minha senha: solicitar ao administrador a redefinição.',
    ],
    imageSrc: loginScreen,
    imageCaption: 'Figura: tela de Login do sistema TACOM',
  },
  {
    title: 'Dashboard',
    paragraphs: [
      'Tela inicial com indicadores resumidos: quantidade por status, distribuição por empresa e gráfico de manutenções por categoria de defeito.',
      'Os filtros do dashboard suportam busca em tempo real em todos os multi-selects.',
    ],
    illustration: 'filter-panel',
  },
  {
    title: 'Controle de Equipamentos',
    paragraphs: [
      'Lista todos os equipamentos cadastrados. Cada linha mostra código, tipo, modelo, status (colorido), empresa atual e ações.',
    ],
    bullets: [
      'Código: identificador único do equipamento.',
      'Tipo / Modelo: classificação do equipamento.',
      'Estado: UF onde o equipamento está localizado.',
      'Empresa: empresa atualmente responsável.',
      'Coluna de Manutenção: exibida apenas para itens em manutenção ou aguardando.',
    ],
    illustration: 'status-legend',
  },
  {
    title: 'Cadastro de Equipamentos',
    paragraphs: ['Formulário para inclusão e edição de equipamentos.'],
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
    illustration: 'movement-flow',
  },
  {
    title: 'Defeitos: DR, DE e Outros',
    paragraphs: [
      'Toda manutenção é categorizada para permitir análise de qualidade.',
    ],
    illustration: 'defect-categories',
  },
  {
    title: 'Histórico de Movimentações',
    paragraphs: [
      'Lista todas as movimentações com filtros em cascata por equipamento, empresa e período.',
      'A coluna Defeito mostra DR/DE/Outro conforme registrado. As colunas Origem e Destino são preenchidas conforme o tipo do movimento.',
    ],
    illustration: 'filter-panel',
  },
  {
    title: 'Frota',
    paragraphs: ['Cadastro mensal da frota por empresa, com totais calculados automaticamente.'],
    bullets: [
      'Simples C/Image (vem antes de Simples S/Image no formulário).',
      'Simples S/Image, Seção, Telemetria, CITGIS, Buszoom.',
    ],
    illustration: 'frota-card',
  },
  {
    title: 'Relatórios',
    paragraphs: [
      'Todos os relatórios suportam exportação em CSV, XLSX e PDF, além de impressão.',
      'Os PDFs seguem o padrão TACOM: barra vermelha no topo, logo em destaque e rodapé com paginação.',
    ],
    illustration: 'export-bar',
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
          Baixe os documentos oficiais do sistema TACOM em PDF, com logo, cores padrão e ilustrações.
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
              Explicação detalhada de cada relatório com ilustrações: padrão de PDF, legenda de status,
              fluxo de movimentação, categorias de defeito e exemplo de tabela.
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
              Guia completo com tela de Login real, diagramas de fluxo, legendas coloridas e
              explicação de cada módulo, tela e campo do sistema TACOM.
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
