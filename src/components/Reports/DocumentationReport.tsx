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

  const resetTextStyle = () => {
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 14) {
      doc.addPage();
      drawHeader();
      y = 32;
      resetTextStyle();
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
    title: 'Objetivo deste documento',
    paragraphs: [
      'Este documento é o guia oficial dos relatórios do sistema TACOM. Foi escrito para qualquer pessoa, mesmo sem experiência prévia, entender exatamente: (1) qual é o OBJETIVO de cada relatório, (2) PARA QUE serve no dia a dia, (3) o que CADA card (indicador) representa, (4) o que CADA coluna mostra e (5) DE ONDE a informação vem (qual tabela e qual coluna do banco a alimenta).',
      'A ideia central do sistema TACOM é controlar o ciclo de vida dos equipamentos de telemetria embarcada: desde a entrada no estoque, passando pela alocação em empresas clientes, manutenções, defeitos, retorno ao estoque e — quando aplicável — o faturamento mensal dos serviços. Cada relatório responde a uma pergunta específica desse ciclo.',
      'Sempre que aparecer um número em um card ou em uma coluna, este documento explica COMO ele é calculado e DE QUAL fonte (tabela do banco) ele vem. Isso garante rastreabilidade total e elimina dúvidas sobre a origem dos dados.',
    ],
    bullets: [
      'Objetivo: a pergunta central que o relatório responde.',
      'Para que serve: como ele apoia a operação, comercial, financeiro ou auditoria.',
      'Cards (indicadores): o que cada número representa, como é calculado e de onde vem.',
      'Colunas da tabela: o significado de cada coluna e a tabela/coluna de origem no banco.',
      'Filtros: o que cada filtro faz com os dados exibidos.',
      'Dica: pequenas observações que evitam erros comuns.',
    ],
  },
  {
    title: 'Origem dos dados (tabelas do sistema)',
    paragraphs: [
      'Todos os relatórios são alimentados pelas mesmas tabelas centrais. Conhecer essas tabelas ajuda a entender de onde cada número sai e por que dois relatórios podem mostrar valores diferentes (geralmente porque usam filtros distintos sobre as mesmas tabelas).',
    ],
    bullets: [
      'equipamentos: cadastro mestre de cada equipamento (numero_serie, tipo, modelo, status, estado, id_empresa, data_entrada, data_saida). Fonte da "fotografia atual" da frota.',
      'empresas: cadastro de clientes/operadoras (name, cnpj, cod_operadora, estado, contact). Usada em todas as colunas "Empresa".',
      'movimentacoes: histórico de tudo que acontece com um equipamento (tipo_movimento, data_movimento, empresa_origem_nome, empresa_destino_nome, defeito_reclamado_id, defeito_encontrado_id, tipo_manutencao_id, usuario_responsavel). Fonte de Movimentações, Manutenções e Histórico.',
      'tipos_manutencao: catálogo de defeitos e manutenções (codigo, descricao, categoria_defeito = DR / DE / OUTRO). Classifica cada movimentação de manutenção.',
      'tipos_equipamento: catálogo de tipos (CCIT, CONNECTION, P MOT, etc), usado em filtros e agrupamentos.',
      'frota: cadastro MENSAL por empresa com a quantidade contratada de cada serviço (simples_com_imagem, simples_sem_imagem, secao, telemetria, citgis, buszoom, total). Fonte exclusiva do relatório de Frota/Faturamento.',
      'estados: lista de UFs usada em filtros e cadastros.',
      'usuarios: quem registrou cada ação (auditoria). O nome é gravado em movimentacoes.usuario_responsavel.',
    ],
  },
  {
    title: 'Glossário de Status (vale para todos os relatórios)',
    paragraphs: [
      'Todo equipamento possui um Status (equipamentos.status). Ele muda automaticamente conforme as movimentações registradas — você não precisa editar o status na mão. Entender este glossário é a chave para interpretar QUALQUER relatório, porque a maioria dos cards é uma contagem por status.',
    ],
    illustration: 'status-legend',
    bullets: [
      'Disponível (verde): no estoque TACOM, pronto para entrega. Origem: equipamentos.status = "disponivel".',
      'Em Uso (azul): alocado em uma empresa cliente, operando no campo. Origem: equipamentos.status = "em_uso".',
      'Manutenção (laranja): em reparo na TACOM. Origem: equipamentos.status = "manutencao".',
      'Aguardando Manutenção (amarelo): retornou com defeito mas ainda não entrou em reparo. Origem: equipamentos.status = "aguardando_manutencao".',
      'Defeito / Danificado (vermelho): problema confirmado. Origem: equipamentos.status = "defeito" ou "danificado".',
      'Indisponível: fora de operação por outro motivo. Origem: equipamentos.status = "indisponivel".',
      'Regra de soma: Disponível + Em Uso + Manutenção/Defeito + Indisponível = Total da base filtrada.',
    ],
  },
  {
    title: 'Padrão visual dos PDFs',
    paragraphs: [
      'Todos os PDFs seguem a mesma identidade TACOM: barra vermelha superior com logo, título centralizado, cabeçalho de tabela em cinza-escuro, linhas alternadas em rosa-claro e rodapé com "Página X de Y". Totais importantes aparecem em vermelho para destaque.',
    ],
    illustration: 'header-mockup',
  },
  {
    title: 'Exportação e Impressão',
    paragraphs: [
      'No topo de cada relatório existe uma barra com botões de exportação. Cada formato tem um uso recomendado:',
    ],
    bullets: [
      'Imprimir (cinza): abre o diálogo de impressão do navegador.',
      'PDF (vermelho): relatório oficial com identidade TACOM. Use para envio a clientes e arquivo.',
      'CSV (azul): texto puro para importar em outros sistemas.',
      'XLSX (verde): planilha Excel pronta para análises e fórmulas.',
    ],
    illustration: 'export-bar',
  },
  {
    title: 'Filtros: a base de qualquer relatório',
    paragraphs: [
      'Antes de exportar, aplique filtros. Eles deixam o relatório menor, mais rápido e focado. Sem filtros, o sistema mostra TUDO (centenas de páginas em bases grandes).',
      'Quando você muda um filtro, TODOS os cards e a tabela são recalculados na hora considerando apenas os registros que restaram. Por isso dois usuários podem ver totais diferentes na mesma tela.',
    ],
    illustration: 'filter-panel',
  },

  {
    title: '1. Relatório de Empresas',
    paragraphs: [
      'Objetivo: apresentar a lista completa de empresas (clientes/operadoras) cadastradas, com dados de identificação e a quantidade atual de equipamentos vinculados.',
      'Para que serve: visão gerencial dos parceiros. Apoia o comercial (entender o porte de cada cliente), o administrativo (manter cadastros atualizados) e a diretoria (visão consolidada da base).',
      'Fonte principal: tabela empresas, cruzada com equipamentos para contar quantos itens cada empresa tem hoje.',
    ],
    bullets: [
      'Card "Total de Empresas": número de empresas ativas. Origem: COUNT(empresas).',
      'Card "Equipamentos Vinculados": soma de equipamentos com status Em Uso vinculados a alguma empresa. Origem: COUNT(equipamentos WHERE status = "em_uso").',
      'Card "Novas no Mês": empresas cadastradas no mês vigente. Origem: empresas.created_at no mês atual.',
      'Coluna Nome: razão social / nome fantasia. Origem: empresas.name.',
      'Coluna Código Operadora: código interno de conciliação. Origem: empresas.cod_operadora.',
      'Coluna CNPJ: documento fiscal. Origem: empresas.cnpj.',
      'Coluna Estado (UF): UF principal de operação. Origem: empresas.estado.',
      'Coluna Contato / Telefone: dados de contato. Origem: empresas.contact e empresas.telefone.',
      'Coluna Qtd. Equipamentos: quantos equipamentos estão com a empresa AGORA. Origem: COUNT(equipamentos WHERE id_empresa = empresa.id AND status = "em_uso").',
      'Dica: revise periodicamente para identificar empresas sem equipamentos ou cadastros desatualizados.',
    ],
  },

  {
    title: '2. Status dos Equipamentos',
    paragraphs: [
      'Objetivo: mostrar a situação operacional atual da frota — quantos equipamentos estão em cada status neste exato momento.',
      'Para que serve: monitorar a operação em tempo real. Muitos itens em Manutenção ou Defeito sinalizam algo que precisa de atenção (qualidade, processo de checagem, fornecedor).',
      'Fonte principal: tabela equipamentos (coluna status), cruzada com empresas.',
    ],
    illustration: 'status-legend',
    bullets: [
      'Card "Disponível": no estoque TACOM, prontos para entrega. Origem: COUNT(equipamentos WHERE status = "disponivel").',
      'Card "Em Uso": entregues a clientes e operando. Origem: COUNT(equipamentos WHERE status = "em_uso").',
      'Card "Manutenção": em reparo agora. Origem: COUNT(equipamentos WHERE status = "manutencao").',
      'Card "Defeito / Danificado": problema confirmado. Origem: COUNT(equipamentos WHERE status IN ("defeito","danificado")).',
      'Coluna Tipo: categoria do equipamento. Origem: equipamentos.tipo.',
      'Coluna Modelo: variação específica. Origem: equipamentos.modelo.',
      'Coluna Número de Série: identificador único. Origem: equipamentos.numero_serie.',
      'Coluna Empresa: cliente que está com o equipamento. Origem: empresas.name via equipamentos.id_empresa.',
      'Coluna Status: situação atual colorida. Origem: equipamentos.status.',
      'Coluna Estado: UF física. Origem: equipamentos.estado.',
      'Dica: filtre por status + empresa para identificar gargalos específicos.',
    ],
  },

  {
    title: '3. Distribuição de Equipamentos',
    paragraphs: [
      'Objetivo: enxergar visualmente, em gráficos de barras, como a frota está distribuída por Tipo, Modelo, Status e Empresa.',
      'Para que serve: detectar concentrações e faltas. Ajuda a planejar redistribuição entre regiões/clientes e identificar tipos/modelos sobrando ou faltando.',
      'Fonte principal: agrupamentos sobre equipamentos, cruzados com empresas e tipos_equipamento.',
    ],
    bullets: [
      'Gráfico "Por Tipo": cada barra é um tipo; o tamanho mostra quantos itens daquele tipo existem na frota filtrada. Origem: GROUP BY equipamentos.tipo.',
      'Gráfico "Por Modelo": detalha cada tipo por modelo. Origem: GROUP BY equipamentos.tipo, equipamentos.modelo.',
      'Gráfico "Por Status": composição da frota por situação. Origem: GROUP BY equipamentos.status.',
      'Gráfico "Por Empresa": quanto cada cliente concentra. Origem: GROUP BY equipamentos.id_empresa (nome via empresas.name).',
      'Multi-selects com busca em tempo real: digite parte do nome para filtrar opções.',
      'Dica: exporte em PDF para apresentações; em XLSX para análises próprias.',
    ],
    illustration: 'status-legend',
  },

  {
    title: '4. Movimentações (Histórico Operacional)',
    paragraphs: [
      'Objetivo: registrar e exibir o histórico COMPLETO de movimentações. Cada linha é um evento (entrada, saída, transferência ou manutenção) de um equipamento.',
      'Para que serve: rastrear o ciclo de vida operacional. Responde com precisão "onde o equipamento esteve, quando, por quê e quem registrou". É a base de qualquer auditoria.',
      'Fonte principal: tabela movimentacoes, cruzada com equipamentos, empresas e tipos_manutencao.',
    ],
    illustration: 'movement-flow',
    bullets: [
      'Card "Total de Movimentações": quantas movimentações no período filtrado. Origem: COUNT(movimentacoes).',
      'Card "Entradas": vezes em que um equipamento foi recebido por uma empresa. Origem: COUNT(movimentacoes WHERE tipo_movimento = "entrada").',
      'Card "Saídas": vezes em que um equipamento deixou uma empresa. Origem: COUNT(movimentacoes WHERE tipo_movimento = "saida").',
      'Card "Transferências": movimentações entre duas empresas diferentes. Origem: COUNT(movimentacoes WHERE empresa_origem_nome <> empresa_destino_nome).',
      'Coluna Data: data real do evento. Origem: movimentacoes.data_movimento.',
      'Coluna Hora: hora exata do registro no sistema (auditoria fina). Origem: movimentacoes.data_criacao.',
      'Coluna Tipo: Entrada, Saída ou Movimentação. Origem: movimentacoes.tipo_movimento.',
      'Coluna Equipamento: número de série. Origem: equipamentos.numero_serie via movimentacoes.id_equipamento.',
      'Coluna Origem: empresa de onde o equipamento saiu. Origem: movimentacoes.empresa_origem_nome.',
      'Coluna Destino: empresa para onde foi. Origem: movimentacoes.empresa_destino_nome.',
      'Coluna Categoria de Defeito: DR, DE ou Outro. Origem: tipos_manutencao.categoria_defeito via defeito_reclamado_id / defeito_encontrado_id / tipo_manutencao_id.',
      'Coluna Defeito Reclamado: problema reportado pelo cliente. Origem: tipos_manutencao.descricao via movimentacoes.defeito_reclamado_id.',
      'Coluna Defeito Encontrado: diagnóstico técnico real. Origem: tipos_manutencao.descricao via movimentacoes.defeito_encontrado_id.',
      'Coluna Tipo de Manutenção: detalhe técnico do reparo. Origem: tipos_manutencao.descricao via movimentacoes.tipo_manutencao_id.',
      'Coluna Usuário: quem registrou (trilha de auditoria). Origem: movimentacoes.usuario_responsavel.',
      'Filtro Período: restringe ao intervalo desejado (data_movimento).',
      'Filtro Empresa: limita a uma empresa (origem OU destino).',
      'Filtro Tipo: Entrada, Saída ou Movimentação.',
      'Filtro Categoria de Defeito: apenas DR, DE ou Outros.',
      'Dica: para auditoria, filtre por período e exporte em PDF; o arquivo fica datado e oficial.',
    ],
  },

  {
    title: '5. Relatório de Inventário',
    paragraphs: [
      'Objetivo: ser a "fotografia da frota agora". Lista TODOS os equipamentos cadastrados com tipo, modelo, status, estado e empresa atual.',
      'Para que serve: referência rápida de patrimônio e localização. Responde "onde está o equipamento X?" ou "quantos CCIT 5.0 temos disponíveis hoje?".',
      'Fonte principal: tabela equipamentos, cruzada com empresas.',
    ],
    bullets: [
      'Card "Total de Equipamentos": TODOS os equipamentos cadastrados na base filtrada. Origem: COUNT(equipamentos).',
      'Card "Disponíveis": no estoque TACOM, livres para entrega. Origem: COUNT(equipamentos WHERE status = "disponivel").',
      'Card "Em Uso": alocados em alguma empresa. Origem: COUNT(equipamentos WHERE status = "em_uso").',
      'Card "Manutenção / Defeito": soma de Manutenção + Defeito + Danificado. Origem: COUNT(equipamentos WHERE status IN ("manutencao","defeito","danificado")).',
      'Regra de ouro: Disponíveis + Em Uso + Manutenção/Defeito + Indisponível = Total. Se o total parecer estranho, confira filtros.',
      'Coluna Tipo: categoria do equipamento. Origem: equipamentos.tipo.',
      'Coluna Modelo: variação específica (pode aparecer "-"). Origem: equipamentos.modelo.',
      'Coluna Número de Série: código único. Origem: equipamentos.numero_serie.',
      'Coluna Empresa: cliente atual (ou "TACOM SISTEMAS POA" se está no estoque). Origem: empresas.name via equipamentos.id_empresa.',
      'Coluna Status: situação atual colorida. Origem: equipamentos.status.',
      'Coluna Estado: UF física. Origem: equipamentos.estado.',
      'Coluna Data Entrada: quando foi cadastrado/recebido. Origem: equipamentos.data_entrada.',
      'Coluna Data Saída: última vez que saiu da TACOM. Origem: equipamentos.data_saida.',
      'Filtro Operadora: limita a uma empresa.',
      'Filtro Status: mostra apenas equipamentos no status escolhido.',
      'Filtro Tipo de Equipamento: limita a um tipo.',
      'Filtro Número de Série: busca um equipamento específico.',
      'Dica: para auditoria física, exporte em XLSX antes de ir a campo.',
    ],
  },

  {
    title: '6. Histórico Detalhado de um Equipamento',
    paragraphs: [
      'Objetivo: apresentar a "ficha de vida completa" de UM equipamento — em ordem cronológica, todas as movimentações, manutenções e defeitos daquele item.',
      'Para que serve: investigar problemas recorrentes, embasar substituições, dar suporte a auditorias e responder dúvidas pontuais.',
      'Fonte principal: tabela movimentacoes filtrada por id_equipamento, cruzada com tipos_manutencao e empresas.',
    ],
    illustration: 'defect-categories',
    bullets: [
      'Cabeçalho: número de série, tipo, modelo e empresa atual. Origem: equipamentos + empresas.',
      'Card "Total de Eventos": quantas movimentações o equipamento teve. Origem: COUNT(movimentacoes WHERE id_equipamento = X).',
      'Card "Manutenções": quantas vezes passou por reparo. Origem: COUNT(movimentacoes com defeito ou tipo_manutencao preenchido).',
      'Card "Tempo Total em Uso": dias acumulados em status Em Uso, calculado a partir das datas das movimentações.',
      'Coluna Data: quando o evento aconteceu. Origem: movimentacoes.data_movimento.',
      'Coluna Tipo de Movimento: Entrada, Saída, Movimentação ou Manutenção. Origem: movimentacoes.tipo_movimento.',
      'Coluna Origem → Destino: trajeto. Origem: movimentacoes.empresa_origem_nome / empresa_destino_nome.',
      'Coluna Defeito: categoria (DR/DE/Outro) + descrição. Origem: tipos_manutencao via FKs em movimentacoes.',
      'Coluna Usuário: quem registrou. Origem: movimentacoes.usuario_responsavel.',
      'Dica: se um equipamento aparece muito com DR, é candidato natural a substituição.',
    ],
  },

  {
    title: '7. Frota (Faturamento por Serviço)',
    paragraphs: [
      'Objetivo: consolidar, por empresa e por mês de referência, a quantidade contratada de cada serviço (Simples C/Image, S/Image, Seção, Telemetria, CITGIS, Buszoom) para fins de faturamento mensal.',
      'Para que serve: é o relatório-chave do Financeiro. Os totais aqui exibidos são a base para emissão das notas fiscais e cobrança mensal.',
      'Fonte principal: tabela frota (independente de equipamentos — é um cadastro mensal manual da operação).',
    ],
    illustration: 'sample-table',
    bullets: [
      'Coluna Empresa: nome do cliente. Origem: frota.nome_empresa.',
      'Coluna Cód. Operadora: código de conciliação. Origem: frota.cod_operadora.',
      'Coluna Simples C/Image: serviço "Simples Com Imagem" (câmera). Origem: frota.simples_com_imagem.',
      'Coluna Simples S/Image: serviço "Simples Sem Imagem" (apenas dados). Origem: frota.simples_sem_imagem.',
      'Coluna Seção: serviço Seção. Origem: frota.secao.',
      'Coluna Nuvem (calculada): Simples C/Image + Simples S/Image + Seção. Origem: frota.nuvem (recalculada ao salvar).',
      'Coluna Telemetria: serviço de telemetria. Origem: frota.telemetria.',
      'Coluna CITGIS: serviço CITGIS. Origem: frota.citgis.',
      'Coluna Buszoom: serviço Buszoom. Origem: frota.buszoom.',
      'Coluna Total (calculada): Nuvem + Telemetria + CITGIS + Buszoom — número usado para faturamento. Origem: frota.total.',
      'Linha TOTAL GERAL (vermelho): soma de todas as empresas. Aparece APENAS quando o filtro de empresa está em "Todas".',
      'Filtro Mês de Referência: define o mês a ser faturado. Origem: frota.mes_referencia.',
      'Filtro Empresa: opcional; em "Todas" para ver o TOTAL GERAL.',
      'Dica: gere o PDF no dia 1 de cada mês para fechar o faturamento do mês anterior.',
    ],
  },

  {
    title: '8. Manutenções',
    paragraphs: [
      'Objetivo: acompanhar todas as manutenções realizadas, separadas por categoria de defeito (DR, DE e Outros), com todos os detalhes técnicos.',
      'Para que serve: análise de qualidade. Identifica equipamentos, modelos ou empresas que concentram mais problemas e embasa ações corretivas.',
      'Fonte principal: movimentacoes filtradas pelas que têm defeito ou tipo_manutencao preenchido, cruzadas com tipos_manutencao.',
    ],
    illustration: 'defect-categories',
    bullets: [
      'Card "Total de Manutenções": número total no período filtrado. Origem: COUNT(movimentacoes com defeito ou manutenção).',
      'Card "DR": Defeito de Recolhimento — identificado quando o equipamento retorna do cliente. Origem: tipos_manutencao.categoria_defeito = "DR".',
      'Card "DE": Defeito de Entrega — identificado antes de entregar ao cliente. Origem: tipos_manutencao.categoria_defeito = "DE".',
      'Card "Outros": preventivas, atualizações, ajustes. Origem: tipos_manutencao.categoria_defeito = "OUTRO" ou nulo.',
      'Coluna Data: quando a manutenção foi registrada. Origem: movimentacoes.data_movimento.',
      'Coluna Equipamento: número de série. Origem: equipamentos.numero_serie.',
      'Coluna Categoria: DR, DE ou Outro. Origem: tipos_manutencao.categoria_defeito.',
      'Coluna Tipo de Manutenção: descrição técnica. Origem: tipos_manutencao.descricao via tipo_manutencao_id.',
      'Coluna Defeito Reclamado: o que o cliente reportou. Origem: tipos_manutencao.descricao via defeito_reclamado_id.',
      'Coluna Defeito Encontrado: o que a equipe técnica identificou. Origem: tipos_manutencao.descricao via defeito_encontrado_id.',
      'Coluna Empresa: cliente envolvido. Origem: empresas.name.',
      'Filtro Período: restringe ao intervalo (data_movimento).',
      'Filtro Empresa: limita a uma empresa.',
      'Filtro Categoria de Defeito: isola DR, DE ou Outros.',
      'Filtro Tipo de Manutenção: filtra pelo tipo técnico.',
      'Filtro Tipo de Equipamento: limita a um tipo para identificar famílias problemáticas.',
      'Filtro Número de Série: investiga o histórico de UM equipamento.',
      'Dica: muitas DE indicam falha na checagem antes da entrega; muitas DR indicam problema de qualidade ou uso indevido.',
    ],
  },

  {
    title: '9. Relatório Mensal',
    paragraphs: [
      'Objetivo: consolidar mês a mês as entradas, saídas, saldo, total de equipamentos e novas empresas cadastradas no período.',
      'Para que serve: apresentações gerenciais e fechamento de mês. Ideal para diretoria e acompanhamento de tendência (a frota está crescendo ou encolhendo?).',
      'Fonte principal: agregações sobre movimentacoes (por mês) e empresas (cadastros novos).',
    ],
    bullets: [
      'Card "Total de Entradas": soma de movimentações tipo Entrada no período. Origem: COUNT(movimentacoes WHERE tipo_movimento = "entrada").',
      'Card "Total de Saídas": soma de Saídas no período. Origem: COUNT(movimentacoes WHERE tipo_movimento = "saida").',
      'Card "Equipamentos": total ativo no último mês do período. Origem: COUNT(equipamentos) acumulado até o mês.',
      'Card "Novas Empresas": empresas cadastradas no período. Origem: COUNT(empresas WHERE created_at no período).',
      'Coluna Mês: mês/ano de referência (agrupador).',
      'Coluna Entradas (verde, com +): movimentações de entrada do mês.',
      'Coluna Saídas (vermelho, com −): movimentações de saída do mês.',
      'Coluna Saldo: Entradas − Saídas. Positivo (verde) = cresceu; negativo (vermelho) = diminuiu.',
      'Coluna Total Equipamentos: quantidade cadastrada até o fim daquele mês.',
      'Coluna Novas Empresas: clientes cadastrados no mês.',
      'Filtro Ano: ano de análise.',
      'Filtro Mês Inicial / Mês Final: intervalo dentro do ano.',
      'Dica: combine com o relatório de Frota para uma visão gerencial completa (operação + faturamento).',
    ],
  },

  {
    title: '10. Estoque Detalhado',
    paragraphs: [
      'Objetivo: analisar os níveis de estoque (Disponíveis na TACOM), destacando itens em quantidade crítica conforme um mínimo recomendado por tipo/modelo.',
      'Para que serve: apoiar o planejamento de compras e reposição. Evita ruptura (faltar equipamento) e excesso (capital parado).',
      'Fonte principal: equipamentos filtrados por status = "disponivel", agrupados por tipo/modelo.',
    ],
    bullets: [
      'Card "Total em Estoque": todos os equipamentos disponíveis. Origem: COUNT(equipamentos WHERE status = "disponivel").',
      'Card "Estoque Crítico": tipos/modelos abaixo do mínimo configurado.',
      'Card "Estoque Saudável": tipos com quantidade adequada.',
      'Coluna Tipo / Modelo: categoria do equipamento. Origem: equipamentos.tipo / modelo.',
      'Coluna Quantidade Disponível: itens prontos para entrega. Origem: COUNT(equipamentos WHERE status = "disponivel" GROUP BY tipo, modelo).',
      'Coluna Mínimo Recomendado: valor de referência para alerta.',
      'Coluna Status do Estoque: OK (verde), Atenção (laranja) ou Crítico (vermelho).',
      'Dica: revise semanalmente; itens em laranja/vermelho exigem ação imediata.',
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
