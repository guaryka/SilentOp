'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TradingAccount } from '@/types/supabase'
import { formatCurrency } from '@/lib/utils'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface ManageAccountsProps {
  open: boolean
  onClose: () => void
  accounts: TradingAccount[]
  onAccountsChanged: () => void
}

export function ManageAccounts({ open, onClose, accounts, onAccountsChanged }: ManageAccountsProps) {
  const { t } = useTranslation()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState(0)
  const [editPlatform, setEditPlatform] = useState<TradingAccount['platform']>('csv')

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBalance, setNewBalance] = useState(100000)
  const [newPlatform, setNewPlatform] = useState<TradingAccount['platform']>('csv')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [open])

  const startEdit = (acc: TradingAccount) => {
    setEditId(acc.id)
    setEditName(acc.name)
    setEditBalance(Number(acc.starting_balance))
    setEditPlatform(acc.platform)
  }

  const cancelEdit = () => {
    setEditId(null)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    setErrorMsg(null)
    setSuccessMsg(null)
    const { error } = await supabase
      .from('trading_accounts')
      .update({
        name: editName.trim(),
        starting_balance: editBalance,
        platform: editPlatform,
      })
      .eq('id', id)
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg(t('common.accounts.updateSuccess'))
      setEditId(null)
      onAccountsChanged()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.accounts.deleteConfirm'))) return
    setErrorMsg(null)
    setSuccessMsg(null)
    const { error } = await supabase
      .from('trading_accounts')
      .delete()
      .eq('id', id)
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg(t('common.accounts.deleteSuccess'))
      onAccountsChanged()
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !userId) return
    setErrorMsg(null)
    setSuccessMsg(null)
    const { error } = await supabase
      .from('trading_accounts')
      .insert({
        user_id: userId,
        name: newName.trim(),
        starting_balance: newBalance,
        platform: newPlatform,
        status: 'active',
      })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg(t('common.accounts.createSuccess', { name: newName.trim() }))
      setShowCreate(false)
      setNewName('')
      setNewBalance(100000)
      onAccountsChanged()
    }
  }

  const platforms: { value: TradingAccount['platform']; label: string }[] = [
    { value: 'csv', label: t('common.platforms.csv') },
    { value: 'mt5', label: t('common.platforms.mt5') },
    { value: 'topstep', label: t('common.platforms.topstep') },
    { value: 'the5er_mt5', label: t('common.platforms.the5er_mt5') },
    { value: 'other', label: t('common.platforms.other') },
  ]

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: -1,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="card"
            style={{
              width: '100%',
              maxWidth: '32rem',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-hover)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings style={{ width: '1.125rem', height: '1.125rem', color: 'var(--primary-light)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  {t('common.accounts.manage')}
                </h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {errorMsg && (
                <div className="feedback-alert feedback-alert-danger">
                  <AlertCircle style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
                  <p>{errorMsg}</p>
                </div>
              )}
              {successMsg && (
                <div className="feedback-alert feedback-alert-success">
                  <Check style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
                  <p>{successMsg}</p>
                </div>
              )}

              {accounts.length === 0 && !showCreate && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <p className="text-sm">{t('common.accounts.noAccounts')}</p>
                  <p className="text-xs" style={{ marginTop: '0.25rem' }}>{t('common.accounts.createFirst')}</p>
                </div>
              )}

              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {editId === acc.id ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {t('common.accounts.name')}
                        </label>
                        <input
                          className="input-field"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={t('common.accounts.name')}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {t('common.accounts.balance')}
                          </label>
                          <input
                            className="input-field"
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(parseFloat(e.target.value) || 0)}
                            placeholder={t('common.accounts.balance')}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {t('common.accounts.platform')}
                          </label>
                          <Select
                            value={editPlatform}
                            onChange={(val) => setEditPlatform(val as TradingAccount['platform'])}
                            options={platforms}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button onClick={cancelEdit} className="btn-secondary" style={{ height: '2.25rem', fontSize: '0.8125rem', padding: '0 1rem' }}>
                          {t('common.actions.cancel')}
                        </button>
                        <button onClick={() => handleUpdate(acc.id)} className="btn-import-submit" style={{ height: '2.25rem', fontSize: '0.8125rem', padding: '0 1rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                          {t('common.actions.save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{acc.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.125rem' }}>
                          {acc.platform.toUpperCase()} &middot; {formatCurrency(Number(acc.starting_balance))}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEdit(acc)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                          title={t('common.actions.edit')}
                        >
                          <Pencil style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                          title={t('common.actions.delete')}
                        >
                          <Trash2 style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showCreate && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-light)' }}>
                    {t('common.accounts.addNew')}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {t('common.accounts.name')}
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. Personal Live, Topstep Eval"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {t('common.accounts.balance')}
                      </label>
                      <input
                        className="input-field"
                        type="number"
                        placeholder={t('common.accounts.balance')}
                        value={newBalance}
                        onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {t('common.accounts.platform')}
                      </label>
                      <Select
                        value={newPlatform}
                        onChange={(val) => setNewPlatform(val as TradingAccount['platform'])}
                        options={platforms}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button onClick={() => { setShowCreate(false); setNewName('') }} className="btn-secondary" style={{ height: '2.25rem', fontSize: '0.8125rem', padding: '0 1rem' }}>
                      {t('common.actions.cancel')}
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim()}
                      className="btn-import-submit"
                      style={{
                        height: '2.25rem',
                        fontSize: '0.8125rem',
                        padding: '0 1rem',
                        background: newName.trim() ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--surface-3)',
                      }}
                    >
                      <Plus style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.25rem' }} />
                      {t('common.accounts.add')}
                    </button>
                  </div>
                </div>
              )}

              {!showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.875rem',
                    background: 'var(--surface-2)',
                    border: '1px dashed var(--border-hover)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--primary-light)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--primary-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.color = 'var(--primary-light)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  {t('common.accounts.addNew')}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
