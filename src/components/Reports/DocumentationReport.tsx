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
  doc.text('Fluxo de movimentacao: empresa de origem -> equipamento -> empresa de destino', x, y + boxH + 4);
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
    doc.text('v', bx + colW - 3, y + 14);
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
    title: 'Como usar este documento',
    paragraphs: [
      'Este guia foi escrito para quem nunca usou o sistema TACOM. Cada secao explica um relatorio: o que ele mostra, para que ele serve, quem deve usar e como interpretar as informacoes.',
      'Voce nao precisa ser tecnico. Leia uma secao por vez, no seu ritmo. Sempre que aparecer um diagrama ou tabela de exemplo, observe as cores e os rotulos: o sistema usa o mesmo padrao em todas as telas.',
    ],
    bullets: [
      'O que e: explicacao simples do relatorio.',
      'Para que serve: qual decisao ou tarefa ele apoia no dia a dia.',
      'Como usar: passo a passo basico (filtrar, visualizar, exportar).',
      'Dica: pequenas observacoes que evitam erros comuns.',
    ],
  },
  {
    title: 'Padrao Visual dos PDFs',
    paragraphs: [
      'Todos os PDFs gerados pelo sistema seguem a mesma identidade visual da TACOM. Isso facilita o reconhecimento e da uma aparencia profissional para os relatorios.',
      'O que voce vai ver em todo PDF: barra superior vermelha com o logo TACOM, titulo centralizado, cabecalho de tabela em cinza escuro, linhas alternadas em rosa-claro para facilitar a leitura e rodape com numeracao de paginas (Pagina X de Y).',
      'As cores nao sao decoracao: o vermelho identifica a marca TACOM e o cinza garante legibilidade. Sempre que um dado for um total importante, ele aparece em vermelho para chamar atencao.',
    ],
    illustration: 'header-mockup',
  },
  {
    title: 'Exportacao e Impressao',
    paragraphs: [
      'Em cima de cada relatorio existe uma barra de botoes para voce levar os dados para fora do sistema. Use o formato certo para cada situacao:',
    ],
    bullets: [
      'Imprimir (cinza): abre a janela de impressao do navegador. Use para imprimir em papel ou salvar como PDF rapido.',
      'PDF (vermelho): gera o relatorio oficial com logo, cores e formatacao TACOM. Use para enviar a clientes, gestores ou arquivar.',
      'CSV (azul): arquivo de texto compativel com qualquer programa. Use para importar em outros sistemas.',
      'XLSX (verde): planilha do Excel pronta para analise, formulas e graficos.',
    ],
    illustration: 'export-bar',
  },
  {
    title: 'Filtros: a base de qualquer relatorio',
    paragraphs: [
      'Antes de exportar, sempre aplique filtros. Filtrar deixa o relatorio menor, mais rapido de abrir e muito mais facil de entender.',
      'Os filtros mais comuns sao: Empresa, Status do equipamento, Tipo/Modelo e Periodo (intervalo de datas). Voce pode combinar varios ao mesmo tempo.',
      'Dica: se voce nao escolher nada, o sistema mostra TUDO. Em bases grandes, isso pode demorar e gerar PDFs com centenas de paginas. Comece sempre filtrando por empresa ou periodo.',
    ],
    illustration: 'filter-panel',
  },
  {
    title: '1. Relatorio de Empresas',
    paragraphs: [
      'O que e: uma lista completa de todas as empresas cadastradas no sistema, mostrando dados de identificacao, contato e a quantidade de equipamentos que cada uma possui no momento.',
      'Para que serve: oferecer uma visao gerencial dos parceiros. Util para comerciais, gestores e equipe administrativa entenderem quem sao os clientes e o tamanho de cada operacao.',
      'Como usar: filtre por nome da empresa ou por codigo de operadora para encontrar rapidamente um cliente especifico. Use a exportacao em XLSX se precisar fazer analises comparativas.',
    ],
    bullets: [
      'Mostra: nome, codigo, contato e total de equipamentos por empresa.',
      'Quando usar: reunioes comerciais, conferencia de cadastros, relatorios para a diretoria.',
      'Dica: revise periodicamente para identificar empresas sem equipamentos ou com cadastros desatualizados.',
    ],
  },
  {
    title: '2. Status dos Equipamentos',
    paragraphs: [
      'O que e: mostra a situacao atual de cada equipamento da frota. Cada status tem uma cor padrao que aparece em todas as telas e relatorios do sistema.',
      'Para que serve: monitorar a operacao em tempo real e identificar problemas. Se ha muitos equipamentos em "Manutencao" ou "Aguardando", e sinal de que algo precisa de atencao.',
      'Como interpretar as cores: cada cor representa uma fase do ciclo de vida do equipamento. Memorize essa legenda; ela e usada em TODOS os relatorios.',
    ],
    illustration: 'status-legend',
    bullets: [
      'Disponivel (verde): pronto para uso ou em uso normal.',
      'Em Manutencao (laranja): com algum defeito sendo tratado.',
      'Aguardando (amarelo): parado esperando alguma acao.',
      'Inativo (cinza): fora de operacao.',
      'Dica: filtre por status e empresa para identificar gargalos especificos.',
    ],
  },
  {
    title: '3. Distribuicao de Equipamentos',
    paragraphs: [
      'O que e: graficos de barras que mostram como a frota esta distribuida por tipo, modelo, status e empresa.',
      'Para que serve: enxergar de forma visual onde estao concentrados os equipamentos, detectar faltas, planejar redistribuicoes e identificar quais modelos sao mais comuns.',
      'Como usar: comece sem filtros para ver a foto geral; depois use os multi-selects (com busca em tempo real) para focar em tipos ou status especificos. As cores das barras seguem a mesma legenda do relatorio de Status.',
    ],
    bullets: [
      'Grafico horizontal: facilita comparar quantidades entre categorias.',
      'Grafico empilhado: mostra a composicao interna de cada barra.',
      'Dica: exporte em PDF para incluir em apresentacoes; exporte em XLSX para fazer suas proprias analises.',
    ],
    illustration: 'status-legend',
  },
  {
    title: '4. Movimentacoes (Historico Operacional)',
    paragraphs: [
      'O que e: o historico completo de todas as movimentacoes registradas no sistema. Cada linha representa um equipamento saindo de um lugar e indo para outro.',
      'Para que serve: rastrear o ciclo de vida operacional de cada equipamento. Saber onde ele esteve, quando, por que e quem registrou.',
      'Como ler o fluxo: toda movimentacao tem tres partes principais: Origem (de onde saiu), Equipamento (qual item) e Destino (para onde foi). O sistema atualiza automaticamente o status e a empresa atual apos cada registro.',
    ],
    illustration: 'movement-flow',
    bullets: [
      'Tipos de movimento: Entrada (chegou em uma empresa), Saida (deixou uma empresa) ou Movimentacao (transferencia entre empresas).',
      'Filtros: por equipamento, empresa, periodo e tipo. Os filtros sao em cascata (um afeta o outro).',
      'Dica: para auditoria, sempre filtre por periodo e exporte em PDF; o arquivo fica oficial e datado.',
    ],
  },
  {
    title: '5. Inventario',
    paragraphs: [
      'O que e: a lista detalhada de TODOS os equipamentos cadastrados, com tipo, modelo, status, estado (UF) e empresa atual responsavel.',
      'Para que serve: funcionar como referencia rapida de patrimonio e localizacao. E o "raio-X" da frota.',
      'Como usar: filtre por operadora, status ou tipo para reduzir a lista. Clique em um equipamento para abrir seu historico completo (drill-down).',
    ],
    bullets: [
      'Util para conferencia fisica (inventario presencial).',
      'Util para responder rapidamente "onde esta o equipamento X?".',
      'Dica: exporte em XLSX antes de uma auditoria; voce pode marcar itens conferidos diretamente na planilha.',
    ],
  },
  {
    title: '6. Historico Detalhado de um Equipamento',
    paragraphs: [
      'O que e: a "ficha completa" de um equipamento especifico. Reune em um so lugar todas as movimentacoes, manutencoes e defeitos daquele item.',
      'Para que serve: investigar problemas recorrentes, dar suporte a auditorias e responder duvidas pontuais sobre um equipamento.',
      'Como usar: pesquise pelo codigo do equipamento e o sistema monta a linha do tempo completa, da primeira entrada ate o ultimo registro.',
    ],
    illustration: 'defect-categories',
    bullets: [
      'Mostra a sequencia cronologica de eventos.',
      'Destaque para manutencoes (DR, DE, Outros).',
      'Dica: se um equipamento aparece muito com defeitos DR, e candidato a substituicao.',
    ],
  },
  {
    title: '7. Frota (Faturamento por Servico)',
    paragraphs: [
      'O que e: o relatorio mais usado pelo financeiro. Consolida a frota por empresa e por mes de referencia, somando todos os servicos contratados.',
      'Para que serve: subsidiar o faturamento mensal. Mostra quantos equipamentos de cada categoria de servico cada empresa tem, no mes selecionado.',
      'Como usar: selecione o mes de referencia e (opcional) a empresa. Se voce escolher "Todas as empresas", aparece a linha TOTAL GERAL ao final, somando tudo. Se filtrar por uma empresa especifica, a linha de total nao aparece (evita confusao com totais incompletos).',
    ],
    illustration: 'sample-table',
    bullets: [
      'Servicos contemplados: Simples C/Image, Simples S/Image, Secao, Nuvem, CITGIS, Buszoom, Telemetria.',
      'Calculos automaticos: Nuvem = Simples C/Image + Simples S/Image + Secao. Total = Nuvem + Telemetria + CITGIS + Buszoom.',
      'PDF oficial: cabecalho cinza, total em vermelho, logo TACOM no topo.',
      'Dica: gere o PDF no dia 1 de cada mes para fechar o faturamento do mes anterior.',
    ],
  },
  {
    title: '8. Manutencoes',
    paragraphs: [
      'O que e: acompanha todas as manutencoes realizadas, separadas por tipo de defeito.',
      'Para que serve: analise de qualidade. Permite identificar quais equipamentos, modelos ou empresas concentram mais problemas e priorizar acoes corretivas.',
      'Como usar: filtre por periodo e categoria de defeito. Use o agrupamento por modelo para descobrir series com mais ocorrencias.',
    ],
    illustration: 'defect-categories',
    bullets: [
      'DR (Defeito de Recolhimento): problema identificado quando o equipamento volta.',
      'DE (Defeito de Entrega): problema identificado na entrega ao cliente.',
      'Outro: demais manutencoes (preventivas, ajustes, etc).',
      'Dica: muitas ocorrencias DE indicam falha no processo de checagem antes da entrega.',
    ],
  },
  {
    title: '9. Relatorio Mensal',
    paragraphs: [
      'O que e: uma consolidacao mensal de tudo: movimentacoes do mes, manutencoes realizadas e status atual da frota.',
      'Para que serve: apresentacoes gerenciais e fechamento de mes. Ideal para reunioes de diretoria e prestacao de contas a clientes.',
      'Como usar: selecione o mes desejado e exporte em PDF. O arquivo ja vem com a identidade visual TACOM e pode ser enviado direto.',
    ],
    bullets: [
      'Visao executiva, com numeros agregados.',
      'Dica: combine com o relatorio de Frota para uma apresentacao completa.',
    ],
  },
  {
    title: '10. Estoque Detalhado',
    paragraphs: [
      'O que e: analise dos niveis de estoque, destacando itens em quantidade critica.',
      'Para que serve: apoiar o planejamento de compras e reposicao. Evita ruptura (faltar equipamento) e excesso (capital parado).',
      'Como usar: revise semanalmente; itens em vermelho ou laranja exigem acao imediata.',
    ],
    bullets: [
      'Identifica itens abaixo do estoque minimo.',
      'Dica: integre a leitura deste relatorio na rotina semanal de compras.',
    ],
  },
];

// ============ Conteudo: Manual Completo ============
const manualSections: Section[] = [
  {
    title: 'Bem-vindo ao Sistema TACOM',
    paragraphs: [
      'Este manual foi escrito para qualquer pessoa, mesmo sem experiencia previa. Explicamos cada tela, cada campo e o que voce deve fazer em cada situacao.',
      'O sistema TACOM serve para controlar equipamentos: onde estao, com qual empresa, qual o status, quais defeitos tiveram e quanto cada cliente deve pagar no mes. Tudo em um lugar so.',
      'Leia este manual do inicio ao fim na primeira vez. Depois, use como consulta sempre que tiver duvida.',
    ],
    illustration: 'header-mockup',
  },
  {
    title: '1. Como acessar o sistema',
    paragraphs: [
      'O acesso e feito com usuario e senha pessoais. Suas credenciais sao criadas pelo administrador.',
      'A senha e armazenada de forma criptografada (tecnologia bcrypt). Nem mesmo o administrador consegue ver sua senha; em caso de esquecimento, ele apenas redefine.',
    ],
    bullets: [
      'Login: digite o usuario, depois a senha, e clique em Entrar.',
      'Logout: clique no seu nome (canto superior) e escolha Sair. Sempre saia em computadores compartilhados.',
      'Esqueci a senha: peca ao administrador para redefinir.',
      'Dica: nao compartilhe sua senha. Cada acao no sistema fica registrada com o nome do usuario.',
    ],
    imageSrc: loginScreen,
    imageCaption: 'Figura 1: tela de Login do sistema TACOM',
  },
  {
    title: '2. Perfis de acesso',
    paragraphs: [
      'O sistema tem dois perfis principais. As permissoes definem o que cada usuario pode ver e fazer.',
    ],
    bullets: [
      'Administrador: acesso total. Gerencia usuarios, permissoes, cadastros base e configuracoes.',
      'Operacional: acesso aos modulos do dia a dia, conforme permissoes configuradas pelo administrador.',
      'Permissoes de relatorios sao individuais: o administrador pode liberar relatorio por relatorio para cada usuario.',
    ],
  },
  {
    title: '3. Dashboard (tela inicial)',
    paragraphs: [
      'Apos o login voce cai no Dashboard. E uma tela de resumo com os indicadores mais importantes: quantidade de equipamentos por status, distribuicao por empresa e grafico de manutencoes por categoria de defeito.',
      'Os filtros do topo do Dashboard tem busca em tempo real: comece a digitar e as opcoes vao sendo filtradas. Use para olhar so uma empresa, periodo ou tipo de equipamento.',
    ],
    illustration: 'filter-panel',
    bullets: [
      'Cartoes coloridos: quantidades resumidas (Disponivel, Manutencao, etc).',
      'Graficos: distribuicao visual da frota.',
      'Dica: comece o dia olhando o Dashboard. Em 30 segundos voce ja entende a situacao da operacao.',
    ],
  },
  {
    title: '4. Controle de Equipamentos',
    paragraphs: [
      'Lista de TODOS os equipamentos do sistema. Cada linha e um equipamento. As cores indicam o status.',
      'Use a busca para encontrar pelo codigo. Use os filtros para reduzir a lista por empresa, tipo ou status.',
    ],
    bullets: [
      'Codigo: identificador unico (nao se repete).',
      'Tipo / Modelo: classificacao do equipamento.',
      'Estado (UF): onde ele esta fisicamente.',
      'Empresa: quem esta com ele agora.',
      'Status (colorido): situacao atual.',
      'Coluna Manutencao: aparece apenas para itens em manutencao ou aguardando (poupa espaco na tela).',
      'Dica: clique em um equipamento para abrir o historico completo dele.',
    ],
    illustration: 'status-legend',
  },
  {
    title: '5. Cadastro de Equipamentos',
    paragraphs: [
      'Tela para incluir um equipamento novo ou editar um existente. Preencha os campos com atencao; o codigo nao pode ser repetido.',
    ],
    bullets: [
      'Codigo (obrigatorio): identificador unico. Sugestao: padronize um formato para sua operacao.',
      'Tipo e Modelo: escolha nas listas. Se faltar opcao, peca ao administrador.',
      'Estado (UF): o padrao e Rio Grande do Sul; altere se necessario.',
      'Empresa vinculada: quem fica responsavel pelo equipamento.',
      'Status inicial: normalmente "Disponivel".',
      'Dica: salve e confira em seguida no Controle de Equipamentos.',
    ],
  },
  {
    title: '6. Movimentacoes',
    paragraphs: [
      'Aqui voce registra quando um equipamento entra em uma empresa, sai de uma empresa ou e transferido entre empresas.',
      'Importante: o sistema atualiza automaticamente o status e a empresa do equipamento apos cada movimentacao. Voce nao precisa mexer manualmente nessas informacoes.',
    ],
    illustration: 'movement-flow',
    bullets: [
      'Tipo de movimento: Entrada, Saida ou Movimentacao (transferencia).',
      'Empresa de Origem: de onde o equipamento esta saindo.',
      'Empresa de Destino: para onde ele vai.',
      'Data do movimento: posicionada antes dos campos de defeito; preencha com a data real do evento.',
      'Defeito (quando aplicavel): DR, DE ou Outro.',
      'Observacoes: campo livre para detalhes.',
      'Dica: registre o mais proximo possivel da data real para manter o historico fiel.',
    ],
  },
  {
    title: '7. Defeitos: DR, DE e Outros',
    paragraphs: [
      'Toda manutencao precisa ser categorizada. A categorizacao alimenta os relatorios de qualidade.',
    ],
    illustration: 'defect-categories',
    bullets: [
      'DR (Defeito de Recolhimento): identificado quando o equipamento retorna. Indica problema durante o uso.',
      'DE (Defeito de Entrega): identificado na entrega ao cliente. Indica falha no processo de checagem.',
      'Outro: preventivas, ajustes, atualizacoes e demais casos.',
      'Dica: na duvida, use Outro e descreva nas observacoes. E sempre melhor registrar do que deixar em branco.',
    ],
  },
  {
    title: '8. Historico de Movimentacoes',
    paragraphs: [
      'Lista TODAS as movimentacoes registradas no sistema. Use os filtros em cascata para encontrar exatamente o que precisa.',
      'As colunas Origem e Destino sao preenchidas conforme o tipo de movimento. A coluna Defeito mostra DR, DE ou Outro quando houver.',
    ],
    illustration: 'filter-panel',
    bullets: [
      'Filtros em cascata: equipamento, empresa, periodo.',
      'Cada linha mostra: data, tipo, equipamento, origem, destino, defeito e usuario que registrou.',
      'Dica: para auditoria, sempre exporte em PDF apos aplicar filtros; o arquivo tem data, hora e logo TACOM.',
    ],
  },
  {
    title: '9. Frota (Faturamento)',
    paragraphs: [
      'Cadastro mensal da frota por empresa. Os totais (Nuvem e Total Geral) sao calculados automaticamente ao salvar.',
    ],
    illustration: 'frota-card',
    bullets: [
      'Simples C/Image (com imagem): aparece ANTES de Simples S/Image no formulario.',
      'Simples S/Image (sem imagem).',
      'Secao, Telemetria, CITGIS, Buszoom.',
      'Nuvem = Simples C/Image + Simples S/Image + Secao.',
      'Total = Nuvem + Telemetria + CITGIS + Buszoom.',
      'Dica: confira sempre o mes de referencia antes de salvar.',
    ],
  },
  {
    title: '10. Relatorios',
    paragraphs: [
      'Modulo dedicado para gerar todos os relatorios do sistema. Cada relatorio tem seus filtros proprios e botoes de exportacao.',
      'Os PDFs seguem o padrao TACOM: barra vermelha no topo, logo em destaque e rodape com paginacao.',
    ],
    illustration: 'export-bar',
    bullets: [
      'Imprimir: janela de impressao do navegador.',
      'PDF: arquivo oficial com identidade visual TACOM.',
      'CSV: arquivo simples para outros sistemas.',
      'XLSX: planilha Excel pronta para analise.',
      'Dica: leia o documento "Documentacao dos Relatorios" para entender o que cada um faz.',
    ],
  },
  {
    title: '11. Permissoes e Administracao',
    paragraphs: [
      'Modulo restrito a administradores. Aqui sao gerenciados usuarios, perfis, permissoes de relatorios e cadastros base (tipos de equipamento, empresas, etc).',
      'Por seguranca, nunca compartilhe um usuario administrador entre varias pessoas.',
    ],
  },
  {
    title: '12. Boas praticas no dia a dia',
    paragraphs: [
      'Pequenas atitudes garantem relatorios confiaveis.',
    ],
    bullets: [
      'Mantenha o status dos equipamentos sempre atualizado.',
      'Registre movimentacoes o mais proximo possivel da data real.',
      'Sempre informe o defeito (DR, DE ou Outro) quando aplicavel.',
      'Aplique filtros antes de exportar grandes relatorios.',
      'Nunca compartilhe senhas; faca logout em computadores publicos.',
      'Em caso de duvida, prefira registrar com observacao do que nao registrar.',
    ],
  },
  {
    title: '13. Suporte',
    paragraphs: [
      'Em caso de duvidas, problemas ou sugestoes de melhoria, acione a equipe TACOM responsavel pelo sistema.',
      'Sempre que possivel, informe: o que voce estava fazendo, qual o erro ou comportamento inesperado e, se possivel, um print da tela.',
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
