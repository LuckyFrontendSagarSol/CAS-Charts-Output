import { createSlice } from '@reduxjs/toolkit'

/**
 * Chrome-level UI state. The collapsed sidebar is persisted because it is a
 * preference, not a per-visit choice — a reload should not re-open it.
 */
const COLLAPSED_KEY = 'investsmart_static_sidebar_collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

const writeCollapsed = value => {
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0')
  } catch {
    // The choice then lasts until a reload.
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: readCollapsed(),
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
      writeCollapsed(state.sidebarCollapsed)
    },
  },
})

export const { toggleSidebar } = uiSlice.actions

export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed

export default uiSlice.reducer
