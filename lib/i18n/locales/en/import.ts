export const csvImport = {
  header: {
    title: 'Import CSV',
    desc: 'Import trades from MetaTrader or TopStep'
  },
  card: {
    title: 'Upload Trade History',
    desc: 'Select a trading account and upload your CSV or Excel (.xlsx, .xls) file.',
    labelSelectAccount: 'Select Target Trading Account',
    createAccount: '+ Create a new account...',
    btnManageAccounts: 'Manage Accounts'
  },
  form: {
    createAccountTitle: 'Create New Trading Account',
    accountNamePlaceholder: 'Account Name (e.g. Personal MT5)',
    startingBalancePlaceholder: 'Starting Balance (e.g. 2500)',
    btnCreate: 'Create Account',
    btnCancel: 'Cancel'
  },
  dropzone: {
    dragActive: 'Drop the files here...',
    idle: 'Drag and drop your file here, or click to browse',
    supportText: 'Supports CSV, XLSX, XLS',
    selectedFile: 'Selected File:',
    importing: 'Importing Trades...',
    btnImport: 'Import Trades ({count})',
    btnVerify: 'Verify & Import',
    btnClear: 'Clear'
  },
  mapping: {
    title: 'Map Columns',
    desc: 'Map your CSV headers to SilentOp trading fields.',
    required: 'Required',
    optional: 'Optional',
    ticket: 'Ticket / Order ID',
    symbol: 'Symbol',
    direction: 'Direction (Buy/Sell)',
    lots: 'Volume / Lots',
    openTime: 'Open Time',
    closeTime: 'Close Time',
    openPrice: 'Open Price',
    closePrice: 'Close Price',
    profit: 'Profit / Loss',
    commission: 'Commission',
    swap: 'Swap',
    sl: 'Stop Loss (SL)',
    tp: 'Take Profit (TP)',
    pips: 'Pips',
    duration: 'Duration (Mins)',
    notes: 'Notes / Comments',
    selectField: 'Select CSV Column...'
  },
  feedback: {
    success: 'Imported {count} trades successfully!',
    successSub: 'Go to the Trading Calendar or Overview to analyze them!',
    error: 'Failed to import trades. Please check the file format.'
  }
}
