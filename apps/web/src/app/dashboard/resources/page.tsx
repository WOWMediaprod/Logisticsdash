'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCompany } from '../../../contexts/CompanyContext';
import { Plus, Edit, Trash2, Truck, User, Box, Route as RouteIcon, Building2, ArrowLeft, Star } from 'lucide-react';
import { getApiUrl } from '../../../lib/api-config';
import { getCompanies, addCompany, updateCompany, deleteCompany, setDefaultCompany, type BillingCompany } from '../../../lib/companies-storage';

type TabType = 'containers' | 'vehicles' | 'drivers' | 'routes' | 'clients' | 'companies';

// Helper to get singular form of tab name
const getSingularName = (tab: TabType): string => {
  if (tab === 'companies') return 'company';
  return tab.slice(0, -1); // Remove 's' for most cases
};

interface Container {
  id: string;
  iso: string;
  size: string;
  owner: string | null;
  checkOk: boolean;
}

interface Vehicle {
  id: string;
  regNo: string;
  class: string;
  make: string | null;
  model: string | null;
  year: number | null;
  isActive: boolean;
}

interface Driver {
  id: string;
  name: string;
  licenseNo: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

interface Route {
  id: string;
  code: string;
  origin: string;
  destination: string;
  kmEstimate: number | null;
  isActive: boolean;
  client?: { name: string; code: string } | null;
}

interface Client {
  id: string;
  name: string;
  code: string | null;
  terms: string | null;
  isActive: boolean;
}

export default function ResourcesPage() {
  const { companyId } = useCompany();
  const [activeTab, setActiveTab] = useState<TabType>('containers');
  const [loading, setLoading] = useState(false);

  // Data states
  const [containers, setContainers] = useState<Container[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<BillingCompany[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Load data based on active tab
  useEffect(() => {
    if (!companyId) return;
    loadData();
  }, [companyId, activeTab]);

  const loadData = async () => {
    if (!companyId && activeTab !== 'companies') return;
    setLoading(true);

    try {
      // Companies are loaded from localStorage
      if (activeTab === 'companies') {
        const savedCompanies = getCompanies();
        setCompanies(savedCompanies);
        setLoading(false);
        return;
      }

      let endpoint = '';
      // TODO: Get userId from auth context
      const userId = 'temp-user-id';

      switch (activeTab) {
        case 'containers':
          endpoint = `/api/v1/containers?companyId=${companyId}`;
          break;
        case 'vehicles':
          endpoint = `/api/v1/vehicles?companyId=${companyId}`;
          break;
        case 'drivers':
          endpoint = `/api/v1/drivers?companyId=${companyId}`;
          break;
        case 'routes':
          endpoint = `/api/v1/routes?companyId=${companyId}`;
          break;
        case 'clients':
          endpoint = `/api/v1/clients?companyId=${companyId}`;
          break;
      }

      const response = await fetch(getApiUrl(endpoint));
      const result = await response.json();

      if (result.success) {
        switch (activeTab) {
          case 'containers':
            setContainers(result.data);
            break;
          case 'vehicles':
            setVehicles(result.data);
            break;
          case 'drivers':
            setDrivers(result.data);
            break;
          case 'routes':
            setRoutes(result.data);
            break;
          case 'clients':
            setClients(result.data);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setModalMode('add');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      // Companies are stored in localStorage
      if (activeTab === 'companies') {
        const success = deleteCompany(id);
        if (success) {
          loadData();
        } else {
          alert('Failed to delete company');
        }
        return;
      }

      const endpoint = `/api/v1/${activeTab}/${id}?companyId=${companyId}`;
      const response = await fetch(getApiUrl(endpoint), { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        loadData();
      } else {
        alert('Failed to delete: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete item');
    }
  };

  const handleSetDefault = (id: string) => {
    const success = setDefaultCompany(id);
    if (success) {
      loadData();
    } else {
      alert('Failed to set default company');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    loadData();
  };

  const tabs = [
    { id: 'containers' as TabType, label: 'Containers', icon: Box },
    { id: 'vehicles' as TabType, label: 'Vehicles', icon: Truck },
    { id: 'drivers' as TabType, label: 'Drivers', icon: User },
    { id: 'routes' as TabType, label: 'Routes', icon: RouteIcon },
    { id: 'clients' as TabType, label: 'Clients', icon: Building2 },
    { id: 'companies' as TabType, label: 'Companies', icon: Building2 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
          <p className="text-gray-600">Manage your containers, vehicles, drivers, routes, clients, and companies</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add {getSingularName(activeTab)}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'containers' && (
              <ContainersTable
                containers={containers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'vehicles' && (
              <VehiclesTable
                vehicles={vehicles}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'drivers' && (
              <DriversTable
                drivers={drivers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'routes' && (
              <RoutesTable
                routes={routes}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'clients' && (
              <ClientsTable
                clients={clients}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'companies' && (
              <CompaniesTable
                companies={companies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ResourceModal
          type={activeTab}
          mode={modalMode}
          item={selectedItem}
          companyId={companyId || ''}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Table components
function ContainersTable({
  containers,
  onEdit,
  onDelete,
}: {
  containers: Container[];
  onEdit: (item: Container) => void;
  onDelete: (id: string) => void;
}) {
  if (containers.length === 0) {
    return <div className="text-center py-8 text-gray-500">No containers found. Click "Add container" to create one.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4">ISO Number</th>
          <th className="text-left py-3 px-4">Size</th>
          <th className="text-left py-3 px-4">Owner</th>
          <th className="text-left py-3 px-4">Check OK</th>
          <th className="text-right py-3 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {containers.map((container) => (
          <tr key={container.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{container.iso}</td>
            <td className="py-3 px-4">{container.size}</td>
            <td className="py-3 px-4">{container.owner || '-'}</td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs ${container.checkOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {container.checkOk ? 'Yes' : 'No'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(container)}
                className="text-blue-600 hover:text-blue-800 mr-3"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(container.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VehiclesTable({
  vehicles,
  onEdit,
  onDelete,
}: {
  vehicles: Vehicle[];
  onEdit: (item: Vehicle) => void;
  onDelete: (id: string) => void;
}) {
  if (vehicles.length === 0) {
    return <div className="text-center py-8 text-gray-500">No vehicles found. Click "Add vehicle" to create one.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4">Registration No</th>
          <th className="text-left py-3 px-4">Make & Model</th>
          <th className="text-left py-3 px-4">Class</th>
          <th className="text-left py-3 px-4">Year</th>
          <th className="text-left py-3 px-4">Status</th>
          <th className="text-right py-3 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{vehicle.regNo}</td>
            <td className="py-3 px-4">{vehicle.make} {vehicle.model}</td>
            <td className="py-3 px-4">{vehicle.class}</td>
            <td className="py-3 px-4">{vehicle.year || '-'}</td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs ${vehicle.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {vehicle.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(vehicle)}
                className="text-blue-600 hover:text-blue-800 mr-3"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(vehicle.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DriversTable({
  drivers,
  onEdit,
  onDelete,
}: {
  drivers: Driver[];
  onEdit: (item: Driver) => void;
  onDelete: (id: string) => void;
}) {
  if (drivers.length === 0) {
    return <div className="text-center py-8 text-gray-500">No drivers found. Click "Add driver" to create one.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4">Driver ID</th>
          <th className="text-left py-3 px-4">Name</th>
          <th className="text-left py-3 px-4">License No</th>
          <th className="text-left py-3 px-4">Phone</th>
          <th className="text-left py-3 px-4">Email</th>
          <th className="text-left py-3 px-4">Status</th>
          <th className="text-right py-3 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {drivers.map((driver) => (
          <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">
              <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">
                {driver.id}
              </code>
            </td>
            <td className="py-3 px-4 font-medium">{driver.name}</td>
            <td className="py-3 px-4">{driver.licenseNo || '-'}</td>
            <td className="py-3 px-4">{driver.phone || '-'}</td>
            <td className="py-3 px-4">{driver.email || '-'}</td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs ${driver.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {driver.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(driver)}
                className="text-blue-600 hover:text-blue-800 mr-3"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(driver.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RoutesTable({
  routes,
  onEdit,
  onDelete,
}: {
  routes: Route[];
  onEdit: (item: Route) => void;
  onDelete: (id: string) => void;
}) {
  if (routes.length === 0) {
    return <div className="text-center py-8 text-gray-500">No routes found. Click "Add route" to create one.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4">Code</th>
          <th className="text-left py-3 px-4">Origin</th>
          <th className="text-left py-3 px-4">Destination</th>
          <th className="text-left py-3 px-4">Distance (km)</th>
          <th className="text-left py-3 px-4">Client</th>
          <th className="text-left py-3 px-4">Status</th>
          <th className="text-right py-3 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {routes.map((route) => (
          <tr key={route.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{route.code}</td>
            <td className="py-3 px-4">{route.origin}</td>
            <td className="py-3 px-4">{route.destination}</td>
            <td className="py-3 px-4">{route.kmEstimate || '-'}</td>
            <td className="py-3 px-4">{route.client ? `${route.client.name} (${route.client.code})` : 'General'}</td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs ${route.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {route.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(route)}
                className="text-blue-600 hover:text-blue-800 mr-3"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(route.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ClientsTable({
  clients,
  onEdit,
  onDelete,
}: {
  clients: Client[];
  onEdit: (item: Client) => void;
  onDelete: (id: string) => void;
}) {
  if (clients.length === 0) {
    return <div className="text-center py-8 text-gray-500">No clients found. Click "Add client" to create one.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4">Name</th>
          <th className="text-left py-3 px-4">Code</th>
          <th className="text-left py-3 px-4">Terms</th>
          <th className="text-left py-3 px-4">Status</th>
          <th className="text-right py-3 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{client.name}</td>
            <td className="py-3 px-4">{client.code || '-'}</td>
            <td className="py-3 px-4">{client.terms || '-'}</td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(client)}
                className="text-blue-600 hover:text-blue-800 mr-3"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(client.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Modal component with forms
function ResourceModal({
  type,
  mode,
  item,
  companyId,
  onClose,
  onSave,
}: {
  type: TabType;
  mode: 'add' | 'edit';
  item: any;
  companyId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<any>(item || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Companies are stored in localStorage
      if (type === 'companies') {
        if (mode === 'add') {
          addCompany({
            name: formData.name,
            address: formData.address || '',
            phone: formData.phone || '',
            email: formData.email || '',
            taxId: formData.taxId || '',
            isDefault: formData.isDefault || false,
          });
          alert('Company created successfully!');
        } else {
          updateCompany(item.id, {
            name: formData.name,
            address: formData.address || '',
            phone: formData.phone || '',
            email: formData.email || '',
            taxId: formData.taxId || '',
            isDefault: formData.isDefault || false,
          });
          alert('Company updated successfully!');
        }
        onSave();
        return;
      }

      const endpoint = mode === 'add'
        ? `/api/v1/${type}`
        : `/api/v1/${type}/${item.id}`;

      // Remove readonly fields before sending to API
      const { id, createdAt, updatedAt, companyId: _, ...cleanData } = formData;

      // Only add companyId for CREATE, not for EDIT (it's immutable)
      const payload = mode === 'add' ? { ...cleanData, companyId } : cleanData;

      const response = await fetch(getApiUrl(endpoint), {
        method: mode === 'add' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert(mode === 'add'
          ? `${getSingularName(type)} created successfully!${type === 'clients' && result.data.code ? `\n\nClient Code: ${result.data.code}\nClient ID: ${result.data.id}\n\nShare this code with the client to access the portal.` : ''}`
          : `${getSingularName(type)} updated successfully!`
        );
        onSave();
      } else {
        setError(result.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {mode === 'add' ? 'Add' : 'Edit'} {getSingularName(type)}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'clients' && <ClientForm formData={formData} setFormData={setFormData} />}
          {type === 'containers' && <ContainerForm formData={formData} setFormData={setFormData} />}
          {type === 'vehicles' && <VehicleForm formData={formData} setFormData={setFormData} />}
          {type === 'drivers' && <DriverForm formData={formData} setFormData={setFormData} />}
          {type === 'routes' && <RouteForm formData={formData} setFormData={setFormData} companyId={companyId} />}
          {type === 'companies' && <CompanyForm formData={formData} setFormData={setFormData} />}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Form components
function ClientForm({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client Code *</label>
        <input
          type="text"
          value={formData.code || ''}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., MPT, HHL, MSK"
        />
        <p className="mt-1 text-xs text-gray-500">This code will be used by the client to access the portal</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
        <input
          type="text"
          value={formData.terms || ''}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Net 30"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isActive !== false}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Active</label>
      </div>
    </>
  );
}

function ContainerForm({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ISO Number *</label>
        <input
          type="text"
          value={formData.iso || ''}
          onChange={(e) => setFormData({ ...formData, iso: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., CSNU3054383"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
        <select
          value={formData.size || ''}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select size</option>
          <option value="20ft">20ft</option>
          <option value="40ft">40ft</option>
          <option value="40HC">40HC (High Cube)</option>
          <option value="45ft">45ft</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
        <input
          type="text"
          value={formData.owner || ''}
          onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., COSCO, MSK, HHL"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.checkOk || false}
          onChange={(e) => setFormData({ ...formData, checkOk: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Check OK (Container inspected and ready)</label>
      </div>
    </>
  );
}

function VehicleForm({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
        <input
          type="text"
          value={formData.regNo || ''}
          onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., KA05EF9012"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
          <input
            type="text"
            value={formData.make || ''}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Mahindra"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <input
            type="text"
            value={formData.model || ''}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Blazo X 49"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
          <input
            type="text"
            value={formData.class || ''}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            placeholder="e.g., Truck, Trailer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            value={formData.year || ''}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2023"
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isActive !== false}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Active</label>
      </div>
    </>
  );
}

function DriverForm({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., Rajesh Kumar"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
        <input
          type="text"
          value={formData.licenseNo || ''}
          onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., DL-1420110012345"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., +91-9876543210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., driver@example.com"
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isActive !== false}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Active</label>
      </div>
    </>
  );
}

function RouteForm({ formData, setFormData, companyId }: { formData: any; setFormData: (data: any) => void; companyId: string }) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!companyId) return;
    fetch(getApiUrl(`/api/v1/clients?companyId=${companyId}`))
      .then(res => res.json())
      .then(data => {
        if (data.success) setClients(data.data);
      })
      .catch(err => console.error('Failed to load clients:', err));
  }, [companyId]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Route Code *</label>
        <input
          type="text"
          value={formData.code || ''}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., MUM-DEL-001"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
          <input
            type="text"
            value={formData.origin || ''}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            placeholder="e.g., Mumbai Port"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
          <input
            type="text"
            value={formData.destination || ''}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            placeholder="e.g., Delhi ICD"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
        <input
          type="number"
          value={formData.kmEstimate || ''}
          onChange={(e) => setFormData({ ...formData, kmEstimate: parseInt(e.target.value) || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 1450"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client (optional)</label>
        <select
          value={formData.clientId || ''}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">General Route (All clients)</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.code})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Leave empty for a general route available to all clients</p>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isActive !== false}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Active</label>
      </div>
    </>
  );
}

function CompaniesTable({
  companies,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  companies: BillingCompany[];
  onEdit: (item: BillingCompany) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  if (companies.length === 0) {
    return <div className="text-center py-8 text-gray-500">No companies found. Click "Add company" to create one.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4">Name</th>
          <th className="text-left py-3 px-4">Address</th>
          <th className="text-left py-3 px-4">Phone</th>
          <th className="text-left py-3 px-4">Email</th>
          <th className="text-left py-3 px-4">Tax ID</th>
          <th className="text-left py-3 px-4">Default</th>
          <th className="text-right py-3 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {companies.map((company) => (
          <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{company.name}</td>
            <td className="py-3 px-4">{company.address || '-'}</td>
            <td className="py-3 px-4">{company.phone || '-'}</td>
            <td className="py-3 px-4">{company.email || '-'}</td>
            <td className="py-3 px-4">{company.taxId || '-'}</td>
            <td className="py-3 px-4">
              {company.isDefault ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Default
                </span>
              ) : (
                <button
                  onClick={() => onSetDefault(company.id)}
                  className="text-gray-400 hover:text-yellow-600"
                  title="Set as default"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(company)}
                className="text-blue-600 hover:text-blue-800 mr-3"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(company.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompanyForm({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          placeholder="e.g., IWF Logistics"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Company address"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="contact@company.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / Business Registration</label>
        <input
          type="text"
          value={formData.taxId || ''}
          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Tax ID or registration number"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isDefault || false}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Set as default company</label>
      </div>
    </>
  );
}
