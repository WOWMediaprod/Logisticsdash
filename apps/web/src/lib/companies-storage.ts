/**
 * Local storage-based company management for billing purposes
 * Companies are stored client-side and used for job billing
 */

export interface BillingCompany {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  isDefault: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'logistics_billing_companies';

/**
 * Get all companies from localStorage
 */
export function getCompanies(): BillingCompany[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading companies from localStorage:', error);
    return [];
  }
}

/**
 * Save companies to localStorage
 */
function saveCompanies(companies: BillingCompany[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  } catch (error) {
    console.error('Error saving companies to localStorage:', error);
  }
}

/**
 * Add a new company
 */
export function addCompany(companyData: Omit<BillingCompany, 'id' | 'createdAt'>): BillingCompany {
  const companies = getCompanies();

  // If this is the first company or marked as default, make it default
  const isDefault = companyData.isDefault || companies.length === 0;

  // If setting as default, unset all other defaults
  if (isDefault) {
    companies.forEach(c => c.isDefault = false);
  }

  const newCompany: BillingCompany = {
    ...companyData,
    id: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isDefault,
    createdAt: new Date().toISOString(),
  };

  companies.push(newCompany);
  saveCompanies(companies);

  return newCompany;
}

/**
 * Update an existing company
 */
export function updateCompany(id: string, updates: Partial<Omit<BillingCompany, 'id' | 'createdAt'>>): BillingCompany | null {
  const companies = getCompanies();
  const index = companies.findIndex(c => c.id === id);

  if (index === -1) return null;

  // If setting as default, unset all other defaults
  if (updates.isDefault) {
    companies.forEach(c => c.isDefault = false);
  }

  companies[index] = {
    ...companies[index],
    ...updates,
  };

  saveCompanies(companies);
  return companies[index];
}

/**
 * Delete a company
 */
export function deleteCompany(id: string): boolean {
  const companies = getCompanies();
  const filtered = companies.filter(c => c.id !== id);

  if (filtered.length === companies.length) return false;

  // If deleted company was default and there are others, make the first one default
  const deletedCompany = companies.find(c => c.id === id);
  if (deletedCompany?.isDefault && filtered.length > 0) {
    filtered[0].isDefault = true;
  }

  saveCompanies(filtered);
  return true;
}

/**
 * Get a specific company by ID
 */
export function getCompany(id: string): BillingCompany | null {
  const companies = getCompanies();
  return companies.find(c => c.id === id) || null;
}

/**
 * Get the default company
 */
export function getDefaultCompany(): BillingCompany | null {
  const companies = getCompanies();
  return companies.find(c => c.isDefault) || companies[0] || null;
}

/**
 * Set a company as default
 */
export function setDefaultCompany(id: string): boolean {
  const companies = getCompanies();
  const company = companies.find(c => c.id === id);

  if (!company) return false;

  companies.forEach(c => c.isDefault = c.id === id);
  saveCompanies(companies);

  return true;
}
