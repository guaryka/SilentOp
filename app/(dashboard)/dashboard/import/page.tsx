'use client'

import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ManageAccounts } from '@/components/dashboard/ManageAccounts'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function ImportPage() {
  const { locale, t } = useTranslation()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [tradingAccountId, setTradingAccountId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  
  // Create Account State
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountPlatform, setNewAccountPlatform] = useState<'mt5' | 'topstep' | 'the5er_mt5' | 'csv' | 'other'>('csv')
  const [newAccountStartingBalance, setNewAccountStartingBalance] = useState<number>(100000)
  const [creatingAccount, setCreatingAccount] = useState(false)

  // Data State
  const [importing, setImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false)
  
  // Feedback Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current user and setup default account
  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Fetch existing accounts
        const { data: existingAccounts } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', user.id)

        if (existingAccounts && existingAccounts.length > 0) {
          setAccounts(existingAccounts)
          setTradingAccountId(existingAccounts[0].id)
        } else {
          // Create default CSV account if none exist
          const { data: newAccount, error } = await supabase
            .from('trading_accounts')
            .insert({
              user_id: user.id,
              name: 'Default CSV Account',
              platform: 'csv',
              status: 'active'
            })
            .select('*')
            .single()

          if (!error && newAccount) {
            setAccounts([newAccount])
            setTradingAccountId(newAccount.id)
          }
        }
      }
    }
    initUser()
  }, [])

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const isSupportedFile = (fileName: string) => {
    const lower = fileName.toLowerCase()
    return lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isSupportedFile(file.name)) {
        setSelectedFile(file)
        setSuccessMsg(null)
        setErrorMsg(null)
      } else {
        setErrorMsg(locale === 'en' ? 'Please upload a valid CSV or Excel file.' : 'Vui lòng tải lên tệp CSV hoặc Excel hợp lệ.')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isSupportedFile(file.name)) {
        setSelectedFile(file)
        setSuccessMsg(null)
        setErrorMsg(null)
      } else {
        setErrorMsg(locale === 'en' ? 'Please upload a valid CSV or Excel file.' : 'Vui lòng tải lên tệp CSV hoặc Excel hợp lệ.')
      }
    }
  }

  // Safe date parser to handle formats like yyyy.mm.dd hh:mm:ss used by MetaTrader
  const parseDateSafely = (dateStr: any) => {
    if (!dateStr) throw new Error('Empty date')
    
    if (typeof dateStr === 'number') {
      const date = XLSX.SSF.parse_date_code(dateStr)
      const d = new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S)
      return d.toISOString()
    }

    const cleaned = String(dateStr).replace(/\./g, '-').trim()
    const d = new Date(cleaned)
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid Date format: ${dateStr}`)
    }
    return d.toISOString()
  }

  // Detect starting balance from the report (search for balance/deposit rows)
  const detectStartingBalance = (rows: any[][]): number | null => {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.length < 5) continue
      
      const rowStr = row.map(c => String(c).toLowerCase().trim())
      const isBalanceRow = rowStr.includes('balance') || rowStr.includes('deposit') || rowStr.some(cell => cell.includes('initial_deposit') || cell.includes('initial deposit'))
      
      if (isBalanceRow) {
        let headerRow: any[] | null = null
        if (r > 0) {
          const prevRow = rows[r - 1]
          if (prevRow && prevRow.map(c => String(c).toLowerCase()).includes('balance')) {
            headerRow = prevRow.map(c => String(c).toLowerCase().trim())
          }
        }
        
        if (headerRow) {
          const balanceIdx = headerRow.findIndex(h => h === 'balance')
          const profitIdx = headerRow.findIndex(h => h === 'profit')
          const valueIdx = headerRow.findIndex(h => h === 'value')
          
          const targetIdx = balanceIdx !== -1 ? balanceIdx : (profitIdx !== -1 ? profitIdx : valueIdx)
          if (targetIdx !== -1 && row[targetIdx] !== null && row[targetIdx] !== undefined) {
            const val = parseFloat(String(row[targetIdx]).replace(/[^0-9.-]/g, ''))
            if (!isNaN(val) && val > 0) {
              return val
            }
          }
        } else {
          for (let i = row.length - 1; i >= 0; i--) {
            const val = parseFloat(String(row[i]).replace(/[^0-9.-]/g, ''))
            if (!isNaN(val) && val > 0 && val < 10000000) {
              return val
            }
          }
        }
      }
    }
    return null
  }

  // Common process logic for both CSV and XLSX rows
  const processRows = async (rows: any[][]) => {
    if (rows.length <= 1) {
      setErrorMsg(locale === 'en' ? 'The file is empty or has no trade data.' : 'Tệp trống hoặc không chứa dữ liệu giao dịch.')
      setImporting(false)
      return
    }

    try {
      // Find the actual header row by scanning first 20 rows
      let headerRowIdx = 0
      for (let r = 0; r < Math.min(20, rows.length); r++) {
        const row = rows[r]
        if (!row || row.length < 3) continue
        
        const rowStrings = row.map(cell => String(cell).toLowerCase().trim())
        const matches = rowStrings.filter(cell => 
          ['symbol', 'ticket', 'position', 'type', 'volume', 'lots', 'price', 'profit', 'pnl', 'commission', 'swap', 'time', 'date'].includes(cell)
        )
        
        if (matches.length >= 3) {
          headerRowIdx = r
          break
        }
      }

      // Clean headers from the detected row
      const headers = rows[headerRowIdx].map((h: any) => String(h).toLowerCase().trim())
      
      let symbolIdx = -1
      let ticketIdx = -1
      let directionIdx = -1
      let lotsIdx = -1
      let openTimeIdx = -1
      let closeTimeIdx = -1
      let openPriceIdx = -1
      let closePriceIdx = -1
      let profitIdx = -1
      let commissionIdx = -1
      let swapIdx = -1
      let slIdx = -1
      let tpIdx = -1
      let commentIdx = -1

      let timeOccurrences: number[] = []
      let priceOccurrences: number[] = []

      headers.forEach((h: string, idx: number) => {
        if (['symbol', 'ticker', 'instrument', 'pair', 'item'].includes(h)) symbolIdx = idx
        if (['ticket', 'ticket #', 'deal', 'order', 'id', 'position'].includes(h)) ticketIdx = idx
        if (['type', 'direction', 'cmd', 'action'].includes(h)) directionIdx = idx
        if (['size', 'lots', 'volume', 'qty', 'quantity'].includes(h)) lotsIdx = idx
        if (['profit', 'pnl', 'net profit', 'net_profit', 'gain'].includes(h)) profitIdx = idx
        if (['commission', 'fee', 'fees', 'comm'].includes(h)) commissionIdx = idx
        if (['swap', 'swaps', 'rollover'].includes(h)) swapIdx = idx
        if (['s / l', 'sl', 'stop loss', 'stop_loss'].includes(h)) slIdx = idx
        if (['t / p', 'tp', 'take profit', 'take_profit'].includes(h)) tpIdx = idx
        if (['comment', 'commentary', 'notes', 'desc'].includes(h)) commentIdx = idx

        if (['time', 'date', 'open time', 'open_time', 'entry time', 'entry_time', 'close time', 'close_time', 'exit time', 'exit_time'].includes(h)) {
          timeOccurrences.push(idx)
        }
        if (['price', 'open price', 'open_price', 'entry price', 'entry_price', 'close price', 'close_price', 'exit price', 'exit_price'].includes(h)) {
          priceOccurrences.push(idx)
        }
      })

      // Resolve open and close times
      const explicitOpenTimeIdx = headers.findIndex((h: string) => ['open time', 'open_time', 'entry time', 'entry_time'].includes(h))
      openTimeIdx = explicitOpenTimeIdx !== -1 ? explicitOpenTimeIdx : (timeOccurrences[0] ?? -1)

      const explicitCloseTimeIdx = headers.findIndex((h: string) => ['close time', 'close_time', 'exit time', 'exit_time'].includes(h))
      closeTimeIdx = explicitCloseTimeIdx !== -1 ? explicitCloseTimeIdx : (timeOccurrences[1] ?? timeOccurrences[0] ?? -1)

      // Resolve open and close prices
      const explicitOpenPriceIdx = headers.findIndex((h: string) => ['open price', 'open_price', 'entry price', 'entry_price'].includes(h))
      openPriceIdx = explicitOpenPriceIdx !== -1 ? explicitOpenPriceIdx : (priceOccurrences[0] ?? -1)

      const explicitClosePriceIdx = headers.findIndex((h: string) => ['close price', 'close_price', 'exit price', 'exit_price'].includes(h))
      closePriceIdx = explicitClosePriceIdx !== -1 ? explicitClosePriceIdx : (priceOccurrences[1] ?? priceOccurrences[0] ?? -1)

      // Fallback to typical MetaTrader report columns if symbol header is not found
      if (symbolIdx === -1 && headers.length >= 10) {
        ticketIdx = 0
        openTimeIdx = 1
        directionIdx = 2
        lotsIdx = 3
        symbolIdx = 4
        openPriceIdx = 5
        slIdx = 6
        tpIdx = 7
        closeTimeIdx = 8
        closePriceIdx = 9
        commissionIdx = 10
        swapIdx = 11
        profitIdx = 12
      }

      const parsedTrades: any[] = []

      // Start parsing trades after the header row
      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // Check for next section titles (stop parsing once we hit Orders or Deals)
        if (row.length === 1 && typeof row[0] === 'string') {
          const val = row[0].trim().toLowerCase()
          if (['orders', 'deals', 'balance'].includes(val)) {
            break
          }
        }

        const firstCell = String(row[0] || '').trim().toLowerCase()
        const secondCell = String(row[1] || '').trim().toLowerCase()
        if (firstCell === 'orders' || firstCell === 'deals' || secondCell === 'order' || secondCell === 'deal') {
          break
        }

        if (!row[0]) continue

        // Extract symbol
        const symbol = symbolIdx !== -1 ? String(row[symbolIdx]).trim() : ''
        if (!symbol) continue

        // Parse values
        const directionVal = (directionIdx !== -1 ? String(row[directionIdx]) : 'buy').toLowerCase()
        const direction = directionVal.includes('sell') || directionVal.includes('short') ? 'sell' : 'buy'

        const rawProfit = profitIdx !== -1 ? row[profitIdx] : '0'
        const profit = parseFloat(String(rawProfit).replace(/[^0-9.-]/g, '')) || 0

        const rawCommission = commissionIdx !== -1 ? row[commissionIdx] : '0'
        const commission = parseFloat(String(rawCommission).replace(/[^0-9.-]/g, '')) || 0

        const rawSwap = swapIdx !== -1 ? row[swapIdx] : '0'
        const swap = parseFloat(String(rawSwap).replace(/[^0-9.-]/g, '')) || 0

        const rawLots = lotsIdx !== -1 ? row[lotsIdx] : '0.01'
        const lots = parseFloat(String(rawLots).replace(/[^0-9.-]/g, '')) || 0.01

        const rawOpenPrice = openPriceIdx !== -1 ? row[openPriceIdx] : '0'
        const openPrice = parseFloat(String(rawOpenPrice).replace(/[^0-9.-]/g, '')) || 0

        const rawClosePrice = closePriceIdx !== -1 ? row[closePriceIdx] : '0'
        const closePrice = parseFloat(String(rawClosePrice).replace(/[^0-9.-]/g, '')) || 0

        const openTimeStr = openTimeIdx !== -1 ? row[openTimeIdx] : ''
        const closeTimeStr = closeTimeIdx !== -1 ? row[closeTimeIdx] : ''

        if (!openTimeStr || !closeTimeStr) continue

        let openTime: string
        let closeTime: string
        try {
          openTime = parseDateSafely(openTimeStr)
          closeTime = parseDateSafely(closeTimeStr)
        } catch (e) {
          continue
        }

        const durationMinutes = Math.max(
          0,
          Math.round((new Date(closeTime).getTime() - new Date(openTime).getTime()) / (1000 * 60))
        )

        const rawTicket = ticketIdx !== -1 ? row[ticketIdx] : `csv-${i}-${new Date(closeTime).getTime()}`
        const ticket = String(rawTicket).trim()

        const notes = commentIdx !== -1 ? String(row[commentIdx]).trim() : null

        const rawSl = slIdx !== -1 ? row[slIdx] : null
        const sl = rawSl !== null && rawSl !== undefined && String(rawSl).trim() !== '' ? parseFloat(String(rawSl).replace(/[^0-9.-]/g, '')) || null : null

        const rawTp = tpIdx !== -1 ? row[tpIdx] : null
        const tp = rawTp !== null && rawTp !== undefined && String(rawTp).trim() !== '' ? parseFloat(String(rawTp).replace(/[^0-9.-]/g, '')) || null : null

        parsedTrades.push({
          user_id: userId,
          account_id: tradingAccountId,
          ticket,
          symbol: symbol.toUpperCase(),
          direction,
          open_time: openTime,
          close_time: closeTime,
          open_price: openPrice,
          close_price: closePrice,
          lots,
          profit,
          commission,
          swap,
          sl,
          tp,
          duration_minutes: durationMinutes,
          notes: notes || null
        })
      }

      if (parsedTrades.length === 0) {
        setErrorMsg(locale === 'en' ? 'Could not parse any valid trades. Check headers and data rows.' : 'Không thể phân tích lệnh hợp lệ nào. Vui lòng kiểm tra tiêu đề và dòng dữ liệu.')
        setImporting(false)
        return
      }

      // Deduplicate trades by ticket and user_id to prevent database duplicate key errors
      const uniqueTradesMap = new Map<string, any>()
      parsedTrades.forEach((trade) => {
        const key = `${trade.ticket}-${trade.user_id}`
        uniqueTradesMap.set(key, trade)
      })
      const deduplicatedTrades = Array.from(uniqueTradesMap.values())

      // Insert or Upsert into Supabase
      const { error } = await supabase
        .from('trades')
        .upsert(deduplicatedTrades, { onConflict: 'ticket,user_id' })

      if (error) throw error

      // Auto-detect starting balance and update account
      let balanceUpdatedText = ''
      const detectedBalance = detectStartingBalance(rows)
      if (detectedBalance !== null && detectedBalance > 0 && tradingAccountId) {
        const { error: balanceError } = await supabase
          .from('trading_accounts')
          .update({ starting_balance: detectedBalance })
          .eq('id', tradingAccountId)

        if (!balanceError) {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === tradingAccountId
                ? { ...acc, starting_balance: detectedBalance }
                : acc
            )
          )
          balanceUpdatedText = locale === 'en' 
            ? ` (Successfully updated account starting balance to $${detectedBalance.toLocaleString()})`
            : ` (Cập nhật số dư ban đầu tài khoản thành $${detectedBalance.toLocaleString()})`
        }
      }

      setSuccessMsg(t('import.feedback.success', { count: deduplicatedTrades.length }) + balanceUpdatedText)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      console.error('Import error:', err.message)
      setErrorMsg(locale === 'en' ? `Failed to save trades: ${err.message}` : `Lưu lịch sử giao dịch thất bại: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Parse and Import File
  const handleImport = () => {
    if (!selectedFile || !userId || !tradingAccountId) return
    setImporting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const fileName = selectedFile.name.toLowerCase()
    
    // CSV Handler
    if (fileName.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          await processRows(results.data as any[][])
        },
        error: (error) => {
          setErrorMsg(locale === 'en' ? `Failed to parse CSV: ${error.message}` : `Lỗi phân tích CSV: ${error.message}`)
          setImporting(false)
        }
      })
    } 
    // Excel Importer
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          if (!data) {
            setErrorMsg(locale === 'en' ? 'Could not read file data.' : 'Không thể đọc dữ liệu tệp.')
            setImporting(false)
            return
          }
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          await processRows(rows)
        } catch (error: any) {
          setErrorMsg(locale === 'en' ? `Failed to parse Excel file: ${error.message}` : `Lỗi phân tích tệp Excel: ${error.message}`)
          setImporting(false)
        }
      }
      reader.onerror = () => {
        setErrorMsg(locale === 'en' ? 'File read error.' : 'Lỗi đọc tệp.')
        setImporting(false)
      }
      reader.readAsArrayBuffer(selectedFile)
    }
  }

  const handleCreateAccount = async () => {
    if (!newAccountName.trim() || !userId) return
    setCreatingAccount(true)
    try {
      const { data, error } = await supabase
        .from('trading_accounts')
        .insert({
          user_id: userId,
          name: newAccountName.trim(),
          platform: newAccountPlatform,
          starting_balance: newAccountStartingBalance,
          status: 'active'
        })
        .select('*')
        .single()

      if (error) throw error
      if (data) {
        setAccounts(prev => [...prev, data])
        setTradingAccountId(data.id)
        setNewAccountName('')
        setNewAccountStartingBalance(100000)
        setShowCreateAccount(false)
        setSuccessMsg(t('common.accounts.createSuccess', { name: data.name }))
      }
    } catch (e: any) {
      setErrorMsg(locale === 'en' ? `Failed to create account: ${e.message}` : `Tạo tài khoản thất bại: ${e.message}`)
    } finally {
      setCreatingAccount(false)
    }
  }

  return (
    <div className="scrollable-page" style={{ padding: '0 0.5rem 2rem 0' }}>
      <div className="dashboard-container animate-fade-in" style={{ paddingBottom: '3rem', minHeight: 0 }}>
        {/* Title */}
        <div>
          <h2 className="dashboard-welcome-title">{t('import.header.title')}</h2>
          <p className="dashboard-welcome-desc">
            {t('import.header.desc')}
          </p>
        </div>

        {/* Centered Import Card */}
        <div style={{ maxWidth: '36rem', margin: '1.5rem auto 0 auto', width: '100%' }}>
          <div className="card flex flex-col" style={{ gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{t('import.card.title')}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('import.card.desc')}
              </p>
            </div>

            {/* Account Selector */}
            <div className="input-wrapper" style={{ gap: '0.5rem' }}>
              <label className="input-label" style={{ fontWeight: 600 }}>{t('import.card.labelSelectAccount')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <Select
                  value={tradingAccountId || ''}
                  onChange={(val) => {
                    if (val === 'new') {
                      setShowCreateAccount(true)
                    } else {
                      setTradingAccountId(val)
                      setShowCreateAccount(false)
                    }
                  }}
                  options={[
                    ...accounts.map((acc) => ({
                      value: acc.id,
                      label: `${acc.name} (${acc.platform.toUpperCase()})`
                    })),
                    { value: 'new', label: t('import.card.createAccount') }
                  ]}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => setManageAccountsOpen(true)}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    height: '2.5rem',
                    width: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                  title={t('import.card.btnManageAccounts')}
                >
                  <Settings style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            </div>

            <ManageAccounts
              open={manageAccountsOpen}
              onClose={() => setManageAccountsOpen(false)}
              accounts={accounts}
              onAccountsChanged={() => { window.location.reload() }}
            />

            {/* Create Account Inputs */}
            {showCreateAccount && (
              <div className="card flex flex-col" style={{ padding: '0.75rem', gap: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  {t('import.form.createAccountTitle')}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder={t('import.form.accountNamePlaceholder')}
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="number"
                    placeholder={t('import.form.startingBalancePlaceholder')}
                    value={newAccountStartingBalance}
                    onChange={(e) => setNewAccountStartingBalance(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                  <Select
                    value={newAccountPlatform}
                    onChange={(val) => setNewAccountPlatform(val as any)}
                    options={[
                      { value: 'csv', label: t('common.platforms.csv') },
                      { value: 'mt5', label: t('common.platforms.mt5') },
                      { value: 'topstep', label: t('common.platforms.topstep') },
                      { value: 'the5er_mt5', label: t('common.platforms.the5er_mt5') },
                      { value: 'other', label: t('common.platforms.other') }
                    ]}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => setShowCreateAccount(false)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', height: '2rem', fontSize: '0.75rem' }}
                    >
                      {t('import.form.btnCancel')}
                    </button>
                    <button
                      onClick={handleCreateAccount}
                      disabled={creatingAccount || !newAccountName.trim()}
                      className="btn-import-submit"
                      style={{
                        padding: '0.25rem 0.75rem',
                        height: '2rem',
                        fontSize: '0.75rem',
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        width: 'auto'
                      }}
                    >
                      {creatingAccount ? (locale === 'en' ? 'Creating...' : 'Đang tạo...') : t('import.form.btnCreate')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn('dropzone-container', dragActive && 'dropzone-active')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="dropzone-icon-box">
                <Upload style={{ width: '1.5rem', height: '1.5rem', animation: 'float 3s ease-in-out infinite' }} />
              </div>

              {selectedFile ? (
                <div className="flex flex-col items-center" style={{ gap: '0.375rem' }}>
                  <FileSpreadsheet style={{ width: '2rem', height: '2rem', color: '#10b981' }} />
                  <span className="text-sm font-semibold text-white max-w-[280px] truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: '0.375rem' }}>
                  <span className="text-sm font-medium text-white">{t('import.dropzone.idle')}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('import.dropzone.supportText')}</span>
                </div>
              )}
            </div>

            {/* Feedback alerts */}
            {errorMsg && (
              <div className="feedback-alert feedback-alert-danger">
                <AlertCircle className="shrink-0" style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="feedback-alert feedback-alert-success">
                <CheckCircle2 className="shrink-0" style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 600 }}>{successMsg}</p>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.9 }}>
                    {locale === 'en' ? (
                      <>
                        Go to the <Link href="/dashboard/calendar" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700 }}>Trading Calendar</Link> or <Link href="/dashboard" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700 }}>Overview</Link> to analyze them!
                      </>
                    ) : (
                      <>
                        Đi tới <Link href="/dashboard/calendar" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700 }}>Lịch Giao Dịch</Link> hoặc <Link href="/dashboard" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700 }}>Tổng quan</Link> để phân tích chúng!
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="btn-action-group">
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="btn-secondary"
                >
                  {t('import.dropzone.btnClear')}
                </button>
              )}
              <button
                onClick={handleImport}
                disabled={!selectedFile || importing || !tradingAccountId}
                className="btn-import-submit"
                style={{
                  background: (selectedFile && tradingAccountId) ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--surface-3)',
                  boxShadow: (selectedFile && tradingAccountId) ? '0 4px 16px rgba(124, 58, 237, 0.3)' : 'none'
                }}
              >
                {importing ? (
                  <>
                    <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin-slow 1s linear infinite' }} />
                    {locale === 'en' ? 'Importing...' : 'Đang nhập...'}
                  </>
                ) : (
                  t('import.dropzone.btnVerify')
                )}
              </button>
            </div>

            <div className="tip-box">
              <Info className="shrink-0" style={{ width: '1rem', height: '1rem', marginTop: '2px' }} />
              <div>
                <p className="font-semibold" style={{ marginBottom: '0.25rem' }}>
                  {locale === 'en' ? 'MT4/MT5 Compatibility' : 'Tương thích MT4/MT5'}
                </p>
                <p style={{ lineHeight: 1.4 }}>
                  {locale === 'en' 
                    ? 'We fully support direct CSV/Excel (.xlsx, .xls) exports from MetaTrader account history, including mappings for Tickets, Open/Close dates (with dots/spaces), Lots, and multi-price columns.' 
                    : 'Chúng tôi hỗ trợ đầy đủ xuất tệp CSV/Excel (.xlsx, .xls) trực tiếp từ lịch sử tài khoản MetaTrader, bao gồm ánh xạ cho các cột Vé (Ticket), Ngày Mở/Đóng (với dấu chấm/khoảng trắng), Lots và nhiều cột giá.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
