import { common } from './common'
import { auth } from './auth'
import { dashboard } from './dashboard'
import { calendar } from './calendar'
import { trades } from './trades'
import { csvImport } from './import'

export const vi = {
  common,
  auth,
  dashboard,
  calendar,
  trades,
  import: csvImport
}
