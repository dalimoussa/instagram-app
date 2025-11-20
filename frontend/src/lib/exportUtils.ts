import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AnalyticsExportData {
  account: string;
  dateRange: string;
  accountMetrics: {
    impressions: number;
    reach: number;
    followerCount: number;
    engagement: number;
    profileViews: number;
    websiteClicks: number;
  };
  topPosts?: Array<{
    caption: string;
    impressions: number;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    saves: number;
    publishedAt: string;
  }>;
  exportedAt: string;
}

export const exportToCSV = (data: AnalyticsExportData) => {
  const csvRows = [];
  
  // Header
  csvRows.push('Instagram Analytics Report');
  csvRows.push(`Account,@${data.account}`);
  csvRows.push(`Date Range,${data.dateRange}`);
  csvRows.push(`Generated,${new Date(data.exportedAt).toLocaleString()}`);
  csvRows.push('');
  
  // Account Metrics
  csvRows.push('Account Metrics');
  csvRows.push('Metric,Value');
  csvRows.push(`Impressions,${data.accountMetrics.impressions}`);
  csvRows.push(`Reach,${data.accountMetrics.reach}`);
  csvRows.push(`Followers,${data.accountMetrics.followerCount}`);
  csvRows.push(`Total Engagement,${data.accountMetrics.engagement}`);
  csvRows.push(`Profile Views,${data.accountMetrics.profileViews}`);
  csvRows.push(`Website Clicks,${data.accountMetrics.websiteClicks}`);
  csvRows.push('');
  
  // Top Posts
  if (data.topPosts && data.topPosts.length > 0) {
    csvRows.push('Top Performing Posts');
    csvRows.push('Published Date,Caption,Impressions,Reach,Likes,Comments,Saves,Total Engagement');
    data.topPosts.forEach(post => {
      const caption = post.caption.replace(/,/g, ';').replace(/\n/g, ' ').substring(0, 100);
      csvRows.push(
        `${new Date(post.publishedAt).toLocaleDateString()},${caption},${post.impressions},${post.reach},${post.likes},${post.comments},${post.saves},${post.engagement}`
      );
    });
  }
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics-${data.account}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (data: AnalyticsExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('Instagram Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  // Account Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Account: @${data.account}`, 14, 35);
  doc.text(`Date Range: ${data.dateRange}`, 14, 42);
  doc.text(`Generated: ${new Date(data.exportedAt).toLocaleString()}`, 14, 49);
  
  // Account Metrics Table
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text('Account Metrics', 14, 62);
  
  autoTable(doc, {
    startY: 67,
    head: [['Metric', 'Value']],
    body: [
      ['Impressions', data.accountMetrics.impressions.toLocaleString()],
      ['Reach', data.accountMetrics.reach.toLocaleString()],
      ['Followers', data.accountMetrics.followerCount.toLocaleString()],
      ['Total Engagement', data.accountMetrics.engagement.toLocaleString()],
      ['Profile Views', data.accountMetrics.profileViews.toLocaleString()],
      ['Website Clicks', data.accountMetrics.websiteClicks.toLocaleString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });
  
  // Top Posts Table
  if (data.topPosts && data.topPosts.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Top Performing Posts', 14, finalY + 15);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Date', 'Caption', 'Impressions', 'Reach', 'Engagement']],
      body: data.topPosts.slice(0, 15).map(post => [
        new Date(post.publishedAt).toLocaleDateString(),
        post.caption.substring(0, 50) + (post.caption.length > 50 ? '...' : ''),
        post.impressions.toLocaleString(),
        post.reach.toLocaleString(),
        post.engagement.toLocaleString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        1: { cellWidth: 60 },
      },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`analytics-${data.account}-${Date.now()}.pdf`);
};
