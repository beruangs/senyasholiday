import { useEffect } from 'react'

const APP_NAME = 'SEN YAS DADDY'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}

// Preset title generators
export const pageTitle = {
  home: () => `${APP_NAME} - Holiday Planner`,
  dashboard: () => `Dashboard | ${APP_NAME}`,
  dashboardPlan: (planTitle: string) => `Dashboard | ${planTitle}`,
  publicPlan: (planTitle: string) => `${planTitle} | ${APP_NAME}`,
  login: () => `Login | ${APP_NAME}`,
  plans: () => `Plans | ${APP_NAME}`,
}
