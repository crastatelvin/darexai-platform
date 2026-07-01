'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Plus, 
  Sparkles,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  User,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

interface Opportunity {
  id: string;
  title: string;
  value: number;
  status: string;
  contactId: string;
  contact: Contact;
  nextBestAction: string | null;
  updatedAt: string;
}

const STAGES = ['NEW', 'QUALIFYING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function CRMPipeline() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts'>('pipeline');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Opportunity for Detail Modal
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  
  // Add Contact Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactStatus, setNewContactStatus] = useState('LEAD');
  
  // Add Opportunity Form State
  const [showAddOpp, setShowAddOpp] = useState(false);
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppValue, setNewOppValue] = useState('');
  const [newOppStatus, setNewOppStatus] = useState('NEW');
  const [newOppContactId, setNewOppContactId] = useState('');

  // Fetch all CRM data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [contactsRes, oppsRes] = await Promise.all([
        fetch('/api/crm/contacts'),
        fetch('/api/crm/opportunities'),
      ]);

      if (contactsRes.ok && oppsRes.ok) {
        const contactsData = await contactsRes.json();
        const oppsData = await oppsRes.json();
        setContacts(contactsData);
        setOpportunities(oppsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactName,
          email: newContactEmail,
          phone: newContactPhone,
          status: newContactStatus,
        }),
      });
      if (res.ok) {
        setNewContactName('');
        setNewContactEmail('');
        setNewContactPhone('');
        setNewContactStatus('LEAD');
        setShowAddContact(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppContactId) return;

    try {
      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newOppTitle,
          value: parseFloat(newOppValue),
          status: newOppStatus,
          contactId: newOppContactId,
        }),
      });
      if (res.ok) {
        setNewOppTitle('');
        setNewOppValue('');
        setNewOppStatus('NEW');
        setNewOppContactId('');
        setShowAddOpp(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOppStage = async (oppId: string, stage: string) => {
    try {
      const res = await fetch('/api/crm/opportunities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: oppId, status: stage }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local state of selectedOpp if open
        if (selectedOpp && selectedOpp.id === oppId) {
          setSelectedOpp({ ...selectedOpp, status: stage, nextBestAction: updated.nextBestAction });
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 border-r-2 border-transparent mb-4"></div>
        <span>Loading CRM Workspace...</span>
      </div>
    );
  }

  // Group opportunities by stage for Kanban
  const groupedOpps = STAGES.reduce((acc, stage) => {
    acc[stage] = opportunities.filter((o) => o.status === stage);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Customer Relationship Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage contact portfolios, sales opportunities, and AI actions.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 rounded-xl text-xs font-semibold text-zinc-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Contact
          </button>
          <button
            onClick={() => setShowAddOpp(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Opportunity
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition ${
            activeTab === 'pipeline' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Deals Kanban Board
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition ${
            activeTab === 'contacts' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Contacts Database ({contacts.length})
        </button>
      </div>

      {/* Active Tab rendering */}
      {activeTab === 'pipeline' ? (
        
        /* Opportunity Pipeline Kanban */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageOpps = groupedOpps[stage] || [];
            const stageValue = stageOpps.reduce((sum, o) => sum + o.value, 0);

            return (
              <div key={stage} className="flex flex-col min-w-[200px] bg-zinc-900/15 border border-zinc-800 rounded-xl p-4 space-y-4">
                
                {/* Column Header */}
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stage}</span>
                    <span className="text-xs font-semibold text-zinc-300 mt-0.5">{stageOpps.length} deals</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-400 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800">
                    ${stageValue.toLocaleString()}
                  </span>
                </div>

                {/* Opportunity Cards */}
                <div className="flex-1 space-y-3 min-h-[300px]">
                  {stageOpps.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-[10px] text-zinc-600 border border-dashed border-zinc-800/60 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => setSelectedOpp(opp)}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 hover:border-zinc-700/80 transition cursor-pointer text-left space-y-2 glow-border"
                      >
                        <h4 className="text-xs font-bold text-white line-clamp-1">{opp.title}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                            <Briefcase className="w-3 h-3 text-blue-400/80" />
                            {opp.contact.name}
                          </span>
                          <span className="text-xs font-extrabold text-blue-400">
                            ${opp.value.toLocaleString()}
                          </span>
                        </div>

                        {opp.nextBestAction && (
                          <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-1.5 text-[9px] text-zinc-500 font-medium line-clamp-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>Action: {opp.nextBestAction}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* Contacts Database List */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/80 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      No contacts found in this workspace. Create one above!
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-zinc-900/30 transition">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                          {contact.name.charAt(0)}
                        </div>
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono space-y-0.5 text-zinc-400">
                        {contact.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-zinc-500" /> {contact.email}</div>}
                        {contact.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-zinc-500" /> {contact.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          contact.status === 'LEAD' ? 'bg-amber-500/10 text-amber-400' :
                          contact.status === 'CONTACT' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">Opportunity Details</span>
                <h3 className="text-xl font-extrabold text-white mt-2">{selectedOpp.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedOpp(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg p-1.5 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Deal Value Info */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-400 text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Deal Value
              </span>
              <span className="text-xl font-black text-white">${selectedOpp.value.toLocaleString()}</span>
            </div>

            {/* Stage Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">Deal Contact</label>
                <div className="text-sm font-semibold text-white flex items-center gap-2 p-2.5 rounded bg-zinc-950 border border-zinc-900">
                  <User className="w-4 h-4 text-blue-400" />
                  {selectedOpp.contact.name}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">Pipeline Stage</label>
                <select
                  value={selectedOpp.status}
                  onChange={(e) => handleUpdateOppStage(selectedOpp.id, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-blue-500"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Next Best Action Recommendations (CRM Next Best Action) */}
            <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-pulse" />
                AI Recommendation: Next Best Action
              </h4>
              <p className="text-sm text-zinc-300 italic leading-relaxed">
                "{selectedOpp.nextBestAction || 'No action computed. Move stage to trigger analysis.'}"
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-zinc-800/60">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Close File
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddContact} className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Contact</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                  placeholder="+155501928"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Status Status</label>
                <select
                  value={newContactStatus}
                  onChange={(e) => setNewContactStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                >
                  <option value="LEAD">LEAD</option>
                  <option value="CONTACT">CONTACT</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Create Contact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Opportunity Modal */}
      {showAddOpp && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddOpp} className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Opportunity</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Deal Title</label>
                <input
                  type="text"
                  value={newOppTitle}
                  onChange={(e) => setNewOppTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                  placeholder="Enterprise License Agreement"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Deal Value ($ USD)</label>
                <input
                  type="number"
                  value={newOppValue}
                  onChange={(e) => setNewOppValue(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Associated Client Contact</label>
                <select
                  value={newOppContactId}
                  onChange={(e) => setNewOppContactId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Pipeline Stage</label>
                <select
                  value={newOppStatus}
                  onChange={(e) => setNewOppStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-sm focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowAddOpp(false)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newOppContactId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Create Opportunity
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
