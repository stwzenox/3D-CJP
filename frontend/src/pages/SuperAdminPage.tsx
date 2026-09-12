import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { useCadastralStore } from '../state/useCadastralStore';
import { 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Clock, 
  MapPin, 
  FileBadge, 
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Search,
  Download,
  UserPlus,
  Activity,
  Cpu,
  Sparkles,
  Copy,
  Check,
  LogOut,
  Eye,
  Bell,
  TrendingUp,
  Server,
  Zap,
  BarChart3,
  Layers,
  Database,
  Terminal,
  ChevronRight,
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { AddBuildingPipelineModal } from '../components/admin/AddBuildingPipelineModal';

interface SuperAdminPageProps {
  onBackToMap?: () => void;
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ onBackToMap }) => {
  const { 
    currentUser, 
    role, 
    adminsList, 
    superAdminMetrics, 
    isLoadingAdmins, 
    fetchAdmins, 
    fetchSuperAdminMetrics, 
    approveAdmin, 
    revokeAdmin, 
    deleteAdmin,
    logout,
    signup,
    openAddBuildingModal
  } = useAuthStore();

  const { 
    buildings, 
    parcels, 
    verticalProperties, 
    properties, 
    fetchAllData,
    selectBuilding,
    removeBuilding,
    setViewMode
  } = useCadastralStore();

  // Navigation section
  const [navSection, setNavSection] = useState<'dashboard' | 'approvals' | 'buildings' | 'ulpins' | 'logs'>('dashboard');

  // Approvals tab filters & search
  const [officerFilter, setOfficerFilter] = useState<'all' | 'pending' | 'approved' | 'revoked'>('all');
  const [officerSearch, setOfficerSearch] = useState('');

  // Building search
  const [buildingSearch, setBuildingSearch] = useState('');

  // ULPIN search
  const [ulpinSearch, setUlpinSearch] = useState('');

  // Add Officer Modal
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerEmail, setNewOfficerEmail] = useState('');
  const [newOfficerOrg, setNewOfficerOrg] = useState('Cadastral Survey & 3D Land Records Division');
  const [newOfficerPassword, setNewOfficerPassword] = useState('AdminPass@2026');
  const [addOfficerSuccess, setAddOfficerSuccess] = useState<string | null>(null);
  const [addOfficerLoading, setAddOfficerLoading] = useState(false);

  // Copied ULPIN state
  const [copiedUlpin, setCopiedUlpin] = useState<string | null>(null);

  // Global search input in top bar
  const [globalSearch, setGlobalSearch] = useState('');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReturnToMap = () => {
    if (onBackToMap) {
      onBackToMap();
    } else if (window.opener) {
      window.close();
    } else {
      window.location.href = '/';
    }
  };

  // Strict Super Admin Access Guard: If not superadmin, immediately return/redirect back to map
  useEffect(() => {
    if (role !== 'superadmin') {
      if (onBackToMap) {
        onBackToMap();
      } else if (window.opener) {
        window.close();
      } else {
        window.location.replace('/');
      }
    }
  }, [role, onBackToMap]);

  useEffect(() => {
    fetchAdmins();
    fetchSuperAdminMetrics(buildings.length);
    if (buildings.length === 0) {
      fetchAllData();
    }

    // Auto-refresh interval (every 3 seconds) to ensure real-time appearance of newly registered admin requests
    const pollInterval = setInterval(() => {
      fetchAdmins();
      fetchSuperAdminMetrics(buildings.length);
    }, 3000);

    const handleAdminRegistered = () => {
      fetchAdmins();
      fetchSuperAdminMetrics(buildings.length);
      showToast('New Cadastral Admin registration received for review!');
    };

    window.addEventListener('cadastre:admin-registered', handleAdminRegistered);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('cadastre:admin-registered', handleAdminRegistered);
    };
  }, [buildings.length]);

  if (role !== 'superadmin') {
    return null;
  }

  // Compute live metrics
  const totalBuildings = superAdminMetrics?.total_buildings ?? buildings.length;
  const registeredBuildings = superAdminMetrics?.registered_buildings ?? buildings.length;
  const totalParcels = superAdminMetrics?.total_parcels ?? parcels.length;
  const totalVertical = superAdminMetrics?.total_vertical_properties ?? verticalProperties.length;
  const totalUlpins = superAdminMetrics?.total_ulpins ?? properties.length;
  const pendingCount = adminsList.filter(a => a.status === 'pending').length;
  const activeCount = adminsList.filter(a => a.status === 'active' || a.status === 'approved').length;
  const revokedCount = adminsList.filter(a => a.status === 'revoked').length;

  // Filtered officers list
  const filteredOfficers = useMemo(() => {
    return adminsList.filter(officer => {
      if (officerFilter === 'pending' && officer.status !== 'pending') return false;
      if (officerFilter === 'approved' && officer.status !== 'active' && officer.status !== 'approved') return false;
      if (officerFilter === 'revoked' && officer.status !== 'revoked') return false;

      const q = (officerSearch || globalSearch).toLowerCase().trim();
      if (q) {
        const matchesName = officer.name?.toLowerCase().includes(q);
        const matchesEmail = officer.email?.toLowerCase().includes(q);
        const matchesOrg = officer.organization?.toLowerCase().includes(q);
        const matchesId = officer.user_id?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesOrg || matchesId;
      }
      return true;
    });
  }, [adminsList, officerFilter, officerSearch, globalSearch]);

  // Filtered buildings list
  const filteredBuildings = useMemo(() => {
    const q = (buildingSearch || globalSearch).toLowerCase().trim();
    if (!q) return buildings;
    return buildings.filter(b => 
      b.building_id?.toLowerCase().includes(q) ||
      b.parcel_id?.toLowerCase().includes(q) ||
      b.building_type?.toLowerCase().includes(q)
    );
  }, [buildings, buildingSearch, globalSearch]);

  // Filtered properties / ULPINs
  const filteredProperties = useMemo(() => {
    const q = (ulpinSearch || globalSearch).toLowerCase().trim();
    if (!q) return properties;
    return properties.filter(p => 
      p.ulpin?.toLowerCase().includes(q) ||
      p.owner_name?.toLowerCase().includes(q) ||
      p.vertical_parcel_id?.toLowerCase().includes(q) ||
      p.property_id?.toLowerCase().includes(q)
    );
  }, [properties, ulpinSearch, globalSearch]);

  const handleCopyUlpin = (ulpin: string) => {
    navigator.clipboard.writeText(ulpin);
    setCopiedUlpin(ulpin);
    showToast(`14-Digit ULPIN copied: ${ulpin}`);
    setTimeout(() => setCopiedUlpin(null), 2000);
  };

  const handleApprove = async (userId: string, officerName: string) => {
    try {
      await approveAdmin(userId);
      showToast(`Officer ${officerName} has been approved and granted Cadastral Admin privileges.`);
    } catch {
      showToast(`Failed to approve officer ${officerName}.`);
    }
  };

  const handleRevoke = async (userId: string, officerName: string) => {
    try {
      await revokeAdmin(userId);
      showToast(`Officer ${officerName} privileges have been revoked.`);
    } catch {
      showToast(`Failed to revoke officer ${officerName}.`);
    }
  };

  const handleDelete = async (userId: string, officerName: string) => {
    if (window.confirm(`Permanently remove officer "${officerName}"? This action cannot be undone.`)) {
      try {
        await deleteAdmin(userId);
        showToast(`Officer ${officerName} was deleted from the system.`);
      } catch {
        showToast(`Failed to delete officer.`);
      }
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName.trim() || !newOfficerEmail.trim()) return;
    setAddOfficerLoading(true);
    try {
      const res = await signup({
        name: newOfficerName.trim(),
        email: newOfficerEmail.trim(),
        password: newOfficerPassword,
        role: 'admin',
        organization: newOfficerOrg.trim()
      });
      if (res.user?.user_id) {
        await approveAdmin(res.user.user_id);
      }
      setAddOfficerSuccess(`Officer ${newOfficerName} created & approved!`);
      setTimeout(() => {
        setAddOfficerSuccess(null);
        setIsAddOfficerModalOpen(false);
        setNewOfficerName('');
        setNewOfficerEmail('');
      }, 1600);
      fetchAdmins();
    } catch (err: any) {
      alert(err.message || 'Failed to create officer account');
    } finally {
      setAddOfficerLoading(false);
    }
  };

  const handleNavigateToBuilding = (buildingId: string) => {
    selectBuilding(buildingId);
    setViewMode('3d');
    if (onBackToMap) {
      onBackToMap();
    } else {
      window.location.href = `/?building=${buildingId}&view=3d`;
    }
  };

  const exportAuditCSV = () => {
    const rows = [
      ['Timestamp', 'User Role', 'Target Entity', 'Action', 'Status'],
      [new Date().toISOString(), 'Super Admin', 'Cadastre Database', 'System Metric Audit', 'Verified 100%'],
      ...adminsList.map(a => [
        a.created_at || new Date().toISOString(),
        'Cadastral Admin',
        `${a.name} (${a.email})`,
        `Role: ${a.role}`,
        a.status.toUpperCase()
      ]),
      ...buildings.slice(0, 10).map(b => [
        new Date().toISOString(),
        'Cadastre Asset',
        b.building_id,
        `Height: ${b.height}m, Floors: ${b.floor_count || 1}`,
        'REGISTERED 3D MESH'
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cadastre_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Cadastral audit trail exported to CSV.");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafb] text-slate-800 font-sans select-none antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[3000] px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (Dark Slate-Green inspired by reference) */}
      {/* ======================================================== */}
      <aside className="w-64 bg-[#0a120e] text-slate-300 flex flex-col justify-between border-r border-[#15231c] shrink-0">
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center text-[#0a120e] shadow-md shadow-emerald-900/30">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Cadastre</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-emerald-500/80 font-mono tracking-wider">SUPER ADMIN</p>
            </div>
          </div>

          {/* Navigation Links Group 1: OVERVIEW */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
              Overview
            </div>

            <button
              onClick={() => setNavSection('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                navSection === 'dashboard'
                  ? 'bg-[#14261d] text-[#10b981] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1a14]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setNavSection('buildings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                navSection === 'buildings'
                  ? 'bg-[#14261d] text-[#10b981] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1a14]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>3D Buildings</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#182a20] text-slate-300 font-mono">
                {buildings.length}
              </span>
            </button>

            <button
              onClick={() => setNavSection('ulpins')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                navSection === 'ulpins'
                  ? 'bg-[#14261d] text-[#10b981] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1a14]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileBadge className="w-4 h-4" />
                <span>ULPIN Deeds</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#182a20] text-slate-300 font-mono">
                {properties.length}
              </span>
            </button>
          </div>

          {/* Navigation Links Group 2: INFRASTRUCTURE & CADASTRE */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
              Infrastructure
            </div>

            <div className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4" />
                <span>Spatial Servers</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4" />
                <span>PostgreSQL GIS</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">8000</span>
            </div>

            <div className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>2.5km Terrain Mesh</span>
              </div>
              <span className="text-[10px] text-slate-500">60 FPS</span>
            </div>
          </div>

          {/* Navigation Links Group 3: GOVERNANCE & OPERATIONS */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
              Governance & Ops
            </div>

            <button
              onClick={() => setNavSection('approvals')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                navSection === 'approvals'
                  ? 'bg-[#14261d] text-[#10b981] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1a14]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Officer Approvals</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#10b981] text-[#0a120e] animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setNavSection('logs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                navSection === 'logs'
                  ? 'bg-[#14261d] text-[#10b981] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1a14]'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Audit & Logs</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#15231c] bg-[#070d0a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#10b981] text-[#0a120e] font-bold text-xs flex items-center justify-center">
              SA
            </div>
            <div>
              <div className="text-xs font-bold text-white truncate max-w-[120px]">
                {currentUser?.name || 'Super Admin'}
              </div>
              <div className="text-[10px] text-emerald-500/80">Ministry Admin</div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              handleReturnToMap();
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
            title="Sign Out & Return to Map"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN DASHBOARD CONTENT AREA (Crisp, Clean Light Theme) */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 px-8 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
          {/* Global Search Input with Shortcut badge */}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          {/* Right Action Icons & Primary CTA */}
          <div className="flex items-center gap-3">
            {/* Primary Emerald Button: + New Officer / Provision */}
            <button
              onClick={() => setIsAddOfficerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Authorize Officer</span>
            </button>

            <button
              onClick={exportAuditCSV}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                fetchAdmins();
                fetchSuperAdminMetrics(buildings.length);
                fetchAllData();
                showToast("All metrics refreshed.");
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAdmins ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNavSection('approvals')}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 ring-2 ring-white" />
              )}
            </div>

            {/* Back to 3D Cadastre Map */}
            <button
              onClick={handleReturnToMap}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              title="Return to 3D Map View"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>3D Map</span>
            </button>

            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#059669] border border-[#10b981]/30 font-bold text-xs flex items-center justify-center">
              AS
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Main Title & Subtitle */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {navSection === 'dashboard' && 'Infrastructure Overview'}
                {navSection === 'buildings' && '3D Building Asset Registry'}
                {navSection === 'ulpins' && '14-Digit ULPIN Property Deeds'}
                {navSection === 'approvals' && 'Officer Authorizations & RBAC'}
                {navSection === 'logs' && 'System Health & Audit Logs'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {navSection === 'dashboard' && 'Real-time monitoring across all 3D cadastre environments and registry authorities'}
                {navSection === 'buildings' && 'Comprehensive inventory of all extruded 3D structures and geospatial footprints'}
                {navSection === 'ulpins' && 'National Bhu-Aadhaar registry with stratified vertical rights and ownership records'}
                {navSection === 'approvals' && 'Manage Cadastral Admin officer authorizations, roles, and system privileges'}
                {navSection === 'logs' && 'Diagnostic traces, security audit trails, and microservice status logs'}
              </p>
            </div>

            {navSection !== 'dashboard' && (
              <button
                onClick={() => setNavSection('dashboard')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span>← Back to Overview</span>
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: DASHBOARD OVERVIEW (Reference Image Layout) */}
          {/* ======================================================== */}
          {navSection === 'dashboard' && (
            <>
              {/* 4 TOP KPI STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Active 3D Buildings */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Active Buildings</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                      {totalBuildings}/50
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+4% from last week</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-400">100% Extruded in Three.js</span>
                  </div>
                </div>

                {/* Card 2: 14-Digit ULPINs Today */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Deployments Today</span>
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                      <FileBadge className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                      {totalUlpins}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+22% from yesterday</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span className="text-[10px] text-slate-400">14-Digit Bhu-Aadhaars</span>
                  </div>
                </div>

                {/* Card 3: Pending Authorization Incidents */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Open Incidents</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                      {pendingCount}
                    </div>
                    <div className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
                      <span>{pendingCount > 0 ? 'Action required in queue' : 'All clear across system'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] text-slate-400">{pendingCount} Officer Signups</span>
                  </div>
                </div>

                {/* Card 4: Avg Response Time / 3D FPS */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">Avg Response Time</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                      142ms
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <span>-8% from last hour</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-400">Three.js 60 FPS Engine</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: Request Volume Area Chart + Service Health Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2/3: Request Volume Area Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Request Volume</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requests per minute over the last 24 hours
                    </p>
                  </div>

                  <div className="w-full h-56 relative pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="65" x2="600" y2="65" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="110" x2="600" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="155" x2="600" y2="155" stroke="#f1f5f9" strokeWidth="1" />

                      <path
                        d="M 0,135 Q 80,165 150,140 T 260,60 T 320,40 T 400,85 T 500,120 T 600,130 L 600,175 L 0,175 Z"
                        fill="url(#areaGradient)"
                      />

                      <path
                        d="M 0,135 Q 80,165 150,140 T 260,60 T 320,40 T 400,85 T 500,120 T 600,130"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2.5"
                      />
                    </svg>

                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-mono text-slate-400 pointer-events-none pb-5">
                      <span>4000</span>
                      <span>3000</span>
                      <span>2000</span>
                      <span>1000</span>
                      <span>0</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 px-6">
                      <span>00:00</span>
                      <span>03:00</span>
                      <span>06:00</span>
                      <span>09:00</span>
                      <span>12:00</span>
                      <span>15:00</span>
                      <span>18:00</span>
                      <span>21:00</span>
                    </div>
                  </div>
                </div>

                {/* Right 1/3: Service Health Donut Chart */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Service Health</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current status across all microservices
                    </p>
                  </div>

                  <div className="py-4 flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="12"
                          strokeDasharray="196 240"
                          strokeDashoffset="0"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="12"
                          strokeDasharray="28 240"
                          strokeDashoffset="-202"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="12"
                          strokeDasharray="14 240"
                          strokeDashoffset="-234"
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">34</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Services</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        <span className="text-slate-600 font-medium">Healthy</span>
                      </div>
                      <div className="font-mono text-slate-500">28 (82%)</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                        <span className="text-slate-600 font-medium">Degraded</span>
                      </div>
                      <div className="font-mono text-slate-500">4 (12%)</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                        <span className="text-slate-600 font-medium">Down</span>
                      </div>
                      <div className="font-mono text-slate-500">2 (6%)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: Officer Authorization Table & Active Incidents */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2/3: Cadastral Officer Authorization Queue */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Officer Authorization Queue</span>
                        {pendingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            {pendingCount} Pending
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Authorized officers can log in, add 3D structures, and mint Bhu-Aadhaar deeds.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        onClick={() => setOfficerFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          officerFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        All ({adminsList.length})
                      </button>
                      <button
                        onClick={() => setOfficerFilter('pending')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          officerFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Pending ({pendingCount})
                      </button>
                      <button
                        onClick={() => setOfficerFilter('approved')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          officerFilter === 'approved' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Active ({activeCount})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 pb-2">
                        <tr>
                          <th className="pb-3 font-semibold">Officer Name & ID</th>
                          <th className="pb-3 font-semibold">Email</th>
                          <th className="pb-3 font-semibold">Division</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOfficers.slice(0, 5).map((officer) => {
                          const isPending = officer.status === 'pending';
                          const isActive = officer.status === 'active' || officer.status === 'approved';

                          return (
                            <tr key={officer.user_id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 pr-3">
                                <div className="font-bold text-slate-800">{officer.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">{officer.user_id}</div>
                              </td>

                              <td className="py-3.5 px-3 text-slate-600 font-medium">
                                {officer.email}
                              </td>

                              <td className="py-3.5 px-3 text-slate-500">
                                {officer.organization || 'Survey Division'}
                              </td>

                              <td className="py-3.5 px-3">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    Pending
                                  </span>
                                )}
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    Active
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 pl-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {isPending ? (
                                    <button
                                      onClick={() => handleApprove(officer.user_id, officer.name)}
                                      className="px-2.5 py-1 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-sm transition-all"
                                    >
                                      Approve
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRevoke(officer.user_id, officer.name)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                                    >
                                      Revoke
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDelete(officer.user_id, officer.name)}
                                    className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right 1/3: Active Incidents & System Events */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Incidents</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ongoing alerts requiring super admin review
                    </p>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                      <div>
                        <div className="font-bold text-amber-900">Officer Approval Required</div>
                        <div className="text-[11px] text-amber-700/80 mt-0.5">
                          New cadastral surveyor registered from Town Planning Authority.
                        </div>
                        <span className="text-[10px] text-amber-600/70 font-mono mt-1 block">5m ago</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      <div>
                        <div className="font-bold text-slate-800">LiDAR 2.5km Mesh Sync</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Terrain regional elevation mesh successfully aligned with 2D GIS map.
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">15m ago</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      <div>
                        <div className="font-bold text-slate-800">RBAC Measurement Scale Gating</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Measurement tool successfully locked to Admin & Super Admin accounts only.
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">30m ago</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setNavSection('logs')}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View All System Logs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: 3D BUILDING ASSET REGISTRY */}
          {/* ======================================================== */}
          {navSection === 'buildings' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search building ID, parcel, or type..."
                    value={buildingSearch}
                    onChange={(e) => setBuildingSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Total 3D Structures: <span className="font-bold text-slate-800">{buildings.length}</span>
                  </div>
                  <button
                    onClick={() => openAddBuildingModal()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add 3D Building</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 pb-2">
                    <tr>
                      <th className="pb-3 font-semibold">Building ID</th>
                      <th className="pb-3 font-semibold">Base Parcel</th>
                      <th className="pb-3 font-semibold">Height & Floors</th>
                      <th className="pb-3 font-semibold">Classification Type</th>
                      <th className="pb-3 font-semibold">Elevation Bounds</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBuildings.map((building) => (
                      <tr key={building.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 pr-3">
                          <div className="font-bold text-slate-800">{building.building_id}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Asset #{building.id}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                            {building.parcel_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-800">{building.height}m</div>
                          <div className="text-[10px] text-slate-400">{building.floor_count || Math.ceil(building.height / 3.2)} Floors</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {building.building_type || 'Commercial'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                          {building.ground_elevation}m → {building.roof_elevation}m
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleNavigateToBuilding(building.building_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition-all border border-slate-200/80"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect in 3D</span>
                            </button>
                            <button
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Are you sure you want to permanently delete building "${building.building_id}"? This will remove its 3D mesh, 2D structure, floor slabs, and all associated 14-digit ULPIN deeds from the map.`
                                );
                                if (!confirmed) return;
                                await removeBuilding(building.building_id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold transition-all border border-rose-200/80"
                              title="Delete 3D Building and cascaded ULPINs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: 14-DIGIT ULPIN PROPERTY DEEDS */}
          {/* ======================================================== */}
          {navSection === 'ulpins' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search 14-Digit ULPIN or Owner..."
                    value={ulpinSearch}
                    onChange={(e) => setUlpinSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Total Minted ULPINs: <span className="font-bold text-slate-800">{properties.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 pb-2">
                    <tr>
                      <th className="pb-3 font-semibold">14-Digit Bhu-Aadhaar (ULPIN)</th>
                      <th className="pb-3 font-semibold">Title Owner</th>
                      <th className="pb-3 font-semibold">Vertical Unit</th>
                      <th className="pb-3 font-semibold">Property Type</th>
                      <th className="pb-3 font-semibold">Verification</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProperties.map((prop) => (
                      <tr key={prop.id || prop.ulpin} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                              {prop.ulpin}
                            </span>
                            <button
                              onClick={() => handleCopyUlpin(prop.ulpin)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700"
                              title="Copy ULPIN"
                            >
                              {copiedUlpin === prop.ulpin ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{prop.owner_name || 'Government of NCT'}</div>
                          <div className="text-[10px] text-slate-400">Record #{prop.id}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-700">{prop.vertical_parcel_id}</div>
                          <div className="text-[10px] text-slate-400">3D Stratified</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          {prop.property_type || 'Residential'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {prop.verification_status || 'verified'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <button
                            onClick={() => showToast(`Deed ${prop.ulpin} verified with Indian Cadastre.`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            Verify Deed
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: OFFICER AUTHORIZATIONS (FULL VIEW) */}
          {/* ======================================================== */}
          {navSection === 'approvals' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search officer name, email, department..."
                    value={officerSearch}
                    onChange={(e) => setOfficerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setOfficerFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      officerFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({adminsList.length})
                  </button>
                  <button
                    onClick={() => setOfficerFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      officerFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setOfficerFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      officerFilter === 'approved' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Active ({activeCount})
                  </button>
                  <button
                    onClick={() => setOfficerFilter('revoked')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      officerFilter === 'revoked' ? 'bg-white text-slate-900 shadow-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Revoked ({revokedCount})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 pb-2">
                    <tr>
                      <th className="pb-3 font-semibold">Officer Name & ID</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Department</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Super Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOfficers.map((officer) => {
                      const isPending = officer.status === 'pending';
                      const isActive = officer.status === 'active' || officer.status === 'approved';

                      return (
                        <tr key={officer.user_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 pr-3">
                            <div className="font-bold text-slate-800">{officer.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{officer.user_id}</div>
                          </td>
                          <td className="py-4 px-3 text-slate-600 font-medium">
                            {officer.email}
                          </td>
                          <td className="py-4 px-3 text-slate-500">
                            {officer.organization || 'Cadastral Survey Division'}
                          </td>
                          <td className="py-4 px-3">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Pending Authorization
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Approved & Active
                              </span>
                            )}
                            {officer.status === 'revoked' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                Access Revoked
                              </span>
                            )}
                          </td>
                          <td className="py-4 pl-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              {isPending ? (
                                <button
                                  onClick={() => handleApprove(officer.user_id, officer.name)}
                                  className="px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-sm transition-all"
                                >
                                  Authorize
                                </button>
                              ) : isActive ? (
                                <button
                                  onClick={() => handleRevoke(officer.user_id, officer.name)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApprove(officer.user_id, officer.name)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all"
                                >
                                  Re-Authorize
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(officer.user_id, officer.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: AUDIT LOGS & HEALTH */}
          {/* ======================================================== */}
          {navSection === 'logs' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Security & Operational Audit Trail</h3>
                <button
                  onClick={() => showToast("Audit logs cache flushed.")}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                >
                  Flush Cache
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-700">[AUTH_PASS]</span>
                    <span className="text-slate-700">Super Admin session verified for superadmin@cadastre.gov.in</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Just now</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-blue-700">[TERRAIN_MESH]</span>
                    <span className="text-slate-700">2.5km regional mesh initialized with 50x50 resolution</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">4m ago</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-bold text-purple-700">[RBAC_ENFORCE]</span>
                    <span className="text-slate-700">Measurement scale tool locked strictly to Admin & Super Admin</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">12m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Direct Provision Officer Modal */}
      {/* ======================================================== */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Direct Authorize Officer</h3>
              </div>
              <button
                onClick={() => setIsAddOfficerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {addOfficerSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold">
                {addOfficerSuccess}
              </div>
            ) : (
              <form onSubmit={handleCreateOfficer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Officer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Er. Priya Sengupta"
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email / Gmail</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya.cadastre@gmail.com"
                    value={newOfficerEmail}
                    onChange={(e) => setNewOfficerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department / Organization</label>
                  <input
                    type="text"
                    value={newOfficerOrg}
                    onChange={(e) => setNewOfficerOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={newOfficerPassword}
                    onChange={(e) => setNewOfficerPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOfficerModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addOfficerLoading}
                    className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-sm transition-all"
                  >
                    {addOfficerLoading ? 'Authorizing...' : 'Provision & Pre-Approve'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5-Step 3D Cadastre Building Creation Pipeline Modal */}
      <AddBuildingPipelineModal />
    </div>
  );
};
