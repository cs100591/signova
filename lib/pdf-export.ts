import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface AnalysisFinding {
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'MISSING';
  title: string;
  issue: string;
  quote: string;
  explanation: string;
  suggestion?: string;
}

export interface ContractAnalysis {
  contractName: string;
  contractType: string;
  riskScore: number;
  verdict: string;
  findings: AnalysisFinding[];
  missing: string[];
  summary: string[];
  analyzedAt: string;
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'HIGH': return '#DC2626';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#10B981';
    case 'MISSING': return '#6B7280';
    default: return '#6B7280';
  }
};

const getSeverityEmoji = (severity: string): string => {
  switch (severity) {
    case 'HIGH': return '🔴';
    case 'MEDIUM': return '🟡';
    case 'LOW': return '🟢';
    case 'MISSING': return '⚫';
    default: return '⚪';
  }
};

const getRiskScoreColor = (score: number): string => {
  if (score <= 30) return '#10B981';
  if (score <= 70) return '#F59E0B';
  return '#DC2626';
};

export async function exportAnalysisToPDF(
  analysis: ContractAnalysis, 
  elementId?: string
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Helper to add text with wrapping
  const addText = (text: string, x: number, yPos: number, options?: { 
    fontSize?: number; 
    fontStyle?: string;
    color?: string;
    maxWidth?: number;
    lineHeight?: number;
  }): number => {
    const {
      fontSize = 11,
      fontStyle = 'normal',
      color = '#1A1A1A',
      maxWidth = contentWidth,
      lineHeight = fontSize * 0.5
    } = options || {};

    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(color);

    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, yPos);
    
    return lines.length * lineHeight;
  };

  // Helper to add a new page if needed
  const checkNewPage = (neededSpace: number): void => {
    if (y + neededSpace > 280) {
      pdf.addPage();
      y = margin;
    }
  };

  // Header
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Signova', margin, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AI Contract Analysis Report', margin, 35);

  y = 65;

  // Contract Info
  y += addText(analysis.contractName, margin, y, { fontSize: 18, fontStyle: 'bold' });
  y += 5;
  y += addText(`Type: ${analysis.contractType}`, margin, y, { fontSize: 11, color: '#6B7280' });
  y += 5;
  y += addText(`Analyzed: ${new Date(analysis.analyzedAt).toLocaleDateString()}`, margin, y, { fontSize: 11, color: '#6B7280' });
  y += 15;

  // Risk Score Box
  const scoreBoxHeight = 35;
  checkNewPage(scoreBoxHeight + 20);
  
  pdf.setDrawColor(getRiskScoreColor(analysis.riskScore));
  pdf.setLineWidth(1);
  pdf.roundedRect(margin, y, contentWidth, scoreBoxHeight, 3, 3, 'S');
  
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(getRiskScoreColor(analysis.riskScore));
  pdf.text(analysis.riskScore.toString(), margin + 5, y + 25);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor('#6B7280');
  pdf.text('Risk Score', margin + 5, y + 32);
  
  pdf.setFontSize(10);
  pdf.setTextColor('#1A1A1A');
  const verdictLines = pdf.splitTextToSize(analysis.verdict, contentWidth - 70);
  pdf.text(verdictLines, margin + 70, y + 20);
  
  y += scoreBoxHeight + 20;

  // Summary Section
  checkNewPage(40);
  y += addText('Executive Summary', margin, y, { fontSize: 14, fontStyle: 'bold' });
  y += 8;
  
  analysis.summary.forEach((point, index) => {
    checkNewPage(15);
    y += addText(`• ${point}`, margin + 5, y, { fontSize: 10, lineHeight: 5 });
    y += 3;
  });
  y += 10;

  // Findings Section
  if (analysis.findings.length > 0) {
    checkNewPage(30);
    y += addText('Risk Findings', margin, y, { fontSize: 14, fontStyle: 'bold' });
    y += 10;

    analysis.findings.forEach((finding, index) => {
      const findingHeight = 60; // Approximate height
      checkNewPage(findingHeight);

      // Finding box
      pdf.setDrawColor('#E5E7EB');
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, contentWidth, findingHeight, 3, 3, 'S');

      // Severity badge
      const severityColor = getSeverityColor(finding.severity);
      pdf.setFillColor(severityColor);
      pdf.roundedRect(margin + 5, y + 5, 25, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(finding.severity, margin + 8, y + 10.5);

      // Category
      pdf.setTextColor('#6B7280');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(finding.category, margin + 35, y + 10.5);

      // Title
      pdf.setTextColor('#1A1A1A');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${getSeverityEmoji(finding.severity)} ${finding.title}`, margin + 5, y + 22);

      // Issue
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor('#374151');
      const issueLines = pdf.splitTextToSize(finding.issue, contentWidth - 10);
      pdf.text(issueLines, margin + 5, y + 30);

      // Quote (if space permits)
      if (finding.quote && finding.quote.length < 100) {
        pdf.setFontSize(8);
        pdf.setTextColor('#6B7280');
        pdf.setFont('helvetica', 'italic');
        const quoteLines = pdf.splitTextToSize(`"${finding.quote}"`, contentWidth - 10);
        pdf.text(quoteLines, margin + 5, y + 40);
      }

      y += findingHeight + 8;
    });
  }

  // Missing Protections
  if (analysis.missing.length > 0) {
    checkNewPage(40);
    y += addText('Missing Protections', margin, y, { fontSize: 14, fontStyle: 'bold' });
    y += 8;
    
    analysis.missing.forEach((item, index) => {
      checkNewPage(10);
      y += addText(`⚫ ${item}`, margin + 5, y, { fontSize: 10, lineHeight: 5 });
      y += 3;
    });
  }

  // Footer
  const footerY = 285;
  pdf.setDrawColor('#E5E7EB');
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  
  pdf.setFontSize(8);
  pdf.setTextColor('#9CA3AF');
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by Signova • AI Contract Analysis', margin, footerY);
  pdf.text('This analysis is for informational purposes only and does not constitute legal advice.', margin, footerY + 5);
  pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - margin - 20, footerY);

  // Save PDF
  const filename = `signova-analysis-${analysis.contractName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

// Alternative: Export from DOM element (better for complex layouts)
export async function exportElementToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
