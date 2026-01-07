"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Download, 
  FileText,
  Filter,
  X,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Income {
  _id: string;
  userId: string;
  clientId: string;
  amount: number;
  status: string;
  method?: string;
  markedBy?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  _id: string;
  userId: string;
  clientId?: string;
  category: string;
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CommonExpense {
  _id: string;
  userId: string;
  category: string;
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  name: string;
}

interface CashFlowItem {
  _id: string;
  type: 'income' | 'expense';
  clientId?: string;
  clientName?: string;
  category?: string;
  notes?: string;
  amount: number;
  date: string;
  addedBy?: string;
  status?: string;
  method?: string;
  markedBy?: string;
  expenseType?: 'common' | 'project';
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function CashFlowPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commonExpenses, setCommonExpenses] = useState<CommonExpense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [incomeRes, expenseRes, commonExpenseRes, clientsRes] = await Promise.all([
        fetch("/api/interior-income"),
        fetch("/api/expenses"),
        fetch("/api/common-expenses"),
        fetch("/api/clients")
      ]);

      if (incomeRes.ok) {
        const incomeData = await incomeRes.json();
        setIncomes(incomeData.interiorIncomes || []);
      }

      if (expenseRes.ok) {
        const expenseData = await expenseRes.json();
        setExpenses(expenseData.expenses || []);
      }

      if (commonExpenseRes.ok) {
        const commonData = await commonExpenseRes.json();
        setCommonExpenses(commonData.expenses || []);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c._id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getDateRange = () => {
    const now = new Date();
    let from: Date, to: Date;

    switch (dateFilter) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        from = new Date(now);
        from.setDate(now.getDate() - dayOfWeek);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          from = new Date(customDateFrom);
          to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
        } else {
          return null;
        }
        break;
      default:
        return null;
    }

    return { from, to };
  };

  const filterByDate = (dateString: string) => {
    if (dateFilter === 'all') return true;
    const range = getDateRange();
    if (!range) return true;
    const date = new Date(dateString);
    return date >= range.from && date <= range.to;
  };

  const combinedCashFlow = useMemo(() => {
    const incomeItems: CashFlowItem[] = incomes
      .filter(inc => {
        // Only show completed/paid income
        const isCompleted = inc.status === 'completed' || inc.status === 'paid';
        return isCompleted && filterByDate(inc.date);
      })
      .map(inc => ({
        _id: inc._id,
        type: 'income' as const,
        clientId: inc.clientId,
        clientName: getClientName(inc.clientId),
        amount: inc.amount,
        date: inc.date,
        status: inc.status,
        method: inc.method,
        markedBy: inc.markedBy
      }));

    const expenseItems: CashFlowItem[] = [
      ...expenses
        .filter(exp => filterByDate(exp.date))
        .map(exp => ({
          _id: exp._id,
          type: 'expense' as const,
          clientId: exp.clientId,
          clientName: getClientName(exp.clientId),
          category: exp.category,
          notes: exp.notes,
          amount: exp.amount,
          date: exp.date,
          addedBy: exp.addedBy,
          expenseType: 'project' as const
        })),
      ...commonExpenses
        .filter(exp => filterByDate(exp.date))
        .map(exp => ({
          _id: exp._id,
          type: 'expense' as const,
          category: exp.category,
          notes: exp.notes,
          amount: exp.amount,
          date: exp.date,
          addedBy: exp.addedBy,
          expenseType: 'common' as const
        }))
    ];

    return [...incomeItems, ...expenseItems].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [incomes, expenses, commonExpenses, clients, dateFilter, customDateFrom, customDateTo]);

  const filteredIncomes = useMemo(() => 
    combinedCashFlow.filter(item => item.type === 'income'),
    [combinedCashFlow]
  );

  const filteredExpenses = useMemo(() => 
    combinedCashFlow.filter(item => item.type === 'expense'),
    [combinedCashFlow]
  );

  // Calculate running balance for all transactions (oldest to newest)
  const sortedForBalance = [...combinedCashFlow].reverse(); // Oldest first
  let runningBalance = 0;
  const transactionsWithBalance = sortedForBalance.map(item => {
    if (item.type === 'income') {
      runningBalance += item.amount;
    } else {
      runningBalance -= item.amount;
    }
    return { ...item, balance: runningBalance };
  }).reverse(); // Reverse back to newest first

  // Pagination for combined transactions
  const totalPages = Math.ceil(combinedCashFlow.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactionsWithBalance.slice(startIndex, endIndex);

  // Pagination for income table
  const incomeTotalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const incomeStartIndex = (incomePage - 1) * itemsPerPage;
  const incomeEndIndex = incomeStartIndex + itemsPerPage;
  const paginatedIncomes = filteredIncomes.slice(incomeStartIndex, incomeEndIndex);

  // Pagination for expense table
  const expenseTotalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const expenseStartIndex = (expensePage - 1) * itemsPerPage;
  const expenseEndIndex = expenseStartIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(expenseStartIndex, expenseEndIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setIncomePage(1);
    setExpensePage(1);
  }, [dateFilter, customDateFrom, customDateTo]);

  const totalIncome = useMemo(() => 
    filteredIncomes.reduce((sum, item) => sum + item.amount, 0),
    [filteredIncomes]
  );

  const totalExpenses = useMemo(() => 
    filteredExpenses.reduce((sum, item) => sum + item.amount, 0),
    [filteredExpenses]
  );

  const balance = totalIncome - totalExpenses;

  // Analytics calculations
  const getAnalytics = (period: 'today' | 'week' | 'month') => {
    const now = new Date();
    let from: Date, to: Date;

    switch (period) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        from = new Date(now);
        from.setDate(now.getDate() - dayOfWeek);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }

    const periodIncomes = incomes.filter(inc => {
      // Only count completed/paid income
      const isCompleted = inc.status === 'completed' || inc.status === 'paid';
      const date = new Date(inc.date);
      return isCompleted && date >= from && date <= to;
    });

    const periodExpenses = [
      ...expenses.filter(exp => {
        const date = new Date(exp.date);
        return date >= from && date <= to;
      }),
      ...commonExpenses.filter(exp => {
        const date = new Date(exp.date);
        return date >= from && date <= to;
      })
    ];

    const periodIncome = periodIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const periodExpense = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const periodBalance = periodIncome - periodExpense;

    return {
      income: periodIncome,
      expense: periodExpense,
      balance: periodBalance,
      count: periodIncomes.length + periodExpenses.length
    };
  };

  const todayAnalytics = getAnalytics('today');
  const weekAnalytics = getAnalytics('week');
  const monthAnalytics = getAnalytics('month');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Download functions for All Transactions
  const handleDownloadAllTransactionsExcel = () => {
    if (combinedCashFlow.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No transactions to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Calculate running balance for Excel export
    const sortedForBalance = [...combinedCashFlow].reverse();
    let runningBalance = 0;
    const data = sortedForBalance.map(item => {
      if (item.type === 'income') {
        runningBalance += item.amount;
      } else {
        runningBalance -= item.amount;
      }
      return {
        'Date': formatDate(item.date),
        'Client': item.clientName || '-',
        'Category': item.category || '-',
        'Credit': item.type === 'income' ? item.amount : '',
        'Debit': item.type === 'expense' ? item.amount : '',
        'Balance': runningBalance,
        'Marked By': item.type === 'income' 
          ? (item.markedBy ? item.markedBy.split('@')[0] : '-')
          : (item.addedBy ? item.addedBy.split('@')[0] : '-'),
        'Expense Type': item.type === 'expense' 
          ? (item.expenseType ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) : '-')
          : '-'
      };
    }).reverse();

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Transactions');

    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const fileName = `all_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    Swal.fire({
      icon: 'success',
      title: 'Downloaded!',
      text: 'All transactions exported to Excel successfully',
      confirmButtonColor: '#3B82F6',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleDownloadAllTransactionsPDF = () => {
    if (combinedCashFlow.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No transactions to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      
      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect
      doc.setFillColor(0, 51, 102); // Dark blue
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142); // Lighter blue for accent
      doc.rect(5, 45, 200, 20, 'F');
      
      // Add company details on left side with professional styling
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", 15, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
      doc.text("Upputhara P.O, Idukki District", 15, 35);
      doc.text("Kerala – 685505, India", 15, 40);

      // Add logo on right side
      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found, continuing without logo');
      }

      // Add contact details in light blue area
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });
      
      // Add professional report details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 35, 2, 2, 'F');
      
      // Add report details on left
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("REPORT DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Type: All Transactions`, 15, 95);
      doc.text(`Date: ${formatDate(currentDate.toISOString())}`, 15, 105);
      
      // Add report title section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 120, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("ALL TRANSACTIONS REPORT", 105, 128, { align: "center" });

      // Calculate running balance for PDF export
      const sortedForBalance = [...combinedCashFlow].reverse();
      let runningBalance = 0;
      const tableData = sortedForBalance.map(item => {
        if (item.type === 'income') {
          runningBalance += item.amount;
        } else {
          runningBalance -= item.amount;
        }
        return [
          formatDate(item.date),
          item.clientName || '-',
          item.category || '-',
          item.type === 'income' ? formatCurrency(item.amount) : '-',
          item.type === 'expense' ? formatCurrency(item.amount) : '-',
          formatCurrency(runningBalance),
          item.type === 'income' 
            ? (item.markedBy ? item.markedBy.split('@')[0] : '-')
            : (item.addedBy ? item.addedBy.split('@')[0] : '-'),
          item.type === 'expense'
            ? (item.expenseType ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) : '-')
            : '-'
        ];
      }).reverse();

      autoTable(doc, {
        startY: 140,
        head: [['Date', 'Client', 'Category', 'Credit', 'Debit', 'Balance', 'Marked By', 'Expense Type']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 15, right: 15 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Add borders and page numbers to all pages
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      const fileName = `all_transactions_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Downloaded!',
        text: 'All transactions exported to PDF successfully',
        confirmButtonColor: '#3B82F6',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to generate PDF',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Download functions for Income
  const handleDownloadIncomeExcel = () => {
    if (filteredIncomes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No income records to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    const data = filteredIncomes.map(item => ({
      'Date': formatDate(item.date),
      'Client': item.clientName || '-',
      'Amount': item.amount,
      'Status': item.status || '-',
      'Payment Method': item.method || '-',
      'Marked By': item.markedBy ? item.markedBy.split('@')[0] : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Income');

    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];

    const fileName = `income_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    Swal.fire({
      icon: 'success',
      title: 'Downloaded!',
      text: 'Income records exported to Excel successfully',
      confirmButtonColor: '#3B82F6',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleDownloadIncomePDF = () => {
    if (filteredIncomes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No income records to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      
      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect
      doc.setFillColor(0, 51, 102); // Dark blue
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142); // Lighter blue for accent
      doc.rect(5, 45, 200, 20, 'F');
      
      // Add company details on left side with professional styling
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", 15, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
      doc.text("Upputhara P.O, Idukki District", 15, 35);
      doc.text("Kerala – 685505, India", 15, 40);

      // Add logo on right side
      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found, continuing without logo');
      }

      // Add contact details in light blue area
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });
      
      // Add professional report details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 35, 2, 2, 'F');
      
      // Add report details on left
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("REPORT DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Type: Income`, 15, 95);
      doc.text(`Date: ${formatDate(currentDate.toISOString())}`, 15, 105);
      
      // Add report title section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 120, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("INCOME REPORT", 105, 128, { align: "center" });

      const tableData = filteredIncomes.map(item => [
        formatDate(item.date),
        item.clientName || '-',
        formatCurrency(item.amount),
        item.status || '-',
        item.markedBy ? item.markedBy.split('@')[0] : '-'
      ]);

      autoTable(doc, {
        startY: 140,
        head: [['Date', 'Client', 'Amount', 'Status', 'Marked By']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 15, right: 15 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Add borders and page numbers to all pages
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      const fileName = `income_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Downloaded!',
        text: 'Income records exported to PDF successfully',
        confirmButtonColor: '#3B82F6',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to generate PDF',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Download functions for Expenses
  const handleDownloadExpensesExcel = () => {
    if (filteredExpenses.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No expense records to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    const data = filteredExpenses.map(item => ({
      'Date': formatDate(item.date),
      'Client': item.clientName || '-',
      'Category': item.category || '-',
      'Type': item.expenseType ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) : '-',
      'Amount': item.amount,
      'Marked By': item.addedBy ? item.addedBy.split('@')[0] : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    Swal.fire({
      icon: 'success',
      title: 'Downloaded!',
      text: 'Expense records exported to Excel successfully',
      confirmButtonColor: '#3B82F6',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleDownloadExpensesPDF = () => {
    if (filteredExpenses.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No expense records to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      
      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect
      doc.setFillColor(0, 51, 102); // Dark blue
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142); // Lighter blue for accent
      doc.rect(5, 45, 200, 20, 'F');
      
      // Add company details on left side with professional styling
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", 15, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
      doc.text("Upputhara P.O, Idukki District", 15, 35);
      doc.text("Kerala – 685505, India", 15, 40);

      // Add logo on right side
      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found, continuing without logo');
      }

      // Add contact details in light blue area
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });
      
      // Add professional report details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 35, 2, 2, 'F');
      
      // Add report details on left
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("REPORT DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Type: Expenses`, 15, 95);
      doc.text(`Date: ${formatDate(currentDate.toISOString())}`, 15, 105);
      
      // Add report title section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 120, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("EXPENSES REPORT", 105, 128, { align: "center" });

      const tableData = filteredExpenses.map(item => [
        formatDate(item.date),
        item.clientName || '-',
        item.category || '-',
        item.expenseType ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) : '-',
        formatCurrency(item.amount),
        item.addedBy ? item.addedBy.split('@')[0] : '-'
      ]);

      autoTable(doc, {
        startY: 140,
        head: [['Date', 'Client', 'Category', 'Type', 'Amount', 'Marked By']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 15, right: 15 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Add borders and page numbers to all pages
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      const fileName = `expenses_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Downloaded!',
        text: 'Expense records exported to PDF successfully',
        confirmButtonColor: '#3B82F6',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to generate PDF',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cash Flow</h1>
        <p className="text-gray-600 mt-1">Track your income and expenses</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Today</h3>
            <Calendar className="h-5 w-5 opacity-80" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs opacity-80 mb-1">Income</p>
              <p className="text-xl font-bold">{formatCurrency(todayAnalytics.income)}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">Expenses</p>
              <p className="text-xl font-bold">{formatCurrency(todayAnalytics.expense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">This Week</h3>
            <BarChart3 className="h-5 w-5 opacity-80" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs opacity-80 mb-1">Income</p>
              <p className="text-xl font-bold">{formatCurrency(weekAnalytics.income)}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">Expenses</p>
              <p className="text-xl font-bold">{formatCurrency(weekAnalytics.expense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">This Month</h3>
            <TrendingUp className="h-5 w-5 opacity-80" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs opacity-80 mb-1">Income</p>
              <p className="text-xl font-bold">{formatCurrency(monthAnalytics.income)}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">Expenses</p>
              <p className="text-xl font-bold">{formatCurrency(monthAnalytics.expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-xl border shadow-sm ${
          balance >= 0 ? 'border-green-200' : 'border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className={`text-2xl font-bold mt-1 ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              balance >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {(customDateFrom || customDateTo) && (
                <button
                  onClick={() => {
                    setCustomDateFrom("");
                    setCustomDateTo("");
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Combined Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Transactions</h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-600">Income</p>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Expenses</p>
                <p className="text-sm font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadAllTransactionsExcel}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleDownloadAllTransactionsPDF}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.clientName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {item.type === 'income' ? formatCurrency(item.amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {item.type === 'expense' ? formatCurrency(item.amount) : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.type === 'income' 
                        ? (item.markedBy ? item.markedBy.split('@')[0] : '-')
                        : (item.addedBy ? item.addedBy.split('@')[0] : '-')
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === 'expense' ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.expenseType === 'project'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.expenseType ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) : '-'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {combinedCashFlow.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, combinedCashFlow.length)} of {combinedCashFlow.length} transactions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Separate Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Income</span>
                <span className="ml-2 text-sm font-normal text-gray-600">
                  Total: {formatCurrency(totalIncome)}
                </span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadIncomeExcel}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleDownloadIncomePDF}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedIncomes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No income records found
                    </td>
                  </tr>
                ) : (
                  paginatedIncomes.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.clientName || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        +{formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'paid' || item.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.markedBy ? item.markedBy.split('@')[0] : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls for Income */}
          {filteredIncomes.length > itemsPerPage && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {incomeStartIndex + 1} to {Math.min(incomeEndIndex, filteredIncomes.length)} of {filteredIncomes.length} records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIncomePage(prev => Math.max(1, prev - 1))}
                  disabled={incomePage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    incomePage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: incomeTotalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === incomeTotalPages ||
                      (page >= incomePage - 1 && page <= incomePage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setIncomePage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            incomePage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === incomePage - 2 ||
                      page === incomePage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setIncomePage(prev => Math.min(incomeTotalPages, prev + 1))}
                  disabled={incomePage === incomeTotalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    incomePage === incomeTotalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span>Expenses</span>
                <span className="ml-2 text-sm font-normal text-gray-600">
                  Total: {formatCurrency(totalExpenses)}
                </span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadExpensesExcel}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleDownloadExpensesPDF}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No expense records found
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.clientName || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.expenseType === 'project'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.expenseType ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        -{formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.addedBy ? item.addedBy.split('@')[0] : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls for Expenses */}
          {filteredExpenses.length > itemsPerPage && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {expenseStartIndex + 1} to {Math.min(expenseEndIndex, filteredExpenses.length)} of {filteredExpenses.length} records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpensePage(prev => Math.max(1, prev - 1))}
                  disabled={expensePage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    expensePage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: expenseTotalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === expenseTotalPages ||
                      (page >= expensePage - 1 && page <= expensePage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setExpensePage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            expensePage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === expensePage - 2 ||
                      page === expensePage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setExpensePage(prev => Math.min(expenseTotalPages, prev + 1))}
                  disabled={expensePage === expenseTotalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    expensePage === expenseTotalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

