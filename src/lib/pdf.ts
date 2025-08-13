import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportSummaryPDF(opts: {
  title?: string;
  bcgSelector?: string; // e.g., '#bcg-chart'
  swot?: { strengths:string[]; weaknesses:string[]; opportunities:string[]; threats:string[] };
}){
  const doc = new jsPDF({ unit:'pt', format:'a4' });
  const marginX = 40; let y = 48;
  const line = (txt:string, size=12) => { doc.setFontSize(size); doc.text(txt, marginX, y); y += size + 6; };
  const section = (hdr:string) => { y += 6; doc.setFontSize(14); doc.text(hdr, marginX, y); y += 8; doc.setFontSize(11); };

  line(opts.title || 'Business Analysis Summary', 18);
  line(new Date().toLocaleString(), 10);

  if (opts.bcgSelector){
    const el = document.querySelector(opts.bcgSelector) as HTMLElement | null;
    if (el){
      const canvas = await html2canvas(el, { backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = doc.internal.pageSize.getWidth();
      const imgW = pageWidth - marginX*2; const ratio = canvas.height / canvas.width;
      const imgH = imgW * ratio; // scale to width
      if (y + imgH > doc.internal.pageSize.getHeight() - 40){ doc.addPage(); y = 48; }
      doc.addImage(imgData, 'PNG', marginX, y, imgW, imgH);
      y += imgH + 12;
    }
  }

  if (opts.swot){
    section('SWOT');
    const cols: [string, string[]][] = [
      ['Strengths', opts.swot.strengths||[]],
      ['Weaknesses', opts.swot.weaknesses||[]],
      ['Opportunities', opts.swot.opportunities||[]],
      ['Threats', opts.swot.threats||[]],
    ];
    for (const [hdr, items] of cols){
      line(hdr + ':', 12);
      if (items.length === 0){ line('—'); continue; }
      for (const it of items){
        const text = '• ' + it;
        const split = doc.splitTextToSize(text, 515);
        for (const s of split){ line(s, 11); }
      }
      y += 6;
      if (y > doc.internal.pageSize.getHeight() - 80){ doc.addPage(); y = 48; }
    }
  }

  doc.save('bizanalysis-summary.pdf');
}
