import React, { useState } from 'react'
import { Users, Plus, Edit, Save, X, Calendar, TrendingUp } from 'lucide-react'
import { UrlaubBudget } from '../types/urlaub'

interface AdminBudgetVerwaltungProps {
  budgets: UrlaubBudget[]
  onUpdateBudget: (budget: UrlaubBudget) => void
  onAddBudget: (budget: Omit<UrlaubBudget, 'id'>) => void
  onClose: () => void
}

const AdminBudgetVerwaltung: React.FC<AdminBudgetVerwaltungProps> = ({ 
  budgets, 
  onUpdateBudget, 
  onAddBudget,
  onClose
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBudget, setEditingBudget] = useState<UrlaubBudget | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBudget, setNewBudget] = useState({
    mitarbeiterId: '',
    mitarbeiterName: '',
    jahr: new Date().getFullYear(),
    jahresanspruch: 25,
    genommen: 0,
    verplant: 0,
    uebertrag: 0
  })

  const handleEdit = (budget: UrlaubBudget) => {
    setEditingId(budget.mitarbeiterId)
    setEditingBudget({ ...budget })
  }

  const handleSave = () => {
    if (editingBudget) {
      onUpdateBudget(editingBudget)
      setEditingId(null)
      setEditingBudget(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingBudget(null)
  }

  const handleAdd = () => {
    if (newBudget.mitarbeiterId && newBudget.mitarbeiterName) {
      onAddBudget({
        mitarbeiterId: newBudget.mitarbeiterId,
        jahr: newBudget.jahr,
        jahresanspruch: newBudget.jahresanspruch,
        genommen: newBudget.genommen,
        verplant: newBudget.verplant,
        verbleibend: newBudget.jahresanspruch + newBudget.uebertrag - newBudget.genommen - newBudget.verplant,
        uebertrag: newBudget.uebertrag
      })
      setNewBudget({
        mitarbeiterId: '',
        mitarbeiterName: '',
        jahr: new Date().getFullYear(),
        jahresanspruch: 25,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      })
      setShowAddForm(false)
    }
  }

  const getVerbleibend = (budget: UrlaubBudget) => {
    return budget.jahresanspruch + budget.uebertrag - budget.genommen - budget.verplant
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">👥 Urlaubsbudget-Verwaltung</h2>
            <p className="card-subtitle">Verwalten Sie die Urlaubsansprüche aller Mitarbeiter</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} />
              Neues Budget
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onClose}
            >
              <X size={20} />
              Schließen
            </button>
          </div>
        </div>
      </div>

      {/* Neues Budget hinzufügen */}
      {showAddForm && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '12px',
          border: '1px solid #0ea5e9'
        }}>
          <h4 style={{ marginBottom: '16px', color: '#0c4a6e' }}>Neues Urlaubsbudget hinzufügen:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">Mitarbeiter ID</label>
              <input
                type="text"
                className="form-input"
                value={newBudget.mitarbeiterId}
                onChange={(e) => setNewBudget(prev => ({ ...prev, mitarbeiterId: e.target.value }))}
                placeholder="max.mustermann"
              />
            </div>
            <div>
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={newBudget.mitarbeiterName}
                onChange={(e) => setNewBudget(prev => ({ ...prev, mitarbeiterName: e.target.value }))}
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <label className="form-label">Jahr</label>
              <input
                type="number"
                className="form-input"
                value={newBudget.jahr}
                onChange={(e) => setNewBudget(prev => ({ ...prev, jahr: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="form-label">Jahresanspruch</label>
              <input
                type="number"
                className="form-input"
                value={newBudget.jahresanspruch}
                onChange={(e) => setNewBudget(prev => ({ ...prev, jahresanspruch: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Save size={16} />
              Hinzufügen
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} />
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Budgets-Tabelle */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                Mitarbeiter
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Jahr
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Jahresanspruch
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Genommen
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Verplant
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Verbleibend
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Übertrag
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((budget) => (
              <tr key={`${budget.mitarbeiterId}-${budget.jahr}`}>
                <td style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                  {budget.mitarbeiterId}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  {budget.jahr}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  {editingId === budget.mitarbeiterId ? (
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={editingBudget?.jahresanspruch || 0}
                      onChange={(e) => setEditingBudget(prev => prev ? { ...prev, jahresanspruch: parseInt(e.target.value) } : null)}
                    />
                  ) : (
                    budget.jahresanspruch
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  {editingId === budget.mitarbeiterId ? (
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={editingBudget?.genommen || 0}
                      onChange={(e) => setEditingBudget(prev => prev ? { ...prev, genommen: parseInt(e.target.value) } : null)}
                    />
                  ) : (
                    budget.genommen
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  {editingId === budget.mitarbeiterId ? (
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={editingBudget?.verplant || 0}
                      onChange={(e) => setEditingBudget(prev => prev ? { ...prev, verplant: parseInt(e.target.value) } : null)}
                    />
                  ) : (
                    budget.verplant
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ 
                    fontWeight: '600',
                    color: getVerbleibend(budget) < 5 ? '#dc2626' : '#059669'
                  }}>
                    {getVerbleibend(budget)}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  {editingId === budget.mitarbeiterId ? (
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={editingBudget?.uebertrag || 0}
                      onChange={(e) => setEditingBudget(prev => prev ? { ...prev, uebertrag: parseInt(e.target.value) } : null)}
                    />
                  ) : (
                    budget.uebertrag
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  {editingId === budget.mitarbeiterId ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-primary" onClick={handleSave} style={{ padding: '8px' }}>
                        <Save size={16} />
                      </button>
                      <button className="btn btn-secondary" onClick={handleCancel} style={{ padding: '8px' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleEdit(budget)}
                      style={{ padding: '8px' }}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {budgets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <Users size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>Noch keine Urlaubsbudgets</h3>
          <p>Fügen Sie das erste Budget hinzu, um zu beginnen.</p>
        </div>
      )}
    </div>
  )
}

export default AdminBudgetVerwaltung
