import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import admissionService from '../../Services/admissionService';
import { 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DashboardTable = () => {
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovedModalOpen, setIsApprovedModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const fetchAdmissionsData = async () => {
    try {
      setIsLoading(true);
      const data = await admissionService.fetchAdmissions();
      setAdmissions(data);
      setFilteredAdmissions(data);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissionsData();
  }, []);

  useEffect(() => {
    let result = [...admissions];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(admission => admission.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter((admission) =>
        `${admission.first_name} ${admission.last_name} ${admission.admission_number}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredAdmissions(result);
  }, [searchTerm, admissions, sortConfig, statusFilter]);

  const handleEditAdmission = (admission) => {
    navigate(`/admission/edit/${admission.id}`);
  };

  const openDeleteModal = (admission) => {
    if (admission.status === 'approved') {
      setSelectedAdmission(admission);
      setIsApprovedModalOpen(true);
    } else {
      setSelectedAdmission(admission);
      setIsModalOpen(true);
    }
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setSelectedAdmission(null);
  };

  const closeApprovedModal = () => {
    setIsApprovedModalOpen(false);
    setSelectedAdmission(null);
  };

  const handleDeleteAdmission = async () => {
    if (selectedAdmission && selectedAdmission.status !== 'approved') {
      try {
        await admissionService.deleteAdmission(selectedAdmission.id);
        setAdmissions((prevAdmissions) =>
          prevAdmissions.filter((admission) => admission.id !== selectedAdmission.id)
        );
      } catch (error) {
        console.error('Error deleting admission:', error);
      } finally {
        closeDeleteModal();
      }
    }
  };

  const formatLastLogin = (dateString) => {
    if (!dateString) {
      return '';
    }
    return format(new Date(dateString), 'MMMM d, yyyy, h:mm a');
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name) => {
    if (sortConfig.key !== name) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 mr-1 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 mr-1 text-red-500" />;
      case 'in_review':
        return <Clock className="w-4 h-4 mr-1 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 mr-1 text-gray-500" />;
    }
  };
  
  // Improved modal components
  const ConfirmationModal = ({ isOpen, onClose, onConfirm, admissionNumber }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-center mb-5">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center mb-2">Confirm Deletion</h3>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete admission <span className="font-semibold">{admissionNumber}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ApprovedActionModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-center mb-5">
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertTriangle className="text-amber-500 w-8 h-8" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center mb-2">Action Not Permitted</h3>
          <p className="text-gray-600 text-center mb-6">
            This admission has been approved and cannot be modified or deleted.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-gray-50 p-6 rounded-full mb-5">
        <Search className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No admissions found</h3>
      <p className="text-gray-500 max-w-sm mb-6">
        {searchTerm ? 
          "We couldn't find any admissions matching your search criteria." : 
          "There are currently no admissions in the system."}
      </p>
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm('')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Search
        </button>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 font-medium">Loading admissions...</p>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'approved':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'rejected':
          return 'bg-red-50 text-red-700 border-red-200';
        case 'in_review':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(status)}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  // Actions Popover component
  const ActionsPopover = ({ admission }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-0" align="end">
          <div className="py-1">
            <button
              onClick={() => handleEditAdmission(admission)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="mr-3 text-gray-400 h-4 w-4" /> View/Edit
            </button>
            <button
              onClick={() => openDeleteModal(admission)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-3 text-red-400 h-4 w-4" /> Delete
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div id='admission-section' className="container mb-8 mx-auto px-4 max-w-7xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admissions Dashboard</h1>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search admissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-8"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="in_review">In Review</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Admissions 
            <span className="ml-2 text-sm font-medium text-gray-500">
              {filteredAdmissions.length} {filteredAdmissions.length === 1 ? 'record' : 'records'}
            </span>
          </h2>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filteredAdmissions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('admission_number')}
                  >
                    <div className="flex items-center">
                      Admission ID {getSortIcon('admission_number')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('first_name')}
                  >
                    <div className="flex items-center">
                      Applicant Name {getSortIcon('first_name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('submit_date')}
                  >
                    <div className="flex items-center">
                      Submitted Date {getSortIcon('submit_date')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map((admission) => (
                  <tr 
                    key={admission.id} 
                    className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <td 
                      onClick={() => handleEditAdmission(admission)}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                    >
                      {admission.admission_number}
                    </td>
                    <td 
                      onClick={() => handleEditAdmission(admission)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 cursor-pointer hover:text-blue-600"
                    >
                      {`${admission.first_name} ${admission.last_name}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastLogin(admission.submit_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={admission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsPopover admission={admission} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAdmission}
        admissionNumber={selectedAdmission?.admission_number}
      />

      <ApprovedActionModal
        isOpen={isApprovedModalOpen}
        onClose={closeApprovedModal}
      />
    </div>
  );
};

export default DashboardTable;