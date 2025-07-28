"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  FileText,
  Download,
  CreditCard,
  Plus,
  Circle,
  Play
} from "lucide-react";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Stage {
  _id: string;
  userId: string;
  clientId: string;
  date: string;
  stageDesc: string;
  createdAt: string;
}

interface InteriorIncome {
  _id: string;
  userId: string;
  clientId: string;
  amount: number;
  status: string;
  method: string | null;
  date: string;
  createdAt: string;
  markedBy?: string;
}

interface Bank {
  _id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
  upiId: string;
}

interface Estimate {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
}

interface Expense {
  _id: string;
  userId: string;
  clientId: string;
  category: 'material' | 'labour' | 'other';
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApprovedWorkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [interiorIncomes, setInteriorIncomes] = useState<InteriorIncome[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workStarted, setWorkStarted] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch estimate details
        const estimateResponse = await fetch(`/api/interior-estimates/${estimateId}`);
        if (!estimateResponse.ok) {
          throw new Error('Failed to fetch estimate details');
        }
        const estimateData = await estimateResponse.json();
        setEstimate(estimateData.estimate);

        // Fetch client details
        if (estimateData.estimate?.clientId) {
          const clientResponse = await fetch(`/api/clients/${estimateData.estimate.clientId}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setEstimate(prev => prev ? { ...prev, client: clientData.client } : null);
          }
        }

        // Fetch stages for this client
        const stagesResponse = await fetch(`/api/stages?clientId=${estimateData.estimate.clientId}`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          const fetchedStages = stagesData.stages || [];
          setStages(fetchedStages);
          
          // Check if work has started (if "Work Started" stage exists)
          const hasWorkStarted = fetchedStages.some((stage: Stage) => stage.stageDesc === 'Work Started');
          setWorkStarted(hasWorkStarted);
        }

        // Fetch interior income for this client
        const incomeResponse = await fetch(`/api/interior-income?clientId=${estimateData.estimate.clientId}`);
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          console.log('Interior Income Data:', incomeData);
          setInteriorIncomes(incomeData.interiorIncomes || []);
        } else {
          console.error('Failed to fetch interior income:', incomeResponse.status, incomeResponse.statusText);
        }

        // Fetch banks
        const banksResponse = await fetch('/api/banks');
        if (banksResponse.ok) {
          const banksData = await banksResponse.json();
          setBanks(banksData.banks || []);
        }

        // Fetch current user
        try {
          const userResponse = await fetch('/api/auth/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.user);
          }
        } catch (error) {
          console.log('Could not fetch current user, using default');
          // Set a default user if we can't fetch the current user
          setCurrentUser({ name: 'Current User', email: 'user@example.com' });
        }

        // Fetch expenses for this client
        const expensesResponse = await fetch(`/api/expenses?clientId=${estimateData.estimate.clientId}`);
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData.expenses || []);
        }

      } catch (error) {
        console.error('Error fetching details:', error);
        setError('Failed to load work details');
      } finally {
        setLoading(false);
      }
    };

    if (estimateId) {
      fetchDetails();
    }
  }, [estimateId]);

  const handleBackToApprovedWorks = () => {
    router.push('/dashboard/interior-work/approved');
  };

  const handleDownloadInvoice = async (income: InteriorIncome) => {
    if (!selectedBank) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Bank Account',
        text: 'Please select a bank account before downloading the invoice.',
        confirmButtonText: 'OK'
      });
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Company Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Takshaga Interior Solutions', 20, 40);
    doc.text('Interior Design & Construction', 20, 50);
    doc.text('Phone: +91 1234567890', 20, 60);
    doc.text('Email: info@takshaga.com', 20, 70);
    
    // Bank Details
    doc.text('Bank Details:', 20, 90);
    doc.text(`Bank: ${selectedBank.bankName}`, 20, 100);
    doc.text(`Account: ${selectedBank.accountName}`, 20, 110);
    doc.text(`A/C No: ${selectedBank.accountNumber}`, 20, 120);
    doc.text(`IFSC: ${selectedBank.ifscCode}`, 20, 130);
    doc.text(`UPI: ${selectedBank.upiId}`, 20, 140);
    
    // Client Info
    doc.text('Bill To:', 120, 90);
    if (estimate.client) {
      doc.text(estimate.client.name, 120, 100);
      doc.text(estimate.client.email, 120, 110);
      doc.text(estimate.client.phone, 120, 120);
      doc.text(estimate.client.location, 120, 130);
    }
    
    // Invoice Details
    doc.text('Invoice Details:', 20, 160);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 170);
    doc.text(`Payment Phase: Phase ${interiorIncomes.indexOf(income) + 1}`, 20, 180);
    
    // Amount
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount: ₹${income.amount.toLocaleString()}`, 20, 200);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    doc.save(`invoice-phase-${interiorIncomes.indexOf(income) + 1}-${estimate.client?.name || 'client'}.pdf`);
  };

  const handleMarkAsPaid = async (income: InteriorIncome) => {
    const { value: method } = await Swal.fire({
      title: 'Mark as Paid',
      text: 'Select payment method:',
      input: 'select',
      inputOptions: {
        'cash': 'Cash',
        'bank': 'Bank'
      },
      inputPlaceholder: 'Select payment method',
      showCancelButton: true,
      confirmButtonText: 'Mark as Paid',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a payment method';
        }
      }
    });

    if (method) {
      try {
        const response = await fetch(`/api/interior-income/${income._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
            method: method,
            markedBy: currentUser?.name || currentUser?.email || 'Unknown User'
          }),
        });

        if (response.ok) {
          const updatedIncome = await response.json();
          
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Marked as Paid',
            text: 'Payment has been successfully marked as completed and next phase created.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to mark payment as paid.',
        });
      }
    }
  };

  const createNextPhasePayment = async () => {
    // Calculate balance amount (total - completed payments)
    const completedAmount = interiorIncomes
      .filter(income => income && income.status === 'completed')
      .reduce((sum, income) => sum + (income?.amount || 0), 0);
    const balanceAmount = estimate.totalAmount - completedAmount;

    const { value: amount } = await Swal.fire({
      title: 'Create Next Phase Payment',
      text: `Enter amount for the next payment phase (Max: ₹${balanceAmount.toLocaleString()}):`,
      input: 'number',
      inputPlaceholder: `Enter amount (0 to ₹${balanceAmount.toLocaleString()})`,
      inputAttributes: {
        max: balanceAmount,
        min: 0,
        step: 1
      },
      showCancelButton: true,
      confirmButtonText: 'Create Payment',
      cancelButtonText: 'Skip',
      inputValidator: (value) => {
        if (!value || value < 0) {
          return 'Please enter a valid amount';
        }
        if (value > balanceAmount) {
          return `Amount cannot exceed balance of ₹${balanceAmount.toLocaleString()}`;
        }
      }
    });

    if (amount) {
      try {
        const response = await fetch('/api/interior-income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate.clientId,
            amount: Number(amount),
            method: null,
            status: 'pending',
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const newIncome = await response.json();
          
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Next Phase Created',
            text: 'New payment phase has been created successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      } catch (error) {
        console.error('Error creating next phase payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create next phase payment.',
        });
      }
    }
  };

  const handleEditPayment = async (income: InteriorIncome) => {
    // Only allow editing pending payments
    if (income.status !== 'pending') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit Completed Payment',
        text: 'Only pending payments can be edited. Completed payments cannot be modified.',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Calculate balance amount (total - completed payments) + current pending amount
    const completedAmount = interiorIncomes
      .filter(inc => inc && inc.status === 'completed')
      .reduce((sum, inc) => sum + (inc?.amount || 0), 0);
    const otherPendingAmount = interiorIncomes
      .filter(inc => inc && inc.status === 'pending' && inc._id !== income._id)
      .reduce((sum, inc) => sum + (inc?.amount || 0), 0);
    const maxAmount = estimate.totalAmount - completedAmount - otherPendingAmount;

    const { value: amount } = await Swal.fire({
      title: 'Edit Payment Amount',
      text: `Enter new amount (Max: ₹${maxAmount.toLocaleString()}):`,
      input: 'number',
      inputValue: income.amount,
      inputPlaceholder: `Enter amount (0 to ₹${maxAmount.toLocaleString()})`,
      inputAttributes: {
        max: maxAmount,
        min: 0,
        step: 1
      },
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || value < 0) {
          return 'Please enter a valid amount';
        }
        if (value > maxAmount) {
          return `Amount cannot exceed maximum of ₹${maxAmount.toLocaleString()}`;
        }
      }
    });

    if (amount && amount !== income.amount) {
      try {
        const response = await fetch(`/api/interior-income/${income._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount)
          }),
        });

        if (response.ok) {
          const updatedIncome = await response.json();
          
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Updated',
            text: 'Payment amount has been updated successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update payment amount.',
        });
      }
    }
  };

  const refetchInteriorIncomes = async () => {
    if (estimate?.clientId) {
      try {
        const incomeResponse = await fetch(`/api/interior-income?clientId=${estimate.clientId}`);
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          console.log('Refetched Interior Income Data:', incomeData);
          setInteriorIncomes(incomeData.interiorIncomes || []);
        }
      } catch (error) {
        console.error('Error refetching interior income:', error);
      }
    }
  };

  const refetchStages = async () => {
    if (estimate?.clientId) {
      try {
        const stagesResponse = await fetch(`/api/stages?clientId=${estimate.clientId}`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          const fetchedStages = stagesData.stages || [];
          setStages(fetchedStages);
          
          // Check if work has started (if "Work Started" stage exists)
          const hasWorkStarted = fetchedStages.some((stage: Stage) => stage.stageDesc === 'Work Started');
          setWorkStarted(hasWorkStarted);
          
          console.log('Refetched Stages Data:', stagesData);
        }
      } catch (error) {
        console.error('Error refetching stages:', error);
      }
    }
  };

  const handleWorkStarted = async () => {
    try {
      const response = await fetch('/api/stages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: estimate.clientId,
          stageDesc: 'Work Started',
          date: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const newStage = await response.json();
        console.log('New stage created:', newStage);
        
        // Refetch stages to ensure we have the latest data
        await refetchStages();
        
        Swal.fire({
          icon: 'success',
          title: 'Work Started',
          text: 'Work has been marked as started successfully.',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorData.message || 'Failed to mark work as started.',
        });
      }
    } catch (error) {
      console.error('Error marking work as started:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to mark work as started.',
      });
    }
  };

  const handleAddStage = async () => {
    const { value: stageDesc } = await Swal.fire({
      title: 'Add New Stage',
      text: 'Enter stage description:',
      input: 'text',
      inputPlaceholder: 'e.g., Foundation Complete, Walls Painted, etc.',
      showCancelButton: true,
      confirmButtonText: 'Add Stage',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Please enter a stage description';
        }
        if (value.length < 3) {
          return 'Stage description must be at least 3 characters';
        }
      }
    });

    if (stageDesc) {
      try {
        const response = await fetch('/api/stages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate.clientId,
            stageDesc: stageDesc.trim(),
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const newStage = await response.json();
          console.log('New stage created:', newStage);
          
          // Refetch stages to ensure we have the latest data
          await refetchStages();
          
          Swal.fire({
            icon: 'success',
            title: 'Stage Added',
            text: 'New stage has been added successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.message || 'Failed to add stage.',
          });
        }
      } catch (error) {
        console.error('Error adding stage:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add stage.',
        });
      }
    }
  };

  const handleMarkAsCompleted = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Mark Work as Completed',
      text: 'Are you sure you want to mark this work as completed? This action cannot be undone.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark as Completed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    });

    if (isConfirmed) {
      try {
        // First, add "Completed" stage to the database
        const stageResponse = await fetch('/api/stages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate.clientId,
            stageDesc: 'Completed',
            date: new Date().toISOString()
          }),
        });

        if (!stageResponse.ok) {
          throw new Error('Failed to add completed stage');
        }

        // Then, update the estimate status to completed
        const estimateResponse = await fetch(`/api/interior-estimates/${estimateId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed'
          }),
        });

        if (estimateResponse.ok) {
          // Update local estimate state
          setEstimate(prev => prev ? { ...prev, status: 'completed' } : null);
          
          // Refetch stages to show the new "Completed" stage
          await refetchStages();
          
          Swal.fire({
            icon: 'success',
            title: 'Work Completed',
            text: 'Work has been marked as completed successfully. Redirecting to completed works...',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 2000
          });

          // Redirect to completed works details page after a short delay
          setTimeout(() => {
            router.push(`/dashboard/interior-work/completed/${estimateId}/details`);
          }, 2000);
        } else {
          throw new Error('Failed to update estimate status');
        }
      } catch (error) {
        console.error('Error marking work as completed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to mark work as completed.',
        });
      }
    }
  };

  const handleAddPayment = async () => {
    // Calculate balance amount (total - completed payments)
    const completedAmount = interiorIncomes
      .filter(income => income && income.status === 'completed')
      .reduce((sum, income) => sum + (income?.amount || 0), 0);
    const balanceAmount = estimate.totalAmount - completedAmount;

    const { value: amount } = await Swal.fire({
      title: 'Add Payment Phase',
      text: `Enter amount for new payment phase (Max: ₹${balanceAmount.toLocaleString()}):`,
      input: 'number',
      inputPlaceholder: `Enter amount (0 to ₹${balanceAmount.toLocaleString()})`,
      inputAttributes: {
        max: balanceAmount,
        min: 0,
        step: 1
      },
      showCancelButton: true,
      confirmButtonText: 'Create Phase',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || value < 0) {
          return 'Please enter a valid amount';
        }
        if (value > balanceAmount) {
          return `Amount cannot exceed balance of ₹${balanceAmount.toLocaleString()}`;
        }
      }
    });

    if (amount) {
      setPaymentAmount(Number(amount));
      
      try {
        const response = await fetch('/api/interior-income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate.clientId,
            amount: Number(amount),
            method: null,
            status: 'pending',
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const newIncome = await response.json();
          console.log('New income created:', newIncome);
          
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Phase Created',
            text: 'New payment phase has been created successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.message || 'Failed to create payment phase.',
          });
        }
      } catch (error) {
        console.error('Error adding payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create payment phase.',
        });
      }
    }
  };

  const refetchExpenses = async () => {
    if (!estimate?.clientId) return;
    
    try {
      const response = await fetch(`/api/expenses?clientId=${estimate.clientId}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error refetching expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!estimate?.clientId) return;

    const { value: formValues } = await Swal.fire({
      title: 'Add Expense',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Category</option>
              <option value="material">Material</option>
              <option value="labour">Labour</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="notes" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter expense notes"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" id="amount" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter amount" min="0" step="0.01">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add Expense',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const category = (document.getElementById('category') as HTMLSelectElement)?.value;
        const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value;
        const amount = (document.getElementById('amount') as HTMLInputElement)?.value;

        if (!category) {
          Swal.showValidationMessage('Please select a category');
          return false;
        }
        if (!amount || parseFloat(amount) <= 0) {
          Swal.showValidationMessage('Please enter a valid amount');
          return false;
        }

        return { category, notes, amount };
      }
    });

    if (formValues) {
      try {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate.clientId,
            category: formValues.category,
            notes: formValues.notes,
            amount: formValues.amount,
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const newExpense = await response.json();
          console.log('New expense created:', newExpense);
          
          // Refetch expenses to show the new expense
          await refetchExpenses();
          
          Swal.fire({
            icon: 'success',
            title: 'Expense Added',
            text: 'Expense has been added successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.message || 'Failed to add expense.',
          });
        }
      } catch (error) {
        console.error('Error adding expense:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add expense.',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading work details...</span>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Work Details</h1>
              <p className="text-gray-600 mb-6">{error || 'Work not found'}</p>
              <button
                onClick={handleBackToApprovedWorks}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Approved Works
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToApprovedWorks}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Approved Works</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Approved
            </div>
          </div>
        </div>

        {/* Work Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Work Details</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Estimate Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Estimate Information</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <p className="text-3xl font-bold text-green-600">₹{estimate.totalAmount.toLocaleString()}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">Approved</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Created Date:</span>
                  <p className="text-gray-900">{new Date(estimate.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                  <p className="text-gray-900">{new Date(estimate.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <span>Client Information</span>
              </h3>
              
              {estimate.client ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900">{estimate.client.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900">{estimate.client.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <span className="text-gray-900">{estimate.client.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Location:</span>
                    <span className="text-gray-900">{estimate.client.location}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Client information not available</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Financial Overview</span>
            </h3>
          </div>

          {/* Main Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Amount Received */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  Received
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Amount Received</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {interiorIncomes.filter(income => income && income.status === 'completed').length} payment{interiorIncomes.filter(income => income && income.status === 'completed').length !== 1 ? 's' : ''} received
                </p>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                  Expenses
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>

            {/* Balance Amount */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  Balance
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Balance Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{(estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(((estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) / estimate.totalAmount) * 100)}% remaining
                </p>
              </div>
            </div>

            {/* Pending Amount */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹{interiorIncomes.filter(income => income && income.status === 'pending').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {interiorIncomes.filter(income => income && income.status === 'pending').length} payment{interiorIncomes.filter(income => income && income.status === 'pending').length !== 1 ? 's' : ''} pending
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bars Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Payment Progress */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Amount Received</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round((interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) / estimate.totalAmount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Expenses</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round((expenses.reduce((sum, expense) => sum + expense.amount, 0) / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((expenses.reduce((sum, expense) => sum + expense.amount, 0) / estimate.totalAmount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Balance Amount</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(((estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) / estimate.totalAmount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Analytics */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Analytics</h4>
              <div className="space-y-4">
                {/* Bank Payments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Bank Amount</span>
                    <span className="text-sm font-medium text-gray-700">
                      ₹{interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) > 0 ? (interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').reduce((sum, income) => sum + (income?.amount || 0), 0) / interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Cash Payments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Cash Amount</span>
                    <span className="text-sm font-medium text-gray-700">
                      ₹{interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) > 0 ? (interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').reduce((sum, income) => sum + (income?.amount || 0), 0) / interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Payment Distribution */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Completed Payments</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Bank: {interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').length} payments</span>
                    <span className="text-xs text-gray-500">Cash: {interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').length} payments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Net Profit */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  Net Profit
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Project Profit</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{(interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) - expenses.reduce((sum, expense) => sum + expense.amount, 0)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Revenue - Expenses
                </p>
              </div>
            </div>

            {/* Project Value */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                  Project Value
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Project Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{estimate.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Original estimate amount
                </p>
              </div>
            </div>

            {/* Number of Stages */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Clock className="h-6 w-6 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-pink-700 bg-pink-100 px-2 py-1 rounded-full">
                  Stages
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Number of Stages</p>
                <p className="text-2xl font-bold text-pink-600">
                  {stages.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stages.length > 0 ? `${stages.filter(stage => stage && stage.stageDesc === 'approved').length} Approved, ${stages.filter(stage => stage && stage.stageDesc === 'Work Started').length} Started, ${stages.filter(stage => stage && stage.stageDesc !== 'approved' && stage.stageDesc !== 'Work Started').length} Custom` : 'No stages recorded'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stage and Payment Details - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stage Details - Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Stage Details</span>
              </h3>
              <div className="flex items-center space-x-2">
                {/* Show Work Started button if work hasn't started yet */}
                {!workStarted && stages.some(stage => stage && stage.stageDesc === 'Work Started') === false && (
                  <button
                    onClick={handleWorkStarted}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <Play className="h-4 w-4" />
                    <span>Work Started</span>
                  </button>
                )}
                
                {/* Show Add Stage button only after work has started */}
                {(workStarted || stages.some(stage => stage && stage.stageDesc === 'Work Started')) && (
                  <button
                    onClick={handleAddStage}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Stage</span>
                  </button>
                )}
                
                {/* Show Completed button if work has started and there are stages beyond Work Started */}
                {(workStarted || stages.some(stage => stage && stage.stageDesc === 'Work Started')) && 
                 stages.filter(stage => stage && stage.stageDesc !== 'Work Started' && stage.stageDesc !== 'approved').length > 0 && (
                  <button
                    onClick={handleMarkAsCompleted}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>

            {stages.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Stages Found</h4>
                <p className="text-gray-600">No stage information available for this work.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stages.filter(stage => stage).map((stage, index) => (
                  <div key={stage._id} className="relative">
                    {/* Timeline Line */}
                    {index < stages.length - 1 && (
                      <div className="absolute left-6 top-8 w-0.5 h-8 bg-gray-300"></div>
                    )}
                    
                    {/* Timeline Item */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Circle className="h-6 w-6 text-orange-600 fill-current" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{stage.stageDesc}</h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(stage.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Payment Details</span>
              </h3>
              {(() => {
                // Calculate total received amount
                const totalReceived = interiorIncomes
                  .filter(income => income && income.status === 'completed')
                  .reduce((sum, income) => sum + (income?.amount || 0), 0);
                
                // Show button only if:
                // 1. No payments exist, OR
                // 2. Last payment is completed AND total received is less than estimate total
                const shouldShowButton = interiorIncomes.length === 0 || 
                  (interiorIncomes[interiorIncomes.length - 1] && 
                   interiorIncomes[interiorIncomes.length - 1].status === 'completed' && 
                   totalReceived < estimate.totalAmount);
                
                return shouldShowButton ? (
                  <button
                    onClick={handleAddPayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Payment Phase</span>
                  </button>
                ) : null;
              })()}
            </div>

            {/* Financial Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Received Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-lg font-bold text-yellow-600">
                    ₹{interiorIncomes.filter(income => income && income.status === 'pending').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Balance Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{(estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Account Selection - Only show when there are pending payments */}
            {interiorIncomes.some(income => income && income.status === 'pending') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bank Account for Invoice
                </label>
                <select
                  value={selectedBank?._id || ''}
                  onChange={(e) => {
                    const bank = banks.find(b => b._id === e.target.value);
                    setSelectedBank(bank || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="" className="text-gray-900">Select a bank account</option>
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id} className="text-gray-900">
                      {bank.bankName} - {bank.accountName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Loading Payment Records...</h4>
                <p className="text-gray-600">Fetching payment information from database.</p>
              </div>
            ) : interiorIncomes.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Payment Records Found</h4>
                <p className="text-gray-600">No payment information available for this work.</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Client ID: {estimate?.clientId}</p>
                  <p>Total Records: {interiorIncomes.length}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {interiorIncomes.filter(income => income).map((income, index) => (
                  <div key={income._id} className={`border rounded-lg p-4 ${
                    income.status === 'pending' 
                      ? 'border-yellow-200 bg-yellow-50' 
                      : 'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Phase {index + 1}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{income.amount.toLocaleString()}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        income.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {income.status === 'pending' ? 'Pending' : 'Completed'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <p>Date: {new Date(income.date).toLocaleDateString()}</p>
                      {income.method && <p>Payment Method: <span className="font-medium">{income.method}</span></p>}
                      {income.markedBy && <p>Marked by: <span className="font-medium text-blue-600">{income.markedBy.split('@')[0]}</span></p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      {income.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleDownloadInvoice(income)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download Invoice</span>
                          </button>
                          <button
                            onClick={() => handleMarkAsPaid(income)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Mark as Paid</span>
                          </button>
                          <button
                            onClick={() => handleEditPayment(income)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Edit Amount</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Payment Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>

        {/* Expenses Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <span>Expenses Details</span>
            </h3>
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              + Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Expenses Found</h4>
              <p className="text-gray-600">No expense information available for this work.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category-wise grouping */}
              {['material', 'labour', 'other'].map(category => {
                const categoryExpenses = expenses.filter(expense => expense.category === category);
                if (categoryExpenses.length === 0) return null;

                const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                const categoryColor = {
                  material: 'bg-blue-50 border-blue-200 text-blue-800',
                  labour: 'bg-green-50 border-green-200 text-green-800',
                  other: 'bg-purple-50 border-purple-200 text-purple-800'
                }[category];

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 capitalize">{category} Expenses</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${categoryColor}`}>
                        Total: ₹{categoryTotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {categoryExpenses.map(expense => (
                        <div key={expense._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-900">{expense.notes || 'No notes'}</p>
                                <span className="text-lg font-bold text-gray-900">₹{expense.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Date: {new Date(expense.date).toLocaleDateString()}</span>
                                <span>Added by: {expense.addedBy}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Total Expenses Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Total Expenses</h4>
                  <span className="text-2xl font-bold text-red-600">
                    ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 