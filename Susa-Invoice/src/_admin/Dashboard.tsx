import { useState, useEffect } from 'react';
import { FaFileInvoice, FaReceipt, FaChartLine, FaDownload, FaClock, FaCheckCircle } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface RentalInvoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: 'ADVANCE' | 'PARTIAL' | 'FULL';
  totalAmount: number;
  Date: string;
  rentalDetails?: {
    status: string;
  };
  billTo: {
    name: string;
  };
}

interface DashboardStats {
  totalInvoices: number;
  advanceInvoices: number;
  partialInvoices: number;
  fullInvoices: number;
  activeRentals: number;
  completedRentals: number;
  totalRevenue: number;
  totalCompanies: number;
  totalOutstanding: number;
  recentInvoices: RentalInvoice[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    advanceInvoices: 0,
    partialInvoices: 0,
    fullInvoices: 0,
    activeRentals: 0,
    completedRentals: 0,
    totalRevenue: 0,
    totalCompanies: 0,
    totalOutstanding: 0,
    recentInvoices: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const companyId = localStorage.getItem('companyId');
      const baseUrl = 'https://invoices-dk2w.onrender.com';

      const url = companyId
        ? `${baseUrl}/api/dashboard/summary?companyId=${companyId}`
        : `${baseUrl}/api/dashboard/summary`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const data = response.data.data;
        setStats({
          totalInvoices: data.totalInvoices || 0,
          advanceInvoices: data.advanceInvoices || 0,
          partialInvoices: data.partialInvoices || 0,
          fullInvoices: data.fullInvoices || 0,
          activeRentals: data.activeRentals || 0,
          completedRentals: data.completedRentals || 0,
          totalRevenue: data.totalRevenue || 0,
          totalCompanies: data.totalCompanies || 0,
          totalOutstanding: data.totalOutstanding || 0,
          recentInvoices: data.recentInvoices || [],
        });
        setError(null);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-slate-600">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const cardData = [
    {
      title: 'Total Rental Invoices',
      count: stats.totalInvoices,
      trend: 'up',
      trendValue: '12%',
      subtitle: 'All rental invoices',
      icon: <FaFileInvoice className="text-blue-500 text-xl" />,
      bgColor: 'bg-blue-50',
      // action: 'View All',
      // onClick: () => navigate('/all-rental-invoices'),
    },
    {
      title: 'Advance Invoices',
      count: stats.advanceInvoices,
      trend: 'up',
      trendValue: '8%',
      subtitle: 'Initial advance payments',
      icon: <FaReceipt className="text-emerald-500 text-xl" />,
      bgColor: 'bg-emerald-50',
      // action: 'Create New',
      // onClick: () => navigate('/advance-invoice'),
    },
    {
      title: 'Partial Returns',
      count: stats.partialInvoices,
      trend: 'up',
      trendValue: '5%',
      subtitle: 'Partial return invoices',
      icon: <FaClock className="text-amber-500 text-xl" />,
      bgColor: 'bg-amber-50',
      // action: 'View All',
      // onClick: () => navigate('/all-rental-invoices'),
    },
    {
      title: 'Full Settlements',
      count: stats.fullInvoices,
      trend: 'up',
      trendValue: '15%',
      subtitle: 'Completed settlements',
      icon: <FaCheckCircle className="text-green-500 text-xl" />,
      bgColor: 'bg-green-50',
      // action: 'View All',
      // onClick: () => navigate('/all-rental-invoices'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/admin/rental/analytics')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200"
            >
              <FaChartLine size={14} />
              <span>Detailed Analytics</span>
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200">
              <FaDownload size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cardData.map((item) => (
            <div
              // key={index}
              // className={`${item.bgColor} p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-slate-200 cursor-pointer`}
              // onClick={item.onClick}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">{item.title}</h2>
                  <p className="text-sm text-slate-500">{item.subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${item.bgColor.replace('50', '100')}`}>
                  {item.icon}
                </div>
              </div>

              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{item.count}</p>
                  <div className={`flex items-center text-sm ${item.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.trend === 'up' ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                    <span>{item.trendValue} from last month</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Revenue</p>
                  <p className="font-medium text-slate-800">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="font-medium text-slate-800">Active</p>
                </div>
                {/* <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-white shadow-xs hover:bg-slate-50 transition-colors duration-200 border border-slate-200">
                  {item.action}
                </button> */}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Invoices Section */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Recent Invoices</h2>
          {stats.recentInvoices.length > 0 ? (
            <div className="space-y-4">
              {stats.recentInvoices.map((invoice) => (
                <div 
                  key={invoice._id} 
                  className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/rental/details/${invoice._id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      invoice.invoiceType === 'ADVANCE' ? 'bg-blue-50' :
                      invoice.invoiceType === 'PARTIAL' ? 'bg-amber-50' :
                      'bg-green-50'
                    }`}>
                      {invoice.invoiceType === 'ADVANCE' ? <FaFileInvoice className="text-blue-500" /> :
                       invoice.invoiceType === 'PARTIAL' ? <FaClock className="text-amber-500" /> :
                       <FaCheckCircle className="text-green-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-slate-500">{invoice.billTo.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="text-sm text-slate-500">{formatDate(invoice.Date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No recent invoices found
            </div>
          )}
        </div>

        {/* Additional Stats Section */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Quick Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-sky-50 rounded-full">
                  <FaFileInvoice className="text-sky-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Total Companies</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCompanies}</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-50 rounded-full">
                  <FaChartLine className="text-indigo-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-full">
                  <FiTrendingUp className="text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Active Rentals</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.activeRentals}</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-50 rounded-full">
                  <FiTrendingDown className="text-rose-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Completed Rentals</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.completedRentals}</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-50 rounded-full">
                  <FaReceipt className="text-amber-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Total Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;