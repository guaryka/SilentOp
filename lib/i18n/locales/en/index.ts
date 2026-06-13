import { common } from './common'
import { auth } from './auth'
import { dashboard } from './dashboard'
import { calendar } from './calendar'
import { trades } from './trades'
import { csvImport } from './import'

export const en = {
  common,
  auth,
  dashboard,
  calendar,
  trades,
  import: csvImport
}
export type TranslationType = typeof en
